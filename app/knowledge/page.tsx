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

const FIRST_VOCABULARY_PUBLIC_ID =
  "vocab_57c07810d32b57abbf1e01937ae7488edb99ec67da136f3c0819d911464f646d";

const KNOWLEDGE_AREAS = [
  {
    title: "Vocabulary",
    description: "Build reusable word knowledge and review meanings in context.",
    href: `/knowledge/vocabulary/${FIRST_VOCABULARY_PUBLIC_ID}`,
  },
  {
    title: "Idioms",
    description: "Explore fixed expressions and the resources where they appear.",
    href: null,
  },
  {
    title: "Word Comparison",
    description: "Compare related words, meanings, usage, and distinctions.",
    href: null,
  },
  {
    title: "Grammar",
    description: "Study reusable grammar patterns connected to real learning resources.",
    href: null,
  },
] as const;

export default async function KnowledgePage({ searchParams }: Props) {
  const query = await searchParams;
  const learnerContextQuery = preservedLearnerContextQuery(query);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="rounded-[2rem] bg-paper p-6 shadow-soft sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cinnabar">Knowledge Hub</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Build Chinese knowledge you can reuse</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-600">
          Knowledge connects what you notice in learning resources with vocabulary, idioms, word comparisons, and grammar. Vocabulary now has a live learner detail surface; the other dedicated knowledge systems will expand in later product slices without presenting unfinished tools as complete.
        </p>
      </section>

      <section className="mt-10 grid gap-5 sm:grid-cols-2">
        {KNOWLEDGE_AREAS.map((area) => {
          const content = (
            <>
              <h2 className="text-xl font-semibold">{area.title}</h2>
              <p className="mt-2 leading-7 text-stone-600">{area.description}</p>
              <p className="mt-4 text-sm font-semibold text-stone-500">
                {area.href ? "Open the first live vocabulary entry →" : "Dedicated browse and detail experiences are planned for later Phase F slices."}
              </p>
            </>
          );

          return area.href ? (
            <Link
              key={area.title}
              href={{ pathname: area.href, query: learnerContextQuery }}
              className="rounded-3xl border border-orange-100 bg-paper p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >
              {content}
            </Link>
          ) : (
            <article key={area.title} className="rounded-3xl border border-orange-100 bg-paper p-6 shadow-soft">
              {content}
            </article>
          );
        })}
      </section>

      <section className="mt-10 rounded-[2rem] bg-cream p-6 sm:p-10">
        <h2 className="text-2xl font-bold">Keep learning from real resources</h2>
        <p className="mt-3 max-w-3xl leading-7 text-stone-600">
          While the Knowledge systems are being expanded, continue from published resources or reinforce what you learned through Practice. Your current language and level context is preserved when you move between these learner destinations.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={{ pathname: "/resources", query: learnerContextQuery }} className="rounded-full bg-cinnabar px-6 py-3 text-center font-semibold text-white shadow-soft">
            Browse Library
          </Link>
          <Link href={{ pathname: "/practice", query: learnerContextQuery }} className="rounded-full border border-orange-200 bg-paper px-6 py-3 text-center font-semibold text-cinnabar">
            Go to Practice
          </Link>
        </div>
      </section>
    </main>
  );
}
