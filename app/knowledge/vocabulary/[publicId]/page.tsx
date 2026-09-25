import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import {
  resolveKnowledgeContentLocale,
  resolveKnowledgeLanguage,
} from "@/lib/knowledgeLanguage";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";
import { loadVocabularyCharacterDelivery } from "@/lib/vocabularyCharacterDelivery";
import { loadVocabularyDetail } from "@/lib/vocabularyDetail";
import VocabularyDetailView from "./VocabularyDetailView";
import { vocabularyDetailLabelsFor } from "./VocabularyDetailLabels";
import styles from "./VocabularyDetail.module.css";

type Props = {
  params: Promise<{ publicId: string }>;
  searchParams?: Promise<{
    uiLang?: string;
    lang?: string;
    knowledgeLang?: string;
    levelSystem?: string;
    level?: string;
  }>;
};

export default async function VocabularyDetailPage({ params, searchParams }: Props) {
  const { publicId } = await params;
  const query = await searchParams;
  const interfaceLocale = resolveInterfaceLocale(query?.uiLang, query?.lang);
  const knowledgeLanguage = resolveKnowledgeLanguage(query?.knowledgeLang);
  const knowledgeContentLocale = resolveKnowledgeContentLocale(interfaceLocale.code, knowledgeLanguage);
  const labels = vocabularyDetailLabelsFor(interfaceLocale.code);
  const learnerContextQuery = preservedLearnerContextQuery({
    uiLang: query?.uiLang,
    lang: query?.lang,
    knowledgeLang: knowledgeLanguage,
    levelSystem: query?.levelSystem,
    level: query?.level,
  });

  const [result, characterResult] = await Promise.all([
    loadVocabularyDetail(publicId, knowledgeContentLocale),
    loadVocabularyCharacterDelivery(publicId, interfaceLocale.code),
  ]);

  if (result.status === "NOT_FOUND" || result.status === "INVALID_INPUT") notFound();

  if (result.status !== "FOUND") {
    return (
      <main className={styles.page} dir={interfaceLocale.direction}>
        <Link
          href={{ pathname: "/knowledge", query: learnerContextQuery }}
          className={styles.backLink}
        >
          ← {labels.back}
        </Link>
        <p className={styles.unavailable}>{labels.unavailable}</p>
      </main>
    );
  }

  return (
    <VocabularyDetailView
      detail={result.detail}
      characters={characterResult.status === "FOUND" ? characterResult.characters : []}
      interfaceLocaleCode={interfaceLocale.code}
      interfaceDirection={interfaceLocale.direction}
      knowledgeLanguage={knowledgeLanguage}
      learnerContextQuery={learnerContextQuery}
    />
  );
}
