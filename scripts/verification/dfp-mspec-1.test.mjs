import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertFixtureEvidenceIdentity,
  assertMeasuredCommit,
  attributeRouteBytes,
  buildBrowserEvidence,
  createLocalRequestGuard,
  createNetworkLedger,
  isLoopbackHttpUrl,
  parseBrowserArguments,
  resolveMeasuredSourceCommit,
  verifyFixtureResponseIdentity,
} from "../dfp/mspec-1/browser-runner.mjs";
import { deterministicJson, sha256 } from "../dfp/mspec-1/deterministic-json.mjs";
import {
  createFixtureAdapter,
  FIXTURE_ASSET_JS,
  fixtureEvidenceIdentity,
  renderFixtureRoute,
} from "../dfp/mspec-1/fixture-adapter.mjs";
import {
  loadFixtureManifest,
  loadMeasuredFixtures,
} from "../dfp/mspec-1/fixtures.mjs";
import { evaluateMeasuredFixtures } from "../dfp/mspec-1/measure-fixtures.mjs";
import {
  createMeasurementRecorder,
  evaluateBrowserGate,
  measurementIdentity,
  nearestRank,
  payloadBudget,
  resolveSamplingProfile,
  runSampleSet,
  summarizeSamples,
} from "../dfp/mspec-1/measurements.mjs";
import {
  FIXTURE_GENERATOR_VERSION,
  FIXTURE_SCHEMA_VERSION,
  MSPEC_VERSION,
  PROFILE,
} from "../dfp/mspec-1/spec.mjs";

test("locks DFP-MSPEC-1 deterministic JSON and UTF-8 hashing", () => {
  const left = {
    z: 1,
    a: { ignored: undefined, c: "中文", b: true },
    removed: undefined,
    list: [3, undefined, 1],
  };
  const right = {
    list: [3, 1],
    a: { b: true, c: "中文" },
    z: 1,
  };
  assert.equal(deterministicJson(left), deterministicJson(right));
  assert.equal(sha256(left), sha256(right));
  assert.throws(() => deterministicJson({ bad: Number.NaN }), /Non-finite/);
});

test("locks the exact viewport, synthetic profile, cache state, and samples", () => {
  assert.deepEqual(PROFILE.viewport, {
    widthCssPixels: 390,
    heightCssPixels: 844,
    devicePixelRatio: 3,
  });
  assert.deepEqual(PROFILE.network, {
    downstreamBitsPerSecond: 1_600_000,
    upstreamBitsPerSecond: 750_000,
    roundTripLatencyMs: 150,
  });
  assert.equal(PROFILE.cpuSlowdownMultiplier, 4);
  assert.equal(PROFILE.cache.browserHttpCache, "empty");
  assert.equal(PROFILE.cache.serviceWorkers, "disabled");
  assert.equal(PROFILE.sampling.syntheticPageMeasuredSamples, 10);
  assert.equal(PROFILE.sampling.percentileMethod, "nearest-rank");
});

test("verifies every fixture identity and hard budget", async () => {
  const manifest = await loadFixtureManifest();
  const fixtures = await loadMeasuredFixtures();
  assert.equal(manifest.measurementSpec, MSPEC_VERSION);
  assert.equal(manifest.fixtureSchemaVersion, FIXTURE_SCHEMA_VERSION);
  assert.equal(manifest.fixtureGeneratorVersion, FIXTURE_GENERATOR_VERSION);
  assert.deepEqual(
    new Set(fixtures.map(({ definition }) => definition.sizeClass)),
    new Set(["minimum", "representative", "maximum-approved"]),
  );
  for (const { definition, measurement } of fixtures) {
    assert.equal(measurement.sha256, definition.sha256, definition.id);
    assert.equal(measurement.bytes, definition.bytes, definition.id);
    assert.ok(measurement.bytes <= payloadBudget(definition.kind).hardBytes);
  }
  assert.equal(evaluateMeasuredFixtures(manifest, fixtures).pass, true);
  const localeMaximum = fixtures.find(
    ({ definition }) => definition.id === "locale-registry-maximum-approved",
  );
  assert.equal(localeMaximum.measurement.value.data.locales.length, 15);
  assert.ok(
    localeMaximum.measurement.value.data.locales.some(
      (locale) => locale.direction === "rtl",
    ),
  );
});

