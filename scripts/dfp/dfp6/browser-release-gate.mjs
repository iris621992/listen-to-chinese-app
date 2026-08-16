import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import {
  attributeRouteBytes,
  createLocalRequestGuard,
  createNetworkLedger,
} from "../mspec-1/browser-runner.mjs";
import {
  measurementIdentity,
  runSampleSet,
  summarizeSamples,
} from "../mspec-1/measurements.mjs";
import { PROFILE } from "../mspec-1/spec.mjs";
import {
  DFP6_RELEASE_PROFILE,
  evaluateBrowserSummary,
} from "./release-contract.mjs";

const execFileAsync = promisify(execFile);
const LOOPBACK_HOST = "127.0.0.1";
const FIXTURE_ROOT = path.resolve("scripts/dfp/dfp5/fixture-app");
const NEXT_CLI = path.resolve("node_modules/next/dist/bin/next");
const START_TIMEOUT_MS = 60_000;
const CDP_TIMEOUT_MS = 30_000;
const BUILD_DIAGNOSTIC_MAX_CHARS = 8_192;
const SAMPLE_DIAGNOSTIC_MAX_CHARS = 512;
const DIAGNOSTIC_URL = /\b(?:https?|wss?):\/\/[^\s"'`]+/gi;
const DIAGNOSTIC_SENSITIVE_FRAGMENT =
  /\b(?:secret|token|password|credential|service.?role|publishable.?key|anon.?key|answer|correctness|grading|transcript|translation|raw.?content|database.?url)\b(?:\s*[:=]\s*|\s+)[^\s,;]+/gi;
const DIAGNOSTIC_PROVIDER_VALUE =
  /(?:service_role|NEXT_PUBLIC_SUPABASE_|SUPABASE_(?:URL|KEY)|postgres(?:ql)?:\/\/)[^\s,;]*/gi;
const BODY_ATTRIBUTION_CLASSES = new Set(["Document", "RSC", "JavaScript"]);
const RSC_REQUEST_ROLES = ["prefetch", "non-prefetch/unknown"];
const RSC_REQUEST_ROLE_SET = new Set(RSC_REQUEST_ROLES);

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function executableExists(candidate) {
  if (!candidate) return false;
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function chromiumExecutable() {
  const explicit = process.env.DFP6_CHROME_EXECUTABLE;
  const candidates = [
    explicit,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  for (const candidate of candidates) {
    if (await executableExists(candidate)) return candidate;
  }

  const playwrightCache = "/root/.cache/ms-playwright";
  try {
    const directories = await readdir(playwrightCache, { withFileTypes: true });
    for (const directory of directories) {
      if (!directory.isDirectory() || !directory.name.startsWith("chromium-")) {
        continue;
      }
      for (const suffix of ["chrome-linux64/chrome", "chrome-linux/chrome"]) {
        const candidate = path.join(playwrightCache, directory.name, suffix);
        if (await executableExists(candidate)) return candidate;
      }
    }
  } catch {
    // Common and explicit paths remain the portable contract.
  }
  throw new Error(
    "DFP-6 browser release gate requires local Chromium; set DFP6_CHROME_EXECUTABLE",
  );
}

async function reservePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, LOOPBACK_HOST, resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : null;
  await new Promise((resolve, reject) =>
    server.close((error) => error ? reject(error) : resolve()));
  if (!port) throw new Error("Unable to reserve DFP-6 fixture port");
  return port;
}

async function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill("SIGTERM");
  const terminated = await Promise.race([
    exited.then(() => true),
    delay(3_000).then(() => false),
  ]);
  if (!terminated && child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
  }
  await exited;
}

function boundedBuildDiagnostic(value) {
  let text = "";
  if (typeof value === "string") text = value;
  else if (value !== undefined && value !== null) text = String(value);
  if (text.length <= BUILD_DIAGNOSTIC_MAX_CHARS) return text;
  return `${text.slice(0, BUILD_DIAGNOSTIC_MAX_CHARS)}\n...[truncated]`;
}

export function sanitizeBrowserSampleDiagnostic(value) {
  let text = "";
  if (typeof value === "string") text = value;
  else if (value !== undefined && value !== null) text = String(value);
  text = text
    .replace(DIAGNOSTIC_PROVIDER_VALUE, "[REDACTED]")
    .replace(DIAGNOSTIC_SENSITIVE_FRAGMENT, "[REDACTED]")
    .replace(DIAGNOSTIC_URL, "[REDACTED_URL]")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!text) return "UNKNOWN_BROWSER_SAMPLE_FAILURE";
  if (text.length <= SAMPLE_DIAGNOSTIC_MAX_CHARS) return text;
  const suffix = "...[truncated]";
  return `${text.slice(0, SAMPLE_DIAGNOSTIC_MAX_CHARS - suffix.length)}${suffix}`;
}

