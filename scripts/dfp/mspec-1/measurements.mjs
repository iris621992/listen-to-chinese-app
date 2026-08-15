import {
  MSPEC_VERSION,
  PAYLOAD_BUDGETS,
  PROFILE,
  ROUTE_ASSET_BUDGETS,
  ROUTE_PERFORMANCE_BUDGETS,
} from "./spec.mjs";

const AUTHORIZATION_CLASSES = new Set(["public", "learner-owned", "privileged"]);
const LOWER_HEX_40 = /^[0-9a-f]{40}$/;
const LOWER_HEX_64 = /^[0-9a-f]{64}$/;
const LOCALE_CODE = /^[A-Za-z0-9][A-Za-z0-9-]{0,34}$/;

function requireNonEmptyString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Evidence requires ${name}`);
  }
  return value;
}

export function resolveSamplingProfile(sampleCount, percentile) {
  const profiles = [
    {
      name: "server-assembly",
      sampleCount: PROFILE.sampling.serverAssemblyMeasuredSamples,
      percentile: PROFILE.sampling.serverAssemblyPercentile,
    },
    {
      name: "synthetic-page",
      sampleCount: PROFILE.sampling.syntheticPageMeasuredSamples,
      percentile: PROFILE.sampling.syntheticPagePercentile,
    },
  ];
  const profile = profiles.find((candidate) => (
    candidate.sampleCount === sampleCount
    && candidate.percentile === percentile
  ));
  if (!profile) {
    throw new Error(
      "Evidence sampling profile does not match a locked DFP-MSPEC-1 profile",
    );
  }
  return profile.name;
}

export function nearestRank(values, percentile) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new TypeError("nearestRank requires at least one value");
  }
  if (!(percentile > 0 && percentile <= 100)) {
    throw new RangeError("percentile must be greater than 0 and at most 100");
  }
  if (values.some((value) => !Number.isFinite(value))) {
    throw new TypeError("nearestRank accepts finite numeric values only");
  }
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil((percentile / 100) * sorted.length) - 1];
}

export function summarizeSamples(samples, percentile, expectedCount) {
  if (samples.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} samples, received ${samples.length}`);
  }
  const failedSamples = samples.filter((sample) => sample.status !== "ok");
  const values = samples
    .filter((sample) => sample.status === "ok")
    .map((sample) => sample.value);
  return {
    sampleCount: samples.length,
    successfulSampleCount: values.length,
    failedSampleCount: failedSamples.length,
    failures: failedSamples,
    percentile,
    percentileMethod: "nearest-rank",
    value: failedSamples.length === 0 ? nearestRank(values, percentile) : null,
    blocking: failedSamples.length > 0,
  };
}

