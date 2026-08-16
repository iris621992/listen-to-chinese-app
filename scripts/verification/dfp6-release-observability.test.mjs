import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertSanitizedTelemetry,
  DFP6_RELEASE_PROFILE,
  DFP6_VERSION,
  evaluateBrowserSummary,
  evaluateDfp6ReleaseGate,
  evaluateServerAssembly,
  SERVER_ASSEMBLY_BUDGETS,
} from "../dfp/dfp6/release-contract.mjs";
import {
  sanitizeBrowserSampleDiagnostic,
} from "../dfp/dfp6/browser-release-gate.mjs";
import {
  measureActualServerFlows,
  measureInvalidationOutcomes,
  measurePayloadFixtures,
} from "../dfp/dfp6/release-observability.mjs";

function summary(value, failedSampleCount = 0) {
  return {
    sampleCount: 30,
    successfulSampleCount: 30 - failedSampleCount,
    failedSampleCount,
    failures: failedSampleCount
      ? [{ status: "failed", error: "SAMPLE_FAILED" }]
      : [],
    percentile: 95,
    percentileMethod: "nearest-rank",
    value: failedSampleCount ? null : value,
    blocking: failedSampleCount > 0,
  };
}

function browserMetric(value, failedSampleCount = 0) {
  return {
    sampleCount: 10,
    successfulSampleCount: 10 - failedSampleCount,
    failedSampleCount,
    failures: failedSampleCount
      ? [{ status: "failed", error: "SAMPLE_FAILED" }]
      : [],
    percentile: 75,
    percentileMethod: "nearest-rank",
    value: failedSampleCount ? null : value,
    blocking: failedSampleCount > 0,
  };
}

test("locks DFP-6 release sampling and server thresholds", () => {
  assert.equal(DFP6_VERSION, "DFP-6-release-observability.v1");
  assert.deepEqual(DFP6_RELEASE_PROFILE.serverAssembly, {
    warmUpRequests: 1,
    measuredSamples: 30,
    percentile: 95,
    percentileMethod: "nearest-rank",
  });
  assert.deepEqual(SERVER_ASSEMBLY_BUDGETS, {
    discovery: { targetMs: 300, blockingMs: 600 },
    detail: { targetMs: 500, blockingMs: 900 },
    practice: { targetMs: 400, blockingMs: 800 },
  });
});

test("server thresholds distinguish target misses from blocking failures", () => {
  assert.deepEqual(
    evaluateServerAssembly("discovery", summary(250)),
    {
      flowName: "discovery",
      targetMs: 300,
      blockingMs: 600,
      valueMs: 250,
      targetPass: true,
      blockingPass: true,
      pass: true,
    },
  );
  assert.equal(evaluateServerAssembly("discovery", summary(450)).pass, true);
  assert.equal(
    evaluateServerAssembly("discovery", summary(450)).targetPass,
    false,
  );
  assert.equal(evaluateServerAssembly("discovery", summary(601)).pass, false);
  assert.equal(
    evaluateServerAssembly("discovery", summary(10, 1)).pass,
    false,
  );
});

test("browser gate uses blocking DFP-MSPEC-1 thresholds and retains failures", () => {
  const passing = {
    htmlBytes: browserMetric(50_000),
    rscBytes: browserMetric(50_000),
    javascriptBytes: browserMetric(120_000),
    lcpMs: browserMetric(2_000),
    inpMs: browserMetric(150),
    cls: browserMetric(0.05),
  };
  assert.equal(evaluateBrowserSummary(passing).pass, true);

  assert.equal(
    evaluateBrowserSummary({
      ...passing,
      lcpMs: browserMetric(4_001),
    }).pass,
    false,
  );
  assert.equal(
    evaluateBrowserSummary({
      ...passing,
      inpMs: browserMetric(100, 1),
    }).pass,
    false,
  );
});

