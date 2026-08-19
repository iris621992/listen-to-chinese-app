import Link from "next/link";
import { LessonCard } from "@/components/LessonCard";
import { getLessonDiscoveryPage } from "@/lib/lessonDiscovery";
import {
  parseProficiencyContext,
  preservedLearnerContextQuery,
} from "@/lib/proficiencyContext";

type Props = {
  searchParams: Promise<{
    cursor?: string;
    uiLang?: string;
    lang?: string;
    levelSystem?: string;
    level?: string;
  }>;
};

export default async function ResourcesPage({ searchParams }: Props) {
  const query = await searchParams;
  const proficiency = parseProficiencyContext(query.levelSystem, query.level);
  const learnerContextQuery = preservedLearnerContextQuery(query);
  const discovery = await getLessonDiscoveryPage({
    cursor: query.cursor,
    levelSystemCode: query.levelSystem,
    levelCode: query.level,
    requestedLocale: query.lang,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="rounded-[2rem] bg-paper p-6 shadow-soft sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cinnabar">Resource Library</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Explore Chinese learning resources</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-600">
          Browse published reading, listening, video, review, and practice-linked resources. Use the global Level control when you want proficiency context; resource type remains part of the library structure rather than an HSK-first site architecture.
        </p>
      </section>

      {proficiency.kind === "INVALID" ? (
        <section className="mt-10 rounded-3xl border border-dashed border-orange-200 bg-paper p-10 text-center shadow-soft">
          <h2 className="text-2xl font-semibold">Level selection unavailable</h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">Choose a valid Level in the header or select Level: All. The library does not widen an invalid Level URL into an unfiltered result.</p>
        </section>
      ) : discovery.page.items.length > 0 ? (
        <>
          <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {discovery.page.items.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} learnerContextQuery={learnerContextQuery} />
            ))}
          </section>
          {discovery.page.nextCursor ? (
            <div className="mt-8 flex justify-center">
              <Link
                href={{
                  pathname: "/resources",
                  query: {
                    ...learnerContextQuery,
                    cursor: discovery.page.nextCursor,
                  },
                }}
                className="rounded-full border border-orange-200 bg-paper px-6 py-3 font-semibold text-cinnabar"
              >
                More resources
              </Link>
            </div>
          ) : null}
        </>
      ) : (
        <section className="mt-10 rounded-3xl border border-dashed border-orange-200 bg-paper p-10 text-center shadow-soft">
          <h2 className="text-2xl font-semibold">No published resources yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">Resources matching this Level context will appear here when they are published.</p>
        </section>
      )}
    </main>
  );
}
