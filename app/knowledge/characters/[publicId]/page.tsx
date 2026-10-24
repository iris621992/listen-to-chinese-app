import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { loadCharacterDetail } from "@/lib/characterDetail";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import {
  resolveKnowledgeContentLocale,
  resolveKnowledgeLanguage,
} from "@/lib/knowledgeLanguage";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";
import CharacterDetailView from "./CharacterDetailView";
import { characterDetailLabelsFor } from "./CharacterDetailLabels";
import vocabStyles from "../../vocabulary/[publicId]/VocabularyDetail.module.css";

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

function redirectQuery(query: Record<string, string>) {
  const search = new URLSearchParams(query).toString();
  return search ? `?${search}` : "";
}

export default async function CharacterDetailPage({ params, searchParams }: Props) {
  const { publicId } = await params;
  const query = await searchParams;
  const interfaceLocale = resolveInterfaceLocale(query?.uiLang, query?.lang);
  const knowledgeLanguage = resolveKnowledgeLanguage(query?.knowledgeLang);
  const knowledgeContentLocale = resolveKnowledgeContentLocale(interfaceLocale.code, knowledgeLanguage);
  const labels = characterDetailLabelsFor(interfaceLocale.code);
  const learnerContextQuery = preservedLearnerContextQuery({
    uiLang: query?.uiLang,
    lang: query?.lang,
    knowledgeLang: knowledgeLanguage,
    levelSystem: query?.levelSystem,
    level: query?.level,
  });

  const result = await loadCharacterDetail(publicId, knowledgeContentLocale);
  if (result.status === "NOT_FOUND" || result.status === "INVALID_INPUT") notFound();

  if (result.status !== "FOUND") {
    return (
      <main className={vocabStyles.page} dir={interfaceLocale.direction}>
        <Link
          href={{ pathname: "/knowledge", query: learnerContextQuery }}
          className={vocabStyles.backLink}
        >
          ← {labels.knowledge}
        </Link>
        <p className={vocabStyles.unavailable}>{labels.unavailable}</p>
      </main>
    );
  }

  if (result.detail.learnerScope === "recognition_only") {
    const simplified = result.detail.forms.find((form) => form.relationType === "traditional_to_simplified");
    if (!simplified) notFound();
    redirect(`/knowledge/characters/${simplified.publicId}${redirectQuery(learnerContextQuery)}`);
  }

  if (result.detail.learnerScope !== "full") notFound();

  return (
    <CharacterDetailView
      detail={result.detail}
      interfaceLocaleCode={interfaceLocale.code}
      interfaceDirection={interfaceLocale.direction}
      knowledgeLanguage={knowledgeLanguage}
      learnerContextQuery={learnerContextQuery}
    />
  );
}