export function browserMissingVitalsDiagnostic(observed) {
  const missing = [];
  if (!observed?.lcpObserved) missing.push("lcp");
  if (!observed?.inpObserved) missing.push("inp");
  return missing.length > 0 ? missing.join("+") : null;
}

function responseContentType(response) {
  const header = Object.entries(response?.headers ?? {}).find(
    ([name]) => name.toLowerCase() === "content-type",
  )?.[1];
  return String(response?.mimeType || header || "").toLowerCase();
}

function requestHeaderValue(headers, headerName) {
  const target = headerName.toLowerCase();
  return Object.entries(headers ?? {}).find(
    ([name]) => name.toLowerCase() === target,
  )?.[1];
}

export function browserRscRequestRole(request) {
  const headers = request?.headers ?? {};
  const routerPrefetch = String(
    requestHeaderValue(headers, "next-router-prefetch") ?? "",
  ).trim().toLowerCase();
  const purpose = String(
    requestHeaderValue(headers, "purpose") ?? "",
  ).toLowerCase();
  const secPurpose = String(
    requestHeaderValue(headers, "sec-purpose") ?? "",
  ).toLowerCase();
  return routerPrefetch === "1"
    || routerPrefetch === "true"
    || purpose.includes("prefetch")
    || secPurpose.includes("prefetch")
    ? "prefetch"
    : "non-prefetch/unknown";
}

export function browserResponseAttributionClass(item) {
  if (item?.redirect) return null;
  const contentType = responseContentType(item?.response);
  if (item?.type === "Document") return "Document";
  if (contentType.includes("text/x-component")) return "RSC";
  if (item?.type === "Script" || contentType.includes("javascript")) {
    return "JavaScript";
  }
  return null;
}

export function browserResponseNeedsBodyAttribution(item) {
  return browserResponseAttributionClass(item) !== null;
}

export function browserResponseBelongsToInitialRoute(item, requestRole) {
  const attributionClass = browserResponseAttributionClass(item);
  if (attributionClass !== "RSC") return true;
  if (!RSC_REQUEST_ROLE_SET.has(requestRole)) {
    throw new Error("DFP-6 browser RSC request role is invalid");
  }
  return requestRole !== "prefetch";
}

