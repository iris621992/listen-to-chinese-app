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
const LESSON_DISCOVERY_ALL_PROJECTION =
  `${LESSON_DISCOVERY_BASE_PROJECTION},level:levels(code,system:level_systems(code))`;
const LESSON_DISCOVERY_EXACT_PROJECTION =
  `${LESSON_DISCOVERY_BASE_PROJECTION},level:levels!inner(code,system:level_systems!inner(code))`;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTENT_TYPES = new Set([
  "video",
  "reading",
  "listening",
  "practice_only",
  "review_set",
]);

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

export type LessonDiscoverySummary = {
  id: string;
  slug: string;
  titleOriginal: string;
  titleSupport: string | null;
  levelSystemCode: string | null;
  levelCode: string | null;
  contentType:
    | "video"
    | "reading"
    | "listening"
    | "practice_only"
    | "review_set";
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
        | "INVALID_CURSOR"
        | "DATABASE_ERROR"
        | "PAYLOAD_LIMIT_EXCEEDED";
      page: LessonDiscoveryPage;
    };

type CursorEnvelope = {
  version: typeof LESSON_DISCOVERY_CURSOR_VERSION;
  order: typeof LESSON_DISCOVERY_ORDER_VERSION;
  visibility: typeof LESSON_DISCOVERY_VISIBILITY;
  localeCode: string;
  levelSystemCode: string | null;
  levelCode: string | null;
  snapshotAt: string;
  publishedAt: string;
  id: string;
};

export type LessonDiscoveryStoreQuery = {
  levelSystemCode: string | null;
  levelCode: string | null;
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
    if (
      !exactKeys(cursor, [
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
      || cursor.order !== LESSON_DISCOVERY_ORDER_VERSION
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
      || normalizedTimestamp(cursor.snapshotAt) !== cursor.snapshotAt
      || normalizedTimestamp(cursor.publishedAt) !== cursor.publishedAt
      || typeof cursor.id !== "string"
      || !UUID_PATTERN.test(cursor.id)
    ) {
      return null;
    }
    return cursor as CursorEnvelope;
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
    || typeof row.content_type !== "string"
    || !CONTENT_TYPES.has(row.content_type)
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
      levelSystemCode: proficiency?.systemCode ?? null,
      levelCode: proficiency?.levelCode ?? null,
      contentType: row.content_type as LessonDiscoverySummary["contentType"],
      durationSeconds:
        typeof row.duration_seconds === "number" ? row.duration_seconds : null,
      accessLevel: "free",
      publishedAt,
    },
    updatedAt,
  };
};

const compareSummary = (
  left: LessonDiscoverySummary,
  right: LessonDiscoverySummary,
) => {
  const dateOrder = right.publishedAt.localeCompare(left.publishedAt);
  return dateOrder !== 0 ? dateOrder : right.id.localeCompare(left.id);
};

const payloadBytes = (page: LessonDiscoveryPage) =>
  Buffer.byteLength(JSON.stringify(page), "utf8");

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
    || (
      proficiency !== null
      && summaries.some(
        (item) =>
          item.levelSystemCode !== proficiency.systemCode
          || item.levelCode !== proficiency.levelCode,
      )
    )
    || (
      cursor
      && summaries.some(
        (item) =>
          item.publishedAt > cursor.publishedAt
          || (
            item.publishedAt === cursor.publishedAt
            && item.id >= cursor.id
          ),
      )
    )
    || summaries.some(
      (item, index) =>
        index > 0 && compareSummary(summaries[index - 1], item) > 0,
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
          order: LESSON_DISCOVERY_ORDER_VERSION,
          visibility: LESSON_DISCOVERY_VISIBILITY,
          localeCode,
          levelSystemCode,
          levelCode,
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
        .order("published_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(storeQuery.limit);

      if (storeQuery.levelCode && storeQuery.levelSystemCode) {
        query = query
          .eq("level.code", storeQuery.levelCode)
          .eq("level.system.code", storeQuery.levelSystemCode);
      }
      if (storeQuery.after) {
        query = query.or(
          `published_at.lt.${storeQuery.after.publishedAt},and(published_at.eq.${storeQuery.after.publishedAt},id.lt.${storeQuery.after.id})`,
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
            ? "id,level:levels!inner(code,system:level_systems!inner(code))"
            : "id",
        )
        .in("id", ids)
        .eq("status", "published")
        .eq("quality_status", "published")
        .eq("access_level", "free")
        .not("published_at", "is", null)
        .lte("published_at", requestNow)
        .limit(LESSON_DISCOVERY_MAX_PAGE_SIZE);
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
