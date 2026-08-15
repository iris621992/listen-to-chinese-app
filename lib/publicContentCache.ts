export const PUBLIC_CACHE_KEY_VERSION = "public-cache-key.v1" as const;
export const PUBLIC_DISCOVERY_REPRESENTATION_VERSION =
  "lesson-discovery-summary.v2" as const;
export const PUBLIC_DETAIL_REPRESENTATION_VERSION =
  "lesson-detail-core.v1" as const;
export const PUBLIC_NEGATIVE_REPRESENTATION_VERSION =
  "public-negative-lookup.v1" as const;
export const PUBLIC_AUTHORIZATION_CLASS = "anonymous_public" as const;

export const PUBLIC_CACHE_FRESHNESS_SECONDS = Object.freeze({
  discovery: 5 * 60,
  detail: 15 * 60,
  negativeLookup: 30,
});

export type PublicCacheClass =
  | "discovery"
  | "detail"
  | "negative_lookup";

export type PublicCacheKeyParts = {
  cacheClass: PublicCacheClass;
  contentIdentity: string;
  representationVersion: string;
  publicationVersion: string;
  localeCode: string;
  authorizationClass: typeof PUBLIC_AUTHORIZATION_CLASS;
};

export type PublicCacheReadRequest<T> = {
  key: string;
  tags: readonly string[];
  ttlSeconds: number;
  load: () => Promise<T>;
};

export type PublicCacheReadResult<T> = {
  value: T;
  source: "cache" | "fresh";
};

export type PublicCacheAdapter = {
  read<T>(
    request: PublicCacheReadRequest<T>,
  ): Promise<PublicCacheReadResult<T>>;
};

export type AuthoritativeVisibility =
  | {
      status: "PUBLIC";
      contentIdentity: string;
      publicationVersion: string;
    }
  | { status: "NOT_PUBLIC" }
  | { status: "UNAVAILABLE" };

export type PublicDetailReadResult<T> =
  | {
      status: "FOUND";
      value: T;
      cacheSource: "cache" | "fresh";
    }
  | { status: "NOT_FOUND" | "VISIBILITY_UNAVAILABLE" | "CACHE_ERROR" };

export type PublicDiscoveryReadResult<T> =
  | {
      status: "FOUND";
      value: T;
      cacheSource: "cache" | "fresh";
    }
  | { status: "VISIBILITY_DENIED" | "VISIBILITY_UNAVAILABLE" | "CACHE_ERROR" };

export type NegativeLookupResult<T> =
  | { status: "FOUND"; value: T }
  | {
      status: "NOT_FOUND";
      cacheSource: "cache" | "fresh";
    }
  | { status: "LOOKUP_UNAVAILABLE" | "CACHE_ERROR" };

type NegativeLookupStoreResult<T> =
  | { status: "FOUND"; value: T }
  | { status: "NOT_FOUND" }
  | { status: "UNAVAILABLE" };

export type PublicationEventKind =
  | "create"
  | "publish"
  | "update"
  | "unpublish"
  | "visibility_restrict";

export type PublicationInvalidationEvent = {
  schemaVersion: "publication-invalidation.v1";
  eventId: string;
  eventKind: PublicationEventKind;
  committedAt: string;
  resourceId: string;
  slug: string;
  affectedLocaleCodes: readonly string[];
};

export type PublicationInvalidationObservation = {
  eventId: string;
  outcome: "APPLIED" | "DUPLICATE" | "RETRY_REQUIRED";
  tagCount: number;
};

export type PublicationInvalidationAdapter = {
  wasApplied(eventId: string): Promise<boolean>;
  invalidateTags(tags: readonly string[]): Promise<void>;
  markApplied(eventId: string): Promise<void>;
  observe(observation: PublicationInvalidationObservation): Promise<void>;
};

