import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import {
  deterministicJson,
  utf8Bytes,
} from "../dfp/mspec-1/deterministic-json.mjs";

const discoverySource = await readFile("lib/lessonDiscovery.ts", "utf8");
const proficiencySource = await readFile("lib/proficiencyContext.ts", "utf8");
const catalogSource = await readFile("lib/proficiencyCatalog.ts", "utf8");
const homeSource = await readFile("app/page.tsx", "utf8");
const resourcesSource = await readFile("app/resources/page.tsx", "utf8");
const practiceSource = await readFile("app/practice/page.tsx", "utf8");
const headerSource = await readFile("components/Header.tsx", "utf8");
const cardSource = await readFile("components/LessonCard.tsx", "utf8");
const controlsSource = await readFile("components/VideoDiscoveryControls.tsx", "utf8");
const detailPageSource = await readFile("app/lessons/[slug]/page.tsx", "utf8");
const learningPanelSource = await readFile("app/lessons/[slug]/LearningPanel.tsx", "utf8");

const THREE_LOCALE_FIXTURES = [
  { code: "en", direction: "ltr" },
  { code: "vi", direction: "ltr" },
  { code: "ar", direction: "rtl" },
];
const FIFTEEN_LOCALE_FIXTURES = [
  ...THREE_LOCALE_FIXTURES,
  { code: "de", direction: "ltr" },
  { code: "es", direction: "ltr" },
  { code: "fr", direction: "ltr" },
  { code: "hi", direction: "ltr" },
  { code: "id", direction: "ltr" },
  { code: "it", direction: "ltr" },
  { code: "ja", direction: "ltr" },
  { code: "ko", direction: "ltr" },
  { code: "pt", direction: "ltr" },
  { code: "ru", direction: "ltr" },
  { code: "th", direction: "ltr" },
  { code: "tr", direction: "ltr" },
];

function compiledModule(source, context) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return new vm.SourceTextModule(compiled, { context });
}

async function loadActualExports(localeFixtures = THREE_LOCALE_FIXTURES) {
  const context = vm.createContext({
    Buffer,
    Date,
    URL,
    URLSearchParams,
    process: { env: {} },
  });
  const proficiencyModule = compiledModule(proficiencySource, context);
  await proficiencyModule.link(async (specifier) => {
    throw new Error(`Unexpected proficiency import: ${specifier}`);
  });
  const sourceModule = compiledModule(discoverySource, context);
  await sourceModule.link(async (specifier) => {
    if (specifier === "@/lib/proficiencyContext") return proficiencyModule;
    if (specifier === "@/lib/learnerLocaleRegistry") {
      return new vm.SyntheticModule(
        ["defaultLearnerLocaleCode", "getLearnerLocale"],
        function initialize() {
          this.setExport("defaultLearnerLocaleCode", "en");
          this.setExport("getLearnerLocale", (value) => {
            const code = typeof value === "string" ? value.trim().toLowerCase() : "";
            return localeFixtures.find((locale) => locale.code === code) ?? null;
          });
        },
        { context },
      );
    }
    throw new Error(`Unexpected production import: ${specifier}`);
  });
  await sourceModule.evaluate();
  return sourceModule.namespace;
}

async function loadProficiencyExports() {
  const context = vm.createContext({ URLSearchParams });
  const proficiencyModule = compiledModule(proficiencySource, context);
  await proficiencyModule.link(async (specifier) => {
    throw new Error(`Unexpected proficiency import: ${specifier}`);
  });
  await proficiencyModule.evaluate();
  return proficiencyModule.namespace;
}

async function loadCatalogExports() {
  const context = vm.createContext({ process: { env: {} }, URLSearchParams });
  const proficiencyModule = compiledModule(proficiencySource, context);
  await proficiencyModule.link(async (specifier) => {
    throw new Error(`Unexpected proficiency import: ${specifier}`);
  });
  const catalogModule = compiledModule(catalogSource, context);
  await catalogModule.link(async (specifier) => {
    if (specifier === "@/lib/proficiencyContext") return proficiencyModule;
    throw new Error(`Unexpected catalog import: ${specifier}`);
  });
  await catalogModule.evaluate();
  return catalogModule.namespace;
}

