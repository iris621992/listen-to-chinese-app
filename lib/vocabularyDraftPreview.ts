import type {
  VocabularyClassifier,
  VocabularyCollocation,
  VocabularyDetail,
  VocabularyExample,
  VocabularyForm,
  VocabularyPronunciation,
  VocabularyQuickDistinction,
  VocabularyQuickDistinctionContrastExample,
  VocabularyReadingItem,
  VocabularyTranslationEquivalent,
} from "@/lib/vocabularyDetail";

type JsonObject = Record<string, unknown>;

const K1F_PROJECTION_CONTRACT =
  "K1F_VOCABULARY_LOCALIZED_DETAIL_PUBLIC_PROJECTION_V1";

const asObject = (value: unknown): JsonObject | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const stringValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const booleanValue = (value: unknown): boolean => value === true;

const stringArray = (value: unknown): string[] =>
  asArray(value)
    .map(stringValue)
    .filter((item): item is string => item !== null);

function parseTranslationEquivalent(
  value: unknown,
  fallbackId: string,
): VocabularyTranslationEquivalent | null {
  const row = asObject(value);
  if (!row) return null;
  const expression = stringValue(row.expression);
  const localeCode = stringValue(row.locale_code) ?? stringValue(row.content_locale);
  const equivalenceProfile = stringValue(row.equivalence_profile);
  if (!expression || !localeCode || !equivalenceProfile) return null;

  return {
    publicId: stringValue(row.public_id) ?? fallbackId,
    localeCode,
    expression,
    equivalenceProfile,
    contextRestriction: stringValue(row.context_restriction),
    mismatchNote: stringValue(row.mismatch_note),
    preferenceStatus: stringValue(row.preference_status),
    directionality: stringValue(row.directionality),
  };
}

function parseCollocation(
  value: unknown,
  readingItemPublicId: string,
  fallbackId: string,
): VocabularyCollocation | null {
  const row = asObject(value);
  if (!row) return null;
  const expression = stringValue(row.expression);
  const collocationType = stringValue(row.collocation_type);
  if (!expression || !collocationType) return null;

  return {
    publicId: stringValue(row.public_id) ?? fallbackId,
    readingItemPublicId,
    expression,
    collocationType,
    learnerMeaning: stringValue(row.learner_meaning),
    contentLocale: stringValue(row.content_locale),
  };
}

function parseClassifier(
  value: unknown,
  readingItemPublicId: string,
  fallbackId: string,
): VocabularyClassifier | null {
  const row = asObject(value);
  if (!row) return null;
  const expression =
    stringValue(row.expression) ?? stringValue(row.classifier_text);
  if (!expression) return null;

  return {
    publicId: stringValue(row.public_id) ?? fallbackId,
    readingItemPublicId,
    expression,
    learnerNote: stringValue(row.learner_note),
    contentLocale: stringValue(row.content_locale),
  };
}

function parseExample(
  value: unknown,
  readingItemPublicId: string,
  fallbackId: string,
): VocabularyExample | null {
  const row = asObject(value);
  if (!row) return null;
  const chineseText = stringValue(row.chinese_text);
  if (!chineseText) return null;

  return {
    publicId: stringValue(row.public_id) ?? fallbackId,
    readingItemPublicId,
    chineseText,
    pinyinText: stringValue(row.pinyin_text),
    translationText: stringValue(row.translation_text),
    contentLocale: stringValue(row.content_locale),
  };
}

function parseContrastExample(
  value: unknown,
): VocabularyQuickDistinctionContrastExample | null {
  const row = asObject(value);
  if (!row) return null;
  const sourceExpression = stringValue(row.source_expression);
  const targetExpression = stringValue(row.target_expression);
  return sourceExpression && targetExpression
    ? { sourceExpression, targetExpression }
    : null;
}

function parseQuickDistinction(
  value: unknown,
  readingItemPublicId: string,
  fallbackId: string,
): VocabularyQuickDistinction | null {
  const row = asObject(value);
  if (!row) return null;
  const targetExpression = stringValue(row.target_expression);
  if (!targetExpression) return null;

  return {
    publicId: stringValue(row.public_id) ?? fallbackId,
    readingItemPublicId,
    targetExpression,
    learnerExplanation: stringValue(row.learner_explanation),
    sourceUseWhen: stringValue(row.source_use_when),
    targetUseWhen: stringValue(row.target_use_when),
    contrastExamples: asArray(row.contrast_examples)
      .map(parseContrastExample)
      .filter(
        (item): item is VocabularyQuickDistinctionContrastExample =>
          item !== null,
      ),
    contentLocale: stringValue(row.content_locale),
  };
}

