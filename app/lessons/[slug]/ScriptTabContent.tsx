import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";

type ScriptTabContentLabels = {
  translationMissing: (languageCode: string) => string;
  noLessonSegments: string;
};

export function ScriptTabContent({
  lesson,
  labels,
  interfaceDirection,
  interfaceTextAlign,
  supportTextAlign,
  segmentBlockLayout,
  segmentTextStyle,
}: {
  lesson: SupabaseLessonDetail;
  labels: ScriptTabContentLabels;
  interfaceDirection: InterfaceTextDirection;
  interfaceTextAlign: string;
  supportTextAlign: string;
  segmentBlockLayout: string;
  segmentTextStyle: { textAlign: "right" } | undefined;
}) {
  return (
    <>
      <div className="script-lines space-y-3 pr-2">
        {lesson.segments.length > 0 ? lesson.segments.map((segment) => (
          <article key={segment.id} className={`py-1.5 ${supportTextAlign} ${segmentBlockLayout}`}>
            <p className={`chinese-text max-w-full text-lg font-medium leading-snug ${supportTextAlign}`} dir="ltr" style={segmentTextStyle}>{segment.chineseText}</p>
            <p className={`pinyin-row mt-1 max-w-full text-base font-medium leading-snug text-cinnabar ${supportTextAlign}`} dir="ltr" style={segmentTextStyle}>{segment.phoneticText}</p>
            {segment.translation ? (
              <div
                className={`translation-row mt-1.5 max-w-full text-base font-medium leading-snug text-stone-700 ${supportTextAlign}`}
                dir={lesson.selectedDirection}
              >
                {segment.translation}
              </div>
            ) : (
              <div
                className={`translation-row mt-1.5 max-w-full text-base font-medium leading-snug text-stone-700 ${interfaceTextAlign}`}
                dir={interfaceDirection}
              >
                {labels.translationMissing(lesson.selectedCode)}
              </div>
            )}
          </article>
        )) : (
          <p
            className={`rounded-3xl bg-cream p-5 text-stone-600 ${interfaceTextAlign}`}
            dir={interfaceDirection}
          >
            {labels.noLessonSegments}
          </p>
        )}
      </div>
    </>
  );
}
