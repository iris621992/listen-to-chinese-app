import Link from "next/link";
import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";
import { ScriptTabContent } from "./ScriptTabContent";
import { VocabularyTabContent } from "./VocabularyTabContent";
import { PracticeTabContent } from "./PracticeTabContent";

export type LearningTab = "script" | "vocabulary" | "grammar" | "practice";
export type LearningLayout = "video" | "article";

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

export function LearningDisplayInputs() {
  return (
    <>
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
    </>
  );
}

export function LearningToolbar({
  lesson,
  labels,
  interfaceDirection,
  activeTab,
  learnerContextQuery,
  layout,
}: {
  lesson: SupabaseLessonDetail;
  labels: LearningPanelLabels;
  interfaceDirection: InterfaceTextDirection;
  activeTab: LearningTab;
  learnerContextQuery: Record<string, string>;
  layout: LearningLayout;
}) {
  const hrefFor = (tab: LearningTab) =>
    learningTabHref(lesson.slug, lesson.selectedCode, tab, learnerContextQuery);
  const pronunciationLabel = labels.showPronunciation === "Pronunciation"
    ? "Pinyin"
    : labels.showPronunciation;

  return (
    <div
      className={`learning-toolbar ${layout === "video" ? "video-controls" : "reading-top"}`}
      dir={interfaceDirection}
    >
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
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={`script-options ${activeTab === "script" ? "is-visible" : ""}`}>
        <label htmlFor="script-toggle-pinyin" className="script-option-button">
          <span>{pronunciationLabel}</span>
        </label>
        <label htmlFor="script-toggle-translation" className="script-option-button">
          <span>{labels.showTranslation}</span>
        </label>
      </div>
    </div>
  );
}

export function LearningContent({
  lesson,
  labels,
  interfaceDirection,
  interfaceTextAlign,
  supportTextAlign,
  activeTab,
  layout,
}: {
  lesson: SupabaseLessonDetail;
  labels: LearningPanelLabels;
  interfaceDirection: InterfaceTextDirection;
  interfaceTextAlign: string;
  supportTextAlign: string;
  activeTab: LearningTab;
  layout: LearningLayout;
}) {
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
      className={`learning-content ${layout === "video" ? "video-learning" : "article-learning"} ${interfaceTextAlign}`}
      dir={interfaceDirection}
    >
      <div className={`learning-panels ${layout === "video" ? "tab-body" : "article"}`}>
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
    </section>
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
  return (
    <>
      <LearningDisplayInputs />
      <div className="reading-paper" dir={interfaceDirection}>
        <LearningToolbar
          lesson={lesson}
          labels={labels}
          interfaceDirection={interfaceDirection}
          activeTab={activeTab}
          learnerContextQuery={learnerContextQuery}
          layout="article"
        />
        <LearningContent
          lesson={lesson}
          labels={labels}
          interfaceDirection={interfaceDirection}
          interfaceTextAlign={interfaceTextAlign}
          supportTextAlign={supportTextAlign}
          activeTab={activeTab}
          layout="article"
        />
      </div>
    </>
  );
}