export type PublicationInvalidationResult =
  | {
      status: "APPLIED" | "DUPLICATE";
      tags: readonly string[];
    }
  | {
      status: "INVALID_EVENT" | "RETRY_REQUIRED";
      tags: readonly string[];
    };

const FIELD_MAX_LENGTH = 512;
const EVENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const LOCALE_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/;

const isBoundedField = (value: string) =>
  value.trim().length > 0 && value.length <= FIELD_MAX_LENGTH;

const normalizedTimestamp = (value: string) => {
  if (value.length > 64) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

export const isPublicationVisibleAt = (
  publishedAt: string,
  visibilityAt: string,
) => {
  const normalizedPublishedAt = normalizedTimestamp(publishedAt);
  const normalizedVisibilityAt = normalizedTimestamp(visibilityAt);
  return normalizedPublishedAt !== null
    && normalizedVisibilityAt !== null
    && normalizedPublishedAt <= normalizedVisibilityAt;
};

const exactKeys = (value: Record<string, unknown>, expected: string[]) => {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
};

const fnv1a64 = (value: string) => {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    first = Math.imul(first ^ point, 0x01000193) >>> 0;
    second = Math.imul(second ^ point, 0x85ebca6b) >>> 0;
  }
  return first.toString(16).padStart(8, "0")
    + second.toString(16).padStart(8, "0");
};

export const publicCacheIdentity = (kind: string, value: string) => {
  if (!/^[a-z][a-z0-9_-]{0,31}$/.test(kind) || value.length > 4096) {
    throw new Error("Invalid public cache identity input.");
  }
  return `${kind}:${fnv1a64(value)}`;
};

const normalizedLocales = (values: readonly string[]) => {
  const normalized = values.map((value) => value.trim().toLowerCase());
  if (
    normalized.length > 50
    || normalized.some((value) => !LOCALE_PATTERN.test(value))
    || new Set(normalized).size !== normalized.length
  ) {
    return null;
  }
  return normalized.sort();
};

export function createPublicCacheKey(parts: PublicCacheKeyParts) {
  if (
    !isBoundedField(parts.contentIdentity)
    || !isBoundedField(parts.representationVersion)
    || !isBoundedField(parts.publicationVersion)
    || !LOCALE_PATTERN.test(parts.localeCode)
    || parts.authorizationClass !== PUBLIC_AUTHORIZATION_CLASS
  ) {
    throw new Error("Invalid public cache key parts.");
  }

  return `dfp4:${Buffer.from(JSON.stringify({
    version: PUBLIC_CACHE_KEY_VERSION,
    cacheClass: parts.cacheClass,
    contentIdentity: parts.contentIdentity,
    representationVersion: parts.representationVersion,
    publicationVersion: parts.publicationVersion,
    localeCode: parts.localeCode,
    authorizationClass: parts.authorizationClass,
  }), "utf8").toString("base64url")}`;
}

export const publicDiscoveryTags = (identity: string) =>
  Object.freeze([
    "public:discovery",
    `public:discovery:${fnv1a64(identity)}`,
  ]);

export const publicDetailTags = (resourceId: string, localeCode: string) =>
  Object.freeze([
    `public:resource:${fnv1a64(resourceId)}`,
    `public:resource:${fnv1a64(resourceId)}:locale:${fnv1a64(localeCode)}`,
  ]);

export const publicNegativeTags = (slug: string) =>
  Object.freeze([
    `public:negative:${fnv1a64(slug)}`,
  ]);

export const nextPublicCacheAdapter: PublicCacheAdapter = {
  async read<T>(request: PublicCacheReadRequest<T>) {
    const { unstable_cache: unstableCache } = await import("next/cache");
    let source: "cache" | "fresh" = "cache";
    const cached = unstableCache(
      async () => {
        source = "fresh";
        return request.load();
      },
      [request.key],
      {
        revalidate: request.ttlSeconds,
        tags: [...request.tags],
      },
    );
    return { value: await cached(), source };
  },
};

