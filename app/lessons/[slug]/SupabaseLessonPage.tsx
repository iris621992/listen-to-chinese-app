import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";
import { LessonMediaColumn } from "./LessonMediaColumn";
import { LearningPanel, type LearningTab } from "./LearningPanel";
import { labelsFor } from "./lessonUiLabels";

export function SupabaseLessonPage({
  lesson,
  activeTab,
  learnerContextQuery = {},
}: {
  lesson: SupabaseLessonDetail;
  activeTab: LearningTab;
  learnerContextQuery?: Record<string, string>;
}) {
  const labels = labelsFor(lesson.selectedCode);
  const isRtl = lesson.selectedDirection === "rtl";
  const localizedTextAlign = isRtl ? "text-right" : "";
  const segmentBlockLayout = isRtl ? "flex flex-col items-end" : "";
  const segmentTextStyle = isRtl ? { textAlign: "right" as const } : undefined;

  return (
    <main className="lesson-page-shell mx-auto max-w-[98rem] px-4 py-6 sm:px-6 sm:py-8">
      <section
        className="lesson-workspace"
        data-direction={lesson.selectedDirection}
      >
        <div className="lesson-media-pane">
          <LessonMediaColumn lesson={lesson} labels={labels} />
        </div>
        <div className="lesson-learning-pane">
          <LearningPanel
            lesson={lesson}
            labels={labels}
            localizedTextAlign={localizedTextAlign}
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
