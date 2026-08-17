import Link from "next/link";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";

type Props = {
  searchParams: Promise<{
    uiLang?: string;
    lang?: string;
    levelSystem?: string;
    level?: string;
  }>;
};

export default async function PracticePage({ searchParams }: Props) {
  const query = await searchParams;
  const learnerContextQuery = preservedLearnerContextQuery(query);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="rounded-[2rem] bg-paper p-6 shadow-soft sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cinnabar">Practice Library</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Practice Chinese by skill and learning target</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-600">
          Independent practice is a core part of this library. The dedicated practice engine is still being built, so this page preserves your Language and Level context without pretending that independent Level-filtered practice discovery exists yet.
        </p>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["Listening", "Practice comprehension, dictation, and sound-to-meaning skills."],
          ["Reading", "Practice understanding Chinese text, sentence meaning, and context."],
          ["Vocabulary", "Review words through reusable recall and meaning-focused exercises."],
          ["Grammar", "Work with grammar patterns and sentence structures in reusable contexts."],
          ["Sentence skills", "Practice word order, sentence building, and common language patterns."],
          ["Mixed review", "Combine several practice targets for broader review sessions."],
        ].map(([title, text]) => (
          <div key={title} className="rounded-3xl border border-orange-100 bg-paper p-6 shadow-soft">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 leading-6 text-stone-600">{text}</p>
            <p className="mt-4 text-sm font-semibold text-stone-500">Independent practice coming in a later product slice</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-[2rem] bg-cream p-6 sm:p-10">
        <h2 className="text-2xl font-bold">Practice already connected to resources</h2>
        <p className="mt-3 max-w-3xl leading-7 text-stone-600">
          Some published learning resources already include attached exercises. You can use those while the independent practice library is developed as a separate reusable system.
        </p>
        <Link href={{ pathname: "/resources", query: learnerContextQuery }} className="mt-6 inline-flex rounded-full bg-cinnabar px-6 py-3 font-semibold text-white shadow-soft">
          Browse learning resources
        </Link>
      </section>
    </main>
  );
}