export async function readPublicDetail<T>(input: {
  adapter: PublicCacheAdapter;
  localeCode: string;
  verifyVisibility: () => Promise<AuthoritativeVisibility>;
  loadFresh: (visibility: Extract<
    AuthoritativeVisibility,
    { status: "PUBLIC" }
  >) => Promise<T>;
}): Promise<PublicDetailReadResult<T>> {
  const visibility = await input.verifyVisibility();
  if (visibility.status === "UNAVAILABLE") {
    return { status: "VISIBILITY_UNAVAILABLE" };
  }
  if (visibility.status === "NOT_PUBLIC") {
    return { status: "NOT_FOUND" };
  }

  try {
    const cacheResult = await input.adapter.read({
      key: createPublicCacheKey({
        cacheClass: "detail",
        contentIdentity: visibility.contentIdentity,
        representationVersion: PUBLIC_DETAIL_REPRESENTATION_VERSION,
        publicationVersion: visibility.publicationVersion,
        localeCode: input.localeCode,
        authorizationClass: PUBLIC_AUTHORIZATION_CLASS,
      }),
      tags: publicDetailTags(
        visibility.contentIdentity,
        input.localeCode,
      ),
      ttlSeconds: PUBLIC_CACHE_FRESHNESS_SECONDS.detail,
      load: () => input.loadFresh(visibility),
    });
    return {
      status: "FOUND",
      value: cacheResult.value,
      cacheSource: cacheResult.source,
    };
  } catch {
    return { status: "CACHE_ERROR" };
  }
}

export async function readPublicDiscovery<T>(input: {
  adapter: PublicCacheAdapter;
  contentIdentity: string;
  publicationVersion: string;
  localeCode: string;
  loadFresh: () => Promise<T>;
  verifyCachedVisibility: (
    value: T,
  ) => Promise<"PUBLIC" | "NOT_PUBLIC" | "UNAVAILABLE">;
}): Promise<PublicDiscoveryReadResult<T>> {
  try {
    const cacheResult = await input.adapter.read({
      key: createPublicCacheKey({
        cacheClass: "discovery",
        contentIdentity: input.contentIdentity,
        representationVersion: PUBLIC_DISCOVERY_REPRESENTATION_VERSION,
        publicationVersion: input.publicationVersion,
        localeCode: input.localeCode,
        authorizationClass: PUBLIC_AUTHORIZATION_CLASS,
      }),
      tags: publicDiscoveryTags(input.contentIdentity),
      ttlSeconds: PUBLIC_CACHE_FRESHNESS_SECONDS.discovery,
      load: input.loadFresh,
    });

    if (cacheResult.source === "cache") {
      const visibility = await input.verifyCachedVisibility(cacheResult.value);
      if (visibility === "UNAVAILABLE") {
        return { status: "VISIBILITY_UNAVAILABLE" };
      }
      if (visibility === "NOT_PUBLIC") {
        return { status: "VISIBILITY_DENIED" };
      }
    }

    return {
      status: "FOUND",
      value: cacheResult.value,
      cacheSource: cacheResult.source,
    };
  } catch {
    return { status: "CACHE_ERROR" };
  }
}

class PositiveLookup<T> extends Error {
  constructor(readonly value: T) {
    super("Positive lookup results must not enter the negative cache.");
  }
}

class UnavailableLookup extends Error {}

