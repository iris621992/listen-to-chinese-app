import Link from "next/link";
import { LessonCard } from "@/components/LessonCard";
import { VideoDiscoveryControls } from "@/components/VideoDiscoveryControls";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
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
    q?: string;
    duration?: string;
    sort?: string;
  }>;
};

type VideosCopy = {
  eyebrow: string;
  title: string;
  body: string;
  invalidTitle: string;
  invalidBody: string;
  invalidDiscoveryTitle: string;
  invalidDiscoveryBody: string;
  more: string;
  emptyTitle: string;
  emptyBody: string;
  noMatchesTitle: string;
  noMatchesBody: string;
};

const VIDEOS_COPY: Record<"en" | "vi", VideosCopy> = {
  en: {
    eyebrow: "VIDEOS",
    title: "Explore Chinese videos",
    body: "Find videos by title, duration, or level and choose what you want to watch.",
    invalidTitle: "Level selection unavailable",
    invalidBody: "Choose a valid Level in the header or select Level: All. Videos does not widen an invalid Level URL into an unfiltered result.",
    invalidDiscoveryTitle: "Video filters unavailable",
    invalidDiscoveryBody: "One or more search, duration, sort, or pagination values are invalid. Adjust the controls to continue.",
    more: "More videos",
    emptyTitle: "No published videos yet",
    emptyBody: "Videos matching this Level context will appear here when they are published.",
    noMatchesTitle: "No matching videos",
    noMatchesBody: "Try another title, duration, or Level.",
  },
  vi: {
    eyebrow: "VIDEO",
    title: "Khám phá video tiếng Trung",
    body: "Tìm video theo tiêu đề, thời lượng hoặc cấp độ và chọn nội dung bạn muốn xem.",
    invalidTitle: "Cấp độ đã chọn không khả dụng",
    invalidBody: "Hãy chọn một Cấp độ hợp lệ ở phần đầu trang hoặc chọn Cấp độ · Tất cả. Trang Video không tự mở rộng một URL có Cấp độ không hợp lệ thành kết quả không lọc.",
    invalidDiscoveryTitle: "Bộ lọc video không khả dụng",
    invalidDiscoveryBody: "Một hoặc nhiều giá trị tìm kiếm, thời lượng, sắp xếp hoặc phân trang không hợp lệ. Hãy điều chỉnh bộ lọc để tiếp tục.",
    more: "Xem thêm video",
    emptyTitle: "Chưa có video đã xuất bản",
    emptyBody: "Video phù hợp với ngữ cảnh Cấp độ này sẽ xuất hiện ở đây khi được xuất bản.",
    noMatchesTitle: "Không tìm thấy video phù hợp",
    noMatchesBody: "Hãy thử tiêu đề, thời lượng hoặc Cấp độ khác.",
  },
};

const videosCopyFor = (interfaceLocaleCode: string) =>
  interfaceLocaleCode === "vi" ? VIDEOS_COPY.vi : VIDEOS_COPY.en;

const durationControlValue = (value: string | undefined) =>
  value && ["under5", "5to10", "10to20", "20plus"].includes(value)
    ? value
    : "any";

const sortControlValue = (value: string | undefined) =>
  value === "oldest" ? "oldest" : "newest";

const discoveryContextQuery = (
  learnerContext: Record<string, string>,
  query: Awaited<Props["searchParams"]>,
) => ({
  ...learnerContext,
  ...(query.q?.trim() ? { q: query.q.trim() } : {}),
  ...(query.duration ? { duration: query.duration } : {}),
  ...(query.sort ? { sort: query.sort } : {}),
});

export default async function ResourcesPage({ searchParams }: Props) {
  const query = await searchParams;
  const interfaceLocale = resolveInterfaceLocale(query.uiLang, query.lang);
  const copy = videosCopyFor(interfaceLocale.code);
  const proficiency = parseProficiencyContext(query.levelSystem, query.level);
  const learnerContextQuery = preservedLearnerContextQuery(query);
  const discoveryQuery = discoveryContextQuery(learnerContextQuery, query);
  const discovery = await getLessonDiscoveryPage({
    cursor: query.cursor,
    levelSystemCode: query.levelSystem,
    levelCode: query.level,
    requestedLocale: query.lang,
    contentType: "video",
    searchQuery: query.q,
    durationFilter: query.duration,
    sort: query.sort,
  });
  const hasDiscoveryFilters = Boolean(query.q?.trim() || query.duration || query.sort);
  const invalidDiscovery = [
    "INVALID_SEARCH",
    "INVALID_DURATION",
    "INVALID_SORT",
    "INVALID_CURSOR",
  ].includes(discovery.status);

  return (
    <main
      className="learner-library-shell py-8 sm:py-10"
      lang={interfaceLocale.code}
      dir={interfaceLocale.direction}
    >
      <section className="rounded-[2rem] bg-paper p-6 shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cinnabar">{copy.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600 sm:text-lg">{copy.body}</p>
      </section>

      <VideoDiscoveryControls
        interfaceLocaleCode={interfaceLocale.code}
        initialSearchQuery={query.q ?? ""}
        initialDuration={durationControlValue(query.duration)}
        initialSort={sortControlValue(query.sort)}
      />

      {proficiency.kind === "INVALID" ? (
        <section className="mt-8 rounded-3xl border border-dashed border-orange-200 bg-paper p-10 text-center shadow-soft">
          <h2 className="text-2xl font-semibold">{copy.invalidTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">{copy.invalidBody}</p>
        </section>
      ) : invalidDiscovery ? (
        <section className="mt-8 rounded-3xl border border-dashed border-orange-200 bg-paper p-10 text-center shadow-soft">
          <h2 className="text-2xl font-semibold">{copy.invalidDiscoveryTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">{copy.invalidDiscoveryBody}</p>
        </section>
      ) : discovery.page.items.length > 0 ? (
        <>
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {discovery.page.items.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                learnerContextQuery={learnerContextQuery}
                interfaceLocaleCode={interfaceLocale.code}
              />
            ))}
          </section>
          {discovery.page.nextCursor ? (
            <div className="mt-8 flex justify-center">
              <Link
                href={{
                  pathname: "/resources",
                  query: {
                    ...discoveryQuery,
                    cursor: discovery.page.nextCursor,
                  },
                }}
                className="rounded-full border border-orange-200 bg-paper px-6 py-3 font-semibold text-cinnabar"
              >
                {copy.more}
              </Link>
            </div>
          ) : null}
        </>
      ) : (
        <section className="mt-8 rounded-3xl border border-dashed border-orange-200 bg-paper p-10 text-center shadow-soft">
          <h2 className="text-2xl font-semibold">
            {hasDiscoveryFilters ? copy.noMatchesTitle : copy.emptyTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">
            {hasDiscoveryFilters ? copy.noMatchesBody : copy.emptyBody}
          </p>
        </section>
      )}
    </main>
  );
}
