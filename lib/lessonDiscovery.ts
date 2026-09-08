import {
  defaultLearnerLocaleCode,
  getLearnerLocale,
} from "@/lib/learnerLocaleRegistry";
import {
  isProficiencyCode,
  parseProficiencyContext,
} from "@/lib/proficiencyContext";

export const LESSON_DISCOVERY_SCHEMA_VERSION =
  "lesson-discovery-summary.v2" as const;
export const LESSON_DISCOVERY_CURSOR_VERSION =
  "lesson-discovery-cursor.v2" as const;
export const LESSON_DISCOVERY_ORDER_VERSION =
  "published_at_desc_id_desc.v1" as const;
export const LESSON_DISCOVERY_DEFAULT_PAGE_SIZE = 24;
export const LESSON_DISCOVERY_MAX_PAGE_SIZE = 50;
export const LESSON_DISCOVERY_MAX_PAYLOAD_BYTES = 96 * 1024;

const LESSON_DISCOVERY_VISIBILITY = "published_free" as const;
const LESSON_DISCOVERY_BASE_PROJECTION =
  "id,slug,title_original,title_support_default,content_type,duration_seconds,access_level,published_at,updated_at";
const LESSON_DISCOVERY_CARD_MEDIA_PROJECTION = "thumbnail_url";
const LESSON_DISCOVERY_ALL_PROJECTION =
  `${LESSON_DISCOVERY_BASE_PROJECTION},${LESSON_DISCOVERY_CARD_MEDIA_PROJECTION},level:levels(code,system:level_systems(code))`;
const LESSON_DISCOVERY_EXACT_PROJECTION =
  `${LESSON_DISCOVERY_BASE_PROJECTION},${LESSON_DISCOVERY_CARD_MEDIA_PROJECTION},level:levels!inner(code,system:level_systems!inner(code))`;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEARCH_DENIED_PATTERN = /[\u0000-\u001f\u007f",()\\%_*]/;

export type LessonDiscoveryContentType =
  | "video"
  | "reading"
  | "listening"
  | "practice_only"
  | "review_set";

export type LessonDiscoveryDurationFilter =
  | "under5"
  | "5to10"
  | "10to20"
  | "20plus";

export type LessonDiscoverySort = "newest" | "oldest";

const CONTENT_TYPES = new Set<LessonDiscoveryContentType>([
  "video",
  "reading",
  "listening",
  "practice_only",
  "review_set",
]);
const DURATION_FILTERS = new Set<LessonDiscoveryDurationFilter>([
  "under5",
  "5to10",
  "10to20",
  "20plus",
]);
const SORTS = new Set<LessonDiscoverySort>(["newest", "oldest"]);

type Row = Record<string, unknown>;
type DiscoveryStoreError = { message: string };
type ParsedDiscoveryRow = {
  summary: LessonDiscoverySummary;
  updatedAt: string;
};
type ExactProficiency = {
  systemCode: string;
  levelCode: string;
};

type NormalizedContentType = LessonDiscoveryContentType | null | "INVALID";
type NormalizedDurationFilter = LessonDiscoveryDurationFilter | null | "INVALID";
type NormalizedSearchQuery = string | null | "INVALID";
type NormalizedSort = LessonDiscoverySort | "INVALID";

export type LessonDiscoverySummary = {
  id: string;
  slug: string;
  titleOriginal: string;
  titleSupport: string | null;
  thumbnailUrl: string | null;
  levelSystemCode: string | null;
  levelCode: string | null;
  contentType: LessonDiscoveryContentType;
  durationSeconds: number | null;
  accessLevel: "free";
  publishedAt: string;
};

export type LessonDiscoveryPage = {
  schemaVersion: typeof LESSON_DISCOVERY_SCHEMA_VERSION;
  localeCode: string;
  items: LessonDiscoverySummary[];
  nextCursor: string | null;
};

export type LessonDiscoveryResult =
  | { status: "FOUND"; page: LessonDiscoveryPage }
  | {
      status:
        | "UNCONFIGURED"
        | "INVALID_PROFICIENCY"
        | "INVALID_CONTENT_TYPE"
        | "INVALID_SEARCH"
        | "INVALID_DURATION"
        | "INVALID_SORT"
        | "INVALID_CURSOR"
        | "DATABASE_ERROR"
        | "PAYLOAD_LIMIT_EXCEEDED";
      page: LessonDiscoveryPage;
    };

type CursorEnvelope = {
  version: typeof LESSON_DISCOVERY_CURSOR_VERSION;
  order: string;
  visibility: typeof LESSON_DISCOVERY_VISIBILITY;
  localeCode: string;
  levelSystemCode: string | null;
  levelCode: string | null;
  contentType: LessonDiscoveryContentType | null;
  snapshotAt: string;
  publishedAt: string;
  id: string;
};

export type LessonDiscoveryStoreQuery = {
  levelSystemCode: string | null;
  levelCode: string | null;
  contentType: LessonDiscoveryContentType | null;
  searchQuery: string | null;
  durationFilter: LessonDiscoveryDurationFilter | null;
  sort: LessonDiscoverySort;
  localeCode: string;
  visibility: typeof LESSON_DISCOVERY_VISIBILITY;
  snapshotAt: string;
  after: { publishedAt: string; id: string } | null;
  limit: number;
};

type LessonDiscoveryStore = (
  query: LessonDiscoveryStoreQuery,
) => Promise<{ data: unknown[] | null; error: DiscoveryStoreError | null }>;

export type DiscoveryFlowOptions = {
  cursor?: string | null;
  levelSystemCode?: string | null;
  levelCode?: string | null;
  contentType?: LessonDiscoveryContentType | string | null;
  searchQuery?: string | null;
  durationFilter?: LessonDiscoveryDurationFilter | string | null;
  sort?: LessonDiscoverySort | string | null;
  pageSize?: number;
  requestedLocale?: string | null;
  now?: () => Date;
};

const emptyPage = (localeCode: string): LessonDiscoveryPage => ({
  schemaVersion: LESSON_DISCOVERY_SCHEMA_VERSION,
  localeCode,
  items: [],
  nextCursor: null,
});

const normalizedLocale = (value: string | null | undefined) =>
  getLearnerLocale(value)?.code ?? defaultLearnerLocaleCode;

const normalizedContentType = (
  value: string | null | undefined,
): NormalizedContentType => {
  if (value === null || value === undefined) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) return "INVALID";
  return CONTENT_TYPES.has(normalized as LessonDiscoveryContentType)
    ? normalized as LessonDiscoveryContentType
    : "INVALID";
};