const actual = await loadActualExports();
const proficiencyActual = await loadProficiencyExports();
const catalogActual = await loadCatalogExports();
const snapshotAt = "2026-07-29T00:00:00.000Z";
const uuidFor = (number) =>
  `00000000-0000-4000-8000-${number.toString(16).padStart(12, "0")}`;

function rowFor(index, overrides = {}) {
  const group = Math.floor(index / 7);
  const publishedAt = new Date(
    Date.parse("2026-07-28T00:00:00.000Z") - group * 1000,
  ).toISOString();
  return {
    id: uuidFor(9999 - index),
    slug: `lesson-${index}`,
    title_original: `第${index}课`,
    title_support_default: `Lesson ${index}`,
    thumbnail_url: null,
    content_type: "listening",
    duration_seconds: 300,
    access_level: "free",
    published_at: publishedAt,
    updated_at: publishedAt,
    level: {
      code: index % 2 === 0 ? "HSK1" : "HSK2",
      system: { code: "HSK" },
    },
    ...overrides,
  };
}

const compareRows = (left, right, sort = "newest") => {
  const dateOrder = left.published_at.localeCompare(right.published_at);
  const idOrder = left.id.localeCompare(right.id);
  return sort === "oldest"
    ? (dateOrder !== 0 ? dateOrder : idOrder)
    : (dateOrder !== 0 ? -dateOrder : -idOrder);
};

const matchesDuration = (seconds, filter) => {
  if (!filter) return true;
  if (typeof seconds !== "number") return false;
  if (filter === "under5") return seconds < 300;
  if (filter === "5to10") return seconds >= 300 && seconds < 600;
  if (filter === "10to20") return seconds >= 600 && seconds < 1200;
  return seconds >= 1200;
};

function createStore(allRows) {
  const calls = [];
  const returnedRowCounts = [];
  const loadPage = async (query) => {
    calls.push(query);
    const needle = query.searchQuery?.toLocaleLowerCase() ?? null;
    let rows = allRows
      .filter((row) => row.published_at <= query.snapshotAt)
      .filter((row) => row.updated_at <= query.snapshotAt)
      .filter((row) => query.contentType === null || row.content_type === query.contentType)
      .filter((row) => !needle
        || row.title_original.toLocaleLowerCase().includes(needle)
        || row.title_support_default?.toLocaleLowerCase().includes(needle))
      .filter((row) => matchesDuration(row.duration_seconds, query.durationFilter))
      .filter((row) => {
        if (query.levelCode === null && query.levelSystemCode === null) return true;
        return row.level?.code === query.levelCode
          && row.level?.system?.code === query.levelSystemCode;
      })
      .sort((left, right) => compareRows(left, right, query.sort));
    if (query.after) {
      rows = rows.filter((row) => query.sort === "oldest"
        ? row.published_at > query.after.publishedAt
          || (row.published_at === query.after.publishedAt && row.id > query.after.id)
        : row.published_at < query.after.publishedAt
          || (row.published_at === query.after.publishedAt && row.id < query.after.id));
    }
    const data = rows.slice(0, query.limit);
    returnedRowCounts.push(data.length);
    return { data, error: null };
  };
  return { calls, loadPage, returnedRowCounts };
}

const decodeCursor = (cursor) =>
  JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
const encodeCursor = (cursor) =>
  Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");

async function collectIds(rows, options = {}) {
  const seen = [];
  let cursor = null;
  do {
    const result = await actual.runDfp3DiscoveryFlow(
      { ...options, cursor, pageSize: options.pageSize ?? 7, now: () => new Date(snapshotAt) },
      createStore(rows).loadPage,
    );
    assert.equal(result.status, "FOUND");
    seen.push(...result.page.items.map((item) => item.id));
    cursor = result.page.nextCursor;
  } while (cursor);
  return seen;
}

test("proficiency context is generic, pair-bound, and fail closed", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(proficiencyActual.parseProficiencyContext())),
    { kind: "ALL" },
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(proficiencyActual.parseProficiencyContext("HSK", "HSK3"))),
    { kind: "EXACT", systemCode: "HSK", levelCode: "HSK3" },
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(proficiencyActual.parseProficiencyContext("TOCFL", "A2"))),
    { kind: "EXACT", systemCode: "TOCFL", levelCode: "A2" },
  );
  for (const args of [
    ["HSK", null],
    [null, "HSK3"],
    ["bad value", "HSK3"],
    ["", undefined],
    [undefined, ""],
    ["", ""],
    ["   ", "HSK3"],
    ["HSK", "   "],
  ]) {
    assert.equal(proficiencyActual.parseProficiencyContext(...args).kind, "INVALID");
  }
});