test("fixture gate fails closed on locked hash, byte, and set drift", async () => {
  const manifest = await loadFixtureManifest();
  const fixtures = await loadMeasuredFixtures();
  const hashDrift = structuredClone(manifest);
  hashDrift.fixtures[0].sha256 = "0".repeat(64);
  assert.equal(evaluateMeasuredFixtures(hashDrift, fixtures).pass, false);
  const byteDrift = structuredClone(manifest);
  byteDrift.fixtures[0].bytes += 1;
  assert.equal(evaluateMeasuredFixtures(byteDrift, fixtures).pass, false);
  const missingFixture = structuredClone(manifest);
  missingFixture.fixtures.pop();
  assert.equal(evaluateMeasuredFixtures(missingFixture, fixtures).pass, false);
  const duplicateFixture = structuredClone(manifest);
  duplicateFixture.fixtures.push(structuredClone(duplicateFixture.fixtures[0]));
  assert.equal(evaluateMeasuredFixtures(duplicateFixture, fixtures).pass, false);
});

test("uses nearest-rank percentiles and retains failed samples as blocking", () => {
  assert.equal(nearestRank([9, 1, 8, 2, 7, 3, 6, 4, 5, 10], 75), 8);
  const summary = summarizeSamples(
    Array.from({ length: 10 }, (_, index) => index === 4
      ? { status: "failed", error: "timeout" }
      : { status: "ok", value: index + 1 }),
    75,
    10,
  );
  assert.equal(summary.failedSampleCount, 1);
  assert.equal(summary.value, null);
  assert.equal(summary.blocking, true);
});

test("runs exactly one warm-up and 30 measured server samples", async () => {
  const phases = [];
  const result = await runSampleSet({
    warmUpRequests: PROFILE.cache.warmServerAssemblyRequests,
    measuredSamples: PROFILE.sampling.serverAssemblyMeasuredSamples,
    percentile: PROFILE.sampling.serverAssemblyPercentile,
    run: ({ phase, index }) => {
      phases.push(`${phase}-${index}`);
      return index;
    },
  });
  assert.equal(phases[0], "warm-up-1");
  assert.equal(result.samples.length, 30);
  assert.equal(result.summary.value, 29);
  assert.equal(phases.length, 31);
});

test("retains object-valued browser samples without numeric summarization", async () => {
  const result = await runSampleSet({
    measuredSamples: 2,
    percentile: 75,
    summarize: false,
    run: ({ index }) => ({
      routeBytes: { html: index * 100 },
      vitals: { lcpMs: index * 10 },
    }),
  });
  assert.equal(result.summary, null);
  assert.deepEqual(
    result.samples.map((sample) => sample.value),
    [
      { routeBytes: { html: 100 }, vitals: { lcpMs: 10 } },
      { routeBytes: { html: 200 }, vitals: { lcpMs: 20 } },
    ],
  );
});

test("records data-store and auth operations, rounds, durations, and rows", () => {
  const recorder = createMeasurementRecorder();
  recorder.beginRound();
  recorder.recordOperation({ durationMs: 25 });
  recorder.recordOperation({ class: "auth-session", durationMs: 40 });
  recorder.recordRows("resources", 24);
  recorder.beginRound();
  recorder.recordOperation({ durationMs: 10, outcome: "EMPTY" });
  recorder.recordRows("resources", 0);
  assert.deepEqual(recorder.snapshot(), {
    measurementSpec: "DFP-MSPEC-1",
    dataStoreOperations: 2,
    dataStoreDependentRounds: 2,
    authSessionOperations: 1,
    authSessionDependentRounds: 1,
    authSessionDurationMs: 40,
    rows: { resources: 24 },
    operations: [
      { class: "data-store", round: 1, durationMs: 25, outcome: "FOUND" },
      { class: "auth-session", round: 1, durationMs: 40, outcome: "FOUND" },
      { class: "data-store", round: 2, durationMs: 10, outcome: "EMPTY" },
    ],
  });
});