export function createBrowserResponseCompletionTracker({
  timeoutMs = CDP_TIMEOUT_MS,
} = {}) {
  const terminalOutcomes = new Map();
  const waiters = new Map();

  function settle(requestId, outcome) {
    if (terminalOutcomes.has(requestId)) return;
    terminalOutcomes.set(requestId, outcome);
    const pending = waiters.get(requestId) ?? [];
    waiters.delete(requestId);
    for (const resolve of pending) resolve(outcome);
  }

  function waitForRequest(requestId) {
    if (terminalOutcomes.has(requestId)) {
      return Promise.resolve(terminalOutcomes.get(requestId));
    }
    return new Promise((resolve) => {
      const pending = waiters.get(requestId) ?? [];
      pending.push(resolve);
      waiters.set(requestId, pending);
    });
  }

  return {
    loadingFinished({ requestId }) {
      settle(requestId, "finished");
    },
    loadingFailed({ requestId }) {
      settle(requestId, "failed");
    },
    async waitForAll(requests) {
      const uniqueRequests = [...new Map(requests.map((request) => {
        const requestId = request?.requestId;
        const attributionClass = request?.attributionClass;
        const requestRole = attributionClass === "RSC"
          ? request?.requestRole
          : null;
        if (typeof requestId !== "string" || requestId.length === 0) {
          throw new Error("DFP-6 browser response request identity is invalid");
        }
        if (!BODY_ATTRIBUTION_CLASSES.has(attributionClass)) {
          throw new Error("DFP-6 browser response attribution class is invalid");
        }
        if (attributionClass === "RSC" && !RSC_REQUEST_ROLE_SET.has(requestRole)) {
          throw new Error("DFP-6 browser RSC request role is invalid");
        }
        return [requestId, { requestId, attributionClass, requestRole }];
      })).values()];
      if (uniqueRequests.length === 0) return;

      let timeoutHandle;
      try {
        const outcomes = await Promise.race([
          Promise.all(uniqueRequests.map(({ requestId }) => waitForRequest(requestId))),
          new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
              const pendingRequests = uniqueRequests.filter(
                ({ requestId }) => !terminalOutcomes.has(requestId),
              );
              const firstPendingClass =
                pendingRequests[0]?.attributionClass ?? "UNKNOWN";
              const roleCounts = Object.fromEntries(
                RSC_REQUEST_ROLES.map((role) => [role, 0]),
              );
              for (const request of pendingRequests) {
                if (request.attributionClass === "RSC") {
                  roleCounts[request.requestRole] += 1;
                }
              }
              const pendingRscRoles = RSC_REQUEST_ROLES
                .filter((role) => roleCounts[role] > 0)
                .map((role) => `${role}:${roleCounts[role]}`)
                .join(",");
              const rscRoleDiagnostic = pendingRscRoles
                ? ` pendingRscRoles=${pendingRscRoles}`
                : "";
              reject(new Error(
                "DFP-6 browser response lifecycle did not complete: "
                + `pendingClass=${firstPendingClass} `
                + `pendingCount=${pendingRequests.length}`
                + rscRoleDiagnostic,
              ));
            }, timeoutMs);
          }),
        ]);
        if (outcomes.some((outcome) => outcome !== "finished")) {
          throw new Error(
            "DFP-6 browser response failed before attribution",
          );
        }
      } finally {
        clearTimeout(timeoutHandle);
      }
    },
  };
}

async function buildFixture() {
  try {
    await execFileAsync(
      process.execPath,
      [NEXT_CLI, "build", FIXTURE_ROOT],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NEXT_TELEMETRY_DISABLED: "1",
        },
        timeout: 180_000,
        maxBuffer: 8 * 1024 * 1024,
      },
    );
  } catch (error) {
    const message = boundedBuildDiagnostic(
      error instanceof Error ? error.message : error,
    );
    const stdout = boundedBuildDiagnostic(error?.stdout);
    const stderr = boundedBuildDiagnostic(error?.stderr);
    throw new Error(
      [
        "DFP-6 fixture build failed.",
        message ? `message:\n${message}` : "",
        stdout ? `stdout:\n${stdout}` : "",
        stderr ? `stderr:\n${stderr}` : "",
      ].filter(Boolean).join("\n"),
      { cause: error },
    );
  }
}