test("public proficiency catalog remains generic and deterministic", () => {
  const parsed = catalogActual.parsePublicProficiencyCatalog([
    {
      code: "FRAME_B",
      name: "Beta Framework",
      is_active: true,
      library: [{ slug: "listen-to-chinese", is_active: true }],
      levels: [
        { code: "B2", name: "Beta 2", sort_order: 2, is_active: true },
        { code: "B1", name: "Beta 1", sort_order: 1, is_active: true },
      ],
    },
    {
      code: "FRAME_A",
      name: "Alpha Framework",
      is_active: true,
      library: { slug: "listen-to-chinese", is_active: true },
      levels: [
        { code: "A2", name: "Alpha 2", sort_order: 2, is_active: true },
        { code: "A1", name: "Alpha 1", sort_order: 1, is_active: true },
      ],
    },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(parsed)).map((item) => item.value), [
    "FRAME_A:A1",
    "FRAME_A:A2",
    "FRAME_B:B1",
    "FRAME_B:B2",
  ]);
  assert.equal(catalogActual.parsePublicProficiencyCatalog([
    {
      code: "FRAME",
      name: "Framework",
      is_active: true,
      library: { slug: "wrong-library", is_active: true },
      levels: [],
    },
  ]), null);
});

test("actual discovery flow keeps one bounded store operation and page-size limits", async () => {
  const store = createStore(Array.from({ length: 70 }, (_, index) => rowFor(index)));
  const result = await actual.runDfp3DiscoveryFlow(
    { now: () => new Date(snapshotAt) },
    store.loadPage,
  );
  assert.equal(result.status, "FOUND");
  assert.equal(result.page.items.length, 24);
  assert.equal(store.calls.length, 1);
  assert.equal(store.calls[0].limit, 25);
  assert.equal(store.calls[0].visibility, "published_free");
  assert.equal(store.calls[0].searchQuery, null);
  assert.equal(store.calls[0].durationFilter, null);
  assert.equal(store.calls[0].sort, "newest");
  for (const [requested, expected] of [[0, 1], [500, 50]]) {
    const boundedStore = createStore(Array.from({ length: 60 }, (_, index) => rowFor(index)));
    await actual.runDfp3DiscoveryFlow(
      { pageSize: requested, now: () => new Date(snapshotAt) },
      boundedStore.loadPage,
    );
    assert.equal(boundedStore.calls[0].limit, expected + 1);
  }
});

test("newest cursor pagination is deterministic with tied timestamps and snapshot-bound", async () => {
  const rows = Array.from({ length: 77 }, (_, index) => rowFor(index));
  const expected = [...rows].sort((a, b) => compareRows(a, b, "newest")).map((row) => row.id);
  assert.deepEqual(await collectIds(rows, { pageSize: 13 }), expected);

  const first = await actual.runDfp3DiscoveryFlow(
    { pageSize: 10, now: () => new Date(snapshotAt) },
    createStore(rows).loadPage,
  );
  const second = await actual.runDfp3DiscoveryFlow(
    { cursor: first.page.nextCursor, pageSize: 10 },
    createStore([
      rowFor(100, {
        id: uuidFor(10000),
        published_at: "2026-07-27T00:00:00.000Z",
        updated_at: "2026-07-30T00:00:00.000Z",
      }),
      ...rows,
    ]).loadPage,
  );
  assert.equal(second.status, "FOUND");
  assert.ok(second.page.items.every((item) => item.publishedAt <= snapshotAt));
});