function completeIdentity(overrides = {}) {
  return {
    commit: "a".repeat(40),
    route: "http://127.0.0.1:4173/__dfp__/route/detail-representative",
    fixtureHash: "b".repeat(64),
    authorizationClass: "public",
    locale: "vi",
    tool: { name: "Chromium DevTools Protocol", version: "Chrome/140" },
    cacheState: PROFILE.cache,
    sampleCount: 10,
    percentile: 75,
    ...overrides,
  };
}

test("requires complete evidence identity and exact DFP-MSPEC-1 values", () => {
  const identity = measurementIdentity(completeIdentity());
  assert.equal(identity.measurementSpec, "DFP-MSPEC-1");
  assert.equal(identity.samplingProfile, "synthetic-page");
  assert.equal(resolveSamplingProfile(30, 95), "server-assembly");
  const invalid = [
    { commit: "main" },
    { route: "" },
    { fixtureHash: "not-a-hash" },
    { authorizationClass: "unknown" },
    { locale: "" },
    { tool: { name: "CDP", version: "" } },
    { cacheState: { ...PROFILE.cache, serviceWorkers: "enabled" } },
    { sampleCount: 1, percentile: 1 },
    { sampleCount: 10, percentile: 95 },
    { sampleCount: 30, percentile: 75 },
  ];
  for (const override of invalid) {
    assert.throws(() => measurementIdentity(completeIdentity(override)));
  }
});

test("binds evidence locale and authorization class to the measured fixture", async () => {
  const fixture = (await loadMeasuredFixtures()).find(
    ({ definition }) => definition.id === "detail-representative",
  );
  assert.deepEqual(fixtureEvidenceIdentity(fixture), {
    locale: "vi",
    authorizationClass: "public",
  });
  assert.deepEqual(
    assertFixtureEvidenceIdentity({
      locale: "vi",
      authorizationClass: "public",
    }, fixture),
    fixtureEvidenceIdentity(fixture),
  );
  assert.throws(
    () => assertFixtureEvidenceIdentity({
      locale: "ar",
      authorizationClass: "public",
    }, fixture),
    /does not match fixture locale vi/,
  );
  assert.throws(
    () => assertFixtureEvidenceIdentity({
      locale: "vi",
      authorizationClass: "privileged",
    }, fixture),
    /does not match fixture authorization class public/,
  );
  assert.match(renderFixtureRoute(fixture), /<html lang="vi"/);
  assert.match(
    renderFixtureRoute(fixture),
    /data-dfp-authorization-class="public"/,
  );
});

test("binds --commit to the actual measured source HEAD", () => {
  const head = "a".repeat(40);
  assert.equal(assertMeasuredCommit(head, head), head);
  assert.throws(
    () => assertMeasuredCommit(head, "b".repeat(40)),
    /does not match measured source HEAD/,
  );
});

test("rejects an untracked measured-source worktree", async () => {
  const head = "a".repeat(40);
  const calls = [];
  const runGit = async (command, argumentsList, options) => {
    calls.push({ command, argumentsList, options });
    return argumentsList[0] === "rev-parse"
      ? { stdout: `${head}\n` }
      : { stdout: "?? untracked-route.mjs\n" };
  };
  await assert.rejects(
    () => resolveMeasuredSourceCommit({
      repositoryRoot: "/tmp/dfp-source",
      runGit,
    }),
    /worktree is not clean/,
  );
  assert.deepEqual(calls[1].argumentsList, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);
});

test("fails the browser gate when LCP or INP was not observed", () => {
  const gate = evaluateBrowserGate({
    routeBytes: { html: 1, rsc: 1, javascript: 0 },
    vitals: { lcpMs: 0, inpMs: 0, cls: 0 },
  });
  assert.equal(gate.pass, false);
  assert.equal(gate.checks.lcp, false);
  assert.equal(gate.checks.inp, false);
});

