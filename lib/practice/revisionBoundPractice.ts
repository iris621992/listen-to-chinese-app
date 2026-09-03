import type { PreSubmitExerciseOutcomeCode } from "@/lib/preSubmitExercises";

export type RevisionBoundPracticeOption = {
  id: string;
  text: string;
};

export type RevisionBoundPracticeMedia = {
  id: string;
  type: string;
  url: string;
};

export type RevisionBoundPracticeExercise = {
  id: string;
  type: string;
  question: string;
  localeCode: "en" | "vi" | "ar";
  options: RevisionBoundPracticeOption[];
  media: RevisionBoundPracticeMedia[];
};

export type RevisionBoundPracticeSession = {
  publicationRevisionId?: string;
  exercises: RevisionBoundPracticeExercise[];
  exerciseOutcomeCode: PreSubmitExerciseOutcomeCode;
  errors: string[];
};

const PUBLISHED_LESSON_RPC = "get_lesson_public_revision";
const SUPPORTED_LOCALES = new Set(["en", "vi", "ar"]);
const SUPPORTED_SCHEMA_VERSIONS = new Set([
  "lesson-public-snapshot.v1",
  "lesson-public-snapshot.v2",
]);
const EXERCISE_TYPES = new Set([
  "multiple_choice",
  "listening_choice",
  "fill_blank",
  "listen_type",
  "word_order",
  "matching",
  "true_false",
  "pinyin_choice",
  "meaning_choice",
]);
const MEDIA_TYPES = new Set([
  "youtube",
  "audio",
  "image",
  "video",
  "document",
  "other",
]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const FORBIDDEN_KEY_PATTERN =
  /^(?:answer|answer_json|is_correct|correctness|score|grading|grading_rule|hint|explanation|correct_answer_explanation|wrong_answer_explanation|review_notes|internal_notes|audit|secret|service_role|pair|pairs|correct_pair|correct_pairs|left_option_id|right_option_id)$/i;
const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024;
const MAX_EXERCISES = 100;
const MAX_OPTIONS = 50;
const MAX_MEDIA = 20;
const MAX_TRANSLATIONS = 32;

type JsonRecord = Record<string, unknown>;

type ParsedPresentation = {
  localeCode: string;
  prompt: string;
  options: RevisionBoundPracticeOption[];
};

type ParsedExercise = {
  id: string;
  type: string;
  sortOrder: number;
  presentations: Map<string, ParsedPresentation>;
  media: RevisionBoundPracticeMedia[];
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: JsonRecord, expected: readonly string[]) => {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
};

const boundedString = (value: unknown, max: number) => {
  if (typeof value !== "string" || value.length > max) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const validUuid = (value: unknown) =>
  typeof value === "string" && UUID_PATTERN.test(value) ? value : null;

const validTimestamp = (value: unknown) => {
  if (typeof value !== "string" || value.length > 64) return false;
  return Number.isFinite(Date.parse(value));
};

const safePublicUrl = (value: unknown) => {
  const raw = boundedString(value, 2048);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const rejectForbiddenKeys = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.every(rejectForbiddenKeys);
  if (!isRecord(value)) return true;
  return Object.entries(value).every(
    ([key, child]) => !FORBIDDEN_KEY_PATTERN.test(key) && rejectForbiddenKeys(child),
  );
};

const parseOption = (value: unknown): RevisionBoundPracticeOption | null => {
  if (!isRecord(value) || !hasExactKeys(value, ["option_id", "text"])) return null;
  const id = validUuid(value.option_id);
  const text = boundedString(value.text, 1000);
  return id && text ? { id, text } : null;
};

const parseMedia = (value: unknown): RevisionBoundPracticeMedia | null => {
  if (!isRecord(value) || !hasExactKeys(value, ["media_id", "media_type", "url"])) return null;
  const id = validUuid(value.media_id);
  const type = boundedString(value.media_type, 32);
  const url = safePublicUrl(value.url);
  return id && type && MEDIA_TYPES.has(type) && url ? { id, type, url } : null;
};

const parsePresentation = (value: unknown): ParsedPresentation | null => {
  if (!isRecord(value) || !hasExactKeys(value, ["locale_code", "prompt", "options"])) return null;
  const localeCode = boundedString(value.locale_code, 32);
  const prompt = boundedString(value.prompt, 4000);
  if (!localeCode || !prompt || !Array.isArray(value.options) || value.options.length > MAX_OPTIONS) {
    return null;
  }
  const options = value.options.map(parseOption);
  if (options.some((option) => option === null)) return null;
  const parsed = options as RevisionBoundPracticeOption[];
  if (new Set(parsed.map((option) => option.id)).size !== parsed.length) return null;
  return { localeCode, prompt, options: parsed };
};

const parseMatchingGroups = (value: unknown, optionIds: readonly string[]) => {
  if (!isRecord(value) || !hasExactKeys(value, ["left_option_ids", "right_option_ids"])) {
    return false;
  }
  const parseIds = (candidate: unknown) => {
    if (!Array.isArray(candidate) || candidate.length === 0 || candidate.length > MAX_OPTIONS) {
      return null;
    }
    const ids = candidate.map(validUuid);
    if (ids.some((id) => id === null)) return null;
    const parsed = ids as string[];
    return new Set(parsed).size === parsed.length ? parsed : null;
  };
  const left = parseIds(value.left_option_ids);
  const right = parseIds(value.right_option_ids);
  if (!left || !right || left.some((id) => right.includes(id))) return false;
  const actual = [...left, ...right].sort();
  const expected = [...optionIds].sort();
  return actual.length === expected.length
    && actual.every((id, index) => id === expected[index]);
};

const parseExercise = (value: unknown, schemaVersion: string): ParsedExercise | null => {
  if (!isRecord(value)) return null;
  const isV2 = schemaVersion === "lesson-public-snapshot.v2";
  const expectedKeys = isV2
    ? ["exercise_id", "exercise_type", "sort_order", "matching_groups", "presentations", "media"]
    : ["exercise_id", "exercise_type", "sort_order", "presentations", "media"];
  if (!hasExactKeys(value, expectedKeys)) return null;

  const id = validUuid(value.exercise_id);
  const type = boundedString(value.exercise_type, 64);
  const sortOrder = value.sort_order;
  if (!id || !type || !EXERCISE_TYPES.has(type) || !Number.isInteger(sortOrder)
      || !Array.isArray(value.presentations) || value.presentations.length > MAX_TRANSLATIONS
      || !Array.isArray(value.media) || value.media.length > MAX_MEDIA) {
    return null;
  }

  const presentations = value.presentations.map(parsePresentation);
  const media = value.media.map(parseMedia);
  if (presentations.some((item) => item === null) || media.some((item) => item === null)) return null;
  const parsedPresentations = presentations as ParsedPresentation[];
  if (new Set(parsedPresentations.map((item) => item.localeCode)).size !== parsedPresentations.length) return null;

  const optionIdSets = parsedPresentations.map((presentation) =>
    [...presentation.options.map((option) => option.id)].sort(),
  );
  const optionIds = optionIdSets[0] ?? [];
  if (optionIdSets.some((ids) => ids.length !== optionIds.length
      || ids.some((optionId, index) => optionId !== optionIds[index]))) {
    return null;
  }

  if (isV2) {
    if (type === "matching") {
      if (!parseMatchingGroups(value.matching_groups, optionIds)) return null;
    } else if (value.matching_groups !== null) {
      return null;
    }
  }

  return {
    id,
    type,
    sortOrder: sortOrder as number,
    presentations: new Map(parsedPresentations.map((item) => [item.localeCode, item])),
    media: media as RevisionBoundPracticeMedia[],
  };
};

export function parseRevisionBoundPracticeRpcData(
  data: unknown,
  expectedSlug: string,
  requestedLocale: string,
): RevisionBoundPracticeSession | null {
  if (!Array.isArray(data) || data.length !== 1 || !isRecord(data[0])) return null;
  const row = data[0];
  if (!hasExactKeys(row, [
    "outcome_code",
    "lesson_id",
    "revision_id",
    "resource_first_published_at",
    "revision_published_at",
    "payload",
    "payload_sha256",
  ])) return null;

  const outcomeCode = boundedString(row.outcome_code, 64);
  if (outcomeCode !== "FOUND") {
    if (!["NOT_FOUND", "INVALID_INPUT", "DEPENDENCY_UNAVAILABLE"].includes(outcomeCode ?? "")
        || row.lesson_id !== null || row.revision_id !== null || row.payload !== null
        || row.resource_first_published_at !== null || row.revision_published_at !== null
        || row.payload_sha256 !== null) {
      return null;
    }
    return {
      exercises: [],
      exerciseOutcomeCode: outcomeCode as PreSubmitExerciseOutcomeCode,
      errors: outcomeCode === "NOT_FOUND" ? [] : [`published_revision:${outcomeCode}`],
    };
  }

  const lessonId = validUuid(row.lesson_id);
  const revisionId = validUuid(row.revision_id);
  if (!lessonId || !revisionId || !validTimestamp(row.resource_first_published_at)
      || !validTimestamp(row.revision_published_at)
      || typeof row.payload_sha256 !== "string" || !SHA256_PATTERN.test(row.payload_sha256)
      || !isRecord(row.payload) || !rejectForbiddenKeys(row.payload)
      || Buffer.byteLength(JSON.stringify(row.payload), "utf8") > MAX_PAYLOAD_BYTES
      || !hasExactKeys(row.payload, ["schema_version", "lesson", "segments", "vocabulary", "exercises"])) {
    return null;
  }

  const schemaVersion = boundedString(row.payload.schema_version, 64);
  if (!schemaVersion || !SUPPORTED_SCHEMA_VERSIONS.has(schemaVersion)
      || !isRecord(row.payload.lesson)
      || validUuid(row.payload.lesson.id) !== lessonId
      || boundedString(row.payload.lesson.slug, 200) !== expectedSlug
      || !Array.isArray(row.payload.exercises)
      || row.payload.exercises.length > MAX_EXERCISES) {
    return null;
  }

  if (row.payload.exercises.length === 0) {
    return {
      publicationRevisionId: revisionId,
      exercises: [],
      exerciseOutcomeCode: "EMPTY_EXERCISE_LIST",
      errors: [],
    };
  }

  const parsedExercises = row.payload.exercises.map((exercise) =>
    parseExercise(exercise, schemaVersion),
  );
  if (parsedExercises.some((exercise) => exercise === null)) return null;

  const normalizedLocale = requestedLocale.trim().toLowerCase();
  if (!SUPPORTED_LOCALES.has(normalizedLocale)) return null;
  const exercises = (parsedExercises as ParsedExercise[])
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
    .flatMap((exercise) => {
      const presentation = exercise.presentations.get(normalizedLocale)
        ?? exercise.presentations.get("en");
      if (!presentation || !SUPPORTED_LOCALES.has(presentation.localeCode)) return [];
      return [{
        id: exercise.id,
        type: exercise.type,
        question: presentation.prompt,
        localeCode: presentation.localeCode as "en" | "vi" | "ar",
        options: presentation.options,
        media: exercise.media,
      }];
    });

  return {
    publicationRevisionId: revisionId,
    exercises,
    exerciseOutcomeCode: exercises.length > 0 ? "FOUND" : "UNAVAILABLE_LOCALE",
    errors: exercises.length > 0 ? [] : ["published_revision:UNAVAILABLE_LOCALE"],
  };
}

export async function loadRevisionBoundPracticeSession(
  lessonSlug: string,
  requestedLocale: string,
): Promise<RevisionBoundPracticeSession> {
  const normalizedSlug = lessonSlug.trim();
  const normalizedLocale = requestedLocale.trim().toLowerCase();
  if (normalizedSlug.length === 0 || normalizedSlug.length > 200
      || !SUPPORTED_LOCALES.has(normalizedLocale)) {
    return {
      exercises: [],
      exerciseOutcomeCode: "INVALID_INPUT",
      errors: ["published_revision:INVALID_INPUT"],
    };
  }

  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.rpc(PUBLISHED_LESSON_RPC, {
      p_lesson_slug: normalizedSlug,
      p_locale_code: normalizedLocale,
    });
    if (error) {
      return {
        exercises: [],
        exerciseOutcomeCode: "DATABASE_ERROR",
        errors: ["published_revision:unavailable"],
      };
    }

    return parseRevisionBoundPracticeRpcData(data, normalizedSlug, normalizedLocale)
      ?? {
        exercises: [],
        exerciseOutcomeCode: "DEPENDENCY_UNAVAILABLE",
        errors: ["published_revision:DEPENDENCY_UNAVAILABLE"],
      };
  } catch {
    return {
      exercises: [],
      exerciseOutcomeCode: "DATABASE_ERROR",
      errors: ["published_revision:unavailable"],
    };
  }
}
