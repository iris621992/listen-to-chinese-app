import registryDocument from "@/config/interface-locales.v1.json";

export type InterfaceTextDirection = "ltr" | "rtl";

export type InterfaceLocaleDefinition = {
  code: string;
  label: string;
  direction: InterfaceTextDirection;
  enabled: boolean;
};

type InterfaceLocaleRegistry = {
  schemaVersion: "interface-locale-registry.v1";
  registryVersion: number;
  defaultLocaleCode: string;
  locales: InterfaceLocaleDefinition[];
};

export type InterfaceLocaleResolution = {
  registryVersion: number;
  code: string;
  label: string;
  direction: InterfaceTextDirection;
  source: "uiLang" | "legacy-lang" | "default";
};

const isDirection = (value: unknown): value is InterfaceTextDirection =>
  value === "ltr" || value === "rtl";

function parseRegistry(value: unknown): InterfaceLocaleRegistry {
  if (!value || typeof value !== "object") {
    throw new Error("Interface locale registry must be an object.");
  }

  const candidate = value as Partial<InterfaceLocaleRegistry>;
  if (
    candidate.schemaVersion !== "interface-locale-registry.v1"
    || candidate.registryVersion !== 1
    || typeof candidate.defaultLocaleCode !== "string"
    || !Array.isArray(candidate.locales)
  ) {
    throw new Error("Unsupported interface locale registry.");
  }

  const seenCodes = new Set<string>();
  const locales = candidate.locales.map((locale) => {
    if (
      !locale
      || typeof locale !== "object"
      || typeof locale.code !== "string"
      || locale.code.trim().toLowerCase() !== locale.code
      || typeof locale.label !== "string"
      || locale.label.trim().length === 0
      || !isDirection(locale.direction)
      || typeof locale.enabled !== "boolean"
      || seenCodes.has(locale.code)
    ) {
      throw new Error("Invalid interface locale registry entry.");
    }
    seenCodes.add(locale.code);
    return Object.freeze({ ...locale });
  });

  const enabledCodes = new Set(
    locales.filter((locale) => locale.enabled).map((locale) => locale.code),
  );
  if (!enabledCodes.has(candidate.defaultLocaleCode)) {
    throw new Error("The default interface locale must be enabled.");
  }

  return Object.freeze({
    schemaVersion: candidate.schemaVersion,
    registryVersion: candidate.registryVersion,
    defaultLocaleCode: candidate.defaultLocaleCode,
    locales: Object.freeze(locales) as unknown as InterfaceLocaleDefinition[],
  });
}

export const interfaceLocaleRegistry = parseRegistry(registryDocument);
export const enabledInterfaceLocales = Object.freeze(
  interfaceLocaleRegistry.locales.filter((locale) => locale.enabled),
);
export const enabledInterfaceLocaleCodes = Object.freeze(
  enabledInterfaceLocales.map((locale) => locale.code),
);
export const defaultInterfaceLocaleCode =
  interfaceLocaleRegistry.defaultLocaleCode;

export function getInterfaceLocale(code: string | null | undefined) {
  if (!code) return null;
  const normalizedCode = code.trim().toLowerCase();
  return enabledInterfaceLocales.find((locale) => locale.code === normalizedCode)
    ?? null;
}

export function resolveInterfaceLocale(
  uiLang: string | null | undefined,
  legacyLang: string | null | undefined,
): InterfaceLocaleResolution {
  const hasExplicitUiLang = uiLang !== null && uiLang !== undefined;
  const explicit = hasExplicitUiLang ? getInterfaceLocale(uiLang) : null;
  const legacy = getInterfaceLocale(legacyLang);
  const fallback = getInterfaceLocale(defaultInterfaceLocaleCode);
  if (!fallback) {
    throw new Error("The default interface locale is unavailable.");
  }

  const selected = hasExplicitUiLang
    ? explicit ?? fallback
    : legacy ?? fallback;
  let source: InterfaceLocaleResolution["source"] = "default";
  if (hasExplicitUiLang && explicit) {
    source = "uiLang";
  } else if (!hasExplicitUiLang && legacy) {
    source = "legacy-lang";
  }

  return Object.freeze({
    registryVersion: interfaceLocaleRegistry.registryVersion,
    code: selected.code,
    label: selected.label,
    direction: selected.direction,
    source,
  });
}