test("restricts origins and every page request to loopback HTTP", async () => {
  assert.equal(isLoopbackHttpUrl("http://127.0.0.1:4173/a"), true);
  assert.equal(isLoopbackHttpUrl("http://[::1]:4173/a"), true);
  assert.equal(isLoopbackHttpUrl("https://127.0.0.1/a"), false);
  assert.equal(isLoopbackHttpUrl("http://127.0.0.1.example.com/a"), false);
  const valid = parseBrowserArguments([
    "--browser=/usr/bin/chromium",
    "--origin=http://127.0.0.1:4173",
    "--fixture=discovery-representative",
    `--commit=${"a".repeat(40)}`,
  ]);
  assert.equal(valid.origin, "http://127.0.0.1:4173");
  assert.throws(() => parseBrowserArguments([
    "--browser=/usr/bin/chromium",
    "--origin=https://example.com",
    "--fixture=discovery-representative",
    `--commit=${"a".repeat(40)}`,
  ]), /restricted to local HTTP origins/);

  const listeners = new Map();
  const commands = [];
  const client = {
    on(method, listener) {
      listeners.set(method, listener);
      return () => listeners.delete(method);
    },
    async send(method, params) {
      commands.push({ method, params });
      return {};
    },
  };
  const guard = await createLocalRequestGuard(client);
  listeners.get("Fetch.requestPaused")({
    requestId: "local",
    request: { url: "http://localhost:4173/asset.js" },
  });
  listeners.get("Fetch.requestPaused")({
    requestId: "external",
    request: { url: "https://example.com/tracker.js" },
  });
  await assert.rejects(() => guard.assertSafe(), /Non-loopback browser request blocked/);
  assert.ok(commands.some(({ method, params }) => (
    method === "Fetch.continueRequest" && params.requestId === "local"
  )));
  assert.ok(commands.some(({ method, params }) => (
    method === "Fetch.failRequest" && params.requestId === "external"
  )));
  await assert.rejects(() => guard.close(), /Non-loopback browser request blocked/);
});

test("bypasses service workers through the Network domain", async () => {
  const source = await readFile(
    "scripts/dfp/mspec-1/browser-runner.mjs",
    "utf8",
  );
  assert.match(
    source,
    /Network\.setBypassServiceWorker", \{ bypass: true \}/,
  );
});

test("attributes redirect, bootstrap, framework, HTML, RSC, and JS responses", async () => {
  const ledger = createNetworkLedger();
  ledger.requestWillBeSent({
    requestId: "doc",
    request: { url: "http://127.0.0.1:4173/final" },
    type: "Document",
    redirectResponse: {
      url: "http://127.0.0.1:4173/start",
      status: 302,
      mimeType: "text/html",
      headers: {},
      encodedDataLength: 37,
    },
  });
  ledger.responseReceived({
    requestId: "doc",
    type: "Document",
    response: {
      url: "http://127.0.0.1:4173/final",
      mimeType: "text/html",
      headers: {},
    },
  });
  ledger.dataReceived({ requestId: "doc", encodedDataLength: 20 });
  ledger.requestWillBeSent({
    requestId: "rsc",
    request: { url: "http://127.0.0.1:4173/_next/rsc" },
    type: "Fetch",
  });
  ledger.responseReceived({
    requestId: "rsc",
    type: "Fetch",
    response: {
      url: "http://127.0.0.1:4173/_next/rsc",
      mimeType: "text/x-component",
      headers: {},
    },
  });
  ledger.requestWillBeSent({
    requestId: "bootstrap",
    request: { url: "http://127.0.0.1:4173/bootstrap.json" },
    type: "Fetch",
  });
  ledger.responseReceived({
    requestId: "bootstrap",
    type: "Fetch",
    response: {
      url: "http://127.0.0.1:4173/bootstrap.json",
      mimeType: "application/json",
      headers: {},
    },
  });
  const client = {
    async send(method, { requestId }) {
      assert.equal(method, "Network.getResponseBody");
      return {
        body: requestId === "doc" ? "<html>ok</html>" : "rsc-data",
        base64Encoded: false,
      };
    },
  };
  const result = await attributeRouteBytes(client, ledger.entries());
  assert.equal(result.routeBytes.html, Buffer.byteLength("<html>ok</html>"));
  assert.equal(result.routeBytes.rsc, Buffer.byteLength("rsc-data"));
  assert.ok(result.attribution.some((item) => (
    item.classification === "redirect"
    && item.encodedBodyBytes === 37
    && item.source === "requestWillBeSent.redirectResponse"
  )));
  assert.ok(result.attribution.some((item) => (
    item.url.endsWith("/bootstrap.json")
    && item.classification === "other"
    && item.requiredForInitialRoute
  )));
});

