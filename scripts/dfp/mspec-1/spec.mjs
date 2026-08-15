export const MSPEC_VERSION = "DFP-MSPEC-1";
export const FIXTURE_SCHEMA_VERSION = "dfp-fixture-schema-1";
export const FIXTURE_GENERATOR_VERSION = "dfp-fixture-generator-1";

export const PROFILE = Object.freeze({
  viewport: Object.freeze({
    widthCssPixels: 390,
    heightCssPixels: 844,
    devicePixelRatio: 3,
  }),
  network: Object.freeze({
    downstreamBitsPerSecond: 1_600_000,
    upstreamBitsPerSecond: 750_000,
    roundTripLatencyMs: 150,
  }),
  cpuSlowdownMultiplier: 4,
  cache: Object.freeze({
    browserHttpCache: "empty",
    serviceWorkers: "disabled",
    warmServerAssemblyRequests: 1,
  }),
  sampling: Object.freeze({
    serverAssemblyMeasuredSamples: 30,
    serverAssemblyPercentile: 95,
    syntheticPageMeasuredSamples: 10,
    syntheticPagePercentile: 75,
    percentileMethod: "nearest-rank",
    failedSamples: "retained-and-blocking",
  }),
});

export const PAYLOAD_BUDGETS = Object.freeze({
  discovery: Object.freeze({ targetBytes: 64 * 1024, hardBytes: 96 * 1024 }),
  detail: Object.freeze({ targetBytes: 192 * 1024, hardBytes: 256 * 1024 }),
  lazySection: Object.freeze({ targetBytes: 96 * 1024, hardBytes: 128 * 1024 }),
  practice: Object.freeze({ targetBytes: 96 * 1024, hardBytes: 128 * 1024 }),
  localeRegistry: Object.freeze({ targetBytes: 16 * 1024, hardBytes: 24 * 1024 }),
  boundedError: Object.freeze({ targetBytes: 4 * 1024, hardBytes: 8 * 1024 }),
});

export const ROUTE_ASSET_BUDGETS = Object.freeze({
  html: Object.freeze({ targetBytes: 64 * 1024, hardBytes: 96 * 1024 }),
  rsc: Object.freeze({ targetBytes: 96 * 1024, hardBytes: 160 * 1024 }),
  javascript: Object.freeze({ targetBytes: 150 * 1024, hardBytes: 250 * 1024 }),
});

export const ROUTE_PERFORMANCE_BUDGETS = Object.freeze({
  lcp: Object.freeze({ targetMs: 2_500, blockingMs: 4_000 }),
  inp: Object.freeze({ targetMs: 200, blockingMs: 500 }),
  cls: Object.freeze({ target: 0.1, blocking: 0.25 }),
});

export const MANIFEST_PATH = new URL(
  "../../../fixtures/dfp-mspec-1/manifest.json",
  import.meta.url,
);
