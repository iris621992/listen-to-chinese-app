import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { createServer } from "node:net";
import { fileURLToPath, pathToFileURL } from "node:url";
import { sha256 } from "./deterministic-json.mjs";
import {
  FIXTURE_ASSET_JS,
  fixtureEvidenceIdentity,
  renderFixtureRoute,
} from "./fixture-adapter.mjs";
import { loadMeasuredFixtures } from "./fixtures.mjs";
import {
  evaluateBrowserGate,
  measurementIdentity,
  runSampleSet,
  summarizeSamples,
} from "./measurements.mjs";
import { PROFILE } from "./spec.mjs";

const execFileAsync = promisify(execFile);
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const LOWER_HEX_40 = /^[0-9a-f]{40}$/;

export function isLoopbackHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function assertMeasuredCommit(providedCommit, sourceCommit) {
  if (!LOWER_HEX_40.test(providedCommit ?? "")) {
    throw new Error("--commit must be an exact 40-character lowercase SHA");
  }
  if (!LOWER_HEX_40.test(sourceCommit ?? "")) {
    throw new Error("Measured source HEAD is not an exact lowercase commit SHA");
  }
  if (providedCommit !== sourceCommit) {
    throw new Error(
      `--commit ${providedCommit} does not match measured source HEAD ${sourceCommit}`,
    );
  }
  return sourceCommit;
}

export function assertFixtureEvidenceIdentity(options, fixture) {
  const canonical = fixtureEvidenceIdentity(fixture);
  if (options.locale !== canonical.locale) {
    throw new Error(
      `--locale ${options.locale} does not match fixture locale ${canonical.locale}`,
    );
  }
  if (options.authorizationClass !== canonical.authorizationClass) {
    throw new Error(
      `--authorization-class ${options.authorizationClass} does not match `
      + `fixture authorization class ${canonical.authorizationClass}`,
    );
  }
  return canonical;
}

export function parseBrowserArguments(argumentsList) {
  const values = Object.fromEntries(argumentsList.map((argument) => {
    const match = argument.match(/^--([a-z-]+)=(.*)$/);
    if (!match) throw new Error(`Invalid argument: ${argument}`);
    return [match[1], match[2]];
  }));
  const required = ["browser", "origin", "fixture", "commit"];
  for (const name of required) {
    if (!values[name]) throw new Error(`Missing --${name}`);
  }
  const origin = new URL(values.origin);
  if (!isLoopbackHttpUrl(origin.href)) {
    throw new Error("DFP-0 browser measurements are restricted to local HTTP origins");
  }
  if (!LOWER_HEX_40.test(values.commit)) {
    throw new Error("--commit must be an exact 40-character lowercase SHA");
  }
  return {
    browser: values.browser,
    origin: origin.origin,
    fixture: values.fixture,
    commit: values.commit,
    locale: values.locale ?? "vi",
    authorizationClass: values["authorization-class"] ?? "public",
    output: values.output ?? null,
  };
}

export async function resolveMeasuredSourceCommit({
  repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url)),
  runGit = execFileAsync,
} = {}) {
  const [{ stdout: head }, { stdout: status }] = await Promise.all([
    runGit("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot }),
    runGit(
      "git",
      ["status", "--porcelain=v1", "--untracked-files=all"],
      { cwd: repositoryRoot },
    ),
  ]);
  if (status.trim() !== "") {
    throw new Error("Measured source worktree is not clean");
  }
  return head.trim();
}

class CdpClient {
  #socket;
  #nextId = 1;
  #pending = new Map();
  #listeners = new Map();

  constructor(webSocketUrl) {
    this.#socket = new WebSocket(webSocketUrl);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.#socket.addEventListener("open", resolve, { once: true });
      this.#socket.addEventListener("error", reject, { once: true });
    });
    this.#socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.#pending.get(message.id);
        if (!pending) return;
        this.#pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.#listeners.get(message.method) ?? []) {
        listener(message.params);
      }
    });
  }

  send(method, params = {}) {
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.#listeners.get(method) ?? [];
    listeners.push(listener);
    this.#listeners.set(method, listeners);
    return () => {
      this.#listeners.set(
        method,
        (this.#listeners.get(method) ?? []).filter((item) => item !== listener),
      );
    };
  }

  close() {
    this.#socket.close();
  }
}

