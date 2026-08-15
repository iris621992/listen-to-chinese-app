import Link from "next/link";
import type { Lesson } from "@/lib/lessons";

export function StaticLessonPage({ lesson }: { lesson: Lesson }) {
  const freeExercises = lesson.exercises.filter((exercise) => !exercise.locked);
  const lockedExercises = lesson.exercises.filter((exercise) => exercise.locked);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] bg-stone-900 p-6 text-white shadow-soft">
          <div className="flex aspect-video items-center justify-center rounded-3xl border border-white/10 bg-stone-800 text-center">
            <div>
              <p className="text-5xl">▶</p>
              <p className="mt-3 text-sm text-stone-300">YouTube embed placeholder</p>
            </div>
          </div>
        </div>
        <div className="rounded-[2rem] bg-paper p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-cinnabar">HSK{lesson.hsk}</span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-600">{lesson.duration}</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{lesson.series}</span>
          </div>
          <h1 className="chinese-text mt-5 text-4xl font-bold">{lesson.chineseTitle}</h1>
          <p className="mt-2 text-2xl font-semibold text-stone-700">{lesson.englishTitle}</p>
          <p className="mt-4 leading-7 text-stone-600">{lesson.description}</p>
          <button className="mt-6 rounded-full border border-orange-200 bg-cream px-5 py-3 font-semibold text-cinnabar">Audio download placeholder</button>
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] bg-paper p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-bold">Script</h2>
          <div className="flex flex-wrap gap-2">
            {["Chinese Only", "Chinese + Pinyin", "Full"].map((mode) => <button key={mode} className="rounded-full border border-orange-200 bg-cream px-4 py-2 text-sm font-semibold text-stone-700">{mode}</button>)}
          </div>
        </div>
        <div className="mt-6 divide-y divide-orange-100">
          {lesson.script.map((line) => (
            <div key={line.chinese} className="py-5">
              <p className="chinese-text text-2xl font-semibold">{line.chinese}</p>
              <p className="mt-2 text-cinnabar">{line.pinyin}</p>
              <p className="mt-1 text-stone-600">{line.english}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div className="rounded-[2rem] bg-paper p-6 shadow-soft sm:p-8">
          <h2 className="text-3xl font-bold">Practice</h2>
          <div className="mt-6 space-y-4">
            {freeExercises.map((exercise, index) => <div key={exercise.prompt} className="rounded-3xl bg-cream p-5"><p className="font-semibold">{index + 1}. {exercise.prompt}</p><p className="mt-2 text-sm text-stone-500">Answer: {exercise.answer}</p></div>)}
            {lockedExercises.map((exercise, index) => <div key={exercise.prompt} className="rounded-3xl border border-dashed border-orange-200 bg-orange-50 p-5 opacity-80"><p className="font-semibold">🔒 Member exercise {index + 1}: {exercise.prompt}</p><p className="mt-2 text-sm text-stone-500">Unlock for full practice and explanations.</p></div>)}
          </div>
        </div>
        <aside className="rounded-[2rem] bg-cinnabar p-6 text-white shadow-soft sm:p-8">
          <h2 className="text-2xl font-bold">Want more practice?</h2>
          <p className="mt-3 leading-7 text-orange-50">Members get full exercises, answer explanations, and review practice for each lesson.</p>
          <Link href="/membership" className="mt-6 inline-block rounded-full bg-white px-5 py-3 font-semibold text-cinnabar">View membership</Link>
        </aside>
      </section>
    </main>
  );
}