test("browser sample diagnostics are bounded and redact sensitive values", () => {
  const diagnostic = sanitizeBrowserSampleDiagnostic(
    `request failed at https://example.test/private?token=abc `
      + `token=abc NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co `
      + "x".repeat(1024),
  );
  assert.ok(diagnostic.length <= 512);
  assert.doesNotMatch(diagnostic, /https?:\/\//i);
  assert.doesNotMatch(diagnostic, /abc/);
  assert.doesNotMatch(diagnostic, /NEXT_PUBLIC_SUPABASE_/);
  assert.match(diagnostic, /\[REDACTED/);
});

test("sanitized evidence rejects secrets, answer material, and unbounded values", () => {
  assert.doesNotThrow(() =>
    assertSanitizedTelemetry({
      commit: "a".repeat(40),
      rows: { lessons: 24 },
      outcomeCode: "FOUND",
    }));
  assert.throws(
    () => assertSanitizedTelemetry({ serviceRoleToken: "redacted" }),
    /forbidden key/,
  );
  assert.throws(
    () => assertSanitizedTelemetry({ value: "NEXT_PUBLIC_SUPABASE_URL" }),
    /forbidden value/,
  );
  assert.throws(
    () => assertSanitizedTelemetry({ transcript: "fixture" }),
    /forbidden key/,
  );
  assert.throws(
    () => assertSanitizedTelemetry({ value: "x".repeat(1025) }),
    /unbounded/,
  );
});

test("actual DFP-2/3 production flow functions produce stable bounded telemetry", async () => {
  const evidence = await measureActualServerFlows();

  assert.doesNotThrow(() => assertSanitizedTelemetry(evidence));
  assert.equal(evidence.discovery.sampleCount, 30);
  assert.equal(evidence.detail.sampleCount, 30);
  assert.equal(evidence.practice.sampleCount, 30);

  for (const sample of evidence.discovery.samples) {
    assert.equal(sample.status, "ok");
    assert.equal(sample.dataStoreOperations, 1);
    assert.equal(sample.dataStoreDependentRounds, 1);
    assert.equal(sample.authSessionOperations, 0);
    assert.equal(sample.outcomeCode, "FOUND");
  }
  for (const sample of evidence.detail.samples) {
    assert.equal(sample.status, "ok");
    assert.equal(sample.dataStoreOperations, 4);
    assert.equal(sample.dataStoreDependentRounds, 3);
    assert.equal(sample.authSessionOperations, 0);
    assert.equal(sample.outcomeCode, "FOUND");
    assert.equal(sample.rows.localized_segments, 2);
    assert.equal(Object.hasOwn(sample.rows, "segment_translations"), false);
  }
  for (const sample of evidence.practice.samples) {
    assert.equal(sample.status, "ok");
    assert.equal(sample.dataStoreOperations, 1);
    assert.equal(sample.dataStoreDependentRounds, 1);
    assert.equal(sample.authSessionOperations, 0);
    assert.equal(sample.outcomeCode, "FOUND");
  }

  assert.equal(evidence.discovery.summary.failedSampleCount, 0);
  assert.equal(evidence.detail.summary.failedSampleCount, 0);
  assert.equal(evidence.practice.summary.failedSampleCount, 0);
});

test("release evidence uses representative DFP-MSPEC-1 payload fixtures only", async () => {
  const fixtures = await measurePayloadFixtures();
  assert.deepEqual(
    fixtures.map(({ id }) => id),
    [
      "detail-representative",
      "discovery-representative",
      "practice-representative",
    ],
  );
  for (const fixture of fixtures) {
    assert.match(fixture.sha256, /^[0-9a-f]{64}$/);
    assert.ok(fixture.bytes > 0);
  }
});

test("invalidation evidence measures success and retry without a provider", async () => {
  const evidence = await measureInvalidationOutcomes();
  assert.equal(evidence.success, "APPLIED");
  assert.equal(evidence.retry, "RETRY_REQUIRED");
  assert.equal(evidence.terminalFailureObserved, false);
  assert.deepEqual(
    evidence.observedOutcomeCodes,
    ["APPLIED", "RETRY_REQUIRED"],
  );
});

test("release gate fails closed unless every DFP-6 surface passes", async () => {
  const server = {
    discovery: { summary: summary(100) },
    detail: { summary: summary(100) },
    practice: { summary: summary(100) },
  };
  const browser = {
    summary: {
      htmlBytes: browserMetric(10_000),
      rscBytes: browserMetric(0),
      javascriptBytes: browserMetric(50_000),
      lcpMs: browserMetric(1_000),
      inpMs: browserMetric(100),
      cls: browserMetric(0),
    },
  };
  const payloadFixtures = await measurePayloadFixtures();
  const invalidation = {
    success: "APPLIED",
    retry: "RETRY_REQUIRED",
    terminalFailureObserved: false,
  };
  assert.equal(
    evaluateDfp6ReleaseGate({
      server,
      browser,
      payloadFixtures,
      invalidation,
    }).pass,
    true,
  );
  assert.equal(
    evaluateDfp6ReleaseGate({
      server,
      browser: {
        summary: { ...browser.summary, lcpMs: browserMetric(5_000) },
      },
      payloadFixtures,
      invalidation,
    }).pass,
    false,
  );
});

test("implementation stays public-safe and bound to actual production surfaces", async () => {
  const [
    observabilitySource,
    browserSource,
    readmeSource,
    packageSource,
    workflowSource,
  ] = await Promise.all([
    readFile("scripts/dfp/dfp6/release-observability.mjs", "utf8"),
    readFile("scripts/dfp/dfp6/browser-release-gate.mjs", "utf8"),
    readFile("scripts/dfp/dfp6/README.md", "utf8"),
    readFile("package.json", "utf8"),
    readFile(".github/workflows/sbca-ci.yml", "utf8"),
  ]);

  assert.match(observabilitySource, /lib\/lessonDiscovery\.ts/);
  assert.match(observabilitySource, /lib\/supabaseLesson\.ts/);
  assert.match(observabilitySource, /lib\/publicContentCache\.ts/);
  assert.doesNotMatch(observabilitySource, /NEXT_PUBLIC_SUPABASE_/);
  assert.doesNotMatch(observabilitySource, /\bvercel\b/i);

  assert.match(
    browserSource,
    /scripts\/dfp\/dfp5\/fixture-app/,
  );
  assert.match(
    browserSource,
    /app\/lessons\/\[slug\]\/SupabaseLessonPage\.tsx/,
  );
  assert.match(browserSource, /createLocalRequestGuard/);
  assert.match(browserSource, /Input\.dispatchMouseEvent/);
  assert.match(browserSource, /Network\.emulateNetworkConditions/);
  assert.match(browserSource, /DFP-6 browser first sample failure/);
  assert.match(browserSource, /sanitizeBrowserSampleDiagnostic/);

  assert.match(readmeSource, /Field evidence is explicitly `NOT_COLLECTED`/);

  const packageDocument = JSON.parse(packageSource);
  assert.equal(
    packageDocument.scripts["test:dfp6"],
    "node --experimental-vm-modules --test scripts/verification/dfp6-release-observability.test.mjs",
  );
  assert.equal(
    packageDocument.scripts["measure:dfp6:release"],
    "node --experimental-vm-modules scripts/dfp/dfp6/release-observability.mjs",
  );

  assert.match(workflowSource, /name: DFP-6 gate/);
  assert.match(workflowSource, /npm run test:dfp6/);
  assert.match(workflowSource, /measure:dfp6:release/);
  assert.match(workflowSource, /dfp6-release-evidence\.json/);
});
