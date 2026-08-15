import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const cacheSource = await readFile("lib/publicContentCache.ts", "utf8");
const discoverySource = await readFile("lib/lessonDiscovery.ts", "utf8");
const detailSource = await readFile("lib/supabaseLesson.ts", "utf8");
const packageDocument = JSON.parse(await readFile("package.json", "utf8"));

async function loadActualExports() {
  const compiled = ts.transpileModule(cacheSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const context = vm.createContext({
    Buffer,
    Date,
    Error,
    Set,
  });
  const sourceModule = new vm.SourceTextModule(compiled, { context });
  await sourceModule.link(async (specifier) => {
    throw new Error(`Unexpected static production import: ${specifier}`);
  });
  await sourceModule.evaluate();
  return sourceModule.namespace;
}

const actual = await loadActualExports();

class MemoryCacheAdapter {
  constructor() {
    this.values = new Map();
    this.requests = [];
  }

  async read(request) {
    this.requests.push(request);
    if (this.values.has(request.key)) {
      return { value: this.values.get(request.key), source: "cache" };
    }
    const value = await request.load();
    this.values.set(request.key, value);
    return { value, source: "fresh" };
  }
}

const publicVisibility = (overrides = {}) => ({
  status: "PUBLIC",
  contentIdentity: "lesson-1",
  publicationVersion: "2026-07-29T12:00:00.000Z",
  ...overrides,
});

const invalidationEvent = (overrides = {}) => ({
  schemaVersion: "publication-invalidation.v1",
  eventId: "evt-20260729-0001",
  eventKind: "unpublish",
  committedAt: "2026-07-29T12:30:00.000Z",
  resourceId: "lesson-1",
  slug: "lesson-one",
  affectedLocaleCodes: ["en", "vi", "ar"],
  ...overrides,
});

test("cache keys isolate class, identity, representation, publication, locale, and authorization", () => {
  const base = {
    cacheClass: "detail",
    contentIdentity: "lesson-1",
    representationVersion: "lesson-detail-core.v1",
    publicationVersion: "2026-07-29T12:00:00.000Z",
    localeCode: "en",
    authorizationClass: "anonymous_public",
  };
  const key = actual.createPublicCacheKey(base);
  assert.match(key, /^dfp4:/);
  for (const mutation of [
    { cacheClass: "discovery" },
    { contentIdentity: "lesson-2" },
    { representationVersion: "lesson-detail-core.v2" },
    { publicationVersion: "2026-07-29T12:01:00.000Z" },
    { localeCode: "vi" },
  ]) {
    assert.notEqual(
      actual.createPublicCacheKey({ ...base, ...mutation }),
      key,
    );
  }
  assert.throws(
    () => actual.createPublicCacheKey({
      ...base,
      authorizationClass: "authenticated_learner",
    }),
    /Invalid public cache key parts/,
  );
});

test("global proficiency discovery identities are pair-isolated", () => {
  const identity = (levelSystemCode, levelCode) => actual.publicCacheIdentity(
    "discovery",
    JSON.stringify({
      cursor: null,
      levelSystemCode,
      levelCode,
      localeCode: "en",
      pageSize: 24,
    }),
  );
  const all = identity(null, null);
  const hsk2 = identity("HSK", "HSK2");
  const hsk3 = identity("HSK", "HSK3");
  const tocflSameLevelText = identity("TOCFL", "HSK2");
  assert.equal(new Set([all, hsk2, hsk3, tocflSameLevelText]).size, 4);
  assert.equal(actual.PUBLIC_DISCOVERY_REPRESENTATION_VERSION, "lesson-discovery-summary.v2");
});

test("freshness ceilings are exact and forbidden data classes are not representable", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(actual.PUBLIC_CACHE_FRESHNESS_SECONDS)),
    { discovery: 300, detail: 900, negativeLookup: 30 },
  );
  assert.doesNotMatch(
    cacheSource,
    /cacheClass:\s*"(?:practice|learner|grading|admin|draft|configuration)"/,
  );
});

test("publication time rejects future and invalid timestamps", () => {
  const visibilityAt = "2026-07-29T12:30:00.000Z";
  assert.equal(actual.isPublicationVisibleAt("2026-07-29T12:29:59.999Z", visibilityAt), true);
  assert.equal(actual.isPublicationVisibleAt("2026-07-29T12:30:00.000Z", visibilityAt), true);
  assert.equal(actual.isPublicationVisibleAt("2026-07-29T12:30:00.001Z", visibilityAt), false);
  assert.equal(actual.isPublicationVisibleAt("not-a-time", visibilityAt), false);
  assert.equal(actual.isPublicationVisibleAt("2026-07-29T12:00:00.000Z", "not-a-time"), false);
});

