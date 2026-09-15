import { getLearnerLocale } from "@/lib/learnerLocaleRegistry";

const VOCABULARY_PUBLIC_ID_PATTERN = /^vocab_[a-f0-9]{64}$/u;
const K1D_PROJECTION_CONTRACT = "K1D_VOCABULARY_RICH_SUPPORT_PUBLIC_PROJECTION_V1";
const K1C_PROJECTION_CONTRACT = "K1C_VOCABULARY_TE_PUBLIC_PROJECTION_V1";

type JsonObject = Record<string, unknown>;

export type VocabularyForm = {
  publicId: string;
  text: string;
  formType: string;
  formStatus: string | null;
  isPrimary: boolean;
  scriptProfileCode: string | null;
  scriptVariantCode: string | null;
};

export type VocabularyTranslationEquivalent = {
  publicId: string;
  localeCode: string;
  expression: string;
  equivalenceProfile: string;
  contextRestriction: string | null;
  mismatchNote: string | null;
  preferenceStatus: string | null;
  directionality: string | null;
};

export type VocabularyCollocation = {
  publicId: string;
  readingItemPublicId: string;
  expression: string;
  collocationType: string;
};

export type VocabularyClassifier = {
  publicId: string;
  readingItemPublicId: string;
  expression: string;
  learnerNote: string | null;
  contentLocale: string | null;
};

export type VocabularyExample = {
  publicId: string;
  readingItemPublicId: string;
  chineseText: string;
  pinyinText: string | null;
  translationText: string | null;
  contentLocale: string | null;
};

export type VocabularyQuickDistinction = {
  publicId: string;
  readingItemPublicId: string;
  targetExpression: string;
  learnerExplanation: string;
  contentLocale: string;
};

export type VocabularyReadingItem = {
  publicId: string;
  parentPublicId: string | null;
  itemType: string;
  usageType: string | null;
  isSubsense: boolean;
  partOfSpeechCode: string | null;
  registerCode: string | null;
  domainCode: string | null;
  regionProfileCode: string | null;
  contentLocale: string;
  shortLabel: string | null;
  fullExplanation: string | null;
  usageNote: string | null;
  memoryTip: string | null;
  translationEquivalents: VocabularyTranslationEquivalent[];
  collocations: VocabularyCollocation[];
  classifiers: VocabularyClassifier[];
  examples: VocabularyExample[];
  quickDistinctions: VocabularyQuickDistinction[];
};

export type VocabularyPronunciation = {
  publicId: string;
  pronunciation: string;
  pronunciationSystemCode: string | null;
  readingStatus: string | null;
  isDefault: boolean;
  applicableFormPublicIds: string[];
  readingItems: VocabularyReadingItem[];
};

export type VocabularyDetail = {
  publicId: string;
  displayForm: string;
  entryKind: string;
  languageVarietyCode: string | null;
  regionProfileCode: string | null;
  requestedLocale: string;
  fallbackLocale: string;
  forms: VocabularyForm[];
  pronunciations: VocabularyPronunciation[];
};

export type VocabularyDetailLoadResult =
  | { status: "FOUND"; detail: VocabularyDetail }
  | { status: "NOT_FOUND" | "INVALID_INPUT" | "DATABASE_ERROR" };

const asObject = (value: unknown): JsonObject | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const stringValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const booleanValue = (value: unknown): boolean => value === true;

const stringArray = (value: unknown): string[] =>
  asArray(value)
    .map(stringValue)
    .filter((item): item is string => item !== null);

function exactRiOwner(row: JsonObject, expected: string): string | null {
  const owner = stringValue(row.reading_item_public_id);
  return owner === expected ? owner : null;
}

function parseTranslationEquivalent(value: unknown): VocabularyTranslationEquivalent | null {
  const row = asObject(value);
  if (!row) return null;
  const publicId = stringValue(row.public_id);
  const localeCode = stringValue(row.locale_code);
  const expression = stringValue(row.expression);
  const equivalenceProfile = stringValue(row.equivalence_profile);
  if (!publicId || !localeCode || !expression || !equivalenceProfile) return null;
  return {
    publicId,
    localeCode,
    expression,
    equivalenceProfile,
    contextRestriction: stringValue(row.context_restriction),
    mismatchNote: stringValue(row.mismatch_note),
    preferenceStatus: stringValue(row.preference_status),
    directionality: stringValue(row.directionality),
  };
}

