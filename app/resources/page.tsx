import Link from "next/link";
import { LessonCard } from "@/components/LessonCard";
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
  }>;
};

type VideosCopy = {
  eyebrow: string;
  title: string;
  body: string;
  invalidTitle: string;
  invalidBody: string;
  more: string;
  emptyTitle: string;
  emptyBody: string;
};

const VIDEOS_COPY: Record<"en" | "vi", VideosCopy> = {
  en: {
    eyebrow: "VIDEOS",
    title: "Explore Chinese videos",
    body: "Browse published Chinese videos and choose what you want to watch. Videos are optional content, so you can also go directly to Knowledge or Practice whenever that is more useful.",
    invalidTitle: "Level selection unavailable",
    invalidBody: "Choose a valid Level in the header or select Level: All. Videos does not widen an invalid Level URL into an unfiltered result.",
    more: "More videos",
    emptyTitle: "No published videos yet",
    emptyBody: "Videos matching this Level context will appear here when they are published.",
  },
  vi: {
    eyebrow: "VIDEO",
    title: "Khám phá video tiếng Trung",
    body: "Duyệt các video tiếng Trung đã xuất bản và chọn nội dung bạn muốn xem. Video là nội dung tùy chọn; bạn cũng có thể đi thẳng vào Kiến thức hoặc Luyện tập khi phù hợp hơn.",
    invalidTitle: "Cấp độ đã chọn không khả dụng",
    invalidBody: "Hãy chọn một Cấp độ hợp lệ ở phần đầu trang hoặc chọn Cấp độ · Tất cả. Trang Video không tự mở rộng một URL có Cấp độ không hợp lệ thành kết quả không lọc.",
    more: "Xem thêm video",
    emptyTitle: "Chưa có video đã xuất bản",
    emptyBody: "Video phù hợp với ngữ cảnh Cấp độ này sẽ xuất hiện ở đây khi được xuất bản.",
  },
};

const videosCopyFor = (interfaceLocaleCode: string) =>
  interfaceLocaleCode === "vi" ? VIDEOS_COPY.vi : VIDEOS_COPY.en;

export default async function ResourcesPage({ searchParams }: Props) {
  const query = await searchParams;
  const interfaceLocale = resolveInterfaceLocale(query.uiLang, query.lang);
  const copy = videosCopyFor(interfaceLocale.code);
  const proficiency = parseProficiencyContext(query.levelSystem, query.level);
  const learnerContextQuery = preservedLearnerContextQuery(query);
  const discovery = await getLessonDiscoveryPage({
    cursor: query.cursor,
    levelSystemCode: query.levelSystem,
    levelCode: query.level,
    requestedLocale: query.lang,
    contentType: "video",
  });

  return (
    <main
      className="learner-library-shell py-10 sm:py-14"
      lang={interfaceLocale.code}
      dir={interfaceLocale.direction}
    >
      <section className="rounded-[2rem] bg-paper p-6 shadow-soft sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cinnabar">{copy.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-600">{copy.body}</p>
      </section>

      {proficiency.kind === "INVALID" ? (
        <section className="mt-10 rounded-3xl border border-dashed border-orange-200 bg-paper p-10 text-center shadow-soft">
          <h2 className="text-2xl font-semibold">{copy.invalidTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">{copy.invalidBody}</p>
        </section>
      ) : discovery.page.items.length > 0 ? (
        <>
          <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                    ...learnerContextQuery,
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
        <section className="mt-10 rounded-3xl border border-dashed border-orange-200 bg-paper p-10 text-center shadow-soft">
          <h2 className="text-2xl font-semibold">{copy.emptyTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">{copy.emptyBody}</p>
        </section>
      )}
    </main>
  );
}