export function ResourceLearningStyles() {
  return (
    <style>{`
      .learning-toolbar {
        min-width: 0;
        background: transparent;
      }

      .learning-tabs {
        min-width: 0;
      }

      .video-controls {
        align-self: end;
        width: 100%;
        margin: 0;
        padding: 0 0 4px;
        border: 0;
      }

      .video-controls .learning-tabs {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        align-items: center;
        gap: 4px;
        margin: 0;
        padding: 0;
      }

      .learning-tab-button {
        position: relative;
        isolation: isolate;
        min-width: 0;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 9px;
        background: transparent;
        padding: 0 5px;
        color: var(--text-primary);
        font-size: 13px;
        font-weight: 650;
        white-space: nowrap;
      }

      .learning-tab-button::before {
        content: "";
        position: absolute;
        z-index: -1;
        inset: 3px 0;
        border-radius: 9px;
        background: transparent;
      }

      .learning-tab-button > span {
        position: relative;
        z-index: 1;
      }

      .learning-tab-button:hover::before {
        background: #faf6ee;
      }

      .learning-tab-button[aria-current="page"] {
        font-weight: 800;
        color: #2d302a;
      }

      .learning-tab-button[aria-current="page"]::before {
        background: #f1f5ee;
      }

      .learning-tab-button[aria-current="page"]::after {
        content: "";
        position: absolute;
        z-index: 2;
        inset-inline: 12px;
        bottom: 6px;
        height: 3px;
        border-radius: 4px;
        background: #a4653f;
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

      .video-controls .script-options {
        width: auto;
        margin: 7px 0 0;
        padding: 0;
        justify-content: flex-start;
        justify-self: start;
      }

      .script-option-button {
        position: relative;
        isolation: isolate;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        background: transparent;
        padding: 0 10px;
        color: #2d302a;
        font-size: 12.5px;
        font-weight: 650;
        white-space: nowrap;
        cursor: pointer;
      }

      .script-option-button::before {
        content: "";
        position: absolute;
        z-index: -1;
        inset: 5px 0;
        border: 1px solid #ded6c7;
        border-radius: 9px;
        background: #fff;
      }

      .reading-top .script-option-button::before {
        inset-block: 4px;
      }

      .script-option-button > span {
        position: relative;
        z-index: 1;
      }

      .script-option-button:hover::before {
        border-color: #cfc3b0;
        background: #fffdfa;
      }

      #script-toggle-pinyin:checked ~ .video-head-grid label[for="script-toggle-pinyin"],
      #script-toggle-translation:checked ~ .video-head-grid label[for="script-toggle-translation"],
      #script-toggle-pinyin:checked ~ .reading-paper label[for="script-toggle-pinyin"],
      #script-toggle-translation:checked ~ .reading-paper label[for="script-toggle-translation"] {
        font-weight: 800;
      }

      #script-toggle-pinyin:checked ~ .video-head-grid label[for="script-toggle-pinyin"]::before,
      #script-toggle-translation:checked ~ .video-head-grid label[for="script-toggle-translation"]::before,
      #script-toggle-pinyin:checked ~ .reading-paper label[for="script-toggle-pinyin"]::before,
      #script-toggle-translation:checked ~ .reading-paper label[for="script-toggle-translation"]::before {
        background: #f7f0e2;
        border-color: #cdbb9f;
      }

      #script-toggle-pinyin:focus-visible ~ .video-head-grid label[for="script-toggle-pinyin"],
      #script-toggle-translation:focus-visible ~ .video-head-grid label[for="script-toggle-translation"],
      #script-toggle-pinyin:focus-visible ~ .reading-paper label[for="script-toggle-pinyin"],
      #script-toggle-translation:focus-visible ~ .reading-paper label[for="script-toggle-translation"] {
        outline: 3px solid var(--focus-ring);
        outline-offset: 2px;
      }

      .video-learning {
        align-self: start;
        min-width: 0;
        margin: 0;
        padding: 12px 16px;
        border: 1px solid #ded6c7;
        border-radius: 18px;
        background: #fff;
        color: var(--text-primary);
      }

      .video-learning .learning-panels {
        margin: 0;
        padding: 0;
      }

      @media (min-width: 900px) {
        .video-learning {
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: clamp(500px, calc(100vh - 230px), 690px);
          max-height: clamp(500px, calc(100vh - 230px), 690px);
          overflow: hidden;
        }

        .video-learning .learning-panels {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
          padding-inline-end: 8px;
        }
      }

      .reading-paper {
        width: 100%;
        padding: 34px 42px 46px;
        border: 1px solid #ded6c7;
        border-radius: 18px;
        background: #fff;
        box-shadow: none;
      }

      .reading-top {
        width: min(100%, 790px);
        margin: 0 auto;
        padding: 0 0 6px;
        border: 0;
      }

      @media (min-width: 900px) {
        .reading-top {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .reading-top .learning-tabs {
          flex: 1 1 auto;
          min-width: 0;
          width: auto;
          display: grid;
          grid-template-columns: repeat(4, minmax(88px, 1fr));
          gap: 3px;
          margin: 0;
          padding: 0;
        }

        .reading-top .script-options {
          flex: 0 0 auto;
          width: auto;
          margin: 0;
          padding: 0;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
        }
      }

      .article-learning {
        width: min(100%, 790px);
        margin-inline: auto;
        color: var(--text-primary);
      }

      .article-learning .learning-panels {
        width: 100%;
        margin: 0;
        padding: 10px 0 0;
        overflow: visible;
      }

      .script-lines {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }

      .script-sentence {
        min-width: 0;
        margin: 0;
        padding: 14px 10px;
        border-radius: 12px;
      }

      .article-learning .script-sentence {
        padding-top: 16px;
        padding-bottom: 16px;
      }

      .resource-chinese-line {
        margin: 0;
        color: #252922;
        font-family: "KaiTi", "Kaiti SC", "STKaiti", "KaiTi_GB2312", "FangSong", "Microsoft YaHei", "Noto Serif CJK SC", serif;
        font-size: 20px;
        font-weight: 400;
        line-height: 1.72;
        letter-spacing: 0.005em;
        overflow-wrap: anywhere;
      }

      .article-learning .resource-chinese-line {
        font-size: 20.5px;
        line-height: 1.78;
      }

      .resource-pinyin-line {
        margin: 3px 0 0;
        color: #a4653f;
        font-size: 13px;
        font-weight: 400;
        line-height: 1.55;
      }

      .resource-translation-line {
        margin-top: 4px;
        color: #64685f;
        font-size: 14px;
        font-weight: 400;
        line-height: 1.6;
      }

      #script-toggle-pinyin:not(:checked) ~ .lesson-workspace .pinyin-row,
      #script-toggle-pinyin:not(:checked) ~ .reading-paper .pinyin-row {
        display: none;
      }

      #script-toggle-translation:not(:checked) ~ .lesson-workspace .translation-row,
      #script-toggle-translation:not(:checked) ~ .reading-paper .translation-row {
        display: none;
      }

      .resource-placeholder {
        min-height: 140px;
        padding: 20px;
        border: 1px solid #ded6c7;
        border-radius: 14px;
        background: #f7f0e2;
        color: #64685f;
        font-size: 0.9rem;
        line-height: 1.65;
      }

      .learning-panels::-webkit-scrollbar {
        width: 8px;
      }

      .learning-panels::-webkit-scrollbar-track {
        background: transparent;
      }

      .learning-panels::-webkit-scrollbar-thumb {
        border: 2px solid transparent;
        border-radius: 999px;
        background: #b8c0b2;
        background-clip: padding-box;
      }

      .learning-panels {
        scrollbar-width: thin;
        scrollbar-color: #b8c0b2 transparent;
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
        .video-controls .learning-tabs {
          gap: 3px;
        }

        .video-controls .learning-tab-button {
          padding-inline: 3px;
          font-size: 12.5px;
        }

        .reading-top {
          gap: 10px;
        }
      }

      @media (max-width: 899px) {
        .video-controls {
          margin-top: 10px;
          padding: 0;
        }

        .video-controls .learning-tabs,
        .reading-top .learning-tabs {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
        }

        .video-controls .script-options,
        .reading-top .script-options {
          width: auto;
          margin: 8px 0 0;
          padding: 0;
          justify-content: flex-start;
        }

        .video-learning {
          height: auto;
          max-height: none;
          overflow: visible;
        }

        .video-learning .learning-panels {
          overflow: visible;
          padding-inline-end: 0;
          scrollbar-gutter: auto;
        }

        .reading-paper {
          padding: 28px 30px 38px;
        }

        .reading-top {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: auto auto;
          width: 100%;
          margin: 0;
        }

        .article-learning {
          width: 100%;
        }
      }

      @media (max-width: 639px) {
        .video-controls .learning-tabs,
        .reading-top .learning-tabs {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .video-controls .script-options,
        .reading-top .script-options {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
        }

        .script-option-button {
          width: 100%;
          min-width: 0;
        }

        .reading-paper {
          padding: 14px;
          border-radius: 16px;
        }

        .resource-chinese-line,
        .article-learning .resource-chinese-line {
          font-size: 19px;
          line-height: 1.72;
        }
      }
    `}</style>
  );
}
