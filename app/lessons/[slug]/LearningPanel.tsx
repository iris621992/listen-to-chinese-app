import Link from "next/link";
import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";
import { ScriptTabContent } from "./ScriptTabContent";
import { VocabularyTabContent } from "./VocabularyTabContent";
import { PracticeTabContent } from "./PracticeTabContent";

export type LearningTab = "script" | "vocabulary" | "grammar" | "practice";

export const LEARNING_TABS: LearningTab[] = [
  "script",
  "vocabulary",
  "grammar",
  "practice",
];

export function learningTabFor(tab: string | undefined): LearningTab {
  if (tab === "main") return "script";
  return LEARNING_TABS.includes(tab as LearningTab)
    ? tab as LearningTab
    : "script";
}

type LearningPanelLabels = {
  resourceSections: string;
  scriptTab: string;
  vocabularyTab: string;
  grammarTab: string;
  practiceTab: string;
  showPronunciation: string;
  showTranslation: string;
  grammarComingSoon: string;
  translationMissing: (languageCode: string) => string;
  noLessonSegments: string;
  noVocabulary: string;
  details: string;
  hanzi: string;
  meaning: string;
  pronunciation: string;
  usage: string;
  grammarPattern: string;
  partOfSpeech: string;
  example: string;
  exampleTranslation: string;
  synonyms: string;
  antonyms: string;
  usageNotes: string;
  writingGuidancePlaceholder: string;
  exercise: string;
  noOptions: string;
  noExercises: string;
  exercisesUnavailable: string;
  openExerciseMedia: string;
  checkAnswer: string;
  checkingAnswer: string;
  answerCorrect: string;
  answerIncorrect: string;
  lessonUpdatedReload: string;
  answerCheckUnavailable: string;
};

const visuallyHiddenInputStyle = {
  position: "absolute" as const,
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden" as const,
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap" as const,
  border: 0,
};

function learningTabHref(
  slug: string,
  languageCode: string,
  tab: LearningTab,
  learnerContextQuery: Record<string, string>,
) {
  const query = new URLSearchParams({
    ...learnerContextQuery,
    lang: languageCode,
    tab,
  });
  return `/lessons/${slug}?${query.toString()}`;
}

function PlaceholderTabContent({
  message,
  interfaceTextAlign,
  interfaceDirection,
}: {
  message: string;
  interfaceTextAlign: string;
  interfaceDirection: InterfaceTextDirection;
}) {
  return (
    <div
      className={`resource-placeholder ${interfaceTextAlign}`}
      dir={interfaceDirection}
    >
      {message}
    </div>
  );
}

