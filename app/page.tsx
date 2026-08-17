import Link from "next/link";
import { LessonCard } from "@/components/LessonCard";
import { getLessonDiscoveryPage } from "@/lib/lessonDiscovery";
import {
  parseProficiencyContext,
  preservedLearnerContextQuery,
} from "@/lib/proficiencyContext";

type Props = {
  searchParams: Promise<{
    uiLang?: string;
    lang?: string;
    levelSystem?: string;
    level?: string;
  }>;
};

export default async function Home({ searchParams }: Props) {
  const query = await searchParams;
  const proficiency = parseProficiencyContext(query.levelSystem, query.level);
  const discovery = await getLessonDiscoveryPage({
    pageSize: 6,
    levelSystemCode: query.levelSystem,
    levelCode: query.level,
    requestedLocale: query.lang,
  });
  const learnerContextQuery = preservedLearnerContextQuery(query);
  const invalidLevel = proficiency.kind === "INVALID";

  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cinnabar">Chinese learning resource library</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">Learn Chinese with structured resources and practice</h1>
          <p className="mt-6 text-lg leading-8 text-stone-600">Explore reading, listening, vocabulary, grammar, and exercise resources in one library. Choose what you want to study, then practice at your own pace.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={{ pathname: "/resources", query: learnerContextQuery }} className="rounded-full bg-cinnabar px-6 py-3 text-center font-semibold text-white shadow-soft">Browse resources</Link>
            <Link href={{ pathname: "/practice", query: learnerContextQuery }} className="rounded-full border border-orange-200 bg-paper px-6 py-3 text-center font-semibold text-cinnabar">Practice Chinese</Link>
          </div>
        </div>
        <div className="rounded-[2rem] bg-paper p-6 shadow-soft">
          <div className="rounded-3xl bg-cream p-6">
            <p className="chinese-text text-4xl font-semibold">今天我们慢慢学。</p>
            <p className="mt-4 text-lg text-cinnabar">Jīntiān wǒmen mànman xué.</p>
            <p className="mt-2 text-stone-600">Today we learn step by step.</p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm font-semibold text-stone-600">
            <div className="rounded-2xl bg-orange-50 p-4">Explore</div>
            <div className="rounded-2xl bg-orange-50 p-4">Understand</div>
            <div className="rounded-2xl bg-orange-50 p-4">Practice</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cinnabar">One library, many ways to learn</p>
            <h2 className="mt-2 text-3xl font-bold">Explore Chinese learning resources</h2>
          </div>
          <Link href={{ pathname: "/resources", query: learnerContextQuery }} className="font-semibold text-cinnabar">View resource library →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Reading", "Read Chinese passages with language support and study notes."],
            ["Listening", "Build comprehension with audio and listening-focused materials."],
            ["Knowledge", "Review vocabulary, grammar, characters, and reusable language patterns."],
            ["Exercises", "Use structured exercises connected to resources and practice targets."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl border border-orange-100 bg-paper p-5 shadow-soft">
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cinnabar">Recently published</p>
            <h2 className="mt-2 text-3xl font-bold">Latest resources</h2>
          </div>
        </div>
        {invalidLevel ? (
          <p className="mt-6 rounded-3xl border border-dashed border-orange-200 bg-paper p-8 text-stone-600">The selected Level context is unavailable. Choose a valid Level or Level: All.</p>
        ) : discovery.page.items.length > 0 ? (
          <>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {discovery.page.items.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} learnerContextQuery={learnerContextQuery} />)}
            </div>
            <div className="mt-8 flex justify-center">
              <Link href={{ pathname: "/resources", query: learnerContextQuery }} className="rounded-full border border-orange-200 bg-paper px-6 py-3 font-semibold text-cinnabar">Browse all resources</Link>
            </div>
          </>
        ) : (
          <p className="mt-6 rounded-3xl border border-dashed border-orange-200 bg-paper p-8 text-stone-600">Published learning resources will appear here when discovery is available.</p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:pb-20">
        <div className="rounded-[2rem] bg-paper p-6 shadow-soft sm:p-10">
          <h2 className="text-3xl font-bold">Browse → Study → Practice</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              ["Browse", "Choose useful material by resource type, level metadata, and your current learning goal."],
              ["Study", "Use Chinese text, pinyin, translations, vocabulary, grammar, and media when a resource provides them."],
              ["Practice", "Reinforce what you know with exercises and, as the practice library grows, independent skill-focused practice."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl bg-cream p-5">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-stone-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
