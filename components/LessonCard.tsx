import Link from "next/link";
import type { LessonDiscoverySummary } from "@/lib/lessonDiscovery";
import { formatProficiencyLabel } from "@/lib/proficiencyContext";

const durationLabel = (
  seconds: number | null,
  interfaceLocaleCode: string,
) => {
  if (seconds === null) {
    return interfaceLocaleCode === "vi" ? "Tự học" : "Self-paced";
  }
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return interfaceLocaleCode === "vi" ? `${minutes} phút` : `${minutes} min`;
};

const videoPlaceholderLabel = (interfaceLocaleCode: string) =>
  interfaceLocaleCode === "vi" ? "Video" : "Video";

export function LessonCard({
  lesson,
  learnerContextQuery = {},
  interfaceLocaleCode = "en",
}: {
  lesson: LessonDiscoverySummary;
  learnerContextQuery?: Record<string, string>;
  interfaceLocaleCode?: string;
}) {
  const levelLabel = lesson.levelSystemCode && lesson.levelCode
    ? formatProficiencyLabel(lesson.levelSystemCode, lesson.levelCode)
    : null;

  return (
    <Link
      href={{ pathname: `/lessons/${lesson.slug}`, query: learnerContextQuery }}
      className="group block overflow-hidden rounded-[1.6rem] border border-orange-100 bg-paper shadow-soft transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-stone-100">
        {lesson.thumbnailUrl ? (
          // Explicit thumbnail_url is the public thumbnail authority for discovery.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lesson.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
            <div className="flex flex-col items-center gap-3 text-cinnabar/75">
              <span className="flex size-14 items-center justify-center rounded-full bg-white/80 shadow-sm">
                <span className="ml-1 block h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-current" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.2em]">
                {videoPlaceholderLabel(interfaceLocaleCode)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        <h3 className="chinese-text text-2xl font-semibold leading-snug text-stone-900">
          {lesson.titleOriginal}
        </h3>
        {lesson.titleSupport ? (
          <p className="mt-1 line-clamp-2 text-base font-medium leading-6 text-stone-600">
            {lesson.titleSupport}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          {levelLabel ? (
            <span className="rounded-full bg-orange-100 px-3 py-1.5 text-cinnabar">{levelLabel}</span>
          ) : null}
          <span className="rounded-full bg-stone-100 px-3 py-1.5 text-stone-600">
            {durationLabel(lesson.durationSeconds, interfaceLocaleCode)}
          </span>
        </div>
      </div>
    </Link>
  );
}