test("detail reads verify authoritative visibility before every cache access", async () => {
  const adapter = new MemoryCacheAdapter();
  let visibility = publicVisibility();
  let visibilityChecks = 0;
  let freshLoads = 0;
  const read = () => actual.readPublicDetail({
    adapter,
    localeCode: "en",
    verifyVisibility: async () => {
      visibilityChecks += 1;
      return visibility;
    },
    loadFresh: async () => {
      freshLoads += 1;
      return { body: "public lesson" };
    },
  });

  const first = await read();
  const second = await read();
  assert.equal(first.status, "FOUND");
  assert.equal(first.cacheSource, "fresh");
  assert.equal(second.status, "FOUND");
  assert.equal(second.cacheSource, "cache");
  assert.equal(visibilityChecks, 2);
  assert.equal(freshLoads, 1);

  visibility = { status: "NOT_PUBLIC" };
  const unpublished = await read();
  assert.equal(unpublished.status, "NOT_FOUND");
  assert.equal(adapter.requests.length, 2);
  assert.equal(freshLoads, 1);

  visibility = { status: "UNAVAILABLE" };
  const unavailable = await read();
  assert.equal(unavailable.status, "VISIBILITY_UNAVAILABLE");
  assert.equal(adapter.requests.length, 2);
});

test("discovery cache hits perform one bounded visibility check and fail closed", async () => {
  const adapter = new MemoryCacheAdapter();
  let visibility = "PUBLIC";
  let storeOperations = 0;
  const input = {
    adapter,
    contentIdentity: "home:first:24",
    publicationVersion: "2026-07-29T12:00:00.000Z",
    localeCode: "en",
    loadFresh: async () => {
      storeOperations += 1;
      return { ids: ["lesson-1"] };
    },
    verifyCachedVisibility: async () => {
      storeOperations += 1;
      return visibility;
    },
  };

  const first = await actual.readPublicDiscovery(input);
  assert.equal(first.status, "FOUND");
  assert.equal(first.cacheSource, "fresh");
  assert.equal(storeOperations, 1);

  const second = await actual.readPublicDiscovery(input);
  assert.equal(second.status, "FOUND");
  assert.equal(second.cacheSource, "cache");
  assert.equal(storeOperations, 2);

  visibility = "NOT_PUBLIC";
  const unpublished = await actual.readPublicDiscovery(input);
  assert.equal(unpublished.status, "VISIBILITY_DENIED");
  assert.equal(storeOperations, 3);

  visibility = "UNAVAILABLE";
  const unavailable = await actual.readPublicDiscovery(input);
  assert.equal(unavailable.status, "VISIBILITY_UNAVAILABLE");
  assert.equal(storeOperations, 4);
});

test("detail and discovery operation budgets remain within hard ceilings", async () => {
  const detailAdapter = new MemoryCacheAdapter();
  let detailOperations = 0;
  let detailRounds = 1;
  const detail = await actual.readPublicDetail({
    adapter: detailAdapter,
    localeCode: "en",
    verifyVisibility: async () => {
      detailOperations += 1;
      return publicVisibility();
    },
    loadFresh: async () => {
      detailOperations += 3;
      detailRounds += 2;
      return { body: "bounded" };
    },
  });
  assert.equal(detail.status, "FOUND");
  assert.equal(detailOperations, 4);
  assert.equal(detailRounds, 3);

  const discoveryAdapter = new MemoryCacheAdapter();
  let discoveryOperations = 0;
  let discoveryRounds = 0;
  const discoveryInput = {
    adapter: discoveryAdapter,
    contentIdentity: "home:first:24",
    publicationVersion: "2026-07-29T12:00:00.000Z",
    localeCode: "en",
    loadFresh: async () => {
      discoveryOperations += 1;
      discoveryRounds += 1;
      return { ids: ["lesson-1"] };
    },
    verifyCachedVisibility: async () => {
      discoveryOperations += 1;
      discoveryRounds += 1;
      return "PUBLIC";
    },
  };
  await actual.readPublicDiscovery(discoveryInput);
  assert.equal(discoveryOperations, 1);
  assert.equal(discoveryRounds, 1);
  discoveryOperations = 0;
  discoveryRounds = 0;
  await actual.readPublicDiscovery(discoveryInput);
  assert.equal(discoveryOperations, 1);
  assert.equal(discoveryRounds, 1);
});