async function startFixture() {
  await buildFixture();
  const port = await reservePort();
  const origin = `http://${LOOPBACK_HOST}:${port}`;
  const output = [];
  const child = spawn(
    process.execPath,
    [
      NEXT_CLI,
      "start",
      FIXTURE_ROOT,
      "--hostname",
      LOOPBACK_HOST,
      "--port",
      String(port),
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => output.push(chunk));
  }

  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`DFP-6 fixture exited early:\n${output.join("")}`);
    }
    try {
      const response = await fetch(`${origin}/?direction=ltr`);
      if (response.ok) {
        return {
          origin,
          async close() {
            await stopProcess(child);
          },
        };
      }
    } catch {
      // Production fixture is still becoming ready.
    }
    await delay(200);
  }
  await stopProcess(child);
  throw new Error(`DFP-6 fixture did not become ready:\n${output.join("")}`);
}

async function launchChromium() {
  const executable = await chromiumExecutable();
  const userDataDirectory = await mkdtemp(path.join(tmpdir(), "dfp6-chrome-"));
  const output = [];
  const child = spawn(
    executable,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-extensions",
      "--disable-sync",
      "--metrics-recording-only",
      "--no-first-run",
      "--remote-debugging-port=0",
      `--user-data-dir=${userDataDirectory}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  child.stderr.setEncoding("utf8");

  const browserWebSocketUrl = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Chromium CDP endpoint timed out:\n${output.join("")}`));
    }, START_TIMEOUT_MS);
    child.stderr.on("data", (chunk) => {
      output.push(chunk);
      const match = output.join("").match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Chromium exited before CDP was ready (${code})`));
    });
  });

  const debugUrl = new URL(browserWebSocketUrl);
  return {
    debugOrigin: `http://${debugUrl.hostname}:${debugUrl.port}`,
    async close() {
      await stopProcess(child);
      await rm(userDataDirectory, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    },
  };
}

class CdpClient {
  constructor(webSocketUrl) {
    this.sequence = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.socket = new WebSocket(webSocketUrl);
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params);
      }
    });
  }

  send(method, params = {}) {
    this.sequence += 1;
    const id = this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const current = this.listeners.get(method) ?? [];
    current.push(listener);
    this.listeners.set(method, current);
    return () => {
      this.listeners.set(
        method,
        (this.listeners.get(method) ?? []).filter((item) => item !== listener),
      );
    };
  }

  close() {
    this.socket.close();
  }
}

async function waitForDebugger(debugOrigin) {
  const endpoint = `${debugOrigin}/json/version`;
  const deadline = Date.now() + CDP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) return response.json();
    } catch {
      // Chromium is still starting.
    }
    await delay(100);
  }
  throw new Error("DFP-6 Chromium debugger did not become ready");
}

async function createPage(debugOrigin) {
  const response = await fetch(`${debugOrigin}/json/new?about:blank`, {
    method: "PUT",
  });
  if (!response.ok) {
    throw new Error(`Unable to create DFP-6 browser page: ${response.status}`);
  }
  return response.json();
}

const VITALS_BOOTSTRAP = `(() => {
  const state = {
    lcp: 0,
    inp: 0,
    cls: 0,
    lcpObserved: false,
    inpObserved: false,
    clsObserved: true
  };
  Object.defineProperty(window, "__DFP6_VITALS__", {
    value: state,
    configurable: false,
    enumerable: false,
    writable: false
  });
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        state.lcp = Math.max(state.lcp, entry.startTime || 0);
        state.lcpObserved = true;
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) state.cls += entry.value || 0;
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if ((entry.interactionId || 0) > 0) {
          state.inp = Math.max(state.inp, entry.duration || 0);
          state.inpObserved = true;
        }
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 0 });
  } catch {}
})();`;

async function waitForFixturePage(client) {
  const deadline = Date.now() + CDP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const result = await client.send("Runtime.evaluate", {
        expression:
          `document.readyState === "complete" && `
          + `Boolean(document.querySelector('label[for="script-toggle-pinyin"]'))`,
        returnByValue: true,
      });
      if (result.result.value === true) return;
    } catch {
      // Navigation can replace the execution context.
    }
    await delay(100);
  }
  throw new Error("DFP-6 fixture page did not become interactive");
}