function parseReadingItem(
  value: unknown,
  pronunciationIndex: number,
  itemIndex: number,
): VocabularyReadingItem | null {
  const row = asObject(value);
  if (!row) return null;

  const publicId =
    stringValue(row.public_id)
    ?? `preview-ri:${pronunciationIndex}:${itemIndex}`;
  const itemType = stringValue(row.item_type);
  const contentLocale = stringValue(row.content_locale);
  const explanation = asObject(row.learner_explanation);

  if (!itemType || !contentLocale || !explanation) return null;

  const translationEquivalents = asArray(row.translation_equivalents)
    .map((item, index) =>
      parseTranslationEquivalent(
        item,
        `preview-te:${pronunciationIndex}:${itemIndex}:${index}`,
      ),
    )
    .filter(
      (item): item is VocabularyTranslationEquivalent => item !== null,
    );

  const collocations = asArray(row.collocations)
    .map((item, index) =>
      parseCollocation(
        item,
        publicId,
        `preview-collocation:${pronunciationIndex}:${itemIndex}:${index}`,
      ),
    )
    .filter((item): item is VocabularyCollocation => item !== null);

  const classifiers = asArray(row.classifiers)
    .map((item, index) =>
      parseClassifier(
        item,
        publicId,
        `preview-classifier:${pronunciationIndex}:${itemIndex}:${index}`,
      ),
    )
    .filter((item): item is VocabularyClassifier => item !== null);

  const examples = asArray(row.examples)
    .map((item, index) =>
      parseExample(
        item,
        publicId,
        `preview-example:${pronunciationIndex}:${itemIndex}:${index}`,
      ),
    )
    .filter((item): item is VocabularyExample => item !== null);

  const quickDistinctions = asArray(row.quick_distinctions)
    .map((item, index) =>
      parseQuickDistinction(
        item,
        publicId,
        `preview-distinction:${pronunciationIndex}:${itemIndex}:${index}`,
      ),
    )
    .filter((item): item is VocabularyQuickDistinction => item !== null);

  return {
    publicId,
    parentPublicId: stringValue(row.parent_public_id),
    itemType,
    usageType: stringValue(row.usage_type),
    isSubsense:
      booleanValue(row.is_subsense) || Boolean(stringValue(row.parent_public_id)),
    partOfSpeechCode: stringValue(row.part_of_speech_code),
    registerCode: stringValue(row.register_code),
    domainCode: stringValue(row.domain_code),
    regionProfileCode: stringValue(row.region_profile_code),
    contentLocale,
    shortLabel: stringValue(explanation.short_label),
    fullExplanation: stringValue(explanation.full_explanation),
    usageNote: stringValue(explanation.usage_note),
    memoryTip: stringValue(explanation.memory_tip),
    translationEquivalents,
    collocations,
    classifiers,
    examples,
    quickDistinctions,
  };
}

function parsePronunciation(
  value: unknown,
  pronunciationIndex: number,
): VocabularyPronunciation | null {
  const row = asObject(value);
  if (!row) return null;
  const pronunciation = stringValue(row.pronunciation);
  if (!pronunciation) return null;

  const publicId =
    stringValue(row.public_id) ?? `preview-pron:${pronunciationIndex}`;

  return {
    publicId,
    pronunciation,
    pronunciationSystemCode: stringValue(row.pronunciation_system_code),
    readingStatus: stringValue(row.reading_status),
    isDefault: booleanValue(row.is_default),
    applicableFormPublicIds: stringArray(row.applicable_form_public_ids),
    readingItems: asArray(row.reading_items)
      .map((item, index) =>
        parseReadingItem(item, pronunciationIndex, index),
      )
      .filter((item): item is VocabularyReadingItem => item !== null),
  };
}

function parseForm(value: unknown, index: number): VocabularyForm | null {
  const row = asObject(value);
  if (!row) return null;
  const text = stringValue(row.text);
  const formType = stringValue(row.form_type);
  if (!text || !formType) return null;

  return {
    publicId: stringValue(row.public_id) ?? `preview-form:${index}`,
    text,
    formType,
    formStatus: stringValue(row.form_status),
    isPrimary: booleanValue(row.is_primary),
    scriptProfileCode: stringValue(row.script_profile_code),
    scriptVariantCode: stringValue(row.script_variant_code),
  };
}

export function parseVocabularyDraftPreviewPayload(
  value: unknown,
): VocabularyDetail | null {
  const payload = asObject(value);
  if (
    !payload
    || payload.preview_only !== true
    || stringValue(payload.projection_contract) !== K1F_PROJECTION_CONTRACT
  ) {
    return null;
  }

  const entry = asObject(payload.entry);
  if (!entry) return null;

  const displayForm = stringValue(entry.display_form);
  const entryKind = stringValue(entry.entry_kind);
  const requestedLocale = stringValue(payload.requested_locale);
  const fallbackLocale = stringValue(payload.fallback_locale);

  if (!displayForm || !entryKind || !requestedLocale || !fallbackLocale) {
    return null;
  }

  const forms = asArray(entry.forms)
    .map(parseForm)
    .filter((item): item is VocabularyForm => item !== null);

  const pronunciations = asArray(entry.pronunciations)
    .map(parsePronunciation)
    .filter((item): item is VocabularyPronunciation => item !== null);

  if (forms.length === 0 || pronunciations.length === 0) return null;

  const readingItemIds = new Set(
    pronunciations.flatMap((pronunciation) =>
      pronunciation.readingItems.map((item) => item.publicId),
    ),
  );

  const hasOrphan = pronunciations.some((pronunciation) =>
    pronunciation.readingItems.some(
      (item) =>
        item.parentPublicId !== null
        && !readingItemIds.has(item.parentPublicId),
    ),
  );
  if (hasOrphan) return null;

  const hanVietRow = asObject(entry.han_viet);
  const hanVietText = hanVietRow ? stringValue(hanVietRow.text) : null;
  const hanVietLocale = hanVietRow
    ? stringValue(hanVietRow.content_locale)
    : null;

  return {
    publicId: "draft-preview",
    displayForm,
    entryKind,
    languageVarietyCode: stringValue(entry.language_variety_code),
    regionProfileCode: stringValue(entry.region_profile_code),
    requestedLocale,
    fallbackLocale,
    hanViet:
      hanVietText && hanVietLocale
        ? { text: hanVietText, contentLocale: hanVietLocale }
        : null,
    forms,
    pronunciations,
  };
}