test("negative cache stores only absence and never stores positive or unavailable results", async () => {
  const adapter = new MemoryCacheAdapter();
  let lookups = 0;
  const absentInput = {
    adapter,
    slug: "missing-lesson",
    localeCode: "en",
    lookup: async () => {
      lookups += 1;
      return { status: "NOT_FOUND" };
    },
  };
  const first = await actual.readNegativeLookup(absentInput);
  const second = await actual.readNegativeLookup(absentInput);
  assert.equal(first.status, "NOT_FOUND");
  assert.equal(first.cacheSource, "fresh");
  assert.equal(second.status, "NOT_FOUND");
  assert.equal(second.cacheSource, "cache");
  assert.equal(lookups, 1);
  assert.equal(adapter.requests[0].ttlSeconds, 30);

  const positiveAdapter = new MemoryCacheAdapter();
  let positiveLookups = 0;
  const positiveInput = {
    adapter: positiveAdapter,
    slug: "published-lesson",
    localeCode: "en",
    lookup: async () => {
      positiveLookups += 1;
      return { status: "FOUND", value: { id: "lesson-1" } };
    },
  };
  const positiveFirst = await actual.readNegativeLookup(positiveInput);
  const positiveSecond = await actual.readNegativeLookup(positiveInput);
  assert.equal(positiveFirst.status, "FOUND");
  assert.equal(positiveSecond.status, "FOUND");
  assert.equal(positiveLookups, 2);
  assert.equal(positiveAdapter.values.size, 0);

  const unavailableAdapter = new MemoryCacheAdapter();
  const unavailable = await actual.readNegativeLookup({
    adapter: unavailableAdapter,
    slug: "unknown",
    localeCode: "en",
    lookup: async () => ({ status: "UNAVAILABLE" }),
  });
  assert.equal(unavailable.status, "LOOKUP_UNAVAILABLE");
  assert.equal(unavailableAdapter.values.size, 0);
});

test("publication invalidation is post-commit shaped, idempotent, observable, and retryable", async () => {
  const applied = new Set();
  const invalidated = [];
  const observations = [];
  const adapter = {
    wasApplied: async (eventId) => applied.has(eventId),
    invalidateTags: async (tags) => invalidated.push([...tags]),
    markApplied: async (eventId) => applied.add(eventId),
    observe: async (observation) => observations.push(observation),
  };
  const first = await actual.executePublicationInvalidation(invalidationEvent(), adapter);
  const duplicate = await actual.executePublicationInvalidation(invalidationEvent(), adapter);
  assert.equal(first.status, "APPLIED");
  assert.equal(duplicate.status, "DUPLICATE");
  assert.equal(invalidated.length, 1);
  assert.ok(first.tags.includes("public:discovery"));
  assert.equal(new Set(first.tags).size, first.tags.length);
  assert.deepEqual(observations.map((observation) => observation.outcome), ["APPLIED", "DUPLICATE"]);

  let failedObservations = 0;
  const failed = await actual.executePublicationInvalidation(
    invalidationEvent({ eventId: "evt-20260729-0002" }),
    {
      wasApplied: async () => false,
      invalidateTags: async () => { throw new Error("bounded invalidation failure"); },
      markApplied: async () => { throw new Error("must not mark a failed event"); },
      observe: async (observation) => {
        failedObservations += 1;
        assert.equal(observation.outcome, "RETRY_REQUIRED");
      },
    },
  );
  assert.equal(failed.status, "RETRY_REQUIRED");
  assert.equal(failedObservations, 1);
});

