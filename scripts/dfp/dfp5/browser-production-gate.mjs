import { access, mkdtemp, readdir, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import {
  DFP5_IMAGE_HARD_BYTES,
  DFP5_RESERVED_ASPECT_RATIO,
  DFP5_VIEWPORT,
} from "./media-layout-contract.mjs";

const LOOPBACK_HOST = "127.0.0.1";
const FIXTURE_ROOT = path.resolve("scripts/dfp/dfp5/fixture-app");
const NEXT_CLI = path.resolve("node_modules/next/dist/bin/next");
const START_TIMEOUT_MS = 45_000;
const CDP_TIMEOUT_MS = 20_000;

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
  const explicit = process.env.DFP5_CHROME_EXECUTABLE;
  const commonCandidates = [
    explicit,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  for (const candidate of commonCandidates) {
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
    // The explicit/common paths above remain the portable contract.
  }

  throw new Error(
    "DFP-5 browser gate requires local Chromium; set DFP5_CHROME_EXECUTABLE",
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
    server.close((error) => (error ? reject(error) : resolve())),
  );
  if (!port) throw new Error("Unable to reserve the DFP-5 fixture port");
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

async function startNextFixture() {
  const port = await reservePort();
  const origin = `http://${LOOPBACK_HOST}:${port}`;
  const output = [];
  const child = spawn(
    process.execPath,
    [NEXT_CLI, "dev", FIXTURE_ROOT, "--hostname", LOOPBACK_HOST, "--port", String(port)],
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
      throw new Error(`DFP-5 Next fixture exited early:\n${output.join("")}`);
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
      // The fixture is still compiling.
    }
    await delay(200);
  }
  await stopProcess(child);
  throw new Error(`DFP-5 Next fixture did not become ready:\n${output.join("")}`);
}

async function launchChromium() {
  const executable = await chromiumExecutable();
  const userDataDirectory = await mkdtemp(path.join(tmpdir(), "dfp5-chrome-"));
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
  const debugOrigin = `http://${debugUrl.hostname}:${debugUrl.port}`;
  return {
    debugOrigin,
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
        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
        return;
      }
      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, CDP_TIMEOUT_MS);
      this.pending.set(id, {
        resolve(result) {
          clearTimeout(timeout);
          resolve(result);
        },
        reject(error) {
          clearTimeout(timeout);
          reject(error);
        },
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  waitFor(method, predicate = () => true) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`CDP event timed out: ${method}`));
      }, CDP_TIMEOUT_MS);
      const listener = (params) => {
        if (!predicate(params)) return;
        clearTimeout(timeout);
        const listeners = this.listeners.get(method) ?? [];
        this.listeners.set(
          method,
          listeners.filter((candidate) => candidate !== listener),
        );
        resolve(params);
      };
      this.on(method, listener);
    });
  }

  close() {
    this.socket.close();
  }
}

async function createPageClient(debugOrigin) {
  const response = await fetch(`${debugOrigin}/json/new?about:blank`, {
    method: "PUT",
  });
  if (!response.ok) {
    throw new Error(`Unable to create Chromium target: ${response.status}`);
  }
  const target = await response.json();
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  return client;
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Browser evaluation failed");
  }
  return result.result.value;
}

function domMeasurementExpression() {
  return `(() => {
    const root = document.documentElement;
    const body = document.body;
    const workspace = document.querySelector(".lesson-workspace");
    const mediaPane = document.querySelector(".lesson-media-pane");
    const learningPane = document.querySelector(".lesson-learning-pane");
    const media = document.querySelector(
      '[data-media-intent="youtube"], .intent-youtube-frame'
    );
    const rectFor = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      };
    };
    const viewportViolations = [...document.querySelectorAll(
      ".lesson-page-shell, .lesson-page-shell *"
    )].flatMap((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (
        style.display === "none" ||
        style.position === "fixed" ||
        rect.width === 0 ||
        rect.height === 0
      ) return [];
      return rect.left < -0.5 || rect.right > root.clientWidth + 0.5
        ? [{
            className: element.className,
            left: rect.left,
            right: rect.right,
          }]
        : [];
    });
    return {
      root: {
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
      },
      body: {
        clientWidth: body.clientWidth,
        scrollWidth: body.scrollWidth,
      },
      workspace: rectFor(workspace),
      mediaPane: rectFor(mediaPane),
      learningPane: rectFor(learningPane),
      media: rectFor(media),
      iframeSources: [...document.querySelectorAll("iframe")].map(
        (element) => element.src
      ),
      imageSources: [...document.images].map((element) => element.currentSrc),
      viewportViolations,
    };
  })()`;
}

function byteLength(responseBody) {
  return responseBody.base64Encoded
    ? Buffer.from(responseBody.body, "base64").byteLength
    : Buffer.byteLength(responseBody.body);
}

