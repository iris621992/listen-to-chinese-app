import { loadPreSubmitExercises, type PreSubmitExerciseOutcomeCode } from "@/lib/preSubmitExercises";
import {
  enabledLearnerLocaleCodes,
  getLearnerLocale,
  resolveLearnerLocale,
} from "@/lib/learnerLocaleRegistry";

export type Row = Record<string, unknown>;

export type SupabaseLanguage = {
  code: string;
  label: string;
  direction: "ltr" | "rtl";
};

export type SupabaseLessonSegment = {
  id: string;
  chineseText: string;
  phoneticText: string;
  translation: string | null;
};

export type SupabaseLessonOption = {
  id: string;
  text: string;
};

export type SupabaseLessonExerciseMedia = {
  id: string;
  type: string;
  url: string;
};

// Pre-submit exercise data is intentionally answer-free. Grading, attempts,
// correctness, hints, and explanations belong to a later bounded path.
export type SupabaseLessonExercise = {
  id: string;
  type: string;
  question: string;
  localeCode: "en" | "vi" | "ar";
  options: SupabaseLessonOption[];
  media: SupabaseLessonExerciseMedia[];
};

export type SupabaseLessonVocabularyItem = {
  id: string;
  chineseText: string;
  phoneticText: string | null;
  translation: string | null;
  partOfSpeech: string | null;
  example: string | null;
  exampleTranslation: string | null;
  usage: string | null;
  grammarPattern: string | null;
  synonyms: string | null;
  antonyms: string | null;
  usageNotes: string | null;
  writingGuidance: string | null;
};

export type SupabaseLessonContentType =
  | "video"
  | "reading"
  | "listening"
  | "practice_only"
  | "review_set";

export type SupabaseLessonDetail = {
  title: string;
  slug: string;
  publicationRevisionId?: string;
  contentType?: SupabaseLessonContentType;
  youtubeVideoId: string | null;
  youtubeUrl: string | null;
  languages: SupabaseLanguage[];
  selectedCode: string;
  selectedDirection: "ltr" | "rtl";
  segments: SupabaseLessonSegment[];
  vocabulary: SupabaseLessonVocabularyItem[];
  exercises: SupabaseLessonExercise[];
  exerciseOutcomeCode: PreSubmitExerciseOutcomeCode;
  errors: string[];
};

type SupabaseLessonCachedCore = Omit<
  SupabaseLessonDetail,
  "languages" | "selectedDirection" | "contentType"
>;

export type SupabaseLessonLoadResult =
  | { status: "FOUND"; lesson: SupabaseLessonDetail }
  | { status: "UNCONFIGURED" | "NOT_FOUND" | "INVALID_INPUT" | "DATABASE_ERROR" };

export type SupabaseLessonVocabularyLoadResult = {
  vocabulary: SupabaseLessonVocabularyItem[];
  exerciseOutcomeCode: PreSubmitExerciseOutcomeCode;
  errors: string[];
};

export type SupabaseLessonPracticeLoadResult = {
  publicationRevisionId?: string;
  exercises: SupabaseLessonExercise[];
  exerciseOutcomeCode: PreSubmitExerciseOutcomeCode;
  errors: string[];
};

const LANGUAGE_PROJECTION = "code,native_name,direction";
const LESSON_PROJECTION =
  "id,slug,title_original,title_support_default,content_type,youtube_id,status,quality_status,access_level,published_at,updated_at";
const LESSON_SEGMENT_PROJECTION = "id,sort_order,original_text,phonetic_text";
const SEGMENT_TRANSLATION_PROJECTION = "segment_id,language_code,translated_text";
const VOCABULARY_RELATIONAL_PROJECTION =
  "exercise_id,practice_target:practice_targets(id,target_type,name_original,phonetic_text,meaning_default,description,practice_target_translations(language_code,display_name,meaning))";
const MAX_DETAIL_SEGMENTS = 300;
const MAX_VOCABULARY_RELATION_ROWS = 300;
const LESSON_CONTENT_TYPES = new Set<SupabaseLessonContentType>([
  "video",
  "reading",
  "listening",
  "practice_only",
  "review_set",
]);

type QueryError = { message: string };
type QueryResult<T> = { data: T; error: QueryError | null };
type Dfp2FlowHooks = { beginRound?: () => void };

type DetailCoreFlowQueries = {
  loadLanguages: () => Promise<QueryResult<Row[] | null>>;
  loadLesson: () => Promise<QueryResult<Row | null>>;
  loadSegments: (lessonId: string | number) => Promise<QueryResult<Row[] | null>>;
  loadSegmentTranslations: (
    segmentIds: (string | number)[],
    selectedCode: string,
  ) => Promise<QueryResult<Row[] | null>>;
  resolveSelectedCode: (languages: Row[]) => string;
};

