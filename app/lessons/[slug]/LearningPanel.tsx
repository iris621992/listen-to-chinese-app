import Link from "next/link";
import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";
import { MainTabContent } from "./MainTabContent";
import { ScriptTabContent } from "./ScriptTabContent";
import { VocabularyTabContent } from "./VocabularyTabContent";
import { PracticeTabContent } from "./PracticeTabContent";

export type LearningTab = "main" | "script" | "vocabulary" | "grammar" | "practice";

export const LEARNING_TABS: LearningTab[] = [
  "main",
  "script",
  "vocabulary",
  "grammar",
  "practice",
];

export function learningTabFor(tab: string | undefined): LearningTab {
  return LEARNING_TABS.includes(tab as LearningTab) ? tab as LearningTab : "main";
}

type LearningPanelLabels = {
  resourceSections: string;
  mainTab: string;
  mainTitle: string;
  mainBody: string;
  mainScriptTitle: string;
  mainScriptBody: string;
  mainVocabularyTitle: string;
  mainVocabularyBody: string;
  mainGrammarTitle: string;
  mainGrammarBody: string;
  mainPracticeTitle: string;
  mainPracticeBody: string;
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
      className={`rounded-3xl bg-cream p-5 text-sm leading-6 text-stone-600 ${interfaceTextAlign}`}
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
  segmentBlockLayout,
  segmentTextStyle,
  activeTab,
  learnerContextQuery,
}: {
  lesson: SupabaseLessonDetail;
  labels: LearningPanelLabels;
  interfaceDirection: InterfaceTextDirection;
  interfaceTextAlign: string;
  supportTextAlign: string;
  segmentBlockLayout: string;
  segmentTextStyle: { textAlign: "right" } | undefined;
  activeTab: LearningTab;
  learnerContextQuery: Record<string, string>;
}) {
  const toolbarAlignment = interfaceDirection === "rtl"
    ? "justify-end"
    : "justify-start";
  const hrefFor = (tab: LearningTab) =>
    learningTabHref(lesson.slug, lesson.selectedCode, tab, learnerContextQuery);
  const tabButtonClassName = (tab: LearningTab) =>
    `learning-tab-button cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${
      activeTab === tab
        ? "border-orange-200 bg-cinnabar text-white"
        : "border-orange-200 bg-white text-stone-700"
    }`;

  const mainLinks = [
    {
      href: hrefFor("script"),
      title: labels.mainScriptTitle,
      body: labels.mainScriptBody,
    },
    {
      href: hrefFor("vocabulary"),
      title: labels.mainVocabularyTitle,
      body: labels.mainVocabularyBody,
    },
    {
      href: hrefFor("grammar"),
      title: labels.mainGrammarTitle,
      body: labels.mainGrammarBody,
    },
    {
      href: hrefFor("practice"),
      title: labels.mainPracticeTitle,
      body: labels.mainPracticeBody,
    },
  ];

  return (
    <section
      className={`resource-learning-panel flex w-full flex-col overscroll-contain rounded-[2rem] bg-paper p-5 pr-3 shadow-soft sm:p-6 sm:pr-4 ${interfaceTextAlign}`}
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

      <div className="learning-toolbar border-b border-orange-100 bg-paper">
        <nav
          className={`learning-tabs flex flex-wrap gap-3 ${toolbarAlignment}`}
          aria-label={labels.resourceSections}
        >
          <Link
            href={hrefFor("main")}
            data-tab="main"
            aria-current={activeTab === "main" ? "page" : undefined}
            className={tabButtonClassName("main")}
          >
            {labels.mainTab}
          </Link>
          <Link
            href={hrefFor("script")}
            data-tab="script"
            aria-current={activeTab === "script" ? "page" : undefined}
            className={tabButtonClassName("script")}
          >
            {labels.scriptTab}
          </Link>
          <Link
            href={hrefFor("vocabulary")}
            data-tab="vocabulary"
            aria-current={activeTab === "vocabulary" ? "page" : undefined}
            className={tabButtonClassName("vocabulary")}
          >
            {labels.vocabularyTab}
          </Link>
          <Link
            href={hrefFor("grammar")}
            data-tab="grammar"
            aria-current={activeTab === "grammar" ? "page" : undefined}
            className={tabButtonClassName("grammar")}
          >
            {labels.grammarTab}
          </Link>
          <Link
            href={hrefFor("practice")}
            data-tab="practice"
            aria-current={activeTab === "practice" ? "page" : undefined}
            className={tabButtonClassName("practice")}
          >
            {labels.practiceTab}
          </Link>
        </nav>
        <div
          className={`script-options mt-4 ${activeTab === "script" ? "flex" : "hidden"} flex-wrap gap-2 py-1 ${toolbarAlignment}`}
        >
          <label
            htmlFor="script-toggle-pinyin"
            className="script-option-button cursor-pointer rounded-full border border-orange-100 bg-white/70 px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm"
          >
            {labels.showPronunciation}
          </label>
          <label
            htmlFor="script-toggle-translation"
            className="script-option-button cursor-pointer rounded-full border border-orange-100 bg-white/70 px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm"
          >
            {labels.showTranslation}
          </label>
        </div>
      </div>

      <div className="learning-panels">
        {activeTab === "main" ? (
          <MainTabContent
            labels={labels}
            links={mainLinks}
            interfaceDirection={interfaceDirection}
            interfaceTextAlign={interfaceTextAlign}
          />
        ) : null}
        {activeTab === "script" ? (
          <ScriptTabContent
            lesson={lesson}
            labels={labels}
            interfaceDirection={interfaceDirection}
            interfaceTextAlign={interfaceTextAlign}
            supportTextAlign={supportTextAlign}
            segmentBlockLayout={segmentBlockLayout}
            segmentTextStyle={segmentTextStyle}
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
            labels={labels}
            interfaceDirection={interfaceDirection}
            interfaceTextAlign={interfaceTextAlign}
          />
        ) : null}
      </div>

      <style>{`
        .resource-learning-panel {
          height: calc(100vh - 11rem);
          max-height: calc(100vh - 11rem);
          overflow: hidden;
          overscroll-behavior: contain;
        }

        .learning-toolbar {
          flex-shrink: 0;
          padding-top: 0.5rem;
          padding-bottom: 1rem;
        }

        .learning-tab-button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .script-option-button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
        }

        .learning-panels {
          flex: 1 1 0;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          padding-inline-end: 0.5rem;
          padding-top: 1rem;
          scrollbar-gutter: stable;
        }

        .learning-panels::-webkit-scrollbar {
          width: 8px;
        }

        .learning-panels::-webkit-scrollbar-thumb {
          background: rgba(89, 106, 78, 0.38);
          border-radius: 999px;
        }

        .resource-main-intro {
          border-radius: 1.25rem;
          background: var(--surface-subtle);
          padding: 1.25rem;
        }

        .resource-main-intro h2 {
          margin: 0;
          color: var(--text-primary);
          font-size: clamp(1.45rem, 2.2vw, 2rem);
          line-height: 1.15;
        }

        .resource-main-intro p {
          margin: 0.75rem 0 0;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .resource-main-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.875rem;
          margin-top: 1rem;
        }

        .resource-main-card {
          min-height: 132px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          border: 1px solid var(--border-subtle);
          border-radius: 1.15rem;
          background: var(--surface-raised);
          padding: 1rem;
          transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }

        .resource-main-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(55, 52, 43, 0.08);
        }

        .resource-main-card strong {
          color: var(--interactive-primary);
          font-size: 1rem;
        }

        .resource-main-card span {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.55;
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

        #script-toggle-pinyin:not(:checked) ~ .learning-panels .script-lines .pinyin-row {
          display: none;
        }

        #script-toggle-translation:not(:checked) ~ .learning-panels .script-lines .translation-row {
          display: none;
        }

        #script-toggle-pinyin:checked ~ .learning-toolbar .script-options label[for="script-toggle-pinyin"],
        #script-toggle-translation:checked ~ .learning-toolbar .script-options label[for="script-toggle-translation"] {
          background: var(--surface-subtle);
          border-color: var(--interactive-primary);
          color: var(--interactive-primary);
        }

        #script-toggle-pinyin:focus-visible ~ .learning-toolbar .script-options label[for="script-toggle-pinyin"],
        #script-toggle-translation:focus-visible ~ .learning-toolbar .script-options label[for="script-toggle-translation"],
        .vocabulary-details-tab-input:focus-visible ~ .vocabulary-inner-tab-controls .vocabulary-details-tab-label,
        .vocabulary-hanzi-tab-input:focus-visible ~ .vocabulary-inner-tab-controls .vocabulary-hanzi-tab-label {
          outline: 3px solid var(--focus-ring);
          outline-offset: 3px;
        }

        @media (max-width: 899px) {
          .resource-learning-panel {
            height: auto;
            max-height: none;
            overflow: visible;
          }

          .learning-panels {
            flex: 0 1 auto;
            min-height: auto;
            overflow: visible;
            padding-inline-end: 0;
            scrollbar-gutter: auto;
          }
        }

        @media (max-width: 599px) {
          .learning-tabs {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            width: 100%;
          }

          .learning-tab-button {
            width: 100%;
          }

          .resource-main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 899px) and (orientation: landscape) and (max-height: 520px) {
          .resource-learning-panel {
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
          }

          .learning-toolbar {
            padding-top: 0;
            padding-bottom: 0.75rem;
          }

          .resource-main-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </section>
  );
}
