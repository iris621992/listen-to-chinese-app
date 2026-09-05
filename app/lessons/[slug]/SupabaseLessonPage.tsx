import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";
import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import { LessonMediaColumn } from "./LessonMediaColumn";
import {
  LearningContent,
  LearningDisplayInputs,
  LearningPanel,
  LearningToolbar,
  ResourceLearningStyles,
  type LearningTab,
} from "./LearningPanel";
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

  return (
    <main
      className="lesson-page-shell p4-resource-page mx-auto"
      data-content-type={contentType}
      lang={interfaceLocaleCode}
      dir={interfaceDirection}
    >
      {articleFamily ? (
        <section className="article-resource-shell">
          <header className={`resource-heading resource-heading--article ${interfaceTextAlign}`}>
            <h1 className="resource-title" dir="ltr">{lesson.title}</h1>
          </header>
          <LearningPanel
            lesson={lesson}
            labels={labels}
            interfaceDirection={interfaceDirection}
            interfaceTextAlign={interfaceTextAlign}
            supportTextAlign={supportTextAlign}
            activeTab={activeTab}
            learnerContextQuery={learnerContextQuery}
          />
        </section>
      ) : (
        <section className="video-view">
          <LearningDisplayInputs />
          <div className="video-head-grid">
            <header className={`resource-heading video-heading ${interfaceTextAlign}`}>
              <h1 className="resource-title" dir="ltr">{lesson.title}</h1>
            </header>
            <LearningToolbar
              lesson={lesson}
              labels={labels}
              interfaceDirection={interfaceDirection}
              activeTab={activeTab}
              learnerContextQuery={learnerContextQuery}
              layout="video"
            />
          </div>

          <div
            className="lesson-workspace"
            data-content-type={contentType}
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
              <LearningContent
                lesson={lesson}
                labels={labels}
                interfaceDirection={interfaceDirection}
                interfaceTextAlign={interfaceTextAlign}
                supportTextAlign={supportTextAlign}
                activeTab={activeTab}
                layout="video"
              />
            </div>
          </div>
        </section>
      )}

      <ResourceLearningStyles />

      <style>{`
        .p4-resource-page {
          width: min(1568px, calc(100% - 40px));
          max-width: none;
          margin-inline: auto;
          padding: 42px 0 64px;
        }

        .video-view,
        .article-resource-shell {
          width: 100%;
        }

        .video-head-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.95fr) minmax(420px, 1fr);
          gap: 22px;
          align-items: end;
          margin: 0 0 10px;
          min-height: 0;
        }

        .resource-heading {
          min-width: 0;
          margin: 0;
          padding: 0;
        }

        .resource-heading--article {
          width: min(100%, 790px);
          margin: 0 auto 10px;
        }

        .resource-title {
          max-width: 880px;
          margin: 0;
          color: #171a16;
          font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Noto Sans SC", Arial, sans-serif;
          font-size: 29px;
          font-weight: 700;
          line-height: 1.24;
          letter-spacing: -0.015em;
          -webkit-font-smoothing: antialiased;
          overflow-wrap: anywhere;
        }

        .p4-resource-page .lesson-workspace {
          display: grid;
          grid-template-columns: minmax(0, 1.95fr) minmax(420px, 1fr);
          gap: 22px;
          align-items: start;
          width: 100%;
          margin-top: 0;
        }

        .p4-resource-page .lesson-workspace[data-direction="rtl"] {
          direction: rtl;
        }

        .p4-resource-page .lesson-media-pane,
        .p4-resource-page .lesson-learning-pane {
          min-width: 0;
          width: 100%;
          margin-top: 0;
          align-self: start;
        }

        .p4-resource-page .lesson-media-card {
          position: sticky;
          top: 7rem;
          width: 100%;
          margin-top: 0;
          padding: 0;
        }

        .p4-resource-page .lesson-media-surface {
          width: 100%;
          padding: 12px;
          border: 1px solid #2e2925;
          border-radius: 18px;
          background: #211e1b;
          box-shadow: 0 16px 46px rgba(55, 52, 43, 0.08);
        }

        .p4-resource-page .intent-youtube-frame,
        .p4-resource-page .intent-youtube-trigger {
          border-radius: 14px;
        }

        .article-resource-shell {
          max-width: 1040px;
          margin-inline: auto;
        }

        @media (min-width: 1200px) {
          .p4-resource-page .learning-tab-button {
            font-size: 15px;
          }

          .p4-resource-page .script-option-button {
            font-size: 14px;
          }

          .p4-resource-page .video-learning {
            height: clamp(500px, calc(100vh - 230px), 780px);
            max-height: clamp(500px, calc(100vh - 230px), 780px);
          }
        }

        @media (min-width: 900px) and (max-width: 1199px) {
          .p4-resource-page {
            width: min(1360px, calc(100% - 48px));
          }

          .p4-resource-page .learning-tab-button {
            font-size: 14px;
          }

          .p4-resource-page .script-option-button {
            font-size: 13.5px;
          }

          .video-head-grid,
          .p4-resource-page .lesson-workspace {
            grid-template-columns: minmax(0, 1.45fr) minmax(380px, 1fr);
            gap: 18px;
          }

          .p4-resource-page .lesson-media-card {
            top: 6.25rem;
          }
        }

        @media (max-width: 899px) {
          .p4-resource-page {
            width: min(1360px, calc(100% - 40px));
            padding-top: 26px;
          }

          .video-head-grid {
            display: block;
            margin-bottom: 10px;
          }

          .p4-resource-page .lesson-workspace,
          .p4-resource-page .lesson-workspace[data-direction="rtl"] {
            display: grid;
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .p4-resource-page .lesson-media-card {
            position: static;
          }

          .resource-heading--article {
            margin-bottom: 10px;
          }
        }

        @media (max-width: 639px) {
          .p4-resource-page {
            width: calc(100% - 28px);
            padding: 26px 0 48px;
          }

          .resource-title {
            font-size: 25px;
          }
        }

        @media (max-width: 899px) and (orientation: landscape) and (max-height: 520px) {
          .p4-resource-page {
            padding-top: 18px;
          }

          .video-head-grid {
            margin-bottom: 10px;
          }
        }
      `}</style>
    </main>
  );
}