type VocabularyFlowQueries = {
  loadExercises: () => ReturnType<typeof loadPreSubmitExercises>;
  loadTargets: (exerciseIds: string[]) => Promise<QueryResult<Row[] | null>>;
};

export async function runDfp2DetailCoreFlow(
  queries: DetailCoreFlowQueries,
  hooks: Dfp2FlowHooks = {},
) {
  hooks.beginRound?.();
  const [languagesResult, lessonResult] = await Promise.all([
    queries.loadLanguages(),
    queries.loadLesson(),
  ]);

  const lessonId = idValue(lessonResult.data);
  if (lessonResult.error || lessonId === null) {
    return {
      languagesResult,
      lessonResult,
      segmentsResult: null,
      segmentTranslationsResult: null,
      segmentOverflow: false,
      translationOverflow: false,
    };
  }

  hooks.beginRound?.();
  const segmentsResult = await queries.loadSegments(lessonId);
  const segmentRows = (segmentsResult.data ?? []) as Row[];
  const segmentOverflow = segmentRows.length > MAX_DETAIL_SEGMENTS;
  const segmentIds = segmentRows
    .map(idValue)
    .filter((id): id is string | number => id !== null);
  if (segmentsResult.error || segmentOverflow || segmentIds.length === 0) {
    return {
      languagesResult,
      lessonResult,
      segmentsResult,
      segmentTranslationsResult: null,
      segmentOverflow,
      translationOverflow: false,
    };
  }

  hooks.beginRound?.();
  const selectedCode = queries.resolveSelectedCode(
    (languagesResult.data ?? []) as Row[],
  );
  const segmentTranslationsResult =
    await queries.loadSegmentTranslations(segmentIds, selectedCode);
  const translationOverflow =
    ((segmentTranslationsResult.data ?? []) as Row[]).length
    > MAX_DETAIL_SEGMENTS;
  return {
    languagesResult,
    lessonResult,
    segmentsResult,
    segmentTranslationsResult,
    segmentOverflow,
    translationOverflow,
  };
}

export async function runDfp2VocabularyFlow(
  queries: VocabularyFlowQueries,
  hooks: Dfp2FlowHooks = {},
) {
  hooks.beginRound?.();
  const exerciseResult = await queries.loadExercises();
  const exerciseIds = exerciseResult.exercises.map((exercise) => exercise.id);
  if (exerciseResult.outcomeCode !== "FOUND" || exerciseIds.length === 0) {
    return { exerciseResult, targetsResult: null, emptyExerciseIds: exerciseIds.length === 0 };
  }

  hooks.beginRound?.();
  const targetsResult = await queries.loadTargets(exerciseIds);
  return { exerciseResult, targetsResult, emptyExerciseIds: false };
}

export async function runDfp2PracticeFlow(
  loadExercises: () => ReturnType<typeof loadPreSubmitExercises>,
  hooks: Dfp2FlowHooks = {},
) {
  hooks.beginRound?.();
  return loadExercises();
}

export const isSupabaseLessonConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export const textValue = (row: Row | null | undefined, keys: string[]) => {
  if (!row) return null;

  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
    if (Array.isArray(value)) {
      const joinedValue = value
        .filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
        .join(", ");
      if (joinedValue.length > 0) return joinedValue;
    }
  }

  return null;
};

export const idValue = (row: Row | null | undefined) => {
  const value = row?.id;
  return typeof value === "string" || typeof value === "number" ? value : null;
};

export const sortNumber = (row: Row) => {
  const value = row.sort_order ?? row.order_index ?? row.position;
  return typeof value === "number" ? value : 0;
};

export const languageCode = (language: Row) =>
  textValue(language, ["code", "language_code", "locale"]) ?? "unknown";

export const languageDirection = (
  language: Row | null | undefined,
): "ltr" | "rtl" =>
  textValue(language, ["direction", "dir", "text_direction"]) === "rtl"
    ? "rtl"
    : "ltr";

export const languageLabel = (language: Row) => {
  const code = languageCode(language);
  const nativeName = textValue(language, [
    "native_name",
    "name_native",
    "local_name",
  ]);
  const englishName = textValue(language, [
    "english_name",
    "name_en",
    "name",
    "label",
  ]);

  return [code, nativeName, englishName].filter(Boolean).join(" · ");
};