const normalizedSearchQuery = (
  value: string | null | undefined,
): NormalizedSearchQuery => {
  if (value === null || value === undefined) return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) return null;
  if (normalized.length > 120 || SEARCH_DENIED_PATTERN.test(normalized)) {
    return "INVALID";
  }
  return normalized;
};

const normalizedDurationFilter = (
  value: string | null | undefined,
): NormalizedDurationFilter => {
  if (value === null || value === undefined) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0 || normalized === "any") return null;
  return DURATION_FILTERS.has(normalized as LessonDiscoveryDurationFilter)
    ? normalized as LessonDiscoveryDurationFilter
    : "INVALID";
};

const normalizedSort = (
  value: string | null | undefined,
): NormalizedSort => {
  if (value === null || value === undefined || value.trim().length === 0) {
    return "newest";
  }
  const normalized = value.trim().toLowerCase();
  return SORTS.has(normalized as LessonDiscoverySort)
    ? normalized as LessonDiscoverySort
    : "INVALID";
};

const exactProficiencyFor = (
  levelSystemCode: string | null | undefined,
  levelCode: string | null | undefined,
): ExactProficiency | null | "INVALID" => {
  const context = parseProficiencyContext(levelSystemCode, levelCode);
  return context.kind === "ALL"
    ? null
    : context.kind === "INVALID"
      ? "INVALID"
      : { systemCode: context.systemCode, levelCode: context.levelCode };
};

const normalizedPageSize = (value: number | undefined) => {
  if (!Number.isFinite(value)) return LESSON_DISCOVERY_DEFAULT_PAGE_SIZE;
  return Math.min(
    LESSON_DISCOVERY_MAX_PAGE_SIZE,
    Math.max(1, Math.trunc(value ?? LESSON_DISCOVERY_DEFAULT_PAGE_SIZE)),
  );
};

const normalizedTimestamp = (value: unknown) => {
  if (typeof value !== "string" || value.length > 64) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

const normalizedThumbnailUrl = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    return "INVALID" as const;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : "INVALID" as const;
  } catch {
    return "INVALID" as const;
  }
};