export async function createLocalRequestGuard(client) {
  const violations = [];
  const protocolErrors = [];
  const pending = new Set();
  const removeListener = client.on(
    "Fetch.requestPaused",
    ({ requestId, request }) => {
      const allowed = isLoopbackHttpUrl(request.url);
      if (!allowed) violations.push(request.url);
      const task = client.send(
        allowed ? "Fetch.continueRequest" : "Fetch.failRequest",
        allowed
          ? { requestId }
          : { requestId, errorReason: "BlockedByClient" },
      ).catch((error) => {
        protocolErrors.push(error instanceof Error ? error.message : String(error));
      }).finally(() => pending.delete(task));
      pending.add(task);
    },
  );
  await client.send("Fetch.enable", {
    patterns: [{ urlPattern: "*", requestStage: "Request" }],
  });

  const assertSafe = async () => {
    await Promise.allSettled([...pending]);
    if (protocolErrors.length > 0) {
      throw new Error(`Local request guard failed: ${protocolErrors.join("; ")}`);
    }
    if (violations.length > 0) {
      throw new Error(
        `Non-loopback browser request blocked: ${[...new Set(violations)].join(", ")}`,
      );
    }
  };

  return {
    violations,
    assertSafe,
    async close() {
      await Promise.allSettled([...pending]);
      removeListener();
      await client.send("Fetch.disable");
      await assertSafe();
    },
  };
}

export function createNetworkLedger() {
  const entries = [];
  const requests = new Map();
  const currentResponses = new Map();
  let redirectSequence = 0;

  return {
    requestWillBeSent({
      requestId,
      request,
      redirectResponse,
      type = "Other",
      initiator = {},
    }) {
      if (redirectResponse) {
        redirectSequence += 1;
        entries.push({
          key: `${requestId}:redirect:${redirectSequence}`,
          requestId,
          requestUrl: redirectResponse.url,
          type,
          initiatorType: initiator.type ?? null,
          response: redirectResponse,
          source: "requestWillBeSent.redirectResponse",
          redirect: true,
          encodedBodyBytes: redirectResponse.encodedDataLength ?? 0,
        });
      }
      requests.set(requestId, {
        requestUrl: request.url,
        type,
        initiatorType: initiator.type ?? null,
      });
    },
    responseReceived({ requestId, response, type = "Other" }) {
      const request = requests.get(requestId) ?? {};
      const entry = {
        key: requestId,
        requestId,
        requestUrl: request.requestUrl ?? response.url,
        type,
        initiatorType: request.initiatorType ?? null,
        response,
        source: "responseReceived",
        redirect: false,
        encodedBodyBytes: 0,
      };
      entries.push(entry);
      currentResponses.set(requestId, entry);
    },
    dataReceived({ requestId, encodedDataLength }) {
      const entry = currentResponses.get(requestId);
      if (!entry) return;
      entry.encodedBodyBytes += encodedDataLength;
    },
    entries() {
      return entries.map((entry) => ({ ...entry }));
    },
  };
}

function contentTypeOf(response) {
  const header = Object.entries(response.headers ?? {}).find(
    ([name]) => name.toLowerCase() === "content-type",
  )?.[1];
  return String(response.mimeType || header || "").toLowerCase();
}