export function LearningPanel({
  lesson,
  labels,
  interfaceDirection,
  interfaceTextAlign,
  supportTextAlign,
  activeTab,
  learnerContextQuery,
}: {
  lesson: SupabaseLessonDetail;
  labels: LearningPanelLabels;
  interfaceDirection: InterfaceTextDirection;
  interfaceTextAlign: string;
  supportTextAlign: string;
  activeTab: LearningTab;
  learnerContextQuery: Record<string, string>;
}) {
  const articleFamily = lesson.contentType === "reading"
    || lesson.contentType === "listening"
    || lesson.contentType === "practice_only"
    || lesson.contentType === "review_set";
  const layout = articleFamily ? "article" : "video";
  const hrefFor = (tab: LearningTab) =>
    learningTabHref(lesson.slug, lesson.selectedCode, tab, learnerContextQuery);

  const practiceLabels = {
    exercise: labels.exercise,
    noOptions: labels.noOptions,
    noExercises: labels.noExercises,
    exercisesUnavailable: labels.exercisesUnavailable,
    openExerciseMedia: labels.openExerciseMedia,
    checkAnswer: labels.checkAnswer,
    checkingAnswer: labels.checkingAnswer,
    answerCorrect: labels.answerCorrect,
    answerIncorrect: labels.answerIncorrect,
    lessonUpdatedReload: labels.lessonUpdatedReload,
    answerCheckUnavailable: labels.answerCheckUnavailable,
  };

  return (
    <section
      className={`resource-learning-panel ${interfaceTextAlign}`}
      data-layout={layout}
      dir={interfaceDirection}
    >
      <input
        id="script-toggle-pinyin"
        style={visuallyHiddenInputStyle}
        type="checkbox"
        defaultChecked
      />
      <input
        id="script-toggle-translation"
        style={visuallyHiddenInputStyle}
        type="checkbox"
        defaultChecked
      />

      <div className="learning-toolbar">
        <nav className="learning-tabs" aria-label={labels.resourceSections}>
          {LEARNING_TABS.map((tab) => {
            const label = tab === "script"
              ? labels.scriptTab
              : tab === "vocabulary"
                ? labels.vocabularyTab
                : tab === "grammar"
                  ? labels.grammarTab
                  : labels.practiceTab;
            return (
              <Link
                key={tab}
                href={hrefFor(tab)}
                data-tab={tab}
                aria-current={activeTab === tab ? "page" : undefined}
                className="learning-tab-button"
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={`script-options ${activeTab === "script" ? "is-visible" : ""}`}>
          <label htmlFor="script-toggle-pinyin" className="script-option-button">
            <span className="script-option-state" aria-hidden="true" />
            <span>{labels.showPronunciation}</span>
          </label>
          <label htmlFor="script-toggle-translation" className="script-option-button">
            <span className="script-option-state" aria-hidden="true" />
            <span>{labels.showTranslation}</span>
          </label>
        </div>
      </div>

      <div className="learning-panels">
        {activeTab === "script" ? (
          <ScriptTabContent
            lesson={lesson}
            labels={labels}
            interfaceDirection={interfaceDirection}
            interfaceTextAlign={interfaceTextAlign}
            supportTextAlign={supportTextAlign}
          />
        ) : null}
        {activeTab === "vocabulary" ? (
          <VocabularyTabContent
            lesson={lesson}
            labels={labels}
            interfaceDirection={interfaceDirection}
            interfaceTextAlign={interfaceTextAlign}
            supportTextAlign={supportTextAlign}
          />
        ) : null}
        {activeTab === "grammar" ? (
          <PlaceholderTabContent
            message={labels.grammarComingSoon}
            interfaceTextAlign={interfaceTextAlign}
            interfaceDirection={interfaceDirection}
          />
        ) : null}
        {activeTab === "practice" ? (
          <PracticeTabContent
            lesson={lesson}
            labels={practiceLabels}
            interfaceDirection={interfaceDirection}
            interfaceTextAlign={interfaceTextAlign}
          />
        ) : null}
      </div>

      <style>{`
        .resource-learning-panel {
          --resource-article-width: 49.375rem;
          width: 100%;
          min-width: 0;
          overflow: hidden;
          border: 1px solid var(--border-subtle);
          border-radius: 18px;
          background: var(--surface-raised);
          color: var(--text-primary);
        }

        .learning-toolbar {
          padding: 18px 20px 14px;
        }

        .resource-learning-panel[data-layout="video"] .learning-toolbar {
          min-height: 8rem;
        }

        .learning-tabs {
          min-width: 0;
        }

        .resource-learning-panel[data-layout="video"] .learning-tabs {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 4px;
          width: 100%;
        }

        .resource-learning-panel[data-layout="article"] .learning-toolbar {
          width: min(100%, var(--resource-article-width));
          margin-inline: auto;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .resource-learning-panel[data-layout="article"] .learning-tabs {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 0 1 auto;
        }

        .learning-tab-button {
          position: relative;
          min-width: 0;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 9px;
          background: transparent;
          padding: 0 8px;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 650;
          white-space: nowrap;
        }

        .learning-tab-button:hover {
          background: var(--surface-subtle);
        }

        .learning-tab-button[aria-current="page"] {
          background: #f1f5ee;
          color: var(--text-primary);
          font-weight: 800;
        }

        .learning-tab-button[aria-current="page"]::after {
          content: "";
          position: absolute;
          inset-inline: 12px;
          bottom: 3px;
          height: 3px;
          border-radius: 999px;
          background: var(--interactive-secondary);
        }

        .script-options {
          display: none;
          min-width: 0;
          align-items: center;
          gap: 7px;
        }

        .script-options.is-visible {
          display: flex;
        }

        .resource-learning-panel[data-layout="video"] .script-options {
          margin-top: 7px;
          justify-content: flex-start;
        }

        .resource-learning-panel[data-layout="article"] .script-options {
          margin-inline-start: auto;
          justify-content: flex-end;
        }

        .script-option-button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid var(--border-subtle);
          border-radius: 9px;
          background: var(--surface-raised);
          padding: 0 11px;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
        }

        .script-option-state::before {
          content: "○";
          display: inline-block;
          min-width: 1em;
          color: var(--text-muted);
          font-size: 0.8em;
          line-height: 1;
        }

        #script-toggle-pinyin:checked ~ .learning-toolbar label[for="script-toggle-pinyin"],
        #script-toggle-translation:checked ~ .learning-toolbar label[for="script-toggle-translation"] {
          border-color: #cdd8c8;
          background: #f1f5ee;
          color: var(--interactive-primary);
        }

        #script-toggle-pinyin:checked ~ .learning-toolbar label[for="script-toggle-pinyin"] .script-option-state::before,
        #script-toggle-translation:checked ~ .learning-toolbar label[for="script-toggle-translation"] .script-option-state::before {
          content: "✓";
          color: var(--interactive-primary);
          font-weight: 900;
        }

        #script-toggle-pinyin:focus-visible ~ .learning-toolbar label[for="script-toggle-pinyin"],
        #script-toggle-translation:focus-visible ~ .learning-toolbar label[for="script-toggle-translation"] {
          outline: 3px solid var(--focus-ring);
          outline-offset: 3px;
        }

        .learning-panels {
          min-width: 0;
          border-top: 1px solid var(--border-subtle);
          padding: 14px 20px 20px;
        }

        .resource-learning-panel[data-layout="video"] .learning-panels {
          max-height: calc(100vh - 15rem);
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
        }

        .resource-learning-panel[data-layout="article"] {
          padding: 16px 0 24px;
        }

        .resource-learning-panel[data-layout="article"] .learning-toolbar {
          padding: 0 0 14px;
        }

        .resource-learning-panel[data-layout="article"] .learning-panels {
          width: min(100%, var(--resource-article-width));
          margin-inline: auto;
          border-top: 0;
          padding: 14px 0 0;
          overflow: visible;
        }

        .learning-panels::-webkit-scrollbar {
          width: 8px;
        }

        .learning-panels::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgba(89, 106, 78, 0.38);
        }

        .script-lines {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .script-sentence {
          min-width: 0;
          border-radius: 12px;
          padding: 13px 8px;
        }

        .resource-learning-panel[data-layout="article"] .script-sentence {
          padding-top: 16px;
          padding-bottom: 16px;
        }

        .resource-chinese-line {
          margin: 0;
          color: var(--text-primary);
          font-family: KaiTi, "Kaiti SC", STKaiti, KaiTi_GB2312, FangSong, "Noto Serif CJK SC", serif;
          font-size: 1.22rem;
          font-weight: 500;
          line-height: 1.72;
          letter-spacing: 0.012em;
          overflow-wrap: anywhere;
        }

        .resource-learning-panel[data-layout="article"] .resource-chinese-line {
          font-size: 1.38rem;
          line-height: 1.78;
        }

        .resource-pinyin-line {
          margin: 3px 0 0;
          color: #a4653f;
          font-size: 0.84rem;
          font-weight: 500;
          line-height: 1.55;
        }

        .resource-translation-line {
          margin-top: 5px;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 450;
          line-height: 1.62;
        }

        #script-toggle-pinyin:not(:checked) ~ .learning-panels .pinyin-row {
          display: none;
        }

        #script-toggle-translation:not(:checked) ~ .learning-panels .translation-row {
          display: none;
        }

        .resource-placeholder {
          min-height: 140px;
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          background: var(--surface-subtle);
          padding: 20px;
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.65;
        }

        .vocabulary-inner-tab-input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .vocabulary-inner-tab-panel {
          display: none;
        }

        .vocabulary-details-tab-input:checked ~ .vocabulary-inner-tab-panels .vocabulary-details-panel,
        .vocabulary-hanzi-tab-input:checked ~ .vocabulary-inner-tab-panels .vocabulary-hanzi-panel {
          display: block;
        }

        .vocabulary-details-tab-input:focus-visible ~ .vocabulary-inner-tab-controls .vocabulary-details-tab-label,
        .vocabulary-hanzi-tab-input:focus-visible ~ .vocabulary-inner-tab-controls .vocabulary-hanzi-tab-label {
          outline: 3px solid var(--focus-ring);
          outline-offset: 3px;
        }

        @media (min-width: 900px) and (max-width: 1199px) {
          .resource-learning-panel[data-layout="video"] .learning-tabs {
            gap: 3px;
          }

          .resource-learning-panel[data-layout="video"] .learning-tab-button {
            padding-inline: 4px;
            font-size: 0.8125rem;
          }

          .resource-learning-panel[data-layout="article"] .learning-toolbar {
            gap: 12px;
          }

          .resource-learning-panel[data-layout="article"] .learning-tabs {
            gap: 10px;
          }
        }

        @media (max-width: 899px) {
          .resource-learning-panel {
            overflow: visible;
          }

          .resource-learning-panel[data-layout="video"] .learning-toolbar {
            min-height: 0;
          }

          .resource-learning-panel[data-layout="article"] {
            padding: 0;
          }

          .resource-learning-panel[data-layout="article"] .learning-toolbar,
          .learning-toolbar {
            width: 100%;
            margin: 0;
            display: block;
            padding: 16px 16px 12px;
          }

          .resource-learning-panel[data-layout="article"] .learning-tabs,
          .resource-learning-panel[data-layout="video"] .learning-tabs {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 5px;
            width: 100%;
          }

          .resource-learning-panel[data-layout="article"] .script-options,
          .resource-learning-panel[data-layout="video"] .script-options {
            margin: 8px 0 0;
            justify-content: flex-start;
          }

          .resource-learning-panel[data-layout="video"] .learning-panels,
          .resource-learning-panel[data-layout="article"] .learning-panels,
          .learning-panels {
            width: 100%;
            max-height: none;
            margin: 0;
            overflow: visible;
            border-top: 1px solid var(--border-subtle);
            padding: 12px 16px 16px;
            scrollbar-gutter: auto;
          }
        }

        @media (max-width: 639px) {
          .resource-learning-panel[data-layout="article"] .learning-tabs,
          .resource-learning-panel[data-layout="video"] .learning-tabs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .script-options.is-visible {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            width: 100%;
            gap: 6px;
          }

          .script-option-button {
            width: 100%;
            min-width: 0;
            padding-inline: 8px;
          }

          .resource-chinese-line,
          .resource-learning-panel[data-layout="article"] .resource-chinese-line {
            font-size: 1.2rem;
            line-height: 1.72;
          }
        }

        @media (max-width: 899px) and (orientation: landscape) and (max-height: 520px) {
          .learning-toolbar {
            padding-top: 12px;
            padding-bottom: 10px;
          }

          .learning-panels {
            padding-top: 10px;
          }
        }
      `}</style>
    </section>
  );
}
