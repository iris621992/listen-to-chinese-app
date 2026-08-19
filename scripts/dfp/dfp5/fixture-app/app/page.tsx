import { SupabaseLessonPage } from "@/app/lessons/[slug]/SupabaseLessonPage";
import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";

type FixturePageProps = {
  searchParams: Promise<{ direction?: string }>;
};

const LONG_LTR =
  "ThisUnbrokenLearnerFacingContentMustRemainInsideTheActualProductionLearningPanelAtTheRequiredMobileViewport";
const LONG_RTL =
  "محتوى_تعليمي_طويل_للتحقق_من_حدود_التخطيط_الفعلي_في_واجهة_الإنتاج";

function lessonFixture(direction: "ltr" | "rtl"): SupabaseLessonDetail {
  const selectedCode = direction === "rtl" ? "ar" : "en";
  const translation = direction === "rtl" ? LONG_RTL : LONG_LTR;

  return {
    title: "DFP-5 production component fixture",
    slug: "dfp5-production-component-fixture",
    youtubeVideoId: "dQw4w9WgXcQ",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    languages: [
      {
        code: selectedCode,
        label: selectedCode,
        direction,
      },
    ],
    selectedCode,
    selectedDirection: direction,
    segments: [
      {
        id: "segment-1",
        chineseText: "你好，我是小芸。",
        phoneticText: "Nǐ hǎo, wǒ shì Xiǎoyún.",
        translation,
      },
      {
        id: "segment-2",
        chineseText: "欢迎你来到这个小角落。",
        phoneticText: "Huānyíng nǐ láidào zhège xiǎo jiǎoluò.",
        translation,
      },
    ],
    vocabulary: [],
    exercises: [],
    exerciseOutcomeCode: "EMPTY_EXERCISE_LIST",
    errors: [],
  };
}

export default async function Dfp5FixturePage({
  searchParams,
}: FixturePageProps) {
  const query = await searchParams;
  const direction = query.direction === "rtl" ? "rtl" : "ltr";

  return (
    <SupabaseLessonPage
      activeTab="script"
      interfaceDirection={direction}
      interfaceLocaleCode={direction === "rtl" ? "ar" : "en"}
      lesson={lessonFixture(direction)}
    />
  );
}
