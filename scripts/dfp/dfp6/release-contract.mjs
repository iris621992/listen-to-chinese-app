import {
  PAYLOAD_BUDGETS,
  PROFILE,
  ROUTE_ASSET_BUDGETS,
  ROUTE_PERFORMANCE_BUDGETS,
} from "../mspec-1/spec.mjs";

export const DFP6_VERSION = "DFP-6-release-observability.v1";
export const DFP6_EVIDENCE_SCHEMA_VERSION = "dfp6-release-evidence.v1";

export const SERVER_ASSEMBLY_BUDGETS = Object.freeze({
  discovery: Object.freeze({ targetMs: 300, blockingMs: 600 }),
  detail: Object.freeze({ targetMs: 500, blockingMs: 900 }),
  practice: Object.freeze({ targetMs: 400, blockingMs: 800 }),
});

export const DFP6_RELEASE_PROFILE = Object.freeze({
  measurementSpec: "DFP-MSPEC-1",
  serverAssembly: Object.freeze({
    warmUpRequests: PROFILE.cache.warmServerAssemblyRequests,
    measuredSamples: PROFILE.sampling.serverAssemblyMeasuredSamples,
    percentile: PROFILE.sampling.serverAssemblyPercentile,
    percentileMethod: PROFILE.sampling.percentileMethod,
  }),
  syntheticPage: Object.freeze({
    measuredSamples: PROFILE.sampling.syntheticPageMeasuredSamples,
    percentile: PROFILE.sampling.syntheticPagePercentile,
    percentileMethod: PROFILE.sampling.percentileMethod,
  }),
});

const FORBIDDEN_KEY =
  /(?:secret|token|password|credential|service.?role|publishable.?key|anon.?key|answer|correctness|grading|transcript|translation|raw.?content|database.?url)/i;
const FORBIDDEN_VALUE =
  /(?:service_role|NEXT_PUBLIC_SUPABASE_|SUPABASE_(?:URL|KEY)|postgres(?:ql)?:\/\/)/i;

function requireFinite(value, name, minimum = 0) {
  if (!Number.isFinite(value) || value < minimum) {
    throw new Error(`${name} must be a finite number >= ${minimum}`);
  }
  return value;
}

function summaryPass(summary) {
  return summary
    && summary.failedSampleCount === 0
    && summary.blocking === false
    && Number.isFinite(summary.value);
}

export function evaluateServerAssembly(flowName, summary) {
  const budget = SERVER_ASSEMBLY_BUDGETS[flowName];
  if (!budget) throw new Error(`Unknown DFP-6 server flow: ${flowName}`);
  const measurable = summaryPass(summary);
  const valueMs = measurable ? summary.value : null;
  return {
    flowName,
    targetMs: budget.targetMs,
    blockingMs: budget.blockingMs,
    valueMs,
    targetPass: measurable && valueMs <= budget.targetMs,
    blockingPass: measurable && valueMs <= budget.blockingMs,
    pass: measurable && valueMs <= budget.blockingMs,
  };
}