test("exact proficiency and video content type remain exact store boundaries", async () => {
  const rows = [
    rowFor(0, { content_type: "video" }),
    rowFor(1, { content_type: "reading" }),
    rowFor(10, {
      content_type: "video",
      level: { code: "HSK1", system: { code: "TOCFL" } },
    }),
  ];
  const store = createStore(rows);
  const result = await actual.runDfp3DiscoveryFlow(
    {
      levelSystemCode: "HSK",
      levelCode: "HSK1",
      contentType: "video",
      now: () => new Date(snapshotAt),
    },
    store.loadPage,
  );
  assert.equal(result.status, "FOUND");
  assert.equal(store.calls[0].levelSystemCode, "HSK");
  assert.equal(store.calls[0].levelCode, "HSK1");
  assert.equal(store.calls[0].contentType, "video");
  assert.equal(result.page.items.length, 1);
  assert.equal(result.page.items[0].contentType, "video");
});

test("Videos remains video-only across cursor pages", async () => {
  const rows = Array.from({ length: 36 }, (_, index) => rowFor(index, {
    content_type: index % 3 === 0 ? "video" : index % 3 === 1 ? "reading" : "listening",
  }));
  const expected = [...rows]
    .filter((row) => row.content_type === "video")
    .sort((a, b) => compareRows(a, b, "newest"))
    .map((row) => row.id);
  assert.deepEqual(
    await collectIds(rows, { pageSize: 5, contentType: "video" }),
    expected,
  );
});

test("Chinese and default-support title search are bounded and normalized", async () => {
  const rows = [
    rowFor(0, { title_original: "我学中文", title_support_default: "Day 1: I Learn Chinese" }),
    rowFor(1, { title_original: "你好世界", title_support_default: "Hello World" }),
    rowFor(2, { title_original: "生日快乐", title_support_default: "Happy Birthday" }),
  ];
  const chineseStore = createStore(rows);
  const chinese = await actual.runDfp3DiscoveryFlow(
    { searchQuery: "  学中文  ", now: () => new Date(snapshotAt) },
    chineseStore.loadPage,
  );
  assert.equal(chinese.status, "FOUND");
  assert.deepEqual(chinese.page.items.map((item) => item.titleOriginal), ["我学中文"]);
  assert.equal(chineseStore.calls[0].searchQuery, "学中文");

  const support = await actual.runDfp3DiscoveryFlow(
    { searchQuery: "hello", now: () => new Date(snapshotAt) },
    createStore(rows).loadPage,
  );
  assert.equal(support.status, "FOUND");
  assert.deepEqual(support.page.items.map((item) => item.titleSupport), ["Hello World"]);

  for (const searchQuery of ["bad,query", "*wildcard*", "x".repeat(121)]) {
    let calls = 0;
    const result = await actual.runDfp3DiscoveryFlow({ searchQuery }, async () => {
      calls += 1;
      return { data: [], error: null };
    });
    assert.equal(result.status, "INVALID_SEARCH");
    assert.equal(calls, 0);
  }
});

test("duration filters use authoritative seconds and exclude missing duration", async () => {
  const rows = [
    rowFor(0, { duration_seconds: 299 }),
    rowFor(1, { duration_seconds: 300 }),
    rowFor(2, { duration_seconds: 599 }),
    rowFor(3, { duration_seconds: 600 }),
    rowFor(4, { duration_seconds: 1199 }),
    rowFor(5, { duration_seconds: 1200 }),
    rowFor(6, { duration_seconds: null }),
  ];
  const expectedCounts = {
    under5: 1,
    "5to10": 2,
    "10to20": 2,
    "20plus": 1,
  };
  for (const [durationFilter, expectedCount] of Object.entries(expectedCounts)) {
    const store = createStore(rows);
    const result = await actual.runDfp3DiscoveryFlow(
      { durationFilter, now: () => new Date(snapshotAt) },
      store.loadPage,
    );
    assert.equal(result.status, "FOUND");
    assert.equal(result.page.items.length, expectedCount);
    assert.equal(store.calls[0].durationFilter, durationFilter);
  }

  let calls = 0;
  const invalid = await actual.runDfp3DiscoveryFlow({ durationFilter: "short" }, async () => {
    calls += 1;
    return { data: [], error: null };
  });
  assert.equal(invalid.status, "INVALID_DURATION");
  assert.equal(calls, 0);
});

