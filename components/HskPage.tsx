import Link from "next/link";
import { LessonCard } from "@/components/LessonCard";
import { getLessonDiscoveryPage } from "@/lib/lessonDiscovery";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";

const hskDescriptions: Record<number, string> = {
  1: "Beginner-friendly listening with slow greetings, numbers, family, time, and everyday actions.",
  2: "Short practical stories and conversations using familiar HSK2 words and gentle pacing.",
  3: "Bridge into longer daily-life listening with more connectors and natural sentence patterns.",
  4: "Coming soon: calm intermediate listening with richer stories and review practice.",
  5: "Coming soon: longer Mandarin listening lessons for advanced comprehension growth.",
  6: "Coming soon: thoughtful advanced listening practice with natural themes and vocabulary.",
};

type HskPageProps = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  cursor?: string;
  locale?: string;
};

export async function HskPage({ level, cursor, locale }: HskPageProps) {
  const levelCode = `HSK${level}`;
  const discovery = await getLessonDiscoveryPage({
    cursor,
    levelSystemCode: "HSK",
    levelCode,
    requestedLocale: locale,
  });
  const levelLessons = discovery.page.items;
  const filters = ["All", "Free", "Stories", "Reading Practice"];
  const learnerContextQuery = preservedLearnerContextQuery({
    lang: discovery.page.localeCode === "en" ? null : discovery.page.localeCode,
    levelSystem: "HSK",
    level: levelCode,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="rounded-[2rem] bg-paper p-6 shadow-soft sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cinnabar">HSK Level {level}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">HSK{level} Chinese Listening Practice</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-600">{hskDescriptions[level]}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {filters.map((filter) => <button key={filter} className="rounded-full border border-orange-200 bg-cream px-4 py-2 text-sm font-semibold text-stone-700">{filter}</button>)}
        </div>
      </section>

      {levelLessons.length > 0 ? (
        <>
          <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {levelLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} learnerContextQuery={learnerContextQuery} />)}
          </section>
          {discovery.page.nextCursor ? (
            <div className="mt-8 flex justify-center">
              <Link
                href={{
                  pathname: `/hsk${level}`,
                  query: {
                    cursor: discovery.page.nextCursor,
                    ...(discovery.page.localeCode === "en"
                      ? {}
                      : { lang: discovery.page.localeCode }),
                  },
                }}
                className="rounded-full border border-orange-200 bg-paper px-6 py-3 font-semibold text-cinnabar"
              >
                More lessons
              </Link>
            </div>
          ) : null}
        </>
      ) : (
        <section className="mt-10 rounded-3xl border border-dashed border-orange-200 bg-paper p-10 text-center shadow-soft">
          <h2 className="text-2xl font-semibold">Coming Soon</h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">HSK{level} lessons are being prepared with the same gentle pace, clear script, pinyin, translation, and practice format.</p>
        </section>
      )}
    </main>
  );
}