const exactKeys = (value: Row, expected: string[]) => {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
};

const encodeCursor = (value: CursorEnvelope) =>
  Buffer.from(JSON.stringify(value), "utf8").toString("base64url");

const decodeCursor = (value: string): CursorEnvelope | null => {
  if (
    value.length === 0
    || value.length > 2048
    || !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as unknown;
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
      return null;
    }
    const cursor = decoded as Row;
    const cursorContentType = normalizedContentType(
      typeof cursor.contentType === "string" ? cursor.contentType : null,
    );
    if (
      !exactKeys(cursor, [
        "contentType",
        "id",
        "levelCode",
        "levelSystemCode",
        "localeCode",
        "order",
        "publishedAt",
        "snapshotAt",
        "version",
        "visibility",
      ])
      || cursor.version !== LESSON_DISCOVERY_CURSOR_VERSION
      || typeof cursor.order !== "string"
      || cursor.order.length === 0
      || cursor.order.length > 1024
      || cursor.visibility !== LESSON_DISCOVERY_VISIBILITY
      || typeof cursor.localeCode !== "string"
      || (
        cursor.levelSystemCode !== null
        && (
          typeof cursor.levelSystemCode !== "string"
          || !isProficiencyCode(cursor.levelSystemCode)
        )
      )
      || (
        cursor.levelCode !== null
        && (
          typeof cursor.levelCode !== "string"
          || !isProficiencyCode(cursor.levelCode)
        )
      )
      || ((cursor.levelSystemCode === null) !== (cursor.levelCode === null))
      || (
        cursor.contentType !== null
        && cursorContentType === "INVALID"
      )
      || normalizedTimestamp(cursor.snapshotAt) !== cursor.snapshotAt
      || normalizedTimestamp(cursor.publishedAt) !== cursor.publishedAt
      || typeof cursor.id !== "string"
      || !UUID_PATTERN.test(cursor.id)
    ) {
      return null;
    }
    return {
      version: cursor.version,
      order: cursor.order,
      visibility: cursor.visibility,
      localeCode: cursor.localeCode,
      levelSystemCode: cursor.levelSystemCode as string | null,
      levelCode: cursor.levelCode as string | null,
      contentType: cursor.contentType === null
        ? null
        : cursorContentType as LessonDiscoveryContentType,
      snapshotAt: cursor.snapshotAt as string,
      publishedAt: cursor.publishedAt as string,
      id: cursor.id,
    };
  } catch {
    return null;
  }
};

const recordValue = (value: unknown): Row | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Row
    : null;

const proficiencyFrom = (value: unknown): ExactProficiency | null | "INVALID" => {
  if (value === null || value === undefined) return null;
  const level = Array.isArray(value) ? recordValue(value[0]) : recordValue(value);
  if (!level || typeof level.code !== "string" || !isProficiencyCode(level.code)) {
    return "INVALID";
  }
  const systemValue = Array.isArray(level.system)
    ? recordValue(level.system[0])
    : recordValue(level.system);
  if (
    !systemValue
    || typeof systemValue.code !== "string"
    || !isProficiencyCode(systemValue.code)
  ) {
    return "INVALID";
  }
  return { systemCode: systemValue.code, levelCode: level.code };
};

const summaryFromRow = (value: unknown): ParsedDiscoveryRow | null => {
  const row = recordValue(value);
  if (!row) return null;

  const publishedAt = normalizedTimestamp(row.published_at);
  const updatedAt = normalizedTimestamp(row.updated_at);
  const proficiency = proficiencyFrom(row.level);
  const thumbnailUrl = normalizedThumbnailUrl(row.thumbnail_url);
  if (
    typeof row.id !== "string"
    || !UUID_PATTERN.test(row.id)
    || typeof row.slug !== "string"
    || row.slug.trim().length === 0
    || row.slug.length > 200
    || typeof row.title_original !== "string"
    || row.title_original.trim().length === 0
    || (
      row.title_support_default !== null
      && row.title_support_default !== undefined
      && typeof row.title_support_default !== "string"
    )
    || thumbnailUrl === "INVALID"
    || typeof row.content_type !== "string"
    || !CONTENT_TYPES.has(row.content_type as LessonDiscoveryContentType)
    || (
      row.duration_seconds !== null
      && row.duration_seconds !== undefined
      && (
        typeof row.duration_seconds !== "number"
        || !Number.isInteger(row.duration_seconds)
        || row.duration_seconds < 0
      )
    )
    || row.access_level !== "free"
    || !publishedAt
    || !updatedAt
    || proficiency === "INVALID"
  ) {
    return null;
  }

  return {
    summary: {
      id: row.id,
      slug: row.slug,
      titleOriginal: row.title_original,
      titleSupport:
        typeof row.title_support_default === "string"
          ? row.title_support_default
          : null,
      thumbnailUrl,
      levelSystemCode: proficiency?.systemCode ?? null,
      levelCode: proficiency?.levelCode ?? null,
      contentType: row.content_type as LessonDiscoveryContentType,
      durationSeconds:
        typeof row.duration_seconds === "number" ? row.duration_seconds : null,
      accessLevel: "free",
      publishedAt,
    },
    updatedAt,
  };
};

