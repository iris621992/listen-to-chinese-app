import { getLearnerLocale } from "@/lib/learnerLocaleRegistry";

export const KNOWLEDGE_LANGUAGE_PARAM = "knowledgeLang" as const;

export type KnowledgeLanguage = "user" | "zh";

export type KnowledgeContentLocaleRequest = {
  requestedLocaleCode: string;
  fallbackLocaleCode: string;
  exactContentLocaleCode: string | null;
};

export function isKnowledgeLanguageValue(value: string | null | undefined): value is KnowledgeLanguage {
  return value === "user" || value === "zh";
}

export function resolveKnowledgeLanguage(value: string | null | undefined): KnowledgeLanguage {
  return value === "zh" ? "zh" : "user";
}

export function resolveKnowledgeContentLocale(
  interfaceLocaleCode: string,
  knowledgeLanguage: KnowledgeLanguage,
): KnowledgeContentLocaleRequest {
  if (knowledgeLanguage === "zh") {
    return {
      requestedLocaleCode: "zh",
      fallbackLocaleCode: "zh",
      exactContentLocaleCode: "zh",
    };
  }

  const learnerLocale = getLearnerLocale(interfaceLocaleCode) ?? getLearnerLocale("en");
  if (!learnerLocale) {
    throw new Error("No learner locale is available for Knowledge content.");
  }

  return {
    requestedLocaleCode: learnerLocale.code,
    fallbackLocaleCode: learnerLocale.fallbackLocaleCode ?? "en",
    exactContentLocaleCode: null,
  };
}
