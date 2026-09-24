import type { VocabularyCharacterOccurrence } from "@/lib/vocabularyCharacterDelivery";
import type {
  VocabularyClassifier,
  VocabularyCollocation,
  VocabularyCommonMistake,
  VocabularyConstruction,
  VocabularyDetail,
  VocabularyExample,
  VocabularyForm,
  VocabularyKnowledgeLink,
  VocabularyPracticeLink,
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
    ? {
        sourceExpression,
        targetExpression,
        sourceTranslation: stringValue(row.source_translation),
        targetTranslation: stringValue(row.target_translation),
        contentLocale: stringValue(row.content_locale),
      }
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

function parseConstruction(
  value: unknown,
  readingItemPublicId: string,
  fallbackId: string,
): VocabularyConstruction | null {
  const row = asObject(value);
  if (!row) return null;
  const patternText = stringValue(row.pattern_text);
  if (!patternText) return null;
  return {
    publicId: stringValue(row.public_id) ?? stringValue(row.id) ?? fallbackId,
    readingItemPublicId,
    patternText,
    explanation: stringValue(row.explanation),
    contentLocale: stringValue(row.content_locale),
  };
}

function parseCommonMistake(
  value: unknown,
  readingItemPublicId: string,
  fallbackId: string,
): VocabularyCommonMistake | null {
  const row = asObject(value);
  if (!row) return null;
  const incorrectExpression =
    stringValue(row.incorrect_expression) ?? stringValue(row.incorrect_zh);
  const correctExpression =
    stringValue(row.correct_expression) ?? stringValue(row.correct_zh);
  const learnerExplanation =
    stringValue(row.learner_explanation)
    ?? stringValue(row.explanation);
  if (!incorrectExpression && !correctExpression && !learnerExplanation) return null;
  return {
    publicId: stringValue(row.public_id) ?? stringValue(row.id) ?? fallbackId,
    readingItemPublicId,
    incorrectExpression,
    correctExpression,
    learnerExplanation,
    contentLocale: stringValue(row.content_locale),
  };
}

function parseKnowledgeLink(
  value: unknown,
  readingItemPublicId: string,
  fallbackId: string,
): VocabularyKnowledgeLink | null {
  const row = asObject(value);
  if (!row) return null;
  const kind = stringValue(row.kind);
  const scopeKey = stringValue(row.scope_key);
  const targetLabel = stringValue(row.target_label);
  if (!kind || !scopeKey || !targetLabel) return null;
  return {
    publicId: stringValue(row.public_id) ?? stringValue(row.id) ?? fallbackId,
    readingItemPublicId,
    kind,
    scopeKey,
    targetLabel,
    targetSubtitle: stringValue(row.target_subtitle),
    targetType: stringValue(row.target_type),
    targetState: stringValue(row.target_state),
  };
}

function parsePracticeLink(
  value: unknown,
  readingItemPublicId: string,
  fallbackId: string,
): VocabularyPracticeLink | null {
  const row = asObject(value);
  if (!row) return null;
  const scopeKey = stringValue(row.scope_key);
  const targetLabel = stringValue(row.target_label);
  if (!scopeKey || !targetLabel) return null;
  return {
    publicId: stringValue(row.public_id) ?? stringValue(row.id) ?? fallbackId,
    readingItemPublicId,
    scopeKey,
    targetLabel,
    targetSubtitle: stringValue(row.target_subtitle),
    targetType: stringValue(row.target_type),
    targetState: stringValue(row.target_state),
  };
}

type DraftReadingExtensions = {
  usageContext: string | null;
  socialContext: string | null;
  pragmaticExplanation: string | null;
  constructions: VocabularyConstruction[];
  quickDistinctions: VocabularyQuickDistinction[];
  commonMistakes: VocabularyCommonMistake[];
  knowledgeLinks: VocabularyKnowledgeLink[];
  practiceLinks: VocabularyPracticeLink[];
};

const emptyDraftReadingExtensions = (): DraftReadingExtensions => ({
  usageContext: null,
  socialContext: null,
  pragmaticExplanation: null,
  constructions: [],
  quickDistinctions: [],
  commonMistakes: [],
  knowledgeLinks: [],
  practiceLinks: [],
});

function parseDraftReadingExtensions(
  value: unknown,
  readingItemPublicId: string,
  itemIndex: number,
): DraftReadingExtensions {
  const row = asObject(value);
  if (!row) return emptyDraftReadingExtensions();

  return {
    usageContext: stringValue(row.usage_context),
    socialContext: stringValue(row.social_context),
    pragmaticExplanation: stringValue(row.pragmatic_explanation),
    constructions: asArray(row.lexical_constructions)
      .map((item, index) => parseConstruction(
        item,
        readingItemPublicId,
        `preview-construction:${itemIndex}:${index}`,
      ))
      .filter((item): item is VocabularyConstruction => item !== null),
    quickDistinctions: asArray(row.quick_distinctions)
      .map((item, index) => parseQuickDistinction(
        item,
        readingItemPublicId,
        `preview-distinction-extension:${itemIndex}:${index}`,
      ))
      .filter((item): item is VocabularyQuickDistinction => item !== null),
    commonMistakes: asArray(row.common_mistakes)
      .map((item, index) => parseCommonMistake(
        item,
        readingItemPublicId,
        `preview-mistake:${itemIndex}:${index}`,
      ))
      .filter((item): item is VocabularyCommonMistake => item !== null),
    knowledgeLinks: asArray(row.knowledge_links)
      .map((item, index) => parseKnowledgeLink(
        item,
        readingItemPublicId,
        `preview-knowledge-link:${itemIndex}:${index}`,
      ))
      .filter((item): item is VocabularyKnowledgeLink => item !== null),
    practiceLinks: asArray(row.practice_links)
      .map((item, index) => parsePracticeLink(
        item,
        readingItemPublicId,
        `preview-practice-link:${itemIndex}:${index}`,
      ))
      .filter((item): item is VocabularyPracticeLink => item !== null),
  };
}

function parseReadingItem(
  value: unknown,
  pronunciationIndex: number,
  itemIndex: number,
  extensionByReadingItemId: ReadonlyMap<string, unknown>,
): VocabularyReadingItem | null {
  const row = asObject(value);
  if (!row) return null;

  const publicId =
    stringValue(row.public_id)
    ?? `preview-ri:${pronunciationIndex}:${itemIndex}`;
  const extensions = parseDraftReadingExtensions(
    extensionByReadingItemId.get(publicId),
    publicId,
    itemIndex,
  );
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

  const nestedQuickDistinctions = asArray(row.quick_distinctions)
    .map((item, index) =>
      parseQuickDistinction(
        item,
        publicId,
        `preview-distinction:${pronunciationIndex}:${itemIndex}:${index}`,
      ),
    )
    .filter((item): item is VocabularyQuickDistinction => item !== null);
  const quickDistinctions =
    nestedQuickDistinctions.length > 0
      ? nestedQuickDistinctions
      : extensions.quickDistinctions;

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
    usageContext: extensions.usageContext,
    socialContext: extensions.socialContext,
    pragmaticExplanation: extensions.pragmaticExplanation,
    translationEquivalents,
    collocations,
    classifiers,
    examples,
    constructions: extensions.constructions,
    quickDistinctions,
    commonMistakes: extensions.commonMistakes,
    knowledgeLinks: extensions.knowledgeLinks,
    practiceLinks: extensions.practiceLinks,
  };
}

