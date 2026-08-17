import { notFound } from "next/navigation";
import {
  getSupabaseLessonCore,
  getSupabaseLessonPractice,
  getSupabaseLessonVocabulary,
} from "@/lib/supabaseLesson";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";
import { learningTabFor } from "./LearningPanel";
import { SupabaseLessonPage } from "./SupabaseLessonPage";
import { labelsFor } from "./lessonUiLabels";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    uiLang?: string;
    lang?: string;
    tab?: string;
    levelSystem?: string;
    level?: string;
  }>;
};

export default async function LessonPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const activeTab = learningTabFor(query?.tab);
  const interfaceLocale = resolveInterfaceLocale(query?.uiLang, query?.lang);
  const learnerContextQuery = preservedLearnerContextQuery({
    uiLang: query?.uiLang,
    lang: query?.lang,
    levelSystem: query?.levelSystem,
    level: query?.level,
  });
  const supabaseResult = await getSupabaseLessonCore(slug, query?.lang);

  if (supabaseResult.status === "FOUND") {
    let lesson = supabaseResult.lesson;
    if (activeTab === "vocabulary") {
      const section = await getSupabaseLessonVocabulary(
        lesson.slug,
        lesson.selectedCode,
      );
      lesson = {
        ...lesson,
        vocabulary: section.vocabulary,
        exerciseOutcomeCode: section.exerciseOutcomeCode,
        errors: [...lesson.errors, ...section.errors],
      };
    } else if (activeTab === "practice") {
      const section = await getSupabaseLessonPractice(
        lesson.slug,
        lesson.selectedCode,
      );
      lesson = {
        ...lesson,
        exercises: section.exercises,
        exerciseOutcomeCode: section.exerciseOutcomeCode,
        errors: [...lesson.errors, ...section.errors],
      };
    }

    return (
      <SupabaseLessonPage
        lesson={lesson}
        activeTab={activeTab}
        learnerContextQuery={learnerContextQuery}
        interfaceLocaleCode={interfaceLocale.code}
        interfaceDirection={interfaceLocale.direction}
      />
    );
  }

  if (
    supabaseResult.status === "NOT_FOUND"
    || supabaseResult.status === "INVALID_INPUT"
  ) {
    notFound();
  }

  const labels = labelsFor(interfaceLocale.code);
  const interfaceTextAlign = interfaceLocale.direction === "rtl"
    ? "text-right"
    : "text-left";
  return (
    <main
      className={`mx-auto max-w-3xl px-4 py-16 sm:px-6 ${interfaceTextAlign}`}
      dir={interfaceLocale.direction}
    >
      <p className="rounded-3xl border border-orange-200 bg-orange-50 p-6 text-stone-700">
        {labels.lessonUnavailable}
      </p>
    </main>
  );
}
