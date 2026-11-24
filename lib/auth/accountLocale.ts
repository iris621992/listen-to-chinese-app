export type AccountLocale = "vi" | "en";
type LocaleQuery = Readonly<{ uiLang?: string | string[]; lang?: string | string[] }>;

export function resolveAccountLocale(query: LocaleQuery): AccountLocale {
  const candidate = typeof query.uiLang === "string" ? query.uiLang : query.lang;
  return candidate === "vi" ? "vi" : "en";
}

export function accountHref(path: string, locale: AccountLocale): string {
  if (!/^\/[a-z-]+(?:\/[a-z-]+)*$/.test(path)) throw new Error("Invalid account path");
  return locale === "vi" ? path + "?uiLang=vi" : path;
}