test("oldest sort is deterministic across cursor pages", async () => {
  const rows = Array.from({ length: 41 }, (_, index) => rowFor(index));
  const expected = [...rows]
    .sort((a, b) => compareRows(a, b, "oldest"))
    .map((row) => row.id);
  const seen = await collectIds(rows, { sort: "oldest", pageSize: 6 });
  assert.deepEqual(seen, expected);

  let calls = 0;
  const invalid = await actual.runDfp3DiscoveryFlow({ sort: "popular" }, async () => {
    calls += 1;
    return { data: [], error: null };
  });
  assert.equal(invalid.status, "INVALID_SORT");
  assert.equal(calls, 0);
});

test("search, duration, sort, locale, level and content-type cursor context mismatches fail closed", async () => {
  const rows = Array.from({ length: 5 }, (_, index) => rowFor(index, {
    content_type: "video",
    title_support_default: `Chinese video ${index}`,
    duration_seconds: 320,
  }));
  const first = await actual.runDfp3DiscoveryFlow(
    {
      pageSize: 1,
      contentType: "video",
      searchQuery: "Chinese",
      durationFilter: "5to10",
      sort: "oldest",
      levelSystemCode: "HSK",
      levelCode: "HSK1",
      now: () => new Date(snapshotAt),
    },
    createStore(rows).loadPage,
  );
  assert.equal(first.status, "FOUND");
  assert.ok(first.page.nextCursor);
  const cursor = decodeCursor(first.page.nextCursor);

  const mismatches = [
    { searchQuery: "video 2" },
    { durationFilter: "under5" },
    { sort: "newest" },
    { requestedLocale: "vi" },
    { levelSystemCode: "HSK", levelCode: "HSK2" },
    { contentType: "reading" },
  ];
  for (const mismatch of mismatches) {
    let calls = 0;
    const result = await actual.runDfp3DiscoveryFlow(
      {
        cursor: first.page.nextCursor,
        contentType: "video",
        searchQuery: "Chinese",
        durationFilter: "5to10",
        sort: "oldest",
        levelSystemCode: "HSK",
        levelCode: "HSK1",
        ...mismatch,
      },
      async () => {
        calls += 1;
        return { data: [], error: null };
      },
    );
    assert.equal(result.status, "INVALID_CURSOR");
    assert.equal(calls, 0);
  }

  const tampered = encodeCursor({ ...cursor, order: "wrong-context" });
  let calls = 0;
  const tamperedResult = await actual.runDfp3DiscoveryFlow(
    {
      cursor: tampered,
      contentType: "video",
      searchQuery: "Chinese",
      durationFilter: "5to10",
      sort: "oldest",
      levelSystemCode: "HSK",
      levelCode: "HSK1",
    },
    async () => {
      calls += 1;
      return { data: [], error: null };
    },
  );
  assert.equal(tamperedResult.status, "INVALID_CURSOR");
  assert.equal(calls, 0);
});

test("thumbnail projection accepts explicit http(s) authority and fails closed on malformed values", async () => {
  const withThumbnail = await actual.runDfp3DiscoveryFlow(
    { now: () => new Date(snapshotAt) },
    createStore([
      rowFor(0, { thumbnail_url: "https://cdn.example.com/video/one.jpg" }),
      rowFor(1, { thumbnail_url: null }),
    ]).loadPage,
  );
  assert.equal(withThumbnail.status, "FOUND");
  assert.equal(withThumbnail.page.items[0].thumbnailUrl, "https://cdn.example.com/video/one.jpg");
  assert.equal(withThumbnail.page.items[1].thumbnailUrl, null);

  for (const thumbnail_url of ["javascript:alert(1)", "not-a-url"]) {
    const result = await actual.runDfp3DiscoveryFlow(
      {},
      async () => ({ data: [rowFor(0, { thumbnail_url })], error: null }),
    );
    assert.equal(result.status, "DATABASE_ERROR");
  }
});