async function measureDirection({
  debugOrigin,
  fixtureOrigin,
  direction,
}) {
  const client = await createPageClient(debugOrigin);
  const requests = new Map();
  try {
    client.on("Network.requestWillBeSent", (event) => {
      requests.set(event.requestId, {
        requestId: event.requestId,
        url: event.request.url,
        type: event.type,
        response: null,
        encodedDataLength: null,
        failed: false,
      });
    });
    client.on("Network.responseReceived", (event) => {
      const entry = requests.get(event.requestId);
      if (entry) {
        entry.response = {
          mimeType: event.response.mimeType,
          status: event.response.status,
        };
      }
    });
    client.on("Network.loadingFinished", (event) => {
      const entry = requests.get(event.requestId);
      if (entry) entry.encodedDataLength = event.encodedDataLength;
    });
    client.on("Network.loadingFailed", (event) => {
      const entry = requests.get(event.requestId);
      if (entry) entry.failed = true;
    });

    await Promise.all([
      client.send("Page.enable"),
      client.send("Runtime.enable"),
      client.send("Network.enable"),
    ]);
    await client.send("Network.setBlockedURLs", {
      urls: ["*://www.youtube-nocookie.com/*"],
    });
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: DFP5_VIEWPORT.widthCssPixels,
      height: DFP5_VIEWPORT.heightCssPixels,
      deviceScaleFactor: 1,
      mobile: true,
    });

    const loaded = client.waitFor("Page.loadEventFired");
    await client.send("Page.navigate", {
      url: `${fixtureOrigin}/?direction=${direction}`,
    });
    await loaded;
    await delay(500);

    const initialRequestIds = new Set(requests.keys());
    const initialDom = await evaluate(client, domMeasurementExpression());
    const initialEntries = [...requests.values()].filter((entry) =>
      initialRequestIds.has(entry.requestId),
    );
    const thirdPartyMediaOrImageRequests = initialEntries.filter((entry) => {
      if (!/^https?:/.test(entry.url)) return false;
      const external = new URL(entry.url).origin !== fixtureOrigin;
      return external && ["Document", "Image", "Media"].includes(entry.type);
    });

    await evaluate(
      client,
      `document.querySelector('[data-media-intent="youtube"]').click()`,
    );
    await delay(500);
    const activatedDom = await evaluate(client, domMeasurementExpression());
    const activationRequests = [...requests.values()].filter(
      (entry) =>
        !initialRequestIds.has(entry.requestId)
        && entry.url.includes("youtube-nocookie.com/embed/"),
    );

    const probeStartedAt = new Set(requests.keys());
    const probeResult = await evaluate(
      client,
      `new Promise((resolve, reject) => {
        fetch("/probe-image", { cache: "no-store" })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error("image probe returned " + response.status);
            }
            const bytes = await response.arrayBuffer();
            resolve({
              contentType: response.headers.get("content-type"),
              bytes: bytes.byteLength,
            });
          })
          .catch(reject);
      })`,
    );
    if (!probeResult.contentType?.startsWith("image/") || probeResult.bytes <= 0) {
      throw new Error("Browser did not receive the delivered image probe");
    }
    await delay(100);
    const probeEntry = [...requests.values()].find(
      (entry) =>
        !probeStartedAt.has(entry.requestId)
        && entry.response?.mimeType?.startsWith("image/"),
    );
    if (!probeEntry || probeEntry.encodedDataLength === null) {
      throw new Error("CDP did not record the delivered image probe");
    }
    const probeBody = await client.send("Network.getResponseBody", {
      requestId: probeEntry.requestId,
    });

    return {
      direction,
      initial: {
        requestCount: initialEntries.length,
        iframeSources: initialDom.iframeSources,
        imageSources: initialDom.imageSources,
        thirdPartyMediaOrImageRequests:
          thirdPartyMediaOrImageRequests.map(({ type, url }) => ({ type, url })),
      },
      beforeActivation: initialDom,
      afterActivation: activatedDom,
      activationRequests: activationRequests.map(({ failed, type, url }) => ({
        failed,
        type,
        url,
      })),
      deliveredImage: {
        bodyBytes: byteLength(probeBody),
        encodedDataLength: probeEntry.encodedDataLength,
        mimeType: probeEntry.response.mimeType,
        url: probeEntry.url,
      },
    };
  } finally {
    client.close();
  }
}

export async function measureProductionLessonInBrowser() {
  const fixture = await startNextFixture();
  const chromium = await launchChromium();
  try {
    const measurements = [];
    for (const direction of ["ltr", "rtl"]) {
      measurements.push(
        await measureDirection({
          debugOrigin: chromium.debugOrigin,
          fixtureOrigin: fixture.origin,
          direction,
        }),
      );
    }
    for (const measurement of measurements) {
      if (
        measurement.deliveredImage.bodyBytes >= DFP5_IMAGE_HARD_BYTES
      ) {
        throw new Error(
          `Delivered image is ${measurement.deliveredImage.bodyBytes} bytes`,
        );
      }
      const beforeRatio =
        measurement.beforeActivation.media.width
        / measurement.beforeActivation.media.height;
      const afterRatio =
        measurement.afterActivation.media.width
        / measurement.afterActivation.media.height;
      if (
        Math.abs(beforeRatio - DFP5_RESERVED_ASPECT_RATIO) > 0.01
        || Math.abs(afterRatio - DFP5_RESERVED_ASPECT_RATIO) > 0.01
      ) {
        throw new Error("Production media box did not preserve 16:9");
      }
    }
    return measurements;
  } finally {
    try {
      await chromium.close();
    } finally {
      await fixture.close();
    }
  }
}
