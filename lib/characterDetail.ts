import type { KnowledgeContentLocaleRequest } from "@/lib/knowledgeLanguage";
import { getLearnerLocale } from "@/lib/learnerLocaleRegistry";

const CHARACTER_PUBLIC_ID_PATTERN = /^char_[a-f0-9]{64}$/u;
const CHARACTER_PROJECTION_CONTRACT = "CHARACTER_KNOWLEDGE_PUBLIC_PROJECTION_V1";

const CHARACTER_ACCEPTANCE_PREVIEW_BRANCH =
  "agent/character-detail-learner-delivery-v1";
const CHARACTER_ACCEPTANCE_STAGING_URL =
  "https://xqvdbgjfpdxdasxycppi.supabase.co";
const CHARACTER_ACCEPTANCE_STAGING_PUBLISHABLE_KEY =
  "sb_publishable_XPdzYMOqCBDuXJBnb2BW7g_pdMqMqgt";

function usesCharacterAcceptanceStaging(): boolean {
  return (
    process.env.VERCEL_ENV === "preview"
    && process.env.VERCEL_GIT_COMMIT_REF === CHARACTER_ACCEPTANCE_PREVIEW_BRANCH
  );
}

async function createCharacterRuntimeSupabaseClient() {
  if (usesCharacterAcceptanceStaging()) {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(
      CHARACTER_ACCEPTANCE_STAGING_URL,
      CHARACTER_ACCEPTANCE_STAGING_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  return createServerSupabaseClient();
}

type JsonObject = Record<string, unknown>;

export type CharacterApplicability = "PRESENT" | "N/A" | "PENDING";

export type CharacterFormRelation = {
  relationType: string;
  publicId: string;
  glyph: string;
};

export type CharacterPronunciation = {
  publicId: string;
  logicalKey: string;
  pinyin: string;
  hanViet: string | null;
  displayOrder: number;
};

export type CharacterModule = {
  publicId: string;
  logicalKey: string;
  kind: string;
  applicability: CharacterApplicability;
  pronunciation: string | null;
  canonicalZh: string | null;
  localizedText: string | null;
  localizedLocaleCode: string | null;
  displayOrder: number;
};

export type CharacterComponent = {
  logicalKey: string;
  glyph: string;
  roleCode: string | null;
  canonicalRoleZh: string | null;
  localizedRoleLabel: string | null;
  canonicalZh: string;
  localizedText: string | null;
  localizedLocaleCode: string | null;
  displayOrder: number;
};

export type CharacterVocabularyLink = {
  pronunciationPublicId: string | null;
  modulePublicId: string | null;
  vocabularyPublicId: string;
  relationRole: string;
  displayOrder: number;
};

export type CharacterWriting = {
  sourceRepository: string;
  sourceCommit: string;
  sourcePath: string;
  licenseCode: string;
};

export type CharacterStructure = {
  applicability: CharacterApplicability | null;
  classificationZh: string | null;
  code: string | null;
  formula: string | null;
};

export type CharacterDetail = {
  publicId: string;
  glyph: string;
  learnerScope: "full" | "recognition_only" | "identity_only";
  radical: string | null;
  radicalDisplayForm: string | null;
  strokeCount: number | null;
  structure: CharacterStructure;
  componentsApplicability: CharacterApplicability | null;
  writingApplicability: CharacterApplicability | null;
  forms: CharacterFormRelation[];
  pronunciations: CharacterPronunciation[];
  modules: CharacterModule[];
  components: CharacterComponent[];
  writing: CharacterWriting | null;
  vocabularyLinks: CharacterVocabularyLink[];
};

export type CharacterDetailLoadResult =
  | { status: "FOUND"; detail: CharacterDetail }
  | { status: "NOT_FOUND" | "INVALID_INPUT" | "DATABASE_ERROR" };

const asObject = (value: unknown): JsonObject | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const stringValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const numberValue = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function applicabilityValue(value: unknown): CharacterApplicability | null {
  return value === "PRESENT" || value === "N/A" || value === "PENDING" ? value : null;
}

function parseFormRelation(value: unknown): CharacterFormRelation | null {
  const row = asObject(value);
  if (!row) return null;
  const relationType = stringValue(row.relation_type);
  const publicId = stringValue(row.character_public_id);
  const glyph = stringValue(row.glyph);
  if (!relationType || !publicId || !glyph || !CHARACTER_PUBLIC_ID_PATTERN.test(publicId)) return null;
  return { relationType, publicId, glyph };
}

function parsePronunciation(value: unknown): CharacterPronunciation | null {
  const row = asObject(value);
  if (!row) return null;
  const publicId = stringValue(row.public_id);
  const logicalKey = stringValue(row.logical_key);
  const pinyin = stringValue(row.pinyin);
  const displayOrder = numberValue(row.display_order);
  if (!publicId || !logicalKey || !pinyin || displayOrder === null) return null;
  return {
    publicId,
    logicalKey,
    pinyin,
    hanViet: stringValue(row.han_viet),
    displayOrder,
  };
}

function parseModule(value: unknown): CharacterModule | null {
  const row = asObject(value);
  if (!row) return null;
  const publicId = stringValue(row.public_id);
  const logicalKey = stringValue(row.logical_key);
  const kind = stringValue(row.module_kind);
  const applicability = applicabilityValue(row.applicability_status);
  const displayOrder = numberValue(row.display_order);
  if (!publicId || !logicalKey || !kind || !applicability || displayOrder === null) return null;
  return {
    publicId,
    logicalKey,
    kind,
    applicability,
    pronunciation: stringValue(row.pronunciation),
    canonicalZh: stringValue(row.canonical_zh),
    localizedText: stringValue(row.localized_text),
    localizedLocaleCode: stringValue(row.localized_locale_code),
    displayOrder,
  };
}

function parseComponent(value: unknown): CharacterComponent | null {
  const row = asObject(value);
  if (!row) return null;
  const logicalKey = stringValue(row.logical_key);
  const glyph = stringValue(row.glyph);
  const canonicalZh = stringValue(row.canonical_zh);
  const displayOrder = numberValue(row.display_order);
  if (!logicalKey || !glyph || !canonicalZh || displayOrder === null) return null;
  return {
    logicalKey,
    glyph,
    roleCode: stringValue(row.role_code),
    canonicalRoleZh: stringValue(row.canonical_role_zh),
    localizedRoleLabel: stringValue(row.localized_role_label),
    canonicalZh,
    localizedText: stringValue(row.localized_text),
    localizedLocaleCode: stringValue(row.localized_locale_code),
    displayOrder,
  };
}

function parseVocabularyLink(value: unknown): CharacterVocabularyLink | null {
  const row = asObject(value);
  if (!row) return null;
  const vocabularyPublicId = stringValue(row.vocabulary_public_id);
  const relationRole = stringValue(row.relation_role);
  const displayOrder = numberValue(row.display_order);
  if (!vocabularyPublicId || !relationRole || displayOrder === null) return null;
  return {
    pronunciationPublicId: stringValue(row.pronunciation_public_id),
    modulePublicId: stringValue(row.module_public_id),
    vocabularyPublicId,
    relationRole,
    displayOrder,
  };
}

function parseWriting(value: unknown): CharacterWriting | null {
  const row = asObject(value);
  if (!row) return null;
  const sourceRepository = stringValue(row.source_repository);
  const sourceCommit = stringValue(row.source_commit);
  const sourcePath = stringValue(row.source_path);
  const licenseCode = stringValue(row.license_code);
  if (!sourceRepository || !sourceCommit || !sourcePath || !licenseCode) return null;
  return { sourceRepository, sourceCommit, sourcePath, licenseCode };
}

function parseCharacterPayload(value: unknown): CharacterDetail | null {
  const payload = asObject(value);
  if (!payload || stringValue(payload.projection_contract) !== CHARACTER_PROJECTION_CONTRACT) return null;

  const character = asObject(payload.character);
  if (!character) return null;

  const publicId = stringValue(character.public_id);
  const glyph = stringValue(character.glyph);
  const learnerScope = stringValue(character.learner_scope);
  const structureRow = asObject(character.structure);
  if (
    !publicId
    || !glyph
    || !CHARACTER_PUBLIC_ID_PATTERN.test(publicId)
    || !["full", "recognition_only", "identity_only"].includes(learnerScope ?? "")
    || !structureRow
  ) {
    return null;
  }

  const structure: CharacterStructure = {
    applicability: applicabilityValue(structureRow.applicability_status),
    classificationZh: stringValue(structureRow.classification_zh),
    code: stringValue(structureRow.structure_code),
    formula: stringValue(structureRow.structure_formula),
  };

  const forms = asArray(character.forms)
    .map(parseFormRelation)
    .filter((item): item is CharacterFormRelation => item !== null);
  const pronunciations = asArray(character.pronunciations)
    .map(parsePronunciation)
    .filter((item): item is CharacterPronunciation => item !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const modules = asArray(character.modules)
    .map(parseModule)
    .filter((item): item is CharacterModule => item !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const components = asArray(character.components)
    .map(parseComponent)
    .filter((item): item is CharacterComponent => item !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const vocabularyLinks = asArray(character.vocabulary_links)
    .map(parseVocabularyLink)
    .filter((item): item is CharacterVocabularyLink => item !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (learnerScope === "full" && pronunciations.length === 0) return null;

  return {
    publicId,
    glyph,
    learnerScope: learnerScope as CharacterDetail["learnerScope"],
    radical: stringValue(character.radical),
    radicalDisplayForm: stringValue(character.radical_display_form),
    strokeCount: numberValue(character.stroke_count),
    structure,
    componentsApplicability: applicabilityValue(character.components_applicability),
    writingApplicability: applicabilityValue(character.writing_applicability),
    forms,
    pronunciations,
    modules,
    components,
    writing: parseWriting(character.writing),
    vocabularyLinks,
  };
}

function resolveLocaleRequest(
  input: string | null | undefined | KnowledgeContentLocaleRequest,
): KnowledgeContentLocaleRequest | null {
  if (input && typeof input === "object") {
    const requestedLocaleCode = input.requestedLocaleCode.trim().toLowerCase();
    const fallbackLocaleCode = input.fallbackLocaleCode.trim().toLowerCase();
    const exactContentLocaleCode = input.exactContentLocaleCode?.trim().toLowerCase() ?? null;
    if (!requestedLocaleCode || !fallbackLocaleCode) return null;
    return { requestedLocaleCode, fallbackLocaleCode, exactContentLocaleCode };
  }

  const learnerLocale = getLearnerLocale(input) ?? getLearnerLocale("en");
  if (!learnerLocale) return null;
  return {
    requestedLocaleCode: learnerLocale.code,
    fallbackLocaleCode: learnerLocale.fallbackLocaleCode ?? "en",
    exactContentLocaleCode: null,
  };
}

export async function loadCharacterDetail(
  publicId: string,
  localeInput?: string | null | KnowledgeContentLocaleRequest,
): Promise<CharacterDetailLoadResult> {
  if (!CHARACTER_PUBLIC_ID_PATTERN.test(publicId)) return { status: "INVALID_INPUT" };
  const localeRequest = resolveLocaleRequest(localeInput);
  if (!localeRequest) return { status: "DATABASE_ERROR" };

  try {
    const supabase = await createCharacterRuntimeSupabaseClient();
    const { data, error } = await supabase.rpc("get_public_character_entry_v1", {
      p_public_character_id: publicId,
      p_locale_code: localeRequest.requestedLocaleCode,
      p_fallback_locale_code: localeRequest.fallbackLocaleCode,
    });
    if (error) return { status: "DATABASE_ERROR" };
    if (!data) return { status: "NOT_FOUND" };
    const detail = parseCharacterPayload(data);
    return detail ? { status: "FOUND", detail } : { status: "DATABASE_ERROR" };
  } catch {
    return { status: "DATABASE_ERROR" };
  }
}