export const rowMatchesLanguage = (
  row: Row,
  selectedCode: string,
  languageId: string | number | null,
) =>
  textValue(row, ["language_code", "locale", "lang_code", "code"])
    === selectedCode
  || (languageId !== null && row.language_id === languageId);

export const translationFor = (
  translations: Row[],
  parentKeys: string[],
  parentId: string | number | null,
  selectedCode: string,
  languageId: string | number | null,
) => {
  const byParent = translations.filter(
    (translation) =>
      parentId === null
      || parentKeys.some((key) => translation[key] === parentId),
  );

  return (
    byParent.find((translation) =>
      rowMatchesLanguage(translation, selectedCode, languageId),
    ) ?? null
  );
};

const recordValue = (value: unknown): Row | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : null;

const contentTypeValue = (value: unknown): SupabaseLessonContentType | null =>
  typeof value === "string"
    && LESSON_CONTENT_TYPES.has(value as SupabaseLessonContentType)
    ? value as SupabaseLessonContentType
    : null;

const youtubeIdFromUrl = (url: string | null) => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v")
        ?? parsed.pathname.split("/").pop()
        ?? null;
    }
  } catch {
    return null;
  }

  return null;
};

const normalizedLessonSlug = (slug: string) => {
  const normalized = slug.trim();
  return normalized.length > 0 && normalized.length <= 200 ? normalized : null;
};

