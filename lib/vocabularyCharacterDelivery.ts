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