export function evaluateBrowserSummary(summary) {
  const required = [
    "htmlBytes",
    "rscBytes",
    "javascriptBytes",
    "lcpMs",
    "inpMs",
    "cls",
  ];
  const measurable = required.every((name) => summaryPass(summary?.[name]));
  if (!measurable) {
    return {
      pass: false,
      measurable: false,
      checks: Object.fromEntries(required.map((name) => [name, false])),
      targets: {},
    };
  }

  const checks = {
    htmlBytes:
      requireFinite(summary.htmlBytes.value, "htmlBytes", 1)
      <= ROUTE_ASSET_BUDGETS.html.hardBytes,
    rscBytes:
      requireFinite(summary.rscBytes.value, "rscBytes")
      <= ROUTE_ASSET_BUDGETS.rsc.hardBytes,
    javascriptBytes:
      requireFinite(summary.javascriptBytes.value, "javascriptBytes")
      <= ROUTE_ASSET_BUDGETS.javascript.hardBytes,
    lcpMs:
      requireFinite(summary.lcpMs.value, "lcpMs", Number.EPSILON)
      <= ROUTE_PERFORMANCE_BUDGETS.lcp.blockingMs,
    inpMs:
      requireFinite(summary.inpMs.value, "inpMs", Number.EPSILON)
      <= ROUTE_PERFORMANCE_BUDGETS.inp.blockingMs,
    cls:
      requireFinite(summary.cls.value, "cls")
      <= ROUTE_PERFORMANCE_BUDGETS.cls.blocking,
  };
  const targets = {
    htmlBytes: summary.htmlBytes.value <= ROUTE_ASSET_BUDGETS.html.targetBytes,
    rscBytes: summary.rscBytes.value <= ROUTE_ASSET_BUDGETS.rsc.targetBytes,
    javascriptBytes:
      summary.javascriptBytes.value <= ROUTE_ASSET_BUDGETS.javascript.targetBytes,
    lcpMs: summary.lcpMs.value <= ROUTE_PERFORMANCE_BUDGETS.lcp.targetMs,
    inpMs: summary.inpMs.value <= ROUTE_PERFORMANCE_BUDGETS.inp.targetMs,
    cls: summary.cls.value <= ROUTE_PERFORMANCE_BUDGETS.cls.target,
  };
  return {
    pass: Object.values(checks).every(Boolean),
    measurable: true,
    checks,
    targets,
  };
}

export function evaluatePayloadFixtures(fixtures) {
  if (!Array.isArray(fixtures) || fixtures.length === 0) {
    return { pass: false, checks: [] };
  }
  const checks = fixtures.map((fixture) => {
    const budget = PAYLOAD_BUDGETS[fixture.kind];
    const pass = Boolean(
      budget
      && Number.isFinite(fixture.bytes)
      && fixture.bytes >= 0
      && fixture.bytes <= budget.hardBytes
      && /^[0-9a-f]{64}$/.test(fixture.sha256 ?? ""),
    );
    return {
      id: fixture.id,
      kind: fixture.kind,
      bytes: fixture.bytes,
      hardBytes: budget?.hardBytes ?? null,
      pass,
    };
  });
  return { pass: checks.every((check) => check.pass), checks };
}

export function evaluateDfp6ReleaseGate({
  browser,
  invalidation,
  payloadFixtures,
  server,
}) {
  const serverChecks = Object.fromEntries(
    Object.entries(server).map(([name, evidence]) => [
      name,
      evaluateServerAssembly(name, evidence.summary),
    ]),
  );
  const browserCheck = evaluateBrowserSummary(browser.summary);
  const payloadCheck = evaluatePayloadFixtures(payloadFixtures);
  const invalidationPass = invalidation?.success === "APPLIED"
    && invalidation?.retry === "RETRY_REQUIRED"
    && invalidation?.terminalFailureObserved === false;

  return {
    pass:
      Object.values(serverChecks).every((check) => check.pass)
      && browserCheck.pass
      && payloadCheck.pass
      && invalidationPass,
    server: serverChecks,
    browser: browserCheck,
    payloadFixtures: payloadCheck,
    invalidation: { pass: invalidationPass },
  };
}

export function assertSanitizedTelemetry(value, path = "$") {
  if (value === null || value === undefined) return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.length > 1024) {
      throw new Error(`DFP-6 evidence string is unbounded at ${path}`);
    }
    if (FORBIDDEN_VALUE.test(value)) {
      throw new Error(`DFP-6 evidence contains a forbidden value at ${path}`);
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > 200) {
      throw new Error(`DFP-6 evidence array is unbounded at ${path}`);
    }
    value.forEach((item, index) =>
      assertSanitizedTelemetry(item, `${path}[${index}]`));
    return value;
  }
  if (typeof value !== "object") {
    throw new Error(`Unsupported DFP-6 evidence type at ${path}`);
  }

  const entries = Object.entries(value);
  if (entries.length > 100) {
    throw new Error(`DFP-6 evidence object is unbounded at ${path}`);
  }
  for (const [key, child] of entries) {
    if (FORBIDDEN_KEY.test(key)) {
      throw new Error(`DFP-6 evidence contains a forbidden key at ${path}.${key}`);
    }
    assertSanitizedTelemetry(child, `${path}.${key}`);
  }
  return value;
}
