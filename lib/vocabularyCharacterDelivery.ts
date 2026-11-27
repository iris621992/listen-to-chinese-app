import { getLearnerLocale } from "@/lib/learnerLocaleRegistry";

const VOCABULARY_PUBLIC_ID_PATTERN = /^vocab_[a-f0-9]{64}$/u;
const K1E_PROJECTION_CONTRACT = "K1E_VOCABULARY_CHARACTER_AUDIO_PUBLIC_PROJECTION_V1";

type JsonObject = Record<string, unknown>;

export type VocabularyCharacterWriting = {
  sourceRepository: string;
  sourceCommit: string;
  sourcePath: string;
  licenseCode: string;
};

export type VocabularyCharacterOccurrence = {
  writtenFormPublicId: string;
  writtenForm: string;
  isPrimaryForm: boolean;
  scriptProfileCode: string | null;
  scriptVariantCode: string | null;
  position: number;
  lexicalContextPronunciation: string | null;
  character: {
    publicId: string;
    glyph: string;
    standaloneReading: string | null;
    hanViet: string | null;
    radical: string | null;
    strokeCount: number | null;
    structureCode: string | null;
    structureFormula: string | null;
    componentNote: string | null;
    writing: VocabularyCharacterWriting | null;
  };
};

export type VocabularyCharacterDeliveryResult =
  | { status: "FOUND"; characters: VocabularyCharacterOccurrence[] }
  | { status: "UNAVAILABLE" };


type VocabularyCharacterFallbackInput = {
  publicId: string;
  displayForm: string;
  hanViet: { text: string } | null;
  forms: Array<{
    publicId: string;
    text: string;
    isPrimary: boolean;
    scriptProfileCode: string | null;
    scriptVariantCode: string | null;
  }>;
  pronunciations: Array<{
    pronunciation: string;
    isDefault: boolean;
  }>;
};

const HAN_CHARACTER_PATTERN = /^\p{Script=Han}$/u;
const LOCKED_WRITING_REPOSITORY = "chanind/hanzi-writer-data";
const LOCKED_WRITING_COMMIT = "68d10a4b21150cae5e1ebbd223eed289cf32d90c";
const LOCKED_WRITING_LICENSE = "Arphic Public License";

export function buildVocabularyCharacterFallback(
  detail: VocabularyCharacterFallbackInput,
): VocabularyCharacterOccurrence[] {
  const primaryForm = detail.forms.find((form) => form.isPrimary) ?? detail.forms[0];
  if (!primaryForm) return [];

  // A display-only fallback: exact Han glyphs from the authored Written Form,
  // with their original code-point position (including repeats).
  const glyphs = Array.from(primaryForm.text)
    .map((glyph, index) => ({ glyph, position: index + 1 }))
    .filter(({ glyph }) => HAN_CHARACTER_PATTERN.test(glyph));
  if (glyphs.length === 0) return [];

  // Whole-word pronunciation/Hán Việt is valid for a one-glyph word only.
  // No runtime inference of individual readings or Character-owned facts.
  const singleCharacter = HAN_CHARACTER_PATTERN.test(primaryForm.text);
  const pronunciation = singleCharacter
    ? detail.pronunciations.find((item) => item.isDefault) ?? detail.pronunciations[0]
    : null;

  return glyphs.map(({ glyph, position }): VocabularyCharacterOccurrence => ({
    writtenFormPublicId: primaryForm.publicId,
    writtenForm: primaryForm.text,
    isPrimaryForm: true,
    scriptProfileCode: primaryForm.scriptProfileCode,
    scriptVariantCode: primaryForm.scriptVariantCode,
    position,
    lexicalContextPronunciation: singleCharacter ? pronunciation?.pronunciation ?? null : null,
    character: {
      // Technical occurrence key, NOT canonical Character identity/navigation.
      publicId: `fallback:${detail.publicId}:${position}`,
      glyph,
      standaloneReading: null,
      hanViet: singleCharacter ? detail.hanViet?.text ?? null : null,
      radical: null,
      strokeCount: null,
      structureCode: null,
      structureFormula: null,
      componentNote: null,
      writing: {
        // Glyph-exact technical animation asset, not a writing-standard claim.
        sourceRepository: LOCKED_WRITING_REPOSITORY,
        sourceCommit: LOCKED_WRITING_COMMIT,
        sourcePath: `data/${glyph}.json`,
        licenseCode: LOCKED_WRITING_LICENSE,
      },
    },
  }));
}