async function clickPinyinToggle(client) {
  const target = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const label = document.querySelector('label[for="script-toggle-pinyin"]');
      const rect = label?.getBoundingClientRect();
      return rect ? {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
      } : null;
    })()`,
    returnByValue: true,
  });
  if (!target.result.value) {
    throw new Error("DFP-6 interaction target is missing");
  }
  const { x, y } = target.result.value;
  await client.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
  await client.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
}

async function measureNavigation(client, requestGuard, route) {
  const ledger = createNetworkLedger();
  const responseCompletions = createBrowserResponseCompletionTracker();
  const requestRoles = new Map();
  const removeRequestListener = client.on(
    "Network.requestWillBeSent",
    (event) => {
      ledger.requestWillBeSent(event);
      requestRoles.set(event.requestId, browserRscRequestRole(event.request));
    },
  );
  const removeResponseListener = client.on(
    "Network.responseReceived",
    (event) => ledger.responseReceived(event),
  );
  const removeDataListener = client.on(
    "Network.dataReceived",
    (event) => ledger.dataReceived(event),
  );
  const removeLoadingFinishedListener = client.on(
    "Network.loadingFinished",
    (event) => responseCompletions.loadingFinished(event),
  );
  const removeLoadingFailedListener = client.on(
    "Network.loadingFailed",
    (event) => responseCompletions.loadingFailed(event),
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
    await waitForFixturePage(client);
    await delay(500);
    await requestGuard.assertSafe();
    await clickPinyinToggle(client);
    await delay(500);
    await requestGuard.assertSafe();

    const vitals = await client.send("Runtime.evaluate", {
      expression: "window.__DFP6_VITALS__",
      returnByValue: true,
    });
    const observed = vitals.result.value ?? {};
    const missingVitals = browserMissingVitalsDiagnostic(observed);
    if (missingVitals) {
      throw new Error(
        "DFP-6 browser sample did not observe required LCP/INP: "
        + `missingVitals=${missingVitals}`,
      );
    }

    const attributionEntries = ledger.entries();
    const initialRouteAttributionEntries = attributionEntries.filter((item) => {
      const attributionClass = browserResponseAttributionClass(item);
      const requestRole = attributionClass === "RSC"
        ? requestRoles.get(item.requestId) ?? "non-prefetch/unknown"
        : null;
      return browserResponseBelongsToInitialRoute(item, requestRole);
    });
    const attributionRequests = initialRouteAttributionEntries
      .map((item) => {
        const attributionClass = browserResponseAttributionClass(item);
        return {
          requestId: item.requestId,
          attributionClass,
          requestRole: attributionClass === "RSC"
            ? requestRoles.get(item.requestId) ?? "non-prefetch/unknown"
            : null,
        };
      })
      .filter(({ attributionClass }) => attributionClass !== null);
    await responseCompletions.waitForAll(attributionRequests);
    const { routeBytes } = await attributeRouteBytes(
      client,
      initialRouteAttributionEntries,
    );
    return {
      routeBytes,
      vitals: {
        lcpMs: observed.lcp,
        inpMs: observed.inp,
        cls: observed.cls,
      },
    };
  } finally {
    removeRequestListener();
    removeResponseListener();
    removeDataListener();
    removeLoadingFinishedListener();
    removeLoadingFailedListener();
  }
}

function metricSummary(samples, selector) {
  return summarizeSamples(
    samples.map((sample) => sample.status === "ok"
      ? { status: "ok", value: selector(sample.value) }
      : { status: "failed", error: "SAMPLE_FAILED" }),
    DFP6_RELEASE_PROFILE.syntheticPage.percentile,
    DFP6_RELEASE_PROFILE.syntheticPage.measuredSamples,
  );
}

async function fixtureHash() {
  const paths = [
    "scripts/dfp/dfp5/fixture-app/app/page.tsx",
    "app/lessons/[slug]/SupabaseLessonPage.tsx",
    "app/lessons/[slug]/LearningPanel.tsx",
    "app/globals.css",
  ];
  const hash = createHash("sha256");
  for (const filePath of paths) {
    hash.update(filePath);
    hash.update("\0");
    hash.update(await readFile(filePath, "utf8"));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export async function measureDfp6BrowserRelease({ commit }) {
  if (!/^[0-9a-f]{40}$/.test(commit ?? "")) {
    throw new Error("DFP-6 browser evidence requires an exact commit SHA");
  }

  const fixture = await startFixture();
  const browser = await launchChromium();
  let client;
  let requestGuard;
  try {
    const versionEndpoint = await waitForDebugger(browser.debugOrigin);
    const page = await createPage(browser.debugOrigin);
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.connect();
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Network.enable");
    await client.send("Page.addScriptToEvaluateOnNewDocument", {
      source: VITALS_BOOTSTRAP,
    });
    requestGuard = await createLocalRequestGuard(client);

    const route = `${fixture.origin}/?direction=ltr`;
    const sampleSet = await runSampleSet({
      measuredSamples: DFP6_RELEASE_PROFILE.syntheticPage.measuredSamples,
      percentile: DFP6_RELEASE_PROFILE.syntheticPage.percentile,
      summarize: false,
      run: () => measureNavigation(client, requestGuard, route),
    });
    const firstFailedSample = sampleSet.samples.find(
      (sample) => sample.status !== "ok",
    );
    if (firstFailedSample) {
      process.stderr.write(
        `DFP-6 browser first sample failure: ${
          sanitizeBrowserSampleDiagnostic(firstFailedSample.error)
        }\n`,
      );
    }

    const summary = {
      htmlBytes: metricSummary(
        sampleSet.samples,
        (sample) => sample.routeBytes.html,
      ),
      rscBytes: metricSummary(
        sampleSet.samples,
        (sample) => sample.routeBytes.rsc,
      ),
      javascriptBytes: metricSummary(
        sampleSet.samples,
        (sample) => sample.routeBytes.javascript,
      ),
      lcpMs: metricSummary(sampleSet.samples, (sample) => sample.vitals.lcpMs),
      inpMs: metricSummary(sampleSet.samples, (sample) => sample.vitals.inpMs),
      cls: metricSummary(sampleSet.samples, (sample) => sample.vitals.cls),
    };
    const gate = evaluateBrowserSummary(summary);
    const measuredFixtureHash = await fixtureHash();
    const identity = measurementIdentity({
      commit,
      route: "dfp6://production-lesson-script",
      fixtureHash: measuredFixtureHash,
      authorizationClass: "public",
      locale: "en",
      tool: {
        name: "Chromium DevTools Protocol",
        version: String(versionEndpoint.Browser ?? "unknown"),
      },
      cacheState: PROFILE.cache,
      sampleCount: DFP6_RELEASE_PROFILE.syntheticPage.measuredSamples,
      percentile: DFP6_RELEASE_PROFILE.syntheticPage.percentile,
    });

    return {
      evidenceStatus: "MEASURED",
      identity,
      fixtureKind: "production-component-local-fixture",
      sampleCount: sampleSet.samples.length,
      samples: sampleSet.samples.map((sample, index) =>
        sample.status === "ok"
          ? {
              index: index + 1,
              status: "ok",
              routeBytes: sample.value.routeBytes,
              vitals: sample.value.vitals,
            }
          : {
              index: index + 1,
              status: "failed",
              outcomeCode: "SAMPLE_FAILED",
            }),
      summary,
      gate,
    };
  } finally {
    if (requestGuard) {
      try {
        await requestGuard.close();
      } catch {
        // The primary measurement result remains authoritative.
      }
    }
    if (client) client.close();
    await Promise.allSettled([fixture.close(), browser.close()]);
  }
}