function parseCollocation(value: unknown, readingItemPublicId: string): VocabularyCollocation | null {
  const row = asObject(value);
  if (!row) return null;
  const publicId = stringValue(row.public_id);
  const owner = exactRiOwner(row, readingItemPublicId);
  const expression = stringValue(row.expression);
  const collocationType = stringValue(row.collocation_type);
  if (!publicId || !owner || !expression || !collocationType) return null;
  return { publicId, readingItemPublicId: owner, expression, collocationType };
}

function parseClassifier(value: unknown, readingItemPublicId: string): VocabularyClassifier | null {
  const row = asObject(value);
  if (!row) return null;
  const publicId = stringValue(row.public_id);
  const owner = exactRiOwner(row, readingItemPublicId);
  const expression = stringValue(row.expression);
  if (!publicId || !owner || !expression) return null;
  return {
    publicId,
    readingItemPublicId: owner,
    expression,
    learnerNote: stringValue(row.learner_note),
    contentLocale: stringValue(row.content_locale),
  };
}

function parseExample(value: unknown, readingItemPublicId: string): VocabularyExample | null {
  const row = asObject(value);
  if (!row) return null;
  const publicId = stringValue(row.public_id);
  const owner = exactRiOwner(row, readingItemPublicId);
  const chineseText = stringValue(row.chinese_text);
  if (!publicId || !owner || !chineseText) return null;
  return {
    publicId,
    readingItemPublicId: owner,
    chineseText,
    pinyinText: stringValue(row.pinyin_text),
    translationText: stringValue(row.translation_text),
    contentLocale: stringValue(row.content_locale),
  };
}

function parseQuickDistinction(value: unknown, readingItemPublicId: string): VocabularyQuickDistinction | null {
  const row = asObject(value);
  if (!row) return null;
  const publicId = stringValue(row.public_id);
  const owner = exactRiOwner(row, readingItemPublicId);
  const targetExpression = stringValue(row.target_expression);
  const learnerExplanation = stringValue(row.learner_explanation);
  const contentLocale = stringValue(row.content_locale);
  if (!publicId || !owner || !targetExpression || !learnerExplanation || !contentLocale) return null;
  return {
    publicId,
    readingItemPublicId: owner,
    targetExpression,
    learnerExplanation,
    contentLocale,
  };
}

function parseReadingItem(value: unknown, richSupportEnabled: boolean): VocabularyReadingItem | null {
  const row = asObject(value);
  if (!row) return null;
  const publicId = stringValue(row.public_id);
  const itemType = stringValue(row.item_type);
  const contentLocale = stringValue(row.content_locale);
  const explanation = asObject(row.learner_explanation);
  if (!publicId || !itemType || !contentLocale || !explanation) return null;

  return {
    publicId,
    parentPublicId: stringValue(row.parent_public_id),
    itemType,
    usageType: stringValue(row.usage_type),
    isSubsense: booleanValue(row.is_subsense),
    partOfSpeechCode: stringValue(row.part_of_speech_code),
    registerCode: stringValue(row.register_code),
    domainCode: stringValue(row.domain_code),
    regionProfileCode: stringValue(row.region_profile_code),
    contentLocale,
    shortLabel: stringValue(explanation.short_label),
    fullExplanation: stringValue(explanation.full_explanation),
    usageNote: stringValue(explanation.usage_note),
    memoryTip: stringValue(explanation.memory_tip),
    translationEquivalents: asArray(row.translation_equivalents)
      .map(parseTranslationEquivalent)
      .filter((item): item is VocabularyTranslationEquivalent => item !== null),
    collocations: richSupportEnabled
      ? asArray(row.collocations)
          .map((item) => parseCollocation(item, publicId))
          .filter((item): item is VocabularyCollocation => item !== null)
      : [],
    classifiers: richSupportEnabled
      ? asArray(row.classifiers)
          .map((item) => parseClassifier(item, publicId))
          .filter((item): item is VocabularyClassifier => item !== null)
      : [],
    examples: richSupportEnabled
      ? asArray(row.examples)
          .map((item) => parseExample(item, publicId))
          .filter((item): item is VocabularyExample => item !== null)
      : [],
    quickDistinctions: richSupportEnabled
      ? asArray(row.quick_distinctions)
          .map((item) => parseQuickDistinction(item, publicId))
          .filter((item): item is VocabularyQuickDistinction => item !== null)
      : [],
  };
}