function parsePronunciation(
  value: unknown,
  pronunciationIndex: number,
  extensionByReadingItemId: ReadonlyMap<string, unknown>,
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
        parseReadingItem(
          item,
          pronunciationIndex,
          index,
          extensionByReadingItemId,
        ),
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

  const reviewExtensions = asObject(payload.admin_review_extensions);
  const explicitReadingExtensions = asArray(reviewExtensions?.reading_items);
  const extensionByReadingItemId = new Map<string, unknown>();
  for (const extension of explicitReadingExtensions) {
    const row = asObject(extension);
    const readingItemId = row ? stringValue(row.reading_item_id) : null;
    if (readingItemId) extensionByReadingItemId.set(readingItemId, row);
  }

  // Backward-compatible support for Preview v4, where constructions and
  // distinctions were emitted as top-level reviewer extensions.
  if (reviewExtensions) {
    const grouped = new Map<string, JsonObject>();
    const ensureGroup = (readingItemId: string) => {
      const existing = grouped.get(readingItemId) ?? { reading_item_id: readingItemId };
      grouped.set(readingItemId, existing);
      return existing;
    };

    for (const item of asArray(reviewExtensions.lexical_constructions)) {
      const row = asObject(item);
      const readingItemId = row ? stringValue(row.reading_item_id) : null;
      if (!row || !readingItemId) continue;
      const group = ensureGroup(readingItemId);
      const current = asArray(group.lexical_constructions);
      group.lexical_constructions = [...current, row];
    }
    for (const item of asArray(reviewExtensions.quick_distinctions)) {
      const row = asObject(item);
      const readingItemId = row ? stringValue(row.reading_item_id) : null;
      if (!row || !readingItemId) continue;
      const group = ensureGroup(readingItemId);
      const current = asArray(group.quick_distinctions);
      group.quick_distinctions = [...current, row];
    }
    for (const [readingItemId, group] of grouped) {
      if (!extensionByReadingItemId.has(readingItemId)) {
        extensionByReadingItemId.set(readingItemId, group);
      }
    }
  }

  const pronunciations = asArray(entry.pronunciations)
    .map((item, index) => parsePronunciation(
      item,
      index,
      extensionByReadingItemId,
    ))
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


const numberValue = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function parseVocabularyDraftPreviewCharacters(
  value: unknown,
): VocabularyCharacterOccurrence[] {
  const payload = asObject(value);
  if (!payload || payload.preview_only !== true) return [];

  return asArray(payload.characters)
    .map((value): VocabularyCharacterOccurrence | null => {
      const row = asObject(value);
      const character = asObject(row?.character);
      if (!row || !character) return null;
      const writtenFormPublicId = stringValue(row.written_form_public_id);
      const writtenForm = stringValue(row.written_form);
      const position = numberValue(row.position);
      const publicId = stringValue(character.public_id);
      const glyph = stringValue(character.glyph);
      if (!writtenFormPublicId || !writtenForm || !position || !publicId || !glyph) return null;

      const writingRow = asObject(character.writing);
      const sourceRepository = writingRow ? stringValue(writingRow.source_repository) : null;
      const sourceCommit = writingRow ? stringValue(writingRow.source_commit) : null;
      const sourcePath = writingRow ? stringValue(writingRow.source_path) : null;
      const licenseCode = writingRow ? stringValue(writingRow.license_code) : null;

      return {
        writtenFormPublicId,
        writtenForm,
        isPrimaryForm: row.is_primary_form === true,
        scriptProfileCode: stringValue(row.script_profile_code),
        scriptVariantCode: stringValue(row.script_variant_code),
        position,
        lexicalContextPronunciation: stringValue(row.lexical_context_pronunciation),
        character: {
          publicId,
          glyph,
          standaloneReading: stringValue(character.standalone_reading),
          hanViet: stringValue(character.han_viet),
          radical: stringValue(character.radical),
          strokeCount: numberValue(character.stroke_count),
          structureCode: stringValue(character.structure_code),
          structureFormula: stringValue(character.structure_formula),
          componentNote: stringValue(character.component_note),
          writing:
            sourceRepository && sourceCommit && sourcePath && licenseCode
              ? { sourceRepository, sourceCommit, sourcePath, licenseCode }
              : null,
        },
      };
    })
    .filter((item): item is VocabularyCharacterOccurrence => item !== null);
}