export async function readNegativeLookup<T>(input: {
  adapter: PublicCacheAdapter;
  slug: string;
  localeCode: string;
  lookup: () => Promise<NegativeLookupStoreResult<T>>;
}): Promise<NegativeLookupResult<T>> {
  try {
    const cacheResult = await input.adapter.read({
      key: createPublicCacheKey({
        cacheClass: "negative_lookup",
        contentIdentity: input.slug,
        representationVersion: PUBLIC_NEGATIVE_REPRESENTATION_VERSION,
        publicationVersion: "absence-window.v1",
        localeCode: input.localeCode,
        authorizationClass: PUBLIC_AUTHORIZATION_CLASS,
      }),
      tags: publicNegativeTags(input.slug),
      ttlSeconds: PUBLIC_CACHE_FRESHNESS_SECONDS.negativeLookup,
      load: async () => {
        const result = await input.lookup();
        if (result.status === "FOUND") {
          throw new PositiveLookup(result.value);
        }
        if (result.status === "UNAVAILABLE") {
          throw new UnavailableLookup();
        }
        return { status: "NOT_FOUND" as const };
      },
    });
    return {
      status: cacheResult.value.status,
      cacheSource: cacheResult.source,
    };
  } catch (error) {
    if (error instanceof PositiveLookup) {
      return { status: "FOUND", value: error.value as T };
    }
    if (error instanceof UnavailableLookup) {
      return { status: "LOOKUP_UNAVAILABLE" };
    }
    return { status: "CACHE_ERROR" };
  }
}

export function publicationInvalidationTags(
  event: PublicationInvalidationEvent,
) {
  const localeCodes = normalizedLocales(event.affectedLocaleCodes);
  if (!localeCodes) return [];

  return Object.freeze([
    "public:discovery",
    `public:resource:${fnv1a64(event.resourceId)}`,
    `public:negative:${fnv1a64(event.slug)}`,
    ...localeCodes.map(
      (localeCode) =>
        `public:resource:${fnv1a64(event.resourceId)}:locale:${fnv1a64(localeCode)}`,
    ),
  ]);
}

export function isPublicationInvalidationEvent(
  value: unknown,
): value is PublicationInvalidationEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  if (
    !exactKeys(event, [
      "schemaVersion",
      "eventId",
      "eventKind",
      "committedAt",
      "resourceId",
      "slug",
      "affectedLocaleCodes",
    ])
    || event.schemaVersion !== "publication-invalidation.v1"
    || typeof event.eventId !== "string"
    || !EVENT_ID_PATTERN.test(event.eventId)
    || ![
      "create",
      "publish",
      "update",
      "unpublish",
      "visibility_restrict",
    ].includes(String(event.eventKind))
    || typeof event.committedAt !== "string"
    || normalizedTimestamp(event.committedAt) !== event.committedAt
    || typeof event.resourceId !== "string"
    || !isBoundedField(event.resourceId)
    || typeof event.slug !== "string"
    || !isBoundedField(event.slug)
    || !Array.isArray(event.affectedLocaleCodes)
    || !normalizedLocales(
      event.affectedLocaleCodes.filter(
        (localeCode): localeCode is string => typeof localeCode === "string",
      ),
    )
    || event.affectedLocaleCodes.some(
      (localeCode) => typeof localeCode !== "string",
    )
  ) {
    return false;
  }
  return true;
}

export async function executePublicationInvalidation(
  value: unknown,
  adapter: PublicationInvalidationAdapter,
): Promise<PublicationInvalidationResult> {
  if (!isPublicationInvalidationEvent(value)) {
    return { status: "INVALID_EVENT", tags: [] };
  }
  const tags = publicationInvalidationTags(value);
  try {
    if (await adapter.wasApplied(value.eventId)) {
      await adapter.observe({
        eventId: value.eventId,
        outcome: "DUPLICATE",
        tagCount: tags.length,
      });
      return { status: "DUPLICATE", tags };
    }
    await adapter.invalidateTags(tags);
    await adapter.observe({
      eventId: value.eventId,
      outcome: "APPLIED",
      tagCount: tags.length,
    });
    await adapter.markApplied(value.eventId);
    return { status: "APPLIED", tags };
  } catch {
    try {
      await adapter.observe({
        eventId: value.eventId,
        outcome: "RETRY_REQUIRED",
        tagCount: tags.length,
      });
    } catch {
      // Observability failure must not convert a retryable invalidation into success.
    }
    return { status: "RETRY_REQUIRED", tags };
  }
}