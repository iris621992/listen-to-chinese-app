import registryDocument from "@/config/learner-locales.v1.json";

export type LearnerTextDirection = "ltr" | "rtl";

export type LearnerLocaleDefinition = {
  code: string;
  label: string;
  direction: LearnerTextDirection;
  enabled: boolean;
  fallbackLocaleCode: string | null;
};

type LearnerLocaleRegistry = {
  schemaVersion: "learner-locale-registry.v1";
  registryVersion: number;
  defaultLocaleCode: string;
  locales: LearnerLocaleDefinition[];
};

export type LearnerLocaleResolution = {
  registryVersion: number;
  requestedCode: string;
  resolvedCode: string;
  direction: LearnerTextDirection;
  fallbackLocaleCode: string | null;
  usedFallback: boolean;
};

const isDirection = (value: unknown): value is LearnerTextDirection =>
  value === "ltr" || value === "rtl";

function parseRegistry(value: unknown): LearnerLocaleRegistry {
  if (!value || typeof value !== "object") {
    throw new Error("Learner locale registry must be an object.");
  }

  const candidate = value as Partial<LearnerLocaleRegistry>;
  if (
    candidate.schemaVersion !== "learner-locale-registry.v1"
    || candidate.registryVersion !== 1
    || typeof candidate.defaultLocaleCode !== "string"
    || !Array.isArray(candidate.locales)
  ) {
    throw new Error("Unsupported learner locale registry.");
  }

  const seenCodes = new Set<string>();
  const locales = candidate.locales.map((locale) => {
    if (
      !locale
      || typeof locale !== "object"
      || typeof locale.code !== "string"
      || typeof locale.label !== "string"
      || !isDirection(locale.direction)
      || typeof locale.enabled !== "boolean"
      || (
        locale.fallbackLocaleCode !== null
        && typeof locale.fallbackLocaleCode !== "string"
      )
      || seenCodes.has(locale.code)
    ) {
      throw new Error("Invalid learner locale registry entry.");
    }
    seenCodes.add(locale.code);
    return Object.freeze({ ...locale });
  });

  const enabledCodes = new Set(
    locales.filter((locale) => locale.enabled).map((locale) => locale.code),
  );
  if (!enabledCodes.has(candidate.defaultLocaleCode)) {
    throw new Error("The default learner locale must be enabled.");
  }
  for (const locale of locales) {
    if (
      locale.enabled
      && locale.fallbackLocaleCode !== null
      && !enabledCodes.has(locale.fallbackLocaleCode)
    ) {
      throw new Error(`Fallback locale is not enabled: ${locale.code}`);
    }
  }

  return Object.freeze({
    schemaVersion: candidate.schemaVersion,
    registryVersion: candidate.registryVersion,
    defaultLocaleCode: candidate.defaultLocaleCode,
    locales: Object.freeze(locales) as unknown as LearnerLocaleDefinition[],
  });
}

export const learnerLocaleRegistry = parseRegistry(registryDocument);
export const enabledLearnerLocales = Object.freeze(
  learnerLocaleRegistry.locales.filter((locale) => locale.enabled),
);
export const enabledLearnerLocaleCodes = Object.freeze(
  enabledLearnerLocales.map((locale) => locale.code),
);
export const defaultLearnerLocaleCode = learnerLocaleRegistry.defaultLocaleCode;

export function getLearnerLocale(code: string | null | undefined) {
  if (!code) return null;
  const normalizedCode = code.trim().toLowerCase();
  return enabledLearnerLocales.find((locale) => locale.code === normalizedCode) ?? null;
}

export function resolveLearnerLocale(
  requestedCode: string | null | undefined,
  availableCodes: readonly string[],
): LearnerLocaleResolution {
  const defaultLocale = getLearnerLocale(defaultLearnerLocaleCode);
  if (!defaultLocale) {
    throw new Error("The default learner locale is unavailable.");
  }

  const requestedLocale = getLearnerLocale(requestedCode) ?? defaultLocale;
  const available = new Set(availableCodes);
  const candidates = [
    requestedLocale.code,
    requestedLocale.fallbackLocaleCode,
    defaultLocale.code,
  ].filter((code): code is string => code !== null);

  const resolvedCode = candidates.find((code) => available.has(code))
    ?? enabledLearnerLocales.find((locale) => available.has(locale.code))?.code
    ?? defaultLocale.code;
  const resolvedLocale = getLearnerLocale(resolvedCode) ?? defaultLocale;

  return Object.freeze({
    registryVersion: learnerLocaleRegistry.registryVersion,
    requestedCode: requestedLocale.code,
    resolvedCode: resolvedLocale.code,
    direction: resolvedLocale.direction,
    fallbackLocaleCode: requestedLocale.fallbackLocaleCode,
    usedFallback: requestedLocale.code !== resolvedLocale.code,
  });
}