function parsePronunciation(value: unknown, richSupportEnabled: boolean): VocabularyPronunciation | null {
  const row = asObject(value);
  if (!row) return null;
  const publicId = stringValue(row.public_id);
  const pronunciation = stringValue(row.pronunciation);
  if (!publicId || !pronunciation) return null;
  return {
    publicId,
    pronunciation,
    pronunciationSystemCode: stringValue(row.pronunciation_system_code),
    readingStatus: stringValue(row.reading_status),
    isDefault: booleanValue(row.is_default),
    applicableFormPublicIds: stringArray(row.applicable_form_public_ids),
    readingItems: asArray(row.reading_items)
      .map((item) => parseReadingItem(item, richSupportEnabled))
      .filter((item): item is VocabularyReadingItem => item !== null),
  };
}

function parseForm(value: unknown): VocabularyForm | null {
  const row = asObject(value);
  if (!row) return null;
  const publicId = stringValue(row.public_id);
  const text = stringValue(row.text);
  const formType = stringValue(row.form_type);
  if (!publicId || !text || !formType) return null;
  return {
    publicId,
    text,
    formType,
    formStatus: stringValue(row.form_status),
    isPrimary: booleanValue(row.is_primary),
    scriptProfileCode: stringValue(row.script_profile_code),
    scriptVariantCode: stringValue(row.script_variant_code),
  };
}

function parseVocabularyPayload(value: unknown): VocabularyDetail | null {
  const payload = asObject(value);
  if (!payload) return null;
  const contract = stringValue(payload.projection_contract);
  const richSupportEnabled = contract === K1D_PROJECTION_CONTRACT;
  if (!richSupportEnabled && contract !== K1C_PROJECTION_CONTRACT) return null;

  const entry = asObject(payload.entry);
  if (!entry) return null;

  const publicId = stringValue(entry.public_id);
  const displayForm = stringValue(entry.display_form);
  const entryKind = stringValue(entry.entry_kind);
  const requestedLocale = stringValue(payload.requested_locale);
  const fallbackLocale = stringValue(payload.fallback_locale);
  if (!publicId || !displayForm || !entryKind || !requestedLocale || !fallbackLocale) return null;

  const forms = asArray(entry.forms).map(parseForm).filter((item): item is VocabularyForm => item !== null);
  const pronunciations = asArray(entry.pronunciations)
    .map((item) => parsePronunciation(item, richSupportEnabled))
    .filter((item): item is VocabularyPronunciation => item !== null);
  if (forms.length === 0 || pronunciations.length === 0) return null;

  return {
    publicId,
    displayForm,
    entryKind,
    languageVarietyCode: stringValue(entry.language_variety_code),
    regionProfileCode: stringValue(entry.region_profile_code),
    requestedLocale,
    fallbackLocale,
    forms,
    pronunciations,
  };
}

function isMissingV3Rpc(error: unknown): boolean {
  const row = asObject(error);
  if (!row) return false;
  const code = stringValue(row.code);
  const message = stringValue(row.message) ?? "";
  return code === "PGRST202" || code === "42883" || message.includes("get_public_vocabulary_entry_v3");
}

export async function loadVocabularyDetail(
  publicId: string,
  learnerLocaleCode?: string | null,
): Promise<VocabularyDetailLoadResult> {
  if (!VOCABULARY_PUBLIC_ID_PATTERN.test(publicId)) return { status: "INVALID_INPUT" };

  const learnerLocale = getLearnerLocale(learnerLocaleCode) ?? getLearnerLocale("en");
  if (!learnerLocale) return { status: "DATABASE_ERROR" };

  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = createServerSupabaseClient();
    const args = {
      p_public_entry_id: publicId,
      p_locale_code: learnerLocale.code,
      p_fallback_locale_code: learnerLocale.fallbackLocaleCode ?? "en",
    };

    const v3 = await supabase.rpc("get_public_vocabulary_entry_v3", args);
    let data = v3.data;
    let error = v3.error;

    if (error && isMissingV3Rpc(error)) {
      const v2 = await supabase.rpc("get_public_vocabulary_entry_v2", args);
      data = v2.data;
      error = v2.error;
    }

    if (error) return { status: "DATABASE_ERROR" };
    const payload = asObject(data);
    if (!payload?.entry) return { status: "NOT_FOUND" };
    const detail = parseVocabularyPayload(data);
    return detail ? { status: "FOUND", detail } : { status: "DATABASE_ERROR" };
  } catch {
    return { status: "DATABASE_ERROR" };
  }
}