test("future publication remains hidden from stale caches when invalidation fails", async () => {
  const visibilityAt = "2026-07-29T12:30:00.000Z";
  let publishedAt = "2026-07-29T12:00:00.000Z";
  const detailAdapter = new MemoryCacheAdapter();
  const readDetail = () => actual.readPublicDetail({
    adapter: detailAdapter,
    localeCode: "en",
    verifyVisibility: async () => actual.isPublicationVisibleAt(publishedAt, visibilityAt)
      ? publicVisibility()
      : { status: "NOT_PUBLIC" },
    loadFresh: async () => ({ body: "stale body" }),
  });
  assert.equal((await readDetail()).status, "FOUND");

  const discoveryAdapter = new MemoryCacheAdapter();
  const readDiscovery = () => actual.readPublicDiscovery({
    adapter: discoveryAdapter,
    contentIdentity: "home:first:24",
    publicationVersion: visibilityAt,
    localeCode: "en",
    loadFresh: async () => ({ ids: ["lesson-1"] }),
    verifyCachedVisibility: async () => actual.isPublicationVisibleAt(publishedAt, visibilityAt)
      ? "PUBLIC"
      : "NOT_PUBLIC",
  });
  assert.equal((await readDiscovery()).status, "FOUND");

  const invalidation = await actual.executePublicationInvalidation(
    invalidationEvent({ eventKind: "visibility_restrict" }),
    {
      wasApplied: async () => false,
      invalidateTags: async () => { throw new Error("cache backend unavailable"); },
      markApplied: async () => {},
      observe: async () => {},
    },
  );
  assert.equal(invalidation.status, "RETRY_REQUIRED");

  publishedAt = "2026-07-29T13:00:00.000Z";
  const detailAfterCommit = await readDetail();
  assert.equal(detailAfterCommit.status, "NOT_FOUND");
  assert.equal(detailAdapter.requests.length, 1);

  const discoveryAfterCommit = await readDiscovery();
  assert.equal(discoveryAfterCommit.status, "VISIBILITY_DENIED");
  assert.equal(discoveryAdapter.requests.length, 2);
});

test("invalid events fail closed before adapter access", async () => {
  let calls = 0;
  const result = await actual.executePublicationInvalidation(
    { ...invalidationEvent(), committedAt: "not-a-timestamp", unexpected: true },
    {
      wasApplied: async () => { calls += 1; return false; },
      invalidateTags: async () => { calls += 1; },
      markApplied: async () => { calls += 1; },
      observe: async () => { calls += 1; },
    },
  );
  assert.equal(result.status, "INVALID_EVENT");
  assert.equal(calls, 0);
});

test("production integration keeps public-only filters and revalidates exact proficiency on cache hits", () => {
  for (const source of [discoverySource, detailSource]) {
    assert.match(source, /\.eq\("status", "published"\)/);
    assert.match(source, /\.eq\("quality_status", "published"\)/);
    assert.match(source, /\.eq\("access_level", "free"\)/);
  }
  assert.match(discoverySource, /readPublicDiscovery/);
  assert.match(discoverySource, /verifyCachedVisibility/);
  assert.match(discoverySource, /levelSystemCode,[\s\S]*?levelCode,[\s\S]*?localeCode,[\s\S]*?pageSize/);
  assert.match(discoverySource, /\.in\("id", ids\)[\s\S]*?\.not\("published_at", "is", null\)[\s\S]*?\.lte\("published_at", requestNow\)[\s\S]*?\.limit\(LESSON_DISCOVERY_MAX_PAGE_SIZE\)/);
  assert.match(discoverySource, /\.eq\("level\.code", proficiency\.levelCode\)/);
  assert.match(discoverySource, /\.eq\("level\.system\.code", proficiency\.systemCode\)/);
  assert.match(detailSource, /readNegativeLookup/);
  assert.match(detailSource, /readPublicDetail/);
  assert.match(detailSource, /\.eq\("slug", normalizedSlug\)[\s\S]*?\.not\("published_at", "is", null\)[\s\S]*?\.lte\("published_at", visibilityAt\)[\s\S]*?\.maybeSingle\(\)/);
  assert.match(detailSource, /if \(!isPublicationVisibleAt\(publishedAt, visibilityAt\)\) \{[\s\S]*?return \{ status: "NOT_FOUND" \};/);
  assert.match(detailSource, /type SupabaseLessonCachedCore = Omit<[\s\S]*?"languages" \| "selectedDirection"[\s\S]*?>;/);
  assert.match(detailSource, /\.\.\.cachedDetail\.value,[\s\S]*?languages: languages\.map[\s\S]*?selectedDirection: localeResolution\.direction/);
  assert.doesNotMatch(`${discoverySource}\n${detailSource}`, /readPublic(?:Practice|Learner|Grading|Admin|Draft|Configuration)/);
  assert.equal(
    packageDocument.scripts["test:dfp4"],
    "node --experimental-vm-modules --test scripts/verification/dfp4-public-cache-invalidation.test.mjs",
  );
});