export async function attributeRouteBytes(client, ledgerEntries) {
  const routeBytes = { html: 0, rsc: 0, javascript: 0 };
  const attribution = [];

  for (const item of ledgerEntries) {
    const contentType = contentTypeOf(item.response);
    const isDocument = item.type === "Document";
    const isRsc = contentType.includes("text/x-component");
    const isJavaScript = item.type === "Script" || contentType.includes("javascript");
    const classification = item.redirect
      ? "redirect"
      : isDocument ? "html"
        : isRsc ? "rsc"
          : isJavaScript ? "javascript"
            : "other";

    let decodedBodyBytes = null;
    let bodySha256 = null;
    if (!item.redirect && (isDocument || isRsc || isJavaScript)) {
      const body = await client.send("Network.getResponseBody", {
        requestId: item.requestId,
      });
      const decodedBody = body.base64Encoded
        ? Buffer.from(body.body, "base64")
        : Buffer.from(body.body, "utf8");
      decodedBodyBytes = decodedBody.byteLength;
      bodySha256 = createHash("sha256").update(decodedBody).digest("hex");
      if (isDocument) routeBytes.html += decodedBodyBytes;
      else if (isRsc) routeBytes.rsc += decodedBodyBytes;
    }
    const cacheMiss = !item.response.fromDiskCache
      && !item.response.fromServiceWorker;
    if (!item.redirect && isJavaScript && cacheMiss) {
      routeBytes.javascript += item.encodedBodyBytes;
    }
    attribution.push({
      url: item.response.url ?? item.requestUrl,
      resourceType: item.type,
      classification,
      source: item.source,
      requiredForInitialRoute: true,
      cacheMiss,
      encodedBodyBytes: item.encodedBodyBytes,
      decodedBodyBytes,
      bodySha256,
      bodyMeasurement: item.redirect
        ? "cdp-redirect-encoded-length"
        : (isDocument || isRsc)
          ? "content-decoded-response-body"
          : isJavaScript
            ? "encoded-response-body"
            : "attributed-not-budgeted",
    });
  }
  return { routeBytes, attribution };
}

export function verifyFixtureResponseIdentity({
  attribution,
  fixture,
  origin,
}) {
  const expectedResources = [
    {
      role: "html-and-vitals-instrumentation",
      url: `${origin}/__dfp__/route/${fixture.definition.id}`,
      classification: "html",
      sha256: sha256(renderFixtureRoute(fixture)),
    },
    {
      role: "fixture-rsc",
      url: `${origin}/__dfp__/rsc/${fixture.definition.id}`,
      classification: "rsc",
      sha256: fixture.measurement.sha256,
    },
    {
      role: "interaction-instrumentation",
      url: `${origin}/__dfp__/asset.js`,
      classification: "javascript",
      sha256: sha256(FIXTURE_ASSET_JS),
    },
  ];
  const resources = expectedResources.map((expected) => {
    const matches = attribution.filter((item) => (
      !item.redirect
      && item.url === expected.url
      && item.classification === expected.classification
    ));
    if (matches.length !== 1) {
      throw new Error(
        `Expected exactly one ${expected.role} response, received ${matches.length}`,
      );
    }
    const observedSha256 = matches[0].bodySha256;
    if (observedSha256 !== expected.sha256) {
      throw new Error(
        `${expected.role} response hash ${observedSha256 ?? "missing"} `
        + `does not match canonical ${expected.sha256}`,
      );
    }
    return {
      role: expected.role,
      url: expected.url,
      expectedSha256: expected.sha256,
      observedSha256,
      pass: true,
    };
  });
  return {
    measurementSpec: "DFP-MSPEC-1",
    fixtureId: fixture.definition.id,
    fixtureSha256: resources.find(({ role }) => role === "fixture-rsc")
      .observedSha256,
    pass: resources.every(({ pass }) => pass),
    resources,
  };
}

async function waitForDebugger(port) {
  const endpoint = `http://127.0.0.1:${port}/json/version`;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) return response.json();
    } catch {
      // The browser is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Browser DevTools endpoint did not become ready");
}

async function createPage(port) {
  const response = await fetch(
    `http://127.0.0.1:${port}/json/new?about:blank`,
    { method: "PUT" },
  );
  if (!response.ok) throw new Error(`Unable to create browser page: ${response.status}`);
  return response.json();
}

async function allocateLoopbackPort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(
    (error) => error ? reject(error) : resolve(),
  ));
  return port;
}

