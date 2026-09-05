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
  const contentType = lesson.contentType ?? "unknown";
  const articleFamily = contentType === "reading"
    || contentType === "listening"
    || contentType === "practice_only"
    || contentType === "review_set";

  const learningPanel = (
    <LearningPanel
      lesson={lesson}
      labels={labels}
      interfaceDirection={interfaceDirection}
      interfaceTextAlign={interfaceTextAlign}
      supportTextAlign={supportTextAlign}
      activeTab={activeTab}
      learnerContextQuery={learnerContextQuery}
    />
  );

  return (
    <main
      className="lesson-page-shell p4-resource-page mx-auto px-4 py-6 sm:px-6 sm:py-8"
      data-content-type={contentType}
      lang={interfaceLocaleCode}
      dir={interfaceDirection}
    >
      {articleFamily ? (
        <section className="article-resource-shell">
          <header className={`resource-identity resource-identity--article ${interfaceTextAlign}`}>
            <h1 className="resource-title" dir="ltr">{lesson.title}</h1>
          </header>
          {learningPanel}
        </section>
      ) : (
        <section
          className="lesson-workspace"
          data-content-type={contentType}
          data-direction={interfaceDirection}
        >
          <div className="lesson-media-pane">
            <header className={`resource-identity resource-identity--video ${interfaceTextAlign}`}>
              <h1 className="resource-title" dir="ltr">{lesson.title}</h1>
            </header>
            <LessonMediaColumn
              lesson={lesson}
              labels={labels}
              interfaceDirection={interfaceDirection}
            />
          </div>
          <div className="lesson-learning-pane">
            {learningPanel}
          </div>
        </section>
      )}

      <style>{`
        .p4-resource-page {
          width: min(100%, 85rem);
        }

        .resource-identity {
          min-width: 0;
        }

        .resource-identity--video {
          min-height: 8rem;
          display: flex;
          align-items: flex-start;
          padding: 18px 2px 14px;
        }

        .resource-identity--article {
          width: min(100%, 65rem);
          margin: 0 auto 18px;
          padding: 2px 2px 0;
        }

        .resource-title {
          max-width: 52rem;
          margin: 0;
          color: var(--text-primary);
          font-family: "Noto Serif CJK SC", "Songti SC", SimSun, Georgia, serif;
          font-size: clamp(1.75rem, 2.2vw, 2rem);
          font-weight: 700;
          line-height: 1.22;
          letter-spacing: -0.015em;
          overflow-wrap: anywhere;
        }

        .p4-resource-page .lesson-workspace {
          display: grid;
          grid-template-columns: minmax(0, 1.95fr) minmax(380px, 1fr);
          align-items: start;
          gap: 22px;
          width: 100%;
        }

        .p4-resource-page .lesson-workspace[data-direction="rtl"] {
          direction: rtl;
        }

        .p4-resource-page .lesson-media-pane,
        .p4-resource-page .lesson-learning-pane {
          min-width: 0;
          width: 100%;
        }

        .p4-resource-page .lesson-media-pane {
          display: flex;
          flex-direction: column;
        }

        .p4-resource-page .lesson-media-card {
          position: sticky;
          top: 7rem;
          width: 100%;
        }

        .p4-resource-page .lesson-media-surface {
          width: 100%;
          border-radius: 18px;
          background: #211e1b;
          padding: 12px;
          box-shadow: 0 16px 46px rgba(55, 52, 43, 0.08);
        }

        .p4-resource-page .intent-youtube-frame,
        .p4-resource-page .intent-youtube-trigger {
          border-radius: 14px;
        }

        .article-resource-shell {
          width: min(100%, 65rem);
          margin-inline: auto;
        }

        @media (min-width: 900px) and (max-width: 1199px) {
          .p4-resource-page .lesson-workspace {
            grid-template-columns: minmax(0, 1.45fr) minmax(360px, 1fr);
            gap: 18px;
          }

          .p4-resource-page .lesson-media-card {
            top: 6.25rem;
          }
        }

        @media (max-width: 899px) {
          .p4-resource-page .lesson-workspace,
          .p4-resource-page .lesson-workspace[data-direction="rtl"] {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .resource-identity--video {
            min-height: 0;
            padding: 0 2px 2px;
          }

          .resource-identity--article {
            margin-bottom: 14px;
          }

          .p4-resource-page .lesson-media-card {
            position: static;
          }

          .p4-resource-page .lesson-media-pane,
          .p4-resource-page .lesson-learning-pane {
            width: 100%;
          }
        }

        @media (max-width: 599px) {
          .p4-resource-page {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }

          .resource-title {
            font-size: clamp(1.65rem, 8vw, 1.9rem);
          }
        }

        @media (max-width: 899px) and (orientation: landscape) and (max-height: 520px) {
          .p4-resource-page {
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
          }

          .p4-resource-page .lesson-workspace,
          .p4-resource-page .lesson-workspace[data-direction="rtl"] {
            gap: 12px;
          }

          .resource-title {
            font-size: 1.7rem;
          }
        }
      `}</style>
    </main>
  );
}