/**
 * Prefer canonical Character facts at each primary-form position. Fill only
 * missing glyphs for presentation, without ever editing projected rows.
 * Shared by published Learner and Admin Draft/Published Preview.
 */
export function withVocabularyCharacterDisplayFallback(
  detail: VocabularyCharacterFallbackInput,
  projected: VocabularyCharacterOccurrence[],
): VocabularyCharacterOccurrence[] {
  const fallback = buildVocabularyCharacterFallback(detail);
  if (fallback.length === 0) return projected;
  const primaryFormId = fallback[0].writtenFormPublicId;
  const primaryRows = projected.filter((row) => row.writtenFormPublicId === primaryFormId);
  const occupiedPositions = new Set(primaryRows.map((row) => row.position));
  const missing = fallback.filter((row) => !occupiedPositions.has(row.position));

  // The rail shows primary-form occurrences in array order. Keep canonical
  // objects unchanged, but order the combined primary-form positions correctly.
  const orderedPrimaryRows = [...primaryRows, ...missing]
    .sort((left, right) => left.position - right.position);
  const alreadyOrdered = missing.length === 0 && primaryRows.every(
    (row, index) => row === orderedPrimaryRows[index],
  );
  if (alreadyOrdered) return projected;

  // Keep secondary-form occurrences and their relative order untouched.
  // Insert the complete primary sequence at its first original position.
  if (primaryRows.length === 0) return [...projected, ...orderedPrimaryRows];
  let insertedPrimary = false;
  const result: VocabularyCharacterOccurrence[] = [];
  for (const row of projected) {
    if (row.writtenFormPublicId !== primaryFormId) {
      result.push(row);
    } else if (!insertedPrimary) {
      result.push(...orderedPrimaryRows);
      insertedPrimary = true;
    }
  }
  return result;
}

const asObject = (value: unknown): JsonObject | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const stringValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;
const numberValue = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function parseWriting(value: unknown): VocabularyCharacterWriting | null {
  const row = asObject(value);
  if (!row) return null;
  const sourceRepository = stringValue(row.source_repository);
  const sourceCommit = stringValue(row.source_commit);
  const sourcePath = stringValue(row.source_path);
  const licenseCode = stringValue(row.license_code);
  if (!sourceRepository || !sourceCommit || !sourcePath || !licenseCode) return null;
  return { sourceRepository, sourceCommit, sourcePath, licenseCode };
}

function parseOccurrence(value: unknown): VocabularyCharacterOccurrence | null {
  const row = asObject(value);
  const character = asObject(row?.character);
  if (!row || !character) return null;
  const writtenFormPublicId = stringValue(row.written_form_public_id);
  const writtenForm = stringValue(row.written_form);
  const position = numberValue(row.position);
  const publicId = stringValue(character.public_id);
  const glyph = stringValue(character.glyph);
  if (!writtenFormPublicId || !writtenForm || !position || !publicId || !glyph) return null;
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
      writing: parseWriting(character.writing),
    },
  };
}

export async function loadVocabularyCharacterDelivery(
  publicId: string,
  learnerLocaleCode?: string | null,
): Promise<VocabularyCharacterDeliveryResult> {
  if (!VOCABULARY_PUBLIC_ID_PATTERN.test(publicId)) return { status: "UNAVAILABLE" };
  const learnerLocale = getLearnerLocale(learnerLocaleCode) ?? getLearnerLocale("en");
  if (!learnerLocale) return { status: "UNAVAILABLE" };

  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.rpc("get_public_vocabulary_entry_v4", {
      p_public_entry_id: publicId,
      p_locale_code: learnerLocale.code,
      p_fallback_locale_code: learnerLocale.fallbackLocaleCode ?? "en",
    });
    if (error) return { status: "UNAVAILABLE" };
    const payload = asObject(data);
    if (stringValue(payload?.projection_contract) !== K1E_PROJECTION_CONTRACT) {
      return { status: "UNAVAILABLE" };
    }
    const characters = asArray(payload?.characters)
      .map(parseOccurrence)
      .filter((item): item is VocabularyCharacterOccurrence => item !== null);
    return { status: "FOUND", characters };
  } catch {
    return { status: "UNAVAILABLE" };
  }
}