test("invalid rows, filter leaks, store errors and oversized payloads fail closed", async () => {
  const databaseError = await actual.runDfp3DiscoveryFlow(
    {},
    async () => ({ data: null, error: { message: "redacted" } }),
  );
  assert.equal(databaseError.status, "DATABASE_ERROR");

  const invalidRow = await actual.runDfp3DiscoveryFlow(
    {},
    async () => ({ data: [rowFor(0, { access_level: "vip" })], error: null }),
  );
  assert.equal(invalidRow.status, "DATABASE_ERROR");

  const contentTypeLeak = await actual.runDfp3DiscoveryFlow(
    { contentType: "video" },
    async () => ({ data: [rowFor(0, { content_type: "reading" })], error: null }),
  );
  assert.equal(contentTypeLeak.status, "DATABASE_ERROR");

  const searchLeak = await actual.runDfp3DiscoveryFlow(
    { searchQuery: "needle" },
    async () => ({ data: [rowFor(0)], error: null }),
  );
  assert.equal(searchLeak.status, "DATABASE_ERROR");

  const durationLeak = await actual.runDfp3DiscoveryFlow(
    { durationFilter: "under5" },
    async () => ({ data: [rowFor(0, { duration_seconds: 600 })], error: null }),
  );
  assert.equal(durationLeak.status, "DATABASE_ERROR");

  const oversized = await actual.runDfp3DiscoveryFlow(
    { pageSize: 50 },
    async () => ({
      data: Array.from({ length: 50 }, (_, index) => rowFor(index, {
        title_original: "中".repeat(1200),
        title_support_default: "A".repeat(1200),
      })),
      error: null,
    }),
  );
  assert.equal(oversized.status, "PAYLOAD_LIMIT_EXCEEDED");
  assert.deepEqual([...oversized.page.items], []);
});

test("maximum-approved discovery payload and locale expansion remain bounded", async () => {
  const rows = Array.from({ length: 50 }, (_, index) => rowFor(index, {
    title_original: `中文标题${index}`.repeat(12),
    title_support_default: `Support title ${index}`.repeat(12),
  }));
  const result = await actual.runDfp3DiscoveryFlow(
    { pageSize: 50, now: () => new Date(snapshotAt) },
    createStore(rows).loadPage,
  );
  assert.equal(result.status, "FOUND");
  assert.ok(Buffer.byteLength(JSON.stringify(result.page), "utf8") <= actual.LESSON_DISCOVERY_MAX_PAYLOAD_BYTES);

  const measure = async (localeFixtures) => {
    const implementation = await loadActualExports(localeFixtures);
    const store = createStore(rows);
    const measured = await implementation.runDfp3DiscoveryFlow(
      { pageSize: 50, requestedLocale: "ar", now: () => new Date(snapshotAt) },
      store.loadPage,
    );
    assert.equal(measured.status, "FOUND");
    return {
      ids: [...measured.page.items].map((item) => item.id),
      payloadBytes: utf8Bytes(deterministicJson(JSON.parse(JSON.stringify(measured.page)))),
      returnedRows: store.returnedRowCounts[0],
    };
  };
  const threeLocale = await measure(THREE_LOCALE_FIXTURES);
  const fifteenLocale = await measure(FIFTEEN_LOCALE_FIXTURES);
  assert.deepEqual(fifteenLocale.ids, threeLocale.ids);
  assert.ok(Math.abs(fifteenLocale.returnedRows - threeLocale.returnedRows) / threeLocale.returnedRows <= 0.10);
  assert.ok(Math.abs(fifteenLocale.payloadBytes - threeLocale.payloadBytes) / threeLocale.payloadBytes <= 0.10);
});

test("all-level discovery retains published lessons with no proficiency metadata", async () => {
  const result = await actual.runDfp3DiscoveryFlow(
    { now: () => new Date(snapshotAt) },
    createStore([rowFor(0, { level: null })]).loadPage,
  );
  assert.equal(result.status, "FOUND");
  assert.equal(result.page.items.length, 1);
  assert.equal(result.page.items[0].levelSystemCode, null);
  assert.equal(result.page.items[0].levelCode, null);
});

