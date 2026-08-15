import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";

type ScriptTabContentLabels = {
  translationMissing: (languageCode: string) => string;
  noLessonSegments: string;
};

export function ScriptTabContent({
  lesson,
  labels,
  localizedTextAlign,
  segmentBlockLayout,
  segmentTextStyle,
}: {
  lesson: SupabaseLessonDetail;
  labels: ScriptTabContentLabels;
  localizedTextAlign: string;
  segmentBlockLayout: string;
  segmentTextStyle: { textAlign: "right" } | undefined;
}) {
  return (
    <>
      <div className="script-lines space-y-3 pr-2">
        {lesson.segments.length > 0 ? lesson.segments.map((segment) => (
          <article key={segment.id} className={`py-1.5 ${localizedTextAlign} ${segmentBlockLayout}`}>
            <p className={`chinese-text max-w-full text-lg font-medium leading-snug ${localizedTextAlign}`} dir="ltr" style={segmentTextStyle}>{segment.chineseText}</p>
            <p className={`pinyin-row mt-1 max-w-full text-base font-medium leading-snug text-cinnabar ${localizedTextAlign}`} dir="ltr" style={segmentTextStyle}>{segment.phoneticText}</p>
            <div className={`translation-row mt-1.5 max-w-full text-base font-medium leading-snug text-stone-700 ${localizedTextAlign}`} dir={lesson.selectedDirection}>
              {segment.translation ?? labels.translationMissing(lesson.selectedCode)}
            </div>
          </article>
        )) : <p className={`rounded-3xl bg-cream p-5 text-stone-600 ${localizedTextAlign}`} dir={lesson.selectedDirection}>{labels.noLessonSegments}</p>}
      </div>
    </>
  );
}
