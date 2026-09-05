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
    <main
      className="lesson-page-shell p4-resource-page mx-auto max-w-[98rem] px-4 py-6 sm:px-6 sm:py-8"
      lang={interfaceLocaleCode}
      dir={interfaceDirection}
    >
      <header className={`resource-identity ${interfaceTextAlign}`}>
        <p className="resource-identity-eyebrow">{labels.resourceLabel}</p>
        <h1 className="chinese-text" dir="ltr">{lesson.title}</h1>
        <div className="resource-identity-meta" aria-label={labels.supportLanguageLabel}>
          <span>{labels.supportLanguageLabel}</span>
          <strong dir="ltr">{lesson.selectedCode.toUpperCase()}</strong>
        </div>
      </header>

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

      <style>{`
        .p4-resource-page {
          width: min(100%, 98rem);
        }

        .resource-identity {
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          padding: 0.5rem 0 1.25rem;
        }

        .resource-identity-eyebrow {
          margin: 0;
          color: var(--interactive-primary);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .resource-identity h1 {
          max-width: 62rem;
          margin: 0.45rem 0 0;
          color: var(--text-primary);
          font-size: clamp(2rem, 4vw, 3.4rem);
          line-height: 1.08;
          overflow-wrap: anywhere;
        }

        .resource-identity-meta {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.9rem;
          border: 1px solid var(--border-subtle);
          border-radius: 999px;
          background: var(--surface-raised);
          padding: 0.45rem 0.8rem;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .resource-identity-meta strong {
          color: var(--interactive-primary);
          letter-spacing: 0.06em;
        }

        .p4-resource-page .lesson-workspace {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
          align-items: start;
          gap: 1.5rem;
        }

        .p4-resource-page .lesson-workspace[data-direction="rtl"] {
          direction: rtl;
        }

        .p4-resource-page .lesson-media-pane,
        .p4-resource-page .lesson-learning-pane {
          min-width: 0;
          width: 100%;
        }

        .p4-resource-page .lesson-media-card {
          position: sticky;
          top: 7rem;
        }

        @media (min-width: 900px) and (max-width: 1199px) {
          .p4-resource-page .lesson-workspace {
            grid-template-columns: minmax(0, 1.25fr) minmax(300px, 1fr);
            gap: 1rem;
          }

          .p4-resource-page .lesson-media-card {
            top: 6.25rem;
          }
        }

        @media (min-width: 600px) and (max-width: 899px) and (orientation: portrait) {
          .p4-resource-page .lesson-workspace,
          .p4-resource-page .lesson-workspace[data-direction="rtl"] {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }

          .p4-resource-page .lesson-media-card {
            position: static;
          }
        }

        @media (max-width: 899px) and (orientation: landscape) and (max-height: 520px) {
          .p4-resource-page {
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
          }

          .resource-identity {
            margin-bottom: 1rem;
            padding-bottom: 0.8rem;
          }

          .resource-identity h1 {
            font-size: clamp(1.75rem, 5vw, 2.35rem);
          }

          .p4-resource-page .lesson-workspace,
          .p4-resource-page .lesson-workspace[data-direction="rtl"] {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .p4-resource-page .lesson-media-card {
            position: static;
          }
        }

        @media (max-width: 599px) {
          .p4-resource-page {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }

          .resource-identity {
            margin-bottom: 1rem;
            padding-top: 0;
            padding-bottom: 1rem;
          }

          .resource-identity h1 {
            font-size: clamp(1.8rem, 9vw, 2.45rem);
          }

          .p4-resource-page .lesson-workspace,
          .p4-resource-page .lesson-workspace[data-direction="rtl"] {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .p4-resource-page .lesson-media-card {
            position: static;
          }
        }
      `}</style>
    </main>
  );
}
