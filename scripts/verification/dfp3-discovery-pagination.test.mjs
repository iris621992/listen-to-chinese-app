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
  const context = vm.createContext({ Buffer, Date, process: { env: {} }, URLSearchParams });
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

const compareRows = (left, right) => {
  const dateOrder = right.published_at.localeCompare(left.published_at);
  return dateOrder !== 0 ? dateOrder : right.id.localeCompare(left.id);
};

function createStore(allRows) {
  const calls = [];
  const returnedRowCounts = [];
  const loadPage = async (query) => {
    calls.push(query);
    let rows = allRows
      .filter((row) => row.published_at <= query.snapshotAt)
      .filter((row) => row.updated_at <= query.snapshotAt)
      .filter((row) => {
        if (query.levelCode === null && query.levelSystemCode === null) return true;
        return row.level?.code === query.levelCode
          && row.level?.system?.code === query.levelSystemCode;
      })
      .sort(compareRows);
    if (query.after) {
      rows = rows.filter(
        (row) =>
          row.published_at < query.after.publishedAt
          || (
            row.published_at === query.after.publishedAt
            && row.id < query.after.id
          ),
      );
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

test("public proficiency catalog is generic and deterministic across frameworks", () => {
  const parsed = catalogActual.parsePublicProficiencyCatalog([
    {
      code: "FRAME_B",
      name: "Beta Framework",
      is_active: true,
      library: [{ slug: "listen-to-chinese", is_active: true }],
      levels: [
        { code: "B2", name: "Beta 2", sort_order: 2, is_active: true },
        { code: "B1", name: "Beta 1", sort_order: 1, is_active: true },
        { code: "B0", name: "Inactive Beta", sort_order: 0, is_active: false },
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

  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), [
    {
      value: "FRAME_A:A1",
      systemCode: "FRAME_A",
      systemName: "Alpha Framework",
      levelCode: "A1",
      levelName: "Alpha 1",
      sortOrder: 1,
    },
    {
      value: "FRAME_A:A2",
      systemCode: "FRAME_A",
      systemName: "Alpha Framework",
      levelCode: "A2",
      levelName: "Alpha 2",
      sortOrder: 2,
    },
    {
      value: "FRAME_B:B1",
      systemCode: "FRAME_B",
      systemName: "Beta Framework",
      levelCode: "B1",
      levelName: "Beta 1",
      sortOrder: 1,
    },
    {
      value: "FRAME_B:B2",
      systemCode: "FRAME_B",
      systemName: "Beta Framework",
      levelCode: "B2",
      levelName: "Beta 2",
      sortOrder: 2,
    },
  ]);
});

test("public proficiency catalog fails closed on malformed, duplicate, and oversized taxonomies", () => {
  const baseSystem = {
    code: "FRAME",
    name: "Framework",
    is_active: true,
    library: { slug: "listen-to-chinese", is_active: true },
    levels: [{ code: "L1", name: "Level 1", sort_order: 1, is_active: true }],
  };

  assert.equal(
    catalogActual.parsePublicProficiencyCatalog([
      {
        ...baseSystem,
        levels: [
          { code: "L1", name: "Level 1", sort_order: 1, is_active: true },
          { code: "L1", name: "Duplicate", sort_order: 2, is_active: true },
        ],
      },
    ]),
    null,
  );
  assert.equal(
    catalogActual.parsePublicProficiencyCatalog([
      { ...baseSystem, library: { slug: "wrong-library", is_active: true } },
    ]),
    null,
  );
  assert.equal(
    catalogActual.parsePublicProficiencyCatalog([
      { ...baseSystem, code: "bad value" },
    ]),
    null,
  );
  assert.equal(
    catalogActual.parsePublicProficiencyCatalog(
      Array.from({ length: 33 }, (_, index) => ({
        ...baseSystem,
        code: `FRAME${index}`,
        name: `Framework ${index}`,
        levels: [],
      })),
    ),
    null,
  );
  assert.equal(
    catalogActual.parsePublicProficiencyCatalog([
      {
        ...baseSystem,
        levels: Array.from({ length: 65 }, (_, index) => ({
          code: `L${index}`,
          name: `Level ${index}`,
          sort_order: index,
          is_active: true,
        })),
      },
    ]),
    null,
  );
});

test("actual discovery flow uses one bounded store operation", async () => {
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
  assert.equal(store.calls[0].levelSystemCode, null);
  assert.equal(store.calls[0].levelCode, null);
  assert.ok(result.page.nextCursor);
});

test("page size defaults to 24 and clamps to the hard maximum 50", async () => {
  for (const [requested, expected] of [[undefined, 24], [0, 1], [500, 50]]) {
    const store = createStore(Array.from({ length: 60 }, (_, index) => rowFor(index)));
    await actual.runDfp3DiscoveryFlow(
      { pageSize: requested, now: () => new Date(snapshotAt) },
      store.loadPage,
    );
    assert.equal(store.calls[0].limit, expected + 1);
  }
});

test("adjacent cursor pages have no duplicate or skipped rows with tied timestamps", async () => {
  const rows = Array.from({ length: 77 }, (_, index) => rowFor(index)).sort(compareRows);
  const seen = [];
  let cursor = null;
  do {
    const store = createStore(rows);
    const result = await actual.runDfp3DiscoveryFlow(
      { cursor, pageSize: 13, now: () => new Date(snapshotAt) },
      store.loadPage,
    );
    assert.equal(result.status, "FOUND");
    seen.push(...result.page.items.map((item) => item.id));
    cursor = result.page.nextCursor;
  } while (cursor);
  assert.equal(new Set(seen).size, rows.length);
  assert.deepEqual(seen, rows.map((row) => row.id));
});

test("snapshot binding prevents newer publications from entering later pages", async () => {
  const baseRows = Array.from({ length: 30 }, (_, index) => rowFor(index));
  const first = await actual.runDfp3DiscoveryFlow(
    { pageSize: 10, now: () => new Date(snapshotAt) },
    createStore(baseRows).loadPage,
  );
  const laterStore = createStore([
    rowFor(100, {
      id: uuidFor(10000),
      published_at: "2026-07-27T00:00:00.000Z",
      updated_at: "2026-07-30T00:00:00.000Z",
    }),
    ...baseRows,
  ]);
  const second = await actual.runDfp3DiscoveryFlow(
    { cursor: first.page.nextCursor, pageSize: 10 },
    laterStore.loadPage,
  );
  assert.equal(second.status, "FOUND");
  assert.ok(second.page.items.every((item) => item.publishedAt <= snapshotAt));
});

test("exact proficiency filters both system and level at the store boundary", async () => {
  const rows = [
    rowFor(0),
    rowFor(10, { level: { code: "HSK1", system: { code: "TOCFL" } } }),
    rowFor(20, { level: null }),
  ];
  const store = createStore(rows);
  const result = await actual.runDfp3DiscoveryFlow(
    {
      levelSystemCode: "HSK",
      levelCode: "HSK1",
      now: () => new Date(snapshotAt),
    },
    store.loadPage,
  );
  assert.equal(result.status, "FOUND");
  assert.equal(store.calls.length, 1);
  assert.equal(store.calls[0].levelSystemCode, "HSK");
  assert.equal(store.calls[0].levelCode, "HSK1");
  assert.equal(result.page.items.length, 1);
  assert.equal(result.page.items[0].levelSystemCode, "HSK");
  assert.equal(result.page.items[0].levelCode, "HSK1");
});

test("invalid, partial, empty, or whitespace proficiency fails closed before store access", async () => {
  for (const options of [
    { levelSystemCode: "HSK" },
    { levelCode: "HSK1" },
    { levelSystemCode: "bad value", levelCode: "HSK1" },
    { levelSystemCode: "" },
    { levelCode: "" },
    { levelSystemCode: "", levelCode: "" },
    { levelSystemCode: "   ", levelCode: "HSK1" },
    { levelSystemCode: "HSK", levelCode: "   " },
  ]) {
    let calls = 0;
    const result = await actual.runDfp3DiscoveryFlow(options, async () => {
      calls += 1;
      return { data: [], error: null };
    });
    assert.equal(result.status, "INVALID_PROFICIENCY");
    assert.equal(calls, 0);
  }
});

test("malformed and context-mismatched cursors fail closed before store access", async () => {
  const first = await actual.runDfp3DiscoveryFlow(
    {
      pageSize: 1,
      levelSystemCode: "HSK",
      levelCode: "HSK1",
      now: () => new Date(snapshotAt),
    },
    createStore([rowFor(0), rowFor(2)]).loadPage,
  );
  const cursor = decodeCursor(first.page.nextCursor);
  assert.equal(cursor.levelSystemCode, "HSK");
  assert.equal(cursor.levelCode, "HSK1");

  for (const options of [
    { cursor: "not-json", levelSystemCode: "HSK", levelCode: "HSK1" },
    { cursor: encodeCursor({ ...cursor, localeCode: "vi" }), levelSystemCode: "HSK", levelCode: "HSK1" },
    { cursor: first.page.nextCursor, requestedLocale: "vi", levelSystemCode: "HSK", levelCode: "HSK1" },
    { cursor: first.page.nextCursor, levelSystemCode: "TOCFL", levelCode: "HSK1" },
    { cursor: first.page.nextCursor, levelSystemCode: "HSK", levelCode: "HSK2" },
    { cursor: encodeCursor({ ...cursor, levelSystemCode: null }), levelSystemCode: "HSK", levelCode: "HSK1" },
    { cursor: encodeCursor({ ...cursor, visibility: "draft" }), levelSystemCode: "HSK", levelCode: "HSK1" },
    { cursor: encodeCursor({ ...cursor, snapshotAt: "2099-01-01T00:00:00.000Z" }), levelSystemCode: "HSK", levelCode: "HSK1", now: () => new Date(snapshotAt) },
  ]) {
    let calls = 0;
    const result = await actual.runDfp3DiscoveryFlow(options, async () => {
      calls += 1;
      return { data: [], error: null };
    });
    assert.equal(result.status, "INVALID_CURSOR");
    assert.equal(calls, 0);
  }
});

test("invalid rows, cross-system leaks, store errors, and oversized payloads fail closed", async () => {
  const databaseError = await actual.runDfp3DiscoveryFlow({}, async () => ({ data: null, error: { message: "redacted" } }));
  assert.equal(databaseError.status, "DATABASE_ERROR");

  const invalidRow = await actual.runDfp3DiscoveryFlow({}, async () => ({ data: [rowFor(0, { access_level: "vip" })], error: null }));
  assert.equal(invalidRow.status, "DATABASE_ERROR");

  const wrongFilter = await actual.runDfp3DiscoveryFlow(
    { levelSystemCode: "HSK", levelCode: "HSK1" },
    async () => ({ data: [rowFor(1)], error: null }),
  );
  assert.equal(wrongFilter.status, "DATABASE_ERROR");

  const crossSystem = await actual.runDfp3DiscoveryFlow(
    { levelSystemCode: "HSK", levelCode: "HSK1" },
    async () => ({
      data: [rowFor(0, { level: { code: "HSK1", system: { code: "TOCFL" } } })],
      error: null,
    }),
  );
  assert.equal(crossSystem.status, "DATABASE_ERROR");

  const malformedRelation = await actual.runDfp3DiscoveryFlow({}, async () => ({
    data: [rowFor(0, { level: { code: "HSK1" } })],
    error: null,
  }));
  assert.equal(malformedRelation.status, "DATABASE_ERROR");

  const futurePublication = await actual.runDfp3DiscoveryFlow(
    { now: () => new Date(snapshotAt) },
    async () => ({ data: [rowFor(0, { published_at: "2026-07-30T00:00:00.000Z" })], error: null }),
  );
  assert.equal(futurePublication.status, "DATABASE_ERROR");

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

test("maximum-approved discovery payload stays within 96 KiB", async () => {
  const result = await actual.runDfp3DiscoveryFlow(
    { pageSize: 50, now: () => new Date(snapshotAt) },
    createStore(Array.from({ length: 50 }, (_, index) => rowFor(index, {
      title_original: `中文标题${index}`.repeat(12),
      title_support_default: `Support title ${index}`.repeat(12),
    }))).loadPage,
  );
  assert.equal(result.status, "FOUND");
  assert.ok(Buffer.byteLength(JSON.stringify(result.page), "utf8") <= actual.LESSON_DISCOVERY_MAX_PAYLOAD_BYTES);
});

test("three-to-fifteen locale expansion including RTL stays within 10 percent", async () => {
  assert.equal(FIFTEEN_LOCALE_FIXTURES.length, 15);
  assert.ok(FIFTEEN_LOCALE_FIXTURES.some((locale) => locale.direction === "rtl"));
  const rows = Array.from({ length: 50 }, (_, index) => rowFor(index));
  const measure = async (localeFixtures) => {
    const implementation = await loadActualExports(localeFixtures);
    const store = createStore(rows);
    const result = await implementation.runDfp3DiscoveryFlow({ pageSize: 50, requestedLocale: "ar", now: () => new Date(snapshotAt) }, store.loadPage);
    assert.equal(result.status, "FOUND");
    return {
      ids: [...result.page.items].map((item) => item.id),
      payloadBytes: utf8Bytes(deterministicJson(JSON.parse(JSON.stringify(result.page)))),
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

test("production query is summary-only, publication-aware, and exact-pair source filtered", () => {
  assert.match(discoverySource, /lesson-discovery-summary\.v2/);
  assert.match(discoverySource, /lesson-discovery-cursor\.v2/);
  assert.match(
    discoverySource,
    /const LESSON_DISCOVERY_BASE_PROJECTION =\s*"id,slug,title_original,title_support_default,content_type,duration_seconds,access_level,published_at,updated_at"/,
  );
  assert.match(discoverySource, /level:levels\(code,system:level_systems\(code\)\)/);
  assert.match(discoverySource, /level:levels!inner\(code,system:level_systems!inner\(code\)\)/);
  assert.doesNotMatch(
    discoverySource.match(/const LESSON_DISCOVERY_BASE_PROJECTION =[\s\S]*?;/)[0],
    /segment|transcript|vocabulary|exercise|answer|media|audio_url|youtube_id/i,
  );
  assert.match(discoverySource, /\.eq\("status", "published"\)/);
  assert.match(discoverySource, /\.eq\("quality_status", "published"\)/);
  assert.match(discoverySource, /\.eq\("access_level", "free"\)/);
  assert.match(discoverySource, /\.not\("published_at", "is", null\)/);
  assert.match(discoverySource, /\.eq\("level\.code", storeQuery\.levelCode\)/);
  assert.match(discoverySource, /\.eq\("level\.system\.code", storeQuery\.levelSystemCode\)/);
  assert.match(discoverySource, /levelSystemCode,[\s\S]*?levelCode,[\s\S]*?localeCode,[\s\S]*?pageSize/);
  assert.equal(discoverySource.match(/\.from\("lessons"\)/g)?.length, 2);
  assert.match(discoverySource, /verifyCachedVisibility/);
  assert.match(discoverySource, /\.eq\("level\.code", proficiency\.levelCode\)/);
  assert.match(discoverySource, /\.eq\("level\.system\.code", proficiency\.systemCode\)/);
});

test("global Level is consumed only where discovery exists and otherwise preserved", () => {
  for (const source of [homeSource, resourcesSource, cardSource]) {
    assert.doesNotMatch(source, /@\/lib\/lessons/);
    assert.doesNotMatch(source, /\.script|\.exercises|\.vocabulary|transcript/i);
  }
  assert.match(homeSource, /getLessonDiscoveryPage/);
  assert.match(resourcesSource, /getLessonDiscoveryPage/);
  assert.match(resourcesSource, /parseProficiencyContext\(query\.levelSystem,\s*query\.level\)/);
  assert.match(resourcesSource, /levelSystemCode:\s*query\.levelSystem/);
  assert.match(resourcesSource, /levelCode:\s*query\.level/);
  assert.doesNotMatch(resourcesSource, /\bhsk\??:|query\.hsk|hskLevels|Filter resources by HSK level/);
  assert.match(headerSource, /aria-label="Level"/);
  assert.match(headerSource, /Level: All/);
  assert.match(headerSource, /delete\("cursor"\)/);
  assert.doesNotMatch(headerSource, /\bsystemCode:\s*"HSK"/);
  assert.doesNotMatch(headerSource, /Array\.from\(\{\s*length:\s*9/);
  assert.match(practiceSource, /preservedLearnerContextQuery/);
  assert.doesNotMatch(practiceSource, /getLessonDiscoveryPage/);
  assert.match(cardSource, /learnerContextQuery/);
  assert.match(detailPageSource, /preservedLearnerContextQuery/);
  assert.match(detailPageSource, /getSupabaseLessonCore\(slug, query\?\.lang\)/);
  assert.doesNotMatch(detailPageSource, /getSupabaseLessonCore\([^\n]*level/);
  assert.match(learningPanelSource, /learnerContextQuery/);
  assert.match(learningPanelSource, /lang:\s*languageCode/);
});
