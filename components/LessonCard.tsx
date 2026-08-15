import Link from "next/link";
import type { LessonDiscoverySummary } from "@/lib/lessonDiscovery";
import { formatProficiencyLabel } from "@/lib/proficiencyContext";

const durationLabel = (seconds: number | null) => {
  if (seconds === null) return "Self-paced";
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `${minutes} min`;
};

export function LessonCard({
  lesson,
  learnerContextQuery = {},
}: {
  lesson: LessonDiscoverySummary;
  learnerContextQuery?: Record<string, string>;
}) {
  const levelLabel = lesson.levelSystemCode && lesson.levelCode
    ? formatProficiencyLabel(lesson.levelSystemCode, lesson.levelCode)
    : null;

  return (
    <Link
      href={{ pathname: `/lessons/${lesson.slug}`, query: learnerContextQuery }}
      className="block rounded-3xl border border-orange-100 bg-paper p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
        {levelLabel ? (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-cinnabar">{levelLabel}</span>
        ) : null}
        <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-600">{durationLabel(lesson.durationSeconds)}</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{lesson.contentType.replace("_", " ")}</span>
      </div>
      <h3 className="chinese-text text-2xl font-semibold">{lesson.titleOriginal}</h3>
      {lesson.titleSupport ? <p className="mt-1 text-lg font-medium text-stone-700">{lesson.titleSupport}</p> : null}
    </Link>
  );
}
