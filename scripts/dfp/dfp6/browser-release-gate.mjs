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
    if (!observed.lcpObserved || !observed.inpObserved) {
      throw new Error("DFP-6 browser sample did not observe required LCP/INP");
    }

    const { routeBytes } = await attributeRouteBytes(client, ledger.entries());
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