async function measureNavigation(client, route, requestGuard, fixture) {
  const ledger = createNetworkLedger();
  const removeRequestListener = client.on(
    "Network.requestWillBeSent",
    (event) => ledger.requestWillBeSent(event),
  );
  const removeResponseListener = client.on(
    "Network.responseReceived",
    (event) => ledger.responseReceived(event),
  );
  const removeDataListener = client.on(
    "Network.dataReceived",
    (event) => ledger.dataReceived(event),
  );

  try {
    await client.send("Network.clearBrowserCache");
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Network.setBypassServiceWorker", { bypass: true });
    await client.send("ServiceWorker.disable");
    await client.send("Emulation.setCPUThrottlingRate", {
      rate: PROFILE.cpuSlowdownMultiplier,
    });
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: PROFILE.viewport.widthCssPixels,
      height: PROFILE.viewport.heightCssPixels,
      deviceScaleFactor: PROFILE.viewport.devicePixelRatio,
      mobile: true,
    });
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: PROFILE.network.roundTripLatencyMs,
      downloadThroughput: PROFILE.network.downstreamBitsPerSecond / 8,
      uploadThroughput: PROFILE.network.upstreamBitsPerSecond / 8,
      connectionType: "cellular3g",
    });

    await client.send("Page.navigate", { url: route });
    const deadline = Date.now() + 30_000;
    let isReady = false;
    while (Date.now() < deadline) {
      await requestGuard.assertSafe();
      try {
        const ready = await client.send("Runtime.evaluate", {
          expression: "window.__DFP_READY__ === true",
          returnByValue: true,
        });
        if (ready.result.value === true) {
          isReady = true;
          break;
        }
      } catch {
        // Navigation may replace the execution context between polling attempts.
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!isReady) throw new Error("Fixture route did not become ready");

    const button = await client.send("Runtime.evaluate", {
      expression: `(() => {
        const rect = document.querySelector("[data-dfp-action]")?.getBoundingClientRect();
        return rect ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 } : null;
      })()`,
      returnByValue: true,
    });
    if (!button.result.value) throw new Error("Fixture interaction target is missing");
    await client.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: button.result.value.x,
      y: button.result.value.y,
      button: "left",
      clickCount: 1,
    });
    await client.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: button.result.value.x,
      y: button.result.value.y,
      button: "left",
      clickCount: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 250));
    await requestGuard.assertSafe();

    const { routeBytes, attribution } = await attributeRouteBytes(
      client,
      ledger.entries(),
    );
    const responseIdentity = verifyFixtureResponseIdentity({
      attribution,
      fixture,
      origin: new URL(route).origin,
    });
    const vitals = await client.send("Runtime.evaluate", {
      expression: "window.__DFP_VITALS__",
      returnByValue: true,
    });
    return {
      status: "ok",
      routeBytes,
      vitals: {
        lcpMs: vitals.result.value.lcp,
        inpMs: vitals.result.value.inp,
        cls: vitals.result.value.cls,
      },
      routeByteAttribution: attribution,
      responseIdentity,
    };
  } finally {
    removeRequestListener();
    removeResponseListener();
    removeDataListener();
  }
}

function failureMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export function buildBrowserEvidence({
  options,
  versionEndpoint,
  fixture,
  route,
  samples,
  runnerFailures = [],
}) {
  const fixtureIdentity = assertFixtureEvidenceIdentity(options, fixture);
  const successful = samples.filter((sample) => sample.status === "ok");
  const metricSummary = (selector) => summarizeSamples(
    samples.map((sample) => sample.status === "ok"
      ? { status: "ok", value: selector(sample.value) }
      : sample),
    PROFILE.sampling.syntheticPagePercentile,
    PROFILE.sampling.syntheticPageMeasuredSamples,
  );
  const summary = {
    htmlBytes: metricSummary((sample) => sample.routeBytes.html),
    rscBytes: metricSummary((sample) => sample.routeBytes.rsc),
    javascriptBytes: metricSummary((sample) => sample.routeBytes.javascript),
    lcpMs: metricSummary((sample) => sample.vitals.lcpMs),
    inpMs: metricSummary((sample) => sample.vitals.inpMs),
    cls: metricSummary((sample) => sample.vitals.cls),
  };
  const verifiedFixtureHashes = successful.map(
    (sample) => sample.value.responseIdentity?.fixtureSha256,
  );
  const responseIdentity = {
    expectedFixtureSha256: fixture.measurement.sha256,
    verifiedSampleCount: verifiedFixtureHashes.filter(
      (value) => value === fixture.measurement.sha256,
    ).length,
    observedFixtureSha256: [...new Set(verifiedFixtureHashes.filter(Boolean))],
    pass: successful.length === samples.length
      && verifiedFixtureHashes.every(
        (value) => value === fixture.measurement.sha256,
      ),
  };
  const canEvaluate = successful.length === samples.length;
  const browserGate = canEvaluate ? evaluateBrowserGate({
    routeBytes: {
      html: summary.htmlBytes.value,
      rsc: summary.rscBytes.value,
      javascript: summary.javascriptBytes.value,
    },
    vitals: {
      lcpMs: summary.lcpMs.value,
      inpMs: summary.inpMs.value,
      cls: summary.cls.value,
    },
  }) : { measurementSpec: "DFP-MSPEC-1", pass: false, checks: {} };
  const gate = {
    ...browserGate,
    pass: browserGate.pass
      && responseIdentity.pass
      && runnerFailures.length === 0,
    trustChecks: {
      responseIdentity: responseIdentity.pass,
      runnerFailuresAbsent: runnerFailures.length === 0,
    },
  };
  const identity = measurementIdentity({
    commit: options.commit,
    route,
    fixtureHash: responseIdentity.pass
      ? responseIdentity.observedFixtureSha256[0]
      : fixture.measurement.sha256,
    authorizationClass: fixtureIdentity.authorizationClass,
    locale: fixtureIdentity.locale,
    tool: {
      name: "Chromium DevTools Protocol",
      version: versionEndpoint.Browser,
      protocolVersion: versionEndpoint["Protocol-Version"],
      runner: "dfp-browser-runner-1",
    },
    cacheState: PROFILE.cache,
    sampleCount: samples.length,
    percentile: PROFILE.sampling.syntheticPagePercentile,
  });
  identity.fixtureHashSource = responseIdentity.pass
    ? "verified-browser-response-body"
    : "expected-manifest-for-blocking-evidence";
  return {
    identity,
    samples,
    summary,
    responseIdentity,
    runnerFailures,
    gate,
  };
}

