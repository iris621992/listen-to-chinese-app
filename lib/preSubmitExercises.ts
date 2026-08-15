export const PRE_SUBMIT_SUPPORTED_LOCALES = ["en", "vi", "ar"] as const;

export type PreSubmitSupportedLocale = (typeof PRE_SUBMIT_SUPPORTED_LOCALES)[number];

export type PreSubmitExerciseOutcomeCode =
  | "FOUND"
  | "NOT_FOUND"
  | "UNAVAILABLE_LOCALE"
  | "EMPTY_EXERCISE_LIST"
  | "INVALID_INPUT"
  | "DEPENDENCY_UNAVAILABLE"
  | "DATABASE_ERROR";

export type PreSubmitExerciseOption = {
  id: string;
  text: string;
};

export type PreSubmitExerciseMedia = {
  id: string;
  type: string;
  url: string;
};

export type PreSubmitExercise = {
  id: string;
  type: string;
  question: string;
  localeCode: PreSubmitSupportedLocale;
  options: PreSubmitExerciseOption[];
  media: PreSubmitExerciseMedia[];
};

export type PreSubmitExercisesResult =
  | {
      outcomeCode: "FOUND";
      requestedLocaleCode: PreSubmitSupportedLocale;
      exercises: PreSubmitExercise[];
    }
  | {
      outcomeCode: Exclude<PreSubmitExerciseOutcomeCode, "FOUND">;
      requestedLocaleCode: PreSubmitSupportedLocale;
      exercises: [];
    };