test("production query stays publication-aware, summary-bounded and findability-bound", () => {
  assert.match(discoverySource, /lesson-discovery-summary\.v2/);
  assert.match(discoverySource, /lesson-discovery-cursor\.v2/);
  assert.match(
    discoverySource,
    /const LESSON_DISCOVERY_BASE_PROJECTION =\s*"id,slug,title_original,title_support_default,content_type,duration_seconds,access_level,published_at,updated_at"/,
  );
  assert.match(discoverySource, /LESSON_DISCOVERY_CARD_MEDIA_PROJECTION = "thumbnail_url"/);
  assert.doesNotMatch(
    discoverySource.match(/const LESSON_DISCOVERY_BASE_PROJECTION =[\s\S]*?;/)[0],
    /segment|transcript|vocabulary|exercise|answer|media|audio_url|youtube_id/i,
  );
  assert.match(discoverySource, /\.eq\("status", "published"\)/);
  assert.match(discoverySource, /\.eq\("quality_status", "published"\)/);
  assert.match(discoverySource, /\.eq\("access_level", "free"\)/);
  assert.match(discoverySource, /\.eq\("content_type", storeQuery\.contentType\)/);
  assert.match(discoverySource, /title_original\.ilike/);
  assert.match(discoverySource, /title_support_default\.ilike/);
  assert.match(discoverySource, /duration_seconds/);
  assert.match(discoverySource, /ascending:\s*storeQuery\.sort === "oldest"/);
  assert.match(discoverySource, /searchQuery,[\s\S]*?durationFilter,[\s\S]*?sort,[\s\S]*?localeCode,[\s\S]*?pageSize/);
  assert.match(discoverySource, /cursor\.order !== orderIdentity/);
  assert.equal(discoverySource.match(/\.from\("lessons"\)/g)?.length, 2);
  assert.match(discoverySource, /verifyCachedVisibility/);
});

test("Videos UX uses scalable controls, thumbnail-first cards and URL-preserved Load More", () => {
  assert.match(resourcesSource, /contentType:\s*"video"/);
  assert.match(resourcesSource, /searchQuery:\s*query\.q/);
  assert.match(resourcesSource, /durationFilter:\s*query\.duration/);
  assert.match(resourcesSource, /sort:\s*query\.sort/);
  assert.match(resourcesSource, /VideoDiscoveryControls/);
  assert.match(resourcesSource, /md:grid-cols-2 xl:grid-cols-3/);
  assert.match(resourcesSource, /\.\.\.discoveryQuery,[\s\S]*?cursor:\s*discovery\.page\.nextCursor/);
  assert.match(resourcesSource, /pathname:\s*"\/resources"/);
  assert.match(controlsSource, /type="search"/);
  assert.match(controlsSource, /delete\("cursor"\)/);
  assert.match(controlsSource, /set\("q", value\)/);
  assert.match(controlsSource, /set\("duration", value\)/);
  assert.match(controlsSource, /set\("sort", value\)/);
  assert.match(cardSource, /lesson\.thumbnailUrl/);
  assert.match(cardSource, /aspect-video/);
  assert.match(cardSource, /pathname:\s*`\/lessons\/\$\{lesson\.slug\}`/);
  assert.doesNotMatch(cardSource, /youtube/i);
  assert.doesNotMatch(resourcesSource, /Series|Topic|Tags|Category/);
});

test("global Level remains generic and Video-specific discovery state stays local to Videos", () => {
  for (const source of [homeSource, resourcesSource, cardSource]) {
    assert.doesNotMatch(source, /@\/lib\/lessons/);
    assert.doesNotMatch(source, /\.script|\.exercises|\.vocabulary|transcript/i);
  }
  assert.match(homeSource, /getLessonDiscoveryPage/);
  assert.match(resourcesSource, /parseProficiencyContext\(query\.levelSystem,\s*query\.level\)/);
  assert.match(resourcesSource, /levelSystemCode:\s*query\.levelSystem/);
  assert.match(resourcesSource, /levelCode:\s*query\.level/);
  assert.match(headerSource, /aria-label=\{labels\.level\}/);
  assert.match(headerSource, /<option value="all">\{labels\.levelAll\}<\/option>/);
  assert.match(headerSource, /delete\("cursor"\)/);
  assert.doesNotMatch(headerSource, /\bsystemCode:\s*"HSK"/);
  assert.match(practiceSource, /preservedLearnerContextQuery/);
  assert.doesNotMatch(practiceSource, /getLessonDiscoveryPage/);
  assert.match(cardSource, /learnerContextQuery/);
  assert.match(detailPageSource, /preservedLearnerContextQuery/);
  assert.match(detailPageSource, /getSupabaseLessonCore\(slug, query\?\.lang\)/);
  assert.match(learningPanelSource, /learnerContextQuery/);
  assert.match(learningPanelSource, /lang:\s*languageCode/);
});
