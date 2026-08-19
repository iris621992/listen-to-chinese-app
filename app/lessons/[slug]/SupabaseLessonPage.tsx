import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";
import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import { LessonMediaColumn } from "./LessonMediaColumn";
import { LearningPanel, type LearningTab } from "./LearningPanel";
import { labelsFor } from "./lessonUiLabels";

export function SupabaseLessonPage({
  lesson,
  activeTab,
  learnerContextQuery = {},
  interfaceLocaleCode,
  interfaceDirection,
}: {
  lesson: SupabaseLessonDetail;
  activeTab: LearningTab;
  learnerContextQuery?: Record<string, string>;
  interfaceLocaleCode: string;
  interfaceDirection: InterfaceTextDirection;
}) {
  const labels = labelsFor(interfaceLocaleCode);
  const interfaceTextAlign = interfaceDirection === "rtl"
    ? "text-right"
    : "text-left";
  const supportTextAlign = lesson.selectedDirection === "rtl"
    ? "text-right"
    : "text-left";
  const segmentBlockLayout = lesson.selectedDirection === "rtl"
    ? "flex flex-col items-end"
    : "";
  const segmentTextStyle = lesson.selectedDirection === "rtl"
    ? { textAlign: "right" as const }
    : undefined;

  return (
    <main className="lesson-page-shell mx-auto max-w-[98rem] px-4 py-6 sm:px-6 sm:py-8">
      <section
        className="lesson-workspace"
        data-direction={interfaceDirection}
      >
        <div className="lesson-media-pane">
          <LessonMediaColumn
            lesson={lesson}
            labels={labels}
            interfaceDirection={interfaceDirection}
          />
        </div>
        <div className="lesson-learning-pane">
          <LearningPanel
            lesson={lesson}
            labels={labels}
            interfaceDirection={interfaceDirection}
            interfaceTextAlign={interfaceTextAlign}
            supportTextAlign={supportTextAlign}
            segmentBlockLayout={segmentBlockLayout}
            segmentTextStyle={segmentTextStyle}
            activeTab={activeTab}
            learnerContextQuery={learnerContextQuery}
          />
        </div>
      </section>
    </main>
  );
}