async function main() {
  const options = parseBrowserArguments(process.argv.slice(2));
  assertMeasuredCommit(options.commit, await resolveMeasuredSourceCommit());
  const fixtures = await loadMeasuredFixtures();
  const fixture = fixtures.find(({ definition }) => definition.id === options.fixture);
  if (!fixture) throw new Error(`Unknown fixture: ${options.fixture}`);
  assertFixtureEvidenceIdentity(options, fixture);

  const port = await allocateLoopbackPort();
  const userDataDirectory = await mkdtemp(path.join(tmpdir(), "dfp-mspec-1-"));
  const browser = spawn(options.browser, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDirectory}`,
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-features=ServiceWorker",
    "--disable-sync",
    "--no-first-run",
    "about:blank",
  ], { stdio: "ignore" });

  let client;
  let requestGuard;
  const runnerFailures = [];
  try {
    const versionEndpoint = await waitForDebugger(port);
    const page = await createPage(port);
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.open();
    await Promise.all([
      client.send("Page.enable"),
      client.send("Runtime.enable"),
      client.send("Network.enable"),
      client.send("ServiceWorker.enable"),
    ]);
    requestGuard = await createLocalRequestGuard(client);

    const route = `${options.origin}/__dfp__/route/${options.fixture}`;
    const { samples } = await runSampleSet({
      measuredSamples: PROFILE.sampling.syntheticPageMeasuredSamples,
      percentile: PROFILE.sampling.syntheticPagePercentile,
      summarize: false,
      run: () => measureNavigation(client, route, requestGuard, fixture),
    });
    try {
      await requestGuard.close();
    } catch (error) {
      runnerFailures.push({
        phase: "request-guard-finalization",
        error: failureMessage(error),
      });
    } finally {
      requestGuard = null;
    }

    const evidence = buildBrowserEvidence({
      options,
      versionEndpoint,
      fixture,
      route,
      samples,
      runnerFailures,
    });
    const output = `${JSON.stringify(evidence, null, 2)}\n`;
    if (options.output) await writeFile(options.output, output, "utf8");
    else process.stdout.write(output);
    if (!evidence.gate.pass) process.exitCode = 1;
  } finally {
    try {
      if (requestGuard) {
        try {
          await requestGuard.close();
        } catch {
          // Sampling-time guard violations are retained in sample evidence.
        }
      }
    } finally {
      if (client) client.close();
      browser.kill("SIGTERM");
      await rm(userDataDirectory, { recursive: true, force: true });
    }
  }
}

if (
  process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