const durationBounds = (filter: LessonDiscoveryDurationFilter | null) => {
  switch (filter) {
    case "under5": return { min: null, maxExclusive: 300 };
    case "5to10": return { min: 300, maxExclusive: 600 };
    case "10to20": return { min: 600, maxExclusive: 1200 };
    case "20plus": return { min: 1200, maxExclusive: null };
    default: return { min: null, maxExclusive: null };
  }
};

const durationPostgrestFilter = (filter: LessonDiscoveryDurationFilter) => {
  switch (filter) {
    case "under5": return "duration_seconds.lt.300";
    case "5to10": return "and(duration_seconds.gte.300,duration_seconds.lt.600)";
    case "10to20": return "and(duration_seconds.gte.600,duration_seconds.lt.1200)";
    case "20plus": return "duration_seconds.gte.1200";
  }
};

const matchesDuration = (
  seconds: number | null,
  filter: LessonDiscoveryDurationFilter | null,
) => {
  if (!filter) return true;
  if (seconds === null) return false;
  const bounds = durationBounds(filter);
  return (bounds.min === null || seconds >= bounds.min)
    && (bounds.maxExclusive === null || seconds < bounds.maxExclusive);
};

const matchesSearch = (summary: LessonDiscoverySummary, searchQuery: string | null) => {
  if (!searchQuery) return true;
  const needle = searchQuery.toLocaleLowerCase();
  return summary.titleOriginal.toLocaleLowerCase().includes(needle)
    || summary.titleSupport?.toLocaleLowerCase().includes(needle) === true;
};

const compareSummary = (
  left: LessonDiscoverySummary,
  right: LessonDiscoverySummary,
  sort: LessonDiscoverySort,
) => {
  const dateOrder = left.publishedAt.localeCompare(right.publishedAt);
  const idOrder = left.id.localeCompare(right.id);
  return sort === "oldest"
    ? (dateOrder !== 0 ? dateOrder : idOrder)
    : (dateOrder !== 0 ? -dateOrder : -idOrder);
};

const isAfterCursor = (
  summary: LessonDiscoverySummary,
  cursor: CursorEnvelope,
  sort: LessonDiscoverySort,
) => sort === "oldest"
  ? summary.publishedAt > cursor.publishedAt
    || (summary.publishedAt === cursor.publishedAt && summary.id > cursor.id)
  : summary.publishedAt < cursor.publishedAt
    || (summary.publishedAt === cursor.publishedAt && summary.id < cursor.id);

const discoveryOrderIdentity = (
  searchQuery: string | null,
  durationFilter: LessonDiscoveryDurationFilter | null,
  sort: LessonDiscoverySort,
) => {
  if (!searchQuery && !durationFilter && sort === "newest") {
    return LESSON_DISCOVERY_ORDER_VERSION;
  }
  const context = Buffer.from(
    JSON.stringify({ searchQuery, durationFilter, sort }),
    "utf8",
  ).toString("base64url");
  return `published_at_id_context.v2.${context}`;
};

const payloadBytes = (page: LessonDiscoveryPage) =>
  Buffer.byteLength(JSON.stringify(page), "utf8");

