import { getLearnerLocale } from "@/lib/learnerLocaleRegistry";

const VOCABULARY_PUBLIC_ID_PATTERN = /^vocab_[a-f0-9]{64}$/u;
const SEARCH_PROJECTION_CONTRACT = "K1B_VOCABULARY_PUBLIC_PROJECTION_V1";
const MAX_QUERY_LENGTH = 80;
const RESULT_LIMIT = 30;

type JsonObject = Record<string, unknown>;

export type VocabularySearchItem = {
  publicId: string;
  displayForm: string;
  pronunciation: string;
  learnerSummary: string;
  partOfSpeechCode: string | null;
  contentLocale: string;
};

export type VocabularySearchResult =
  | { status: "EMPTY"; query: ""; items: [] }
  | { status: "FOUND"; query: string; items: VocabularySearchItem[] }
  | { status: "INVALID_INPUT" | "DATABASE_ERROR"; query: string; items: [] };

const asObject = (value: unknown): JsonObject | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const stringValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

function parseSearchItem(value: unknown): VocabularySearchItem | null {
  const row = asObject(value);
  if (!row) return null;

  const publicId = stringValue(row.public_id);
  const displayForm = stringValue(row.display_form);
  const pronunciation = stringValue(row.pronunciation);
  const learnerSummary = stringValue(row.learner_summary);
  const contentLocale = stringValue(row.content_locale);

  if (
    !publicId
    || !VOCABULARY_PUBLIC_ID_PATTERN.test(publicId)
    || !displayForm
    || !pronunciation
    || !learnerSummary
    || !contentLocale
  ) {
    return null;
  }

  return {
    publicId,
    displayForm,
    pronunciation,
    learnerSummary,
    partOfSpeechCode: stringValue(row.part_of_speech_code),
    contentLocale,
  };
}

export async function loadVocabularySearch(
  rawQuery: string | null | undefined,
  learnerLocaleCode?: string | null,
): Promise<VocabularySearchResult> {
  const query = rawQuery?.trim() ?? "";
  if (!query) return { status: "EMPTY", query: "", items: [] };
  if (query.length > MAX_QUERY_LENGTH) {
    return { status: "INVALID_INPUT", query, items: [] };
  }

  const learnerLocale = getLearnerLocale(learnerLocaleCode) ?? getLearnerLocale("en");
  if (!learnerLocale) return { status: "DATABASE_ERROR", query, items: [] };

  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.rpc("get_public_vocabulary_entries", {
      p_query: query,
      p_locale_code: learnerLocale.code,
      p_fallback_locale_code: learnerLocale.fallbackLocaleCode ?? "en",
      p_limit: RESULT_LIMIT,
      p_offset: 0,
    });

    if (error) return { status: "DATABASE_ERROR", query, items: [] };

    const payload = asObject(data);
    if (!payload || stringValue(payload.projection_contract) !== SEARCH_PROJECTION_CONTRACT) {
      return { status: "DATABASE_ERROR", query, items: [] };
    }

    const items = asArray(payload.items)
      .map(parseSearchItem)
      .filter((item): item is VocabularySearchItem => item !== null);

    return { status: "FOUND", query, items };
  } catch {
    return { status: "DATABASE_ERROR", query, items: [] };
  }
}