export async function runSampleSet({
  measuredSamples,
  percentile,
  summarize = true,
  warmUpRequests = 0,
  run,
}) {
  if (!Number.isSafeInteger(warmUpRequests) || warmUpRequests < 0) {
    throw new Error("warmUpRequests must be a non-negative safe integer");
  }
  if (!Number.isSafeInteger(measuredSamples) || measuredSamples < 1) {
    throw new Error("measuredSamples must be a positive safe integer");
  }
  if (typeof summarize !== "boolean") {
    throw new Error("summarize must be a boolean");
  }
  for (let index = 0; index < warmUpRequests; index += 1) {
    await run({ phase: "warm-up", index: index + 1 });
  }
  const samples = [];
  for (let index = 0; index < measuredSamples; index += 1) {
    try {
      samples.push({
        index: index + 1,
        status: "ok",
        value: await run({ phase: "measured", index: index + 1 }),
      });
    } catch (error) {
      samples.push({
        index: index + 1,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return {
    samples,
    summary: summarize
      ? summarizeSamples(samples, percentile, measuredSamples)
      : null,
  };
}

export function createMeasurementRecorder() {
  const operations = [];
  const rows = new Map();
  let currentRound = 0;

  return {
    beginRound() {
      currentRound += 1;
      return currentRound;
    },
    recordOperation({
      class: operationClass = "data-store",
      durationMs = 0,
      outcome = "FOUND",
    } = {}) {
      if (currentRound === 0) {
        throw new Error("beginRound must be called before recordOperation");
      }
      if (!["data-store", "auth-session"].includes(operationClass)) {
        throw new Error(`Unsupported operation class: ${operationClass}`);
      }
      if (!Number.isFinite(durationMs) || durationMs < 0) {
        throw new Error("durationMs must be a non-negative finite number");
      }
      operations.push({
        class: operationClass,
        round: currentRound,
        durationMs,
        outcome,
      });
    },
    recordRows(collection, count) {
      if (!Number.isSafeInteger(count) || count < 0) {
        throw new Error("row count must be a non-negative safe integer");
      }
      rows.set(collection, (rows.get(collection) ?? 0) + count);
    },
    snapshot() {
      const byClass = (operationClass) => operations.filter(
        (operation) => operation.class === operationClass,
      );
      const roundsFor = (operationClass) => new Set(
        byClass(operationClass).map((operation) => operation.round),
      ).size;
      return {
        measurementSpec: MSPEC_VERSION,
        dataStoreOperations: byClass("data-store").length,
        dataStoreDependentRounds: roundsFor("data-store"),
        authSessionOperations: byClass("auth-session").length,
        authSessionDependentRounds: roundsFor("auth-session"),
        authSessionDurationMs: byClass("auth-session").reduce(
          (total, operation) => total + operation.durationMs,
          0,
        ),
        rows: Object.fromEntries([...rows.entries()].sort()),
        operations: structuredClone(operations),
      };
    },
  };
}

export function evaluateBrowserGate(measurement) {
  const checks = {
    html: Number.isFinite(measurement.routeBytes.html)
      && measurement.routeBytes.html > 0
      && measurement.routeBytes.html <= ROUTE_ASSET_BUDGETS.html.hardBytes,
    rsc: Number.isFinite(measurement.routeBytes.rsc)
      && measurement.routeBytes.rsc > 0
      && measurement.routeBytes.rsc <= ROUTE_ASSET_BUDGETS.rsc.hardBytes,
    javascript: Number.isFinite(measurement.routeBytes.javascript)
      && measurement.routeBytes.javascript >= 0
      && measurement.routeBytes.javascript <= ROUTE_ASSET_BUDGETS.javascript.hardBytes,
    lcp: Number.isFinite(measurement.vitals.lcpMs)
      && measurement.vitals.lcpMs > 0
      && measurement.vitals.lcpMs <= ROUTE_PERFORMANCE_BUDGETS.lcp.blockingMs,
    inp: Number.isFinite(measurement.vitals.inpMs)
      && measurement.vitals.inpMs > 0
      && measurement.vitals.inpMs <= ROUTE_PERFORMANCE_BUDGETS.inp.blockingMs,
    cls: Number.isFinite(measurement.vitals.cls)
      && measurement.vitals.cls >= 0
      && measurement.vitals.cls <= ROUTE_PERFORMANCE_BUDGETS.cls.blocking,
  };
  return {
    measurementSpec: MSPEC_VERSION,
    pass: Object.values(checks).every(Boolean),
    checks,
  };
}

export function payloadBudget(kind) {
  const budget = PAYLOAD_BUDGETS[kind];
  if (!budget) throw new Error(`Unknown payload budget: ${kind}`);
  return budget;
}

export function measurementIdentity({
  commit,
  route,
  fixtureHash,
  authorizationClass,
  locale,
  tool,
  cacheState,
  sampleCount,
  percentile,
}) {
  if (!LOWER_HEX_40.test(commit ?? "")) {
    throw new Error("Evidence requires an exact 40-character commit SHA");
  }
  requireNonEmptyString(route, "a route");
  if (!LOWER_HEX_64.test(fixtureHash ?? "")) {
    throw new Error("Evidence requires an exact lowercase SHA-256 fixture hash");
  }
  if (!AUTHORIZATION_CLASSES.has(authorizationClass)) {
    throw new Error("Evidence requires a supported authorization class");
  }
  if (typeof locale !== "string" || !LOCALE_CODE.test(locale)) {
    throw new Error("Evidence requires a valid locale");
  }
  if (!tool || typeof tool !== "object") {
    throw new Error("Evidence requires a tool identity");
  }
  requireNonEmptyString(tool.name, "a tool name");
  requireNonEmptyString(tool.version, "a tool version");
  if (
    !cacheState
    || cacheState.browserHttpCache !== PROFILE.cache.browserHttpCache
    || cacheState.serviceWorkers !== PROFILE.cache.serviceWorkers
    || cacheState.warmServerAssemblyRequests
      !== PROFILE.cache.warmServerAssemblyRequests
  ) {
    throw new Error("Evidence cache state does not match DFP-MSPEC-1");
  }
  const samplingProfile = resolveSamplingProfile(sampleCount, percentile);
  return {
    measurementSpec: MSPEC_VERSION,
    commit,
    route,
    fixtureHash,
    authorizationClass,
    locale,
    tool: structuredClone(tool),
    profile: PROFILE,
    cacheState: structuredClone(cacheState),
    samplingProfile,
    sampleCount,
    percentile,
    percentileMethod: "nearest-rank",
  };
}
