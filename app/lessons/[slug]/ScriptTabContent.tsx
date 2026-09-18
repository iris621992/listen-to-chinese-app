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
}: {
  lesson: SupabaseLessonDetail;
  labels: ScriptTabContentLabels;
  interfaceDirection: InterfaceTextDirection;
  interfaceTextAlign: string;
  supportTextAlign: string;
}) {
  return (
    <div className="script-lines">
      {lesson.segments.length > 0 ? lesson.segments.map((segment) => (
        <article key={segment.id} className="script-sentence">
          <p className="resource-chinese-line chinese-text" dir="ltr">
            {segment.chineseText}
          </p>
          <p className="resource-pinyin-line pinyin-row" dir="ltr">
            {segment.phoneticText}
          </p>
          {segment.translation ? (
            <div
              className={`resource-translation-line translation-row ${supportTextAlign}`}
              dir={lesson.selectedDirection}
            >
              {segment.translation}
            </div>
          ) : (
            <div
              className={`resource-translation-line translation-row ${interfaceTextAlign}`}
              dir={interfaceDirection}
            >
              {labels.translationMissing(lesson.selectedCode)}
            </div>
          )}
        </article>
      )) : (
        <p
          className={`resource-placeholder ${interfaceTextAlign}`}
          dir={interfaceDirection}
        >
          {labels.noLessonSegments}
        </p>
      )}
    </div>
  );
}
