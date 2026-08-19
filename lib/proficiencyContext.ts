export const INTERFACE_LOCALE_PARAM = "uiLang" as const;
export const PROFICIENCY_LEVEL_SYSTEM_PARAM = "levelSystem" as const;
export const PROFICIENCY_LEVEL_PARAM = "level" as const;

const PROFICIENCY_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const PRESERVED_QUERY_VALUE_MAX_LENGTH = 128;
const INVALID_PRESERVED_QUERY_VALUE = "__invalid__";

export type ProficiencyContext =
  | { kind: "ALL" }
  | { kind: "EXACT"; systemCode: string; levelCode: string }
  | { kind: "INVALID" };

export type LearnerContextQueryInput = {
  uiLang?: string | null;
  lang?: string | null;
  levelSystem?: string | null;
  level?: string | null;
};

const nonEmptyValue = (value: string | null | undefined) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export function isProficiencyCode(value: string) {
  return PROFICIENCY_CODE_PATTERN.test(value);
}

export function parseProficiencyContext(
  levelSystem: string | null | undefined,
  level: string | null | undefined,
): ProficiencyContext {
  const systemAbsent = levelSystem === null || levelSystem === undefined;
  const levelAbsent = level === null || level === undefined;
  if (systemAbsent && levelAbsent) {
    return { kind: "ALL" };
  }

  const systemValue = nonEmptyValue(levelSystem);
  const levelValue = nonEmptyValue(level);
  if (
    systemValue === null
    || levelValue === null
    || !isProficiencyCode(systemValue)
    || !isProficiencyCode(levelValue)
  ) {
    return { kind: "INVALID" };
  }
  return {
    kind: "EXACT",
    systemCode: systemValue,
    levelCode: levelValue,
  };
}

const preservedQueryValue = (value: string | null | undefined) => {
  const normalized = nonEmptyValue(value);
  if (normalized === null) return null;
  return normalized.length <= PRESERVED_QUERY_VALUE_MAX_LENGTH
    ? normalized
    : INVALID_PRESERVED_QUERY_VALUE;
};

const preservedUiLangValue = (value: string | null | undefined) => {
  if (value === null || value === undefined) return null;
  const normalized = value.trim();
  if (normalized.length === 0) return "";
  return normalized.length <= PRESERVED_QUERY_VALUE_MAX_LENGTH
    ? normalized
    : INVALID_PRESERVED_QUERY_VALUE;
};

export function preservedLearnerContextQuery(
  input: LearnerContextQueryInput,
): Record<string, string> {
  const query: Record<string, string> = {};
  const uiLang = preservedUiLangValue(input.uiLang);
  const lang = preservedQueryValue(input.lang);
  const levelSystem = preservedQueryValue(input.levelSystem);
  const level = preservedQueryValue(input.level);

  if (uiLang !== null) query[INTERFACE_LOCALE_PARAM] = uiLang;
  if (lang !== null) query.lang = lang;
  if (levelSystem !== null) query[PROFICIENCY_LEVEL_SYSTEM_PARAM] = levelSystem;
  if (level !== null) query[PROFICIENCY_LEVEL_PARAM] = level;
  return query;
}

export function formatProficiencyLabel(systemCode: string, levelCode: string) {
  return levelCode.startsWith(systemCode)
    ? levelCode
    : `${systemCode} ${levelCode}`;
}