const normalizedDiscoveryContext = (options: DiscoveryFlowOptions) => {
  const searchQuery = normalizedSearchQuery(options.searchQuery);
  if (searchQuery === "INVALID") return { status: "INVALID_SEARCH" as const };
  const durationFilter = normalizedDurationFilter(options.durationFilter);
  if (durationFilter === "INVALID") return { status: "INVALID_DURATION" as const };
  const sort = normalizedSort(options.sort);
  if (sort === "INVALID") return { status: "INVALID_SORT" as const };
  return { status: "OK" as const, searchQuery, durationFilter, sort };
};

export async function runDfp3DiscoveryFlow(
  options: DiscoveryFlowOptions,
  loadPage: LessonDiscoveryStore,
): Promise<LessonDiscoveryResult> {
  const localeCode = normalizedLocale(options.requestedLocale);
  const proficiency = exactProficiencyFor(
    options.levelSystemCode,
    options.levelCode,
  );
  if (proficiency === "INVALID") {
    return { status: "INVALID_PROFICIENCY", page: emptyPage(localeCode) };
  }
  const contentType = normalizedContentType(options.contentType);
  if (contentType === "INVALID") {
    return { status: "INVALID_CONTENT_TYPE", page: emptyPage(localeCode) };
  }
  const discoveryContext = normalizedDiscoveryContext(options);
  if (discoveryContext.status !== "OK") {
    return { status: discoveryContext.status, page: emptyPage(localeCode) };
  }
  const { searchQuery, durationFilter, sort } = discoveryContext;
  const orderIdentity = discoveryOrderIdentity(searchQuery, durationFilter, sort);

  const pageSize = normalizedPageSize(options.pageSize);
  const requestedCursor = options.cursor?.trim() || null;
  const cursor = requestedCursor ? decodeCursor(requestedCursor) : null;
  const requestDate = options.now?.() ?? new Date();
  const requestTime = requestDate.getTime();
  if (!Number.isFinite(requestTime)) {
    return { status: "DATABASE_ERROR", page: emptyPage(localeCode) };
  }

  const requestNow = new Date(requestTime).toISOString();
  const levelSystemCode = proficiency?.systemCode ?? null;
  const levelCode = proficiency?.levelCode ?? null;
  if (
    requestedCursor
    && (
      !cursor
      || cursor.localeCode !== localeCode
      || cursor.levelSystemCode !== levelSystemCode
      || cursor.levelCode !== levelCode
      || cursor.contentType !== contentType
      || cursor.order !== orderIdentity
      || cursor.snapshotAt > requestNow
      || cursor.publishedAt > cursor.snapshotAt
    )
  ) {
    return { status: "INVALID_CURSOR", page: emptyPage(localeCode) };
  }

  const snapshotAt = cursor?.snapshotAt ?? requestNow;
  const storeResult = await loadPage({
    levelSystemCode,
    levelCode,
    contentType,
    searchQuery,
    durationFilter,
    sort,
    localeCode,
    visibility: LESSON_DISCOVERY_VISIBILITY,
    snapshotAt,
    after: cursor
      ? { publishedAt: cursor.publishedAt, id: cursor.id }
      : null,
    limit: pageSize + 1,
  });

  if (storeResult.error || !Array.isArray(storeResult.data)) {
    return { status: "DATABASE_ERROR", page: emptyPage(localeCode) };
  }
  if (storeResult.data.length > pageSize + 1) {
    return { status: "DATABASE_ERROR", page: emptyPage(localeCode) };
  }

  const parsed = storeResult.data.map(summaryFromRow);
  if (parsed.some((item) => item === null)) {
    return { status: "DATABASE_ERROR", page: emptyPage(localeCode) };
  }
  const parsedRows = parsed as ParsedDiscoveryRow[];
  const summaries = parsedRows.map((item) => item.summary);
  if (
    new Set(summaries.map((item) => item.id)).size !== summaries.length
    || summaries.some((item) => item.publishedAt > snapshotAt)
    || parsedRows.some((item) => item.updatedAt > snapshotAt)
    || summaries.some((item) => !matchesSearch(item, searchQuery))
    || summaries.some((item) => !matchesDuration(item.durationSeconds, durationFilter))
    || (
      contentType !== null
      && summaries.some((item) => item.contentType !== contentType)
    )
    || (
      proficiency !== null
      && summaries.some(
        (item) =>
          item.levelSystemCode !== proficiency.systemCode
          || item.levelCode !== proficiency.levelCode,
      )
    )
    || (cursor && summaries.some((item) => !isAfterCursor(item, cursor, sort)))
    || summaries.some(
      (item, index) =>
        index > 0 && compareSummary(summaries[index - 1], item, sort) > 0,
    )
  ) {
    return { status: "DATABASE_ERROR", page: emptyPage(localeCode) };
  }

  const items = summaries.slice(0, pageSize);
  const lastItem = items.at(-1);
  const nextCursor =
    summaries.length > pageSize && lastItem
      ? encodeCursor({
          version: LESSON_DISCOVERY_CURSOR_VERSION,
          order: orderIdentity,
          visibility: LESSON_DISCOVERY_VISIBILITY,
          localeCode,
          levelSystemCode,
          levelCode,
          contentType,
          snapshotAt,
          publishedAt: lastItem.publishedAt,
          id: lastItem.id,
        })
      : null;
  const page: LessonDiscoveryPage = {
    schemaVersion: LESSON_DISCOVERY_SCHEMA_VERSION,
    localeCode,
    items,
    nextCursor,
  };

  if (payloadBytes(page) > LESSON_DISCOVERY_MAX_PAYLOAD_BYTES) {
    return {
      status: "PAYLOAD_LIMIT_EXCEEDED",
      page: emptyPage(localeCode),
    };
  }
  return { status: "FOUND", page };
}