const normalizedTimestamp = (value: string) => {
  if (value.length > 64) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

export async function getSupabaseLessonCore(
  slug: string,
  selectedCodeParam?: string,
): Promise<SupabaseLessonLoadResult> {
  if (!isSupabaseLessonConfigured) return { status: "UNCONFIGURED" };

  const normalizedSlug = normalizedLessonSlug(slug);
  if (!normalizedSlug) return { status: "INVALID_INPUT" };

  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const {
    isPublicationVisibleAt,
    nextPublicCacheAdapter,
    readNegativeLookup,
    readPublicDetail,
  } = await import("@/lib/publicContentCache");
  const supabase = createServerSupabaseClient();
  const requestedLocaleCode =
    getLearnerLocale(selectedCodeParam)?.code
    ?? enabledLearnerLocaleCodes[0]
    ?? "en";
  const visibilityAt = new Date().toISOString();
  const languagesPromise = Promise.resolve(
    supabase
      .from("languages")
      .select(LANGUAGE_PROJECTION)
      .eq("is_active", true)
      .in("code", [...enabledLearnerLocaleCodes])
      .order("code"),
  );
  const authorityLookup = await readNegativeLookup<Row>({
    adapter: nextPublicCacheAdapter,
    slug: normalizedSlug,
    localeCode: requestedLocaleCode,
    lookup: async () => {
      const result = await supabase
        .from("lessons")
        .select(LESSON_PROJECTION)
        .eq("slug", normalizedSlug)
        .eq("status", "published")
        .eq("quality_status", "published")
        .eq("access_level", "free")
        .not("published_at", "is", null)
        .lte("published_at", visibilityAt)
        .maybeSingle();
      if (result.error) return { status: "UNAVAILABLE" };
      if (!result.data) return { status: "NOT_FOUND" };
      return { status: "FOUND", value: result.data as Row };
    },
  });
  if (authorityLookup.status !== "FOUND") {
    return authorityLookup.status === "NOT_FOUND"
      ? { status: "NOT_FOUND" }
      : { status: "DATABASE_ERROR" };
  }

  const lesson = authorityLookup.value;
  const lessonId = idValue(lesson);
  const contentType = contentTypeValue(lesson.content_type);
  const publishedAt =
    typeof lesson.published_at === "string"
      ? normalizedTimestamp(lesson.published_at)
      : null;
  const publicationVersion =
    typeof lesson.updated_at === "string"
      ? normalizedTimestamp(lesson.updated_at)
      : null;
  if (
    lessonId === null
    || contentType === null
    || publicationVersion === null
    || lesson.status !== "published"
    || lesson.quality_status !== "published"
    || lesson.access_level !== "free"
    || publishedAt === null
  ) {
    return { status: "DATABASE_ERROR" };
  }
  if (!isPublicationVisibleAt(publishedAt, visibilityAt)) {
    return { status: "NOT_FOUND" };
  }

  const languagesResult = await languagesPromise;
  const languages = (languagesResult.data ?? []) as Row[];
  const localeResolution = resolveLearnerLocale(
    selectedCodeParam,
    languages.map((language) => languageCode(language)),
  );
  const selectedCode = localeResolution.resolvedCode;
  const cachedDetail = await readPublicDetail<SupabaseLessonCachedCore>({
    adapter: nextPublicCacheAdapter,
    localeCode: selectedCode,
    verifyVisibility: async () => ({
      status: "PUBLIC",
      contentIdentity: String(lessonId),
      publicationVersion,
    }),
    loadFresh: async () => {
      const errors: string[] = [];
      const flow = await runDfp2DetailCoreFlow({
        loadLanguages: async () => languagesResult,
        loadLesson: async () => ({ data: lesson, error: null }),
        loadSegments: async (id) =>
          supabase
            .from("lesson_segments")
            .select(LESSON_SEGMENT_PROJECTION)
            .eq("lesson_id", id)
            .order("sort_order")
            .limit(MAX_DETAIL_SEGMENTS + 1),
        loadSegmentTranslations: async (segmentIds, localeCode) =>
          supabase
            .from("segment_translations")
            .select(SEGMENT_TRANSLATION_PROJECTION)
            .in("segment_id", segmentIds)
            .eq("language_code", localeCode)
            .limit(MAX_DETAIL_SEGMENTS + 1),
        resolveSelectedCode: () => selectedCode,
      });

      if (flow.segmentOverflow || flow.translationOverflow) {
        throw new Error("Detail row budget exceeded.");
      }
      if (flow.segmentsResult?.error) {
        throw new Error("Lesson segments unavailable.");
      }
      if (flow.segmentTranslationsResult?.error) {
        throw new Error("Segment translations unavailable.");
      }
      const segmentRows = ((flow.segmentsResult?.data ?? []) as Row[]).sort(
        (left, right) => sortNumber(left) - sortNumber(right),
      );
      const segmentTranslations =
        (flow.segmentTranslationsResult?.data ?? []) as Row[];
      const youtubeUrl = textValue(lesson, [
        "youtube_url",
        "video_url",
        "source_url",
      ]);
      const youtubeVideoId =
        textValue(lesson, ["youtube_video_id", "youtube_id", "video_id"])
        ?? youtubeIdFromUrl(youtubeUrl);

      return {
        title:
          textValue(lesson, [
            "title_original",
            "title_support_default",
            "title",
            "name",
            "slug",
          ]) ?? "Untitled lesson",
        slug: normalizedSlug,
        youtubeVideoId,
        youtubeUrl,
        selectedCode,
        segments: segmentRows.map((segment, index) => {
          const segmentId = idValue(segment);
          const translation = translationFor(
            segmentTranslations,
            ["segment_id", "lesson_segment_id"],
            segmentId,
            selectedCode,
            null,
          );
          return {
            id: String(segmentId ?? index),
            chineseText:
              textValue(segment, [
                "chinese_text",
                "text_zh",
                "original_text",
                "text",
                "content",
              ]) ?? "No Chinese/default text.",
            phoneticText:
              textValue(segment, [
                "pinyin",
                "phonetic_text",
                "phonetic",
                "romanization",
              ]) ?? "No pinyin/phonetic text.",
            translation: textValue(translation, [
              "translation",
              "translated_text",
              "text",
              "content",
            ]),
          };
        }),
        vocabulary: [],
        exercises: [],
        exerciseOutcomeCode: "EMPTY_EXERCISE_LIST",
        errors,
      };
    },
  });
  if (cachedDetail.status !== "FOUND") {
    return { status: "DATABASE_ERROR" };
  }
  const languageErrors = languagesResult.error
    ? [`languages: ${languagesResult.error.message}`]
    : [];
  return {
    status: "FOUND",
    lesson: {
      ...cachedDetail.value,
      contentType,
      languages: languages.map((language) => ({
        code: languageCode(language),
        label: languageLabel(language),
        direction:
          getLearnerLocale(languageCode(language))?.direction
          ?? languageDirection(language),
      })),
      selectedDirection: localeResolution.direction,
      errors: [...cachedDetail.value.errors, ...languageErrors],
    },
  };
}

export async function getSupabaseLessonVocabulary(
  slug: string,
  selectedCode: string,
): Promise<SupabaseLessonVocabularyLoadResult> {
  const normalizedSlug = normalizedLessonSlug(slug);
  if (!normalizedSlug) {
    return {
      vocabulary: [],
      exerciseOutcomeCode: "INVALID_INPUT",
      errors: ["pre_submit_exercises:INVALID_INPUT"],
    };
  }

  try {
    const flow = await runDfp2VocabularyFlow({
      loadExercises: () =>
        loadPreSubmitExercises(normalizedSlug, selectedCode),
      loadTargets: async (exerciseIds) => {
        const { createServerSupabaseClient } =
          await import("@/lib/supabase/server");
        return createServerSupabaseClient()
          .from("exercise_targets")
          .select(VOCABULARY_RELATIONAL_PROJECTION)
          .in("exercise_id", exerciseIds)
          .eq(
            "practice_target.practice_target_translations.language_code",
            selectedCode,
          )
          .limit(MAX_VOCABULARY_RELATION_ROWS + 1);
      },
    });
    const errors: string[] = [];
    if (
      flow.exerciseResult.outcomeCode !== "FOUND"
      && flow.exerciseResult.outcomeCode !== "EMPTY_EXERCISE_LIST"
    ) {
      errors.push(
        `pre_submit_exercises:${flow.exerciseResult.outcomeCode}`,
      );
    }
    if (flow.targetsResult?.error) {
      errors.push("exercise_targets:unavailable");
    }

    const targetRows = (flow.targetsResult?.data ?? []) as Row[];
    if (targetRows.length > MAX_VOCABULARY_RELATION_ROWS) {
      return {
        vocabulary: [],
        exerciseOutcomeCode: "DEPENDENCY_UNAVAILABLE",
        errors: ["exercise_targets:row_budget_exceeded"],
      };
    }

    const orderedTargets = new Map<string, Row>();
    for (const row of targetRows) {
      const target = recordValue(row.practice_target);
      const targetId = idValue(target);
      if (target && targetId !== null && !orderedTargets.has(String(targetId))) {
        orderedTargets.set(String(targetId), target);
      }
    }

    const vocabulary = [...orderedTargets.values()]
      .filter((target) =>
        ["vocabulary", "word", "phrase", "fixed_phrase"].includes(
          textValue(target, ["target_type", "type", "kind"]) ?? "",
        ),
      )
      .map((target, index) => {
        const targetId = idValue(target);
        const translations = Array.isArray(
          target.practice_target_translations,
        )
          ? (target.practice_target_translations as Row[])
          : [];
        const translation =
          translations.find((row) =>
            rowMatchesLanguage(row, selectedCode, null),
          ) ?? null;
        return {
          id: String(targetId ?? index),
          chineseText:
            textValue(target, [
              "name_original",
              "chinese_text",
              "text_zh",
              "original_text",
              "word",
              "term",
              "text",
            ]) ?? "Missing vocabulary text.",
          phoneticText: textValue(target, [
            "phonetic_text",
            "pinyin",
            "phonetic",
            "romanization",
          ]),
          translation:
            textValue(translation, [
              "meaning",
              "display_name",
              "translation",
              "translated_text",
              "text",
              "content",
            ])
            ?? textValue(target, [
              "meaning_default",
              "meaning",
              "translation",
            ]),
          partOfSpeech: textValue(target, [
            "part_of_speech",
            "pos",
            "word_class",
          ]),
          example: textValue(target, [
            "example",
            "example_sentence",
            "sample_sentence",
            "description",
          ]),
          exampleTranslation: null,
          usage: textValue(target, [
            "usage",
            "how_to_use",
            "usage_explanation",
          ]),
          grammarPattern: textValue(target, [
            "related_grammar_pattern",
            "grammar_pattern",
            "pattern",
          ]),
          synonyms: textValue(target, ["synonyms", "synonym_text"]),
          antonyms: textValue(target, ["antonyms", "antonym_text"]),
          usageNotes: textValue(target, ["usage_notes", "notes", "note"]),
          writingGuidance: textValue(target, [
            "writing_guidance",
            "character_writing_guidance",
            "hanzi_guidance",
          ]),
        };
      });

    return {
      vocabulary,
      exerciseOutcomeCode: flow.exerciseResult.outcomeCode,
      errors,
    };
  } catch {
    return {
      vocabulary: [],
      exerciseOutcomeCode: "DATABASE_ERROR",
      errors: ["exercise_targets:unavailable"],
    };
  }
}

export async function getSupabaseLessonPractice(
  slug: string,
  selectedCode: string,
): Promise<SupabaseLessonPracticeLoadResult> {
  const normalizedSlug = normalizedLessonSlug(slug);
  if (!normalizedSlug) {
    return {
      exercises: [],
      exerciseOutcomeCode: "INVALID_INPUT",
      errors: ["published_revision:INVALID_INPUT"],
    };
  }

  try {
    const { loadRevisionBoundPracticeSession } = await import(
      "@/lib/practice/revisionBoundPractice"
    );
    return loadRevisionBoundPracticeSession(normalizedSlug, selectedCode);
  } catch {
    return {
      exercises: [],
      exerciseOutcomeCode: "DATABASE_ERROR",
      errors: ["published_revision:unavailable"],
    };
  }
}