test("fails closed when browser responses do not match the fixture adapter", async () => {
  const fixture = (await loadMeasuredFixtures()).find(
    ({ definition }) => definition.id === "detail-representative",
  );
  const origin = "http://127.0.0.1:4173";
  const attribution = [
    {
      url: `${origin}/__dfp__/route/${fixture.definition.id}`,
      classification: "html",
      redirect: false,
      bodySha256: sha256(renderFixtureRoute(fixture)),
    },
    {
      url: `${origin}/__dfp__/rsc/${fixture.definition.id}`,
      classification: "rsc",
      redirect: false,
      bodySha256: fixture.measurement.sha256,
    },
    {
      url: `${origin}/__dfp__/asset.js`,
      classification: "javascript",
      redirect: false,
      bodySha256: sha256(FIXTURE_ASSET_JS),
    },
  ];
  const verified = verifyFixtureResponseIdentity({
    attribution,
    fixture,
    origin,
  });
  assert.equal(verified.pass, true);
  assert.equal(verified.fixtureSha256, fixture.measurement.sha256);

  const forged = structuredClone(attribution);
  forged[1].bodySha256 = sha256("{\"forged\":true}");
  assert.throws(
    () => verifyFixtureResponseIdentity({
      attribution: forged,
      fixture,
      origin,
    }),
    /fixture-rsc response hash .* does not match canonical/,
  );
});

test("serializes blocking guard failures before browser runner exit", async () => {
  const fixture = (await loadMeasuredFixtures()).find(
    ({ definition }) => definition.id === "detail-representative",
  );
  const violation = "Non-loopback browser request blocked: https://example.com/a.js";
  const samples = Array.from({ length: 10 }, (_, index) => ({
    index: index + 1,
    status: "failed",
    error: violation,
  }));
  const evidence = buildBrowserEvidence({
    options: {
      commit: "a".repeat(40),
      authorizationClass: "public",
      locale: "vi",
    },
    versionEndpoint: {
      Browser: "Chrome/149",
      "Protocol-Version": "1.3",
    },
    fixture,
    route: "http://127.0.0.1:4173/__dfp__/route/detail-representative",
    samples,
    runnerFailures: [{
      phase: "request-guard-finalization",
      error: violation,
    }],
  });
  const serialized = JSON.stringify(evidence);
  assert.equal(evidence.gate.pass, false);
  assert.equal(evidence.gate.trustChecks.runnerFailuresAbsent, false);
  assert.equal(evidence.samples.length, 10);
  assert.match(serialized, /Non-loopback browser request blocked/);
  assert.match(serialized, /expected-manifest-for-blocking-evidence/);
});

test("serves fixtures, RSC, HTML, and JS from loopback only", async () => {
  const adapter = await createFixtureAdapter();
  const origin = await adapter.listen();
  try {
    assert.equal(new URL(origin).hostname, "127.0.0.1");
    const fixtureResponse = await fetch(
      `${origin}/__dfp__/fixture/discovery-minimum`,
    );
    assert.equal(fixtureResponse.headers.get("cache-control"), "no-store");
    const rscResponse = await fetch(
      `${origin}/__dfp__/rsc/discovery-minimum`,
    );
    assert.match(rscResponse.headers.get("content-type"), /text\/x-component/);
    const routeResponse = await fetch(
      `${origin}/__dfp__/route/discovery-minimum`,
    );
    assert.match(await routeResponse.text(), /window\.__DFP_READY__/);
    assert.equal((await fetch(`${origin}/__dfp__/asset.js`)).status, 200);
  } finally {
    await adapter.close();
  }
});

test("exposes only local measurement commands and no runtime dependency", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(
    packageJson.scripts["test:dfp0"],
    "node --test scripts/verification/dfp-mspec-1.test.mjs",
  );
  assert.match(packageJson.scripts["measure:dfp0:browser"], /browser-runner/);
  assert.equal(packageJson.devDependencies.playwright, undefined);
  assert.equal(packageJson.dependencies.playwright, undefined);
});