export const isLessonDiscoveryConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const postgrestSearchPattern = (searchQuery: string) => `"*${searchQuery}*"`;

export async function getLessonDiscoveryPage(
  options: DiscoveryFlowOptions = {},
): Promise<LessonDiscoveryResult> {
  const localeCode = normalizedLocale(options.requestedLocale);
  if (!isLessonDiscoveryConfigured) {
    return { status: "UNCONFIGURED", page: emptyPage(localeCode) };
  }

  const proficiency = exactProficiencyFor(
    options.levelSystemCode,
    options.levelCode,
  );
  if (proficiency === "INVALID") {
    return { status: "INVALID_PROFICIENCY", page: emptyPage(localeCode) };
  }
  const contentType = normalizedContentType(options.contentType);
  if (contentType === "INVALID") {
    return { status: "INVALID_CONTENT_TYPE", page: emptyPage(localeCode) };
  }
  const discoveryContext = normalizedDiscoveryContext(options);
  if (discoveryContext.status !== "OK") {
    return { status: discoveryContext.status, page: emptyPage(localeCode) };
  }
  const { searchQuery, durationFilter, sort } = discoveryContext;
  const orderIdentity = discoveryOrderIdentity(searchQuery, durationFilter, sort);

  const requestedCursor = options.cursor?.trim() || null;
  const cursor = requestedCursor ? decodeCursor(requestedCursor) : null;
  const levelSystemCode = proficiency?.systemCode ?? null;
  const levelCode = proficiency?.levelCode ?? null;
  const requestDate = options.now?.() ?? new Date();
  const requestTime = requestDate.getTime();
  if (!Number.isFinite(requestTime)) {
    return { status: "DATABASE_ERROR", page: emptyPage(localeCode) };
  }
  const requestNow = new Date(requestTime).toISOString();
  if (
    requestedCursor
    && (
      !cursor
      || cursor.localeCode !== localeCode
      || cursor.levelSystemCode !== levelSystemCode
      || cursor.levelCode !== levelCode
      || cursor.contentType !== contentType
      || cursor.order !== orderIdentity
      || cursor.snapshotAt > requestNow
      || cursor.publishedAt > cursor.snapshotAt
    )
  ) {
    return { status: "INVALID_CURSOR", page: emptyPage(localeCode) };
  }

  const {
    nextPublicCacheAdapter,
    publicCacheIdentity,
    readPublicDiscovery,
  } = await import("@/lib/publicContentCache");
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = createServerSupabaseClient();
  const freshnessWindowMs = 5 * 60 * 1000;
  const snapshotAt = cursor?.snapshotAt
    ?? new Date(
      Math.floor(requestTime / freshnessWindowMs) * freshnessWindowMs,
    ).toISOString();
  const pageSize = normalizedPageSize(options.pageSize);
  const effectiveOptions: DiscoveryFlowOptions = cursor
    ? options
    : {
        ...options,
        now: () => new Date(snapshotAt),
      };
  const contentIdentity = publicCacheIdentity(
    "discovery",
    JSON.stringify({
      cursor: requestedCursor,
      levelSystemCode,
      levelCode,
      contentType,
      searchQuery,
      durationFilter,
      sort,
      localeCode,
      pageSize,
    }),
  );

  const loadFresh = () =>
    runDfp3DiscoveryFlow(effectiveOptions, async (storeQuery) => {
      let query = supabase
        .from("lessons")
        .select(
          storeQuery.levelCode
            ? LESSON_DISCOVERY_EXACT_PROJECTION
            : LESSON_DISCOVERY_ALL_PROJECTION,
        )
        .eq("status", "published")
        .eq("quality_status", "published")
        .eq("access_level", "free")
        .not("published_at", "is", null)
        .lte("published_at", storeQuery.snapshotAt)
        .lte("updated_at", storeQuery.snapshotAt)
        .order("published_at", { ascending: storeQuery.sort === "oldest" })
        .order("id", { ascending: storeQuery.sort === "oldest" })
        .limit(storeQuery.limit);

      if (storeQuery.contentType) {
        query = query.eq("content_type", storeQuery.contentType);
      }
      if (storeQuery.searchQuery) {
        const pattern = postgrestSearchPattern(storeQuery.searchQuery);
        query = query.or(
          `title_original.ilike.${pattern},title_support_default.ilike.${pattern}`,
        );
      }
      if (storeQuery.durationFilter) {
        query = query.or(durationPostgrestFilter(storeQuery.durationFilter));
      }
      if (storeQuery.levelCode && storeQuery.levelSystemCode) {
        query = query
          .eq("level.code", storeQuery.levelCode)
          .eq("level.system.code", storeQuery.levelSystemCode);
      }
      if (storeQuery.after) {
        const comparator = storeQuery.sort === "oldest" ? "gt" : "lt";
        query = query.or(
          `published_at.${comparator}.${storeQuery.after.publishedAt},and(published_at.eq.${storeQuery.after.publishedAt},id.${comparator}.${storeQuery.after.id})`,
        );
      }
      return query;
    });

  const cacheRead = await readPublicDiscovery<LessonDiscoveryResult>({
    adapter: nextPublicCacheAdapter,
    contentIdentity,
    publicationVersion: snapshotAt,
    localeCode,
    loadFresh: async () => {
      const result = await loadFresh();
      if (result.status !== "FOUND") {
        throw new Error("Non-success discovery results must not enter cache.");
      }
      return result;
    },
    verifyCachedVisibility: async (result) => {
      if (result.status !== "FOUND" || result.page.items.length === 0) {
        return result.status === "FOUND" ? "PUBLIC" : "UNAVAILABLE";
      }
      const ids = result.page.items.map((item) => item.id);
      let authority = supabase
        .from("lessons")
        .select(
          proficiency
            ? "id,content_type,level:levels!inner(code,system:level_systems!inner(code))"
            : "id,content_type",
        )
        .in("id", ids)
        .eq("status", "published")
        .eq("quality_status", "published")
        .eq("access_level", "free")
        .not("published_at", "is", null)
        .lte("published_at", requestNow)
        .limit(LESSON_DISCOVERY_MAX_PAGE_SIZE);
      if (contentType) {
        authority = authority.eq("content_type", contentType);
      }
      if (searchQuery) {
        const pattern = postgrestSearchPattern(searchQuery);
        authority = authority.or(
          `title_original.ilike.${pattern},title_support_default.ilike.${pattern}`,
        );
      }
      if (durationFilter) {
        authority = authority.or(durationPostgrestFilter(durationFilter));
      }
      if (proficiency) {
        authority = authority
          .eq("level.code", proficiency.levelCode)
          .eq("level.system.code", proficiency.systemCode);
      }
      const authorityResult = await authority;
      if (authorityResult.error || !Array.isArray(authorityResult.data)) {
        return "UNAVAILABLE";
      }
      const visibleIds = authorityResult.data
        .map((value) => {
          const row = recordValue(value);
          return row && typeof row.id === "string" ? row.id : null;
        })
        .filter((id): id is string => id !== null);
      return visibleIds.length === ids.length
        && new Set(visibleIds).size === ids.length
        && ids.every((id) => visibleIds.includes(id))
        ? "PUBLIC"
        : "NOT_PUBLIC";
    },
  });

  return cacheRead.status === "FOUND"
    ? cacheRead.value
    : { status: "DATABASE_ERROR", page: emptyPage(localeCode) };
}