const RPC_NAME = "get_lesson_pre_submit_exercises";
const MAX_SLUG_LENGTH = 200;
const WRAPPER_KEYS = ["outcome_code", "requested_locale_code", "exercises"] as const;
const EXERCISE_KEYS = ["exercise_id", "exercise_type", "prompt", "media", "options", "locale_code"] as const;
const OPTION_KEYS = ["option_id", "text"] as const;
const MEDIA_KEYS = ["media_id", "media_type", "url"] as const;
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
const MEDIA_TYPES = new Set(["audio", "image", "video", "other"]);
const RPC_OUTCOMES = new Set<PreSubmitExerciseOutcomeCode>([
  "FOUND",
  "NOT_FOUND",
  "UNAVAILABLE_LOCALE",
  "EMPTY_EXERCISE_LIST",
  "INVALID_INPUT",
  "DEPENDENCY_UNAVAILABLE",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, expectedKeys: readonly string[]) => {
  const actualKeys = Object.keys(value);
  return actualKeys.length === expectedKeys.length && expectedKeys.every((key) => actualKeys.includes(key));
};

const nonEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const safePublicUrl = (value: unknown) => {
  const raw = nonEmptyString(value);
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

export function normalizePreSubmitLocale(value: string | undefined): PreSubmitSupportedLocale | null {
  const normalized = value?.trim().toLowerCase();
  return PRE_SUBMIT_SUPPORTED_LOCALES.includes(normalized as PreSubmitSupportedLocale)
    ? (normalized as PreSubmitSupportedLocale)
    : null;
}

const parseOption = (value: unknown): PreSubmitExerciseOption | null => {
  if (!isRecord(value) || !hasExactKeys(value, OPTION_KEYS)) return null;

  const id = nonEmptyString(value.option_id);
  const text = nonEmptyString(value.text);
  return id && text ? { id, text } : null;
};

const parseMedia = (value: unknown): PreSubmitExerciseMedia | null => {
  if (!isRecord(value) || !hasExactKeys(value, MEDIA_KEYS)) return null;

  const id = nonEmptyString(value.media_id);
  const type = nonEmptyString(value.media_type);
  const url = safePublicUrl(value.url);
  return id && type && MEDIA_TYPES.has(type) && url ? { id, type, url } : null;
};

const parseExercise = (
  value: unknown,
  requestedLocaleCode: PreSubmitSupportedLocale,
): PreSubmitExercise | null => {
  if (!isRecord(value) || !hasExactKeys(value, EXERCISE_KEYS)) return null;

  const id = nonEmptyString(value.exercise_id);
  const type = nonEmptyString(value.exercise_type);
  const question = nonEmptyString(value.prompt);
  const localeCode = normalizePreSubmitLocale(nonEmptyString(value.locale_code) ?? undefined);

  if (!id || !type || !EXERCISE_TYPES.has(type) || !question || !localeCode) return null;
  if (localeCode !== requestedLocaleCode && localeCode !== "en") return null;
  if (!Array.isArray(value.options) || !Array.isArray(value.media)) return null;

  const options = value.options.map(parseOption);
  const media = value.media.map(parseMedia);
  if (options.some((option) => option === null) || media.some((item) => item === null)) return null;

  return {
    id,
    type,
    question,
    localeCode,
    options: options as PreSubmitExerciseOption[],
    media: media as PreSubmitExerciseMedia[],
  };
};

export function parsePreSubmitExerciseRpcData(
  data: unknown,
  expectedRequestedLocaleCode: PreSubmitSupportedLocale,
): PreSubmitExercisesResult | null {
  if (!Array.isArray(data) || data.length !== 1) return null;

  const wrapper = data[0];
  if (!isRecord(wrapper) || !hasExactKeys(wrapper, WRAPPER_KEYS)) return null;

  const outcomeCode = nonEmptyString(wrapper.outcome_code);
  const requestedLocaleCode = normalizePreSubmitLocale(
    nonEmptyString(wrapper.requested_locale_code) ?? undefined,
  );

  if (!outcomeCode || !RPC_OUTCOMES.has(outcomeCode as PreSubmitExerciseOutcomeCode)) return null;
  if (!requestedLocaleCode || requestedLocaleCode !== expectedRequestedLocaleCode) return null;
  if (!Array.isArray(wrapper.exercises)) return null;

  const exercises = wrapper.exercises.map((exercise) =>
    parseExercise(exercise, requestedLocaleCode),
  );
  if (exercises.some((exercise) => exercise === null)) return null;

  if (outcomeCode === "FOUND") {
    if (exercises.length === 0) return null;
    return {
      outcomeCode,
      requestedLocaleCode,
      exercises: exercises as PreSubmitExercise[],
    };
  }

  if (exercises.length !== 0) return null;
  return {
    outcomeCode: outcomeCode as Exclude<PreSubmitExerciseOutcomeCode, "FOUND">,
    requestedLocaleCode,
    exercises: [],
  };
}

export async function loadPreSubmitExercises(
  lessonSlug: string,
  requestedLocale: string | undefined,
): Promise<PreSubmitExercisesResult> {
  const normalizedSlug = lessonSlug.trim();
  const requestedLocaleCode = normalizePreSubmitLocale(requestedLocale);

  if (
    normalizedSlug.length === 0 ||
    normalizedSlug.length > MAX_SLUG_LENGTH ||
    !requestedLocaleCode
  ) {
    return {
      outcomeCode: "INVALID_INPUT",
      requestedLocaleCode: requestedLocaleCode ?? "en",
      exercises: [],
    };
  }

  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.rpc(RPC_NAME, {
      p_lesson_slug: normalizedSlug,
      p_locale_code: requestedLocaleCode,
    });

    if (error) {
      return {
        outcomeCode: "DATABASE_ERROR",
        requestedLocaleCode,
        exercises: [],
      };
    }

    const parsed = parsePreSubmitExerciseRpcData(data, requestedLocaleCode);
    if (parsed) return parsed;

    return {
      outcomeCode: "DEPENDENCY_UNAVAILABLE",
      requestedLocaleCode,
      exercises: [],
    };
  } catch {
    return {
      outcomeCode: "DATABASE_ERROR",
      requestedLocaleCode,
      exercises: [],
    };
  }
}
