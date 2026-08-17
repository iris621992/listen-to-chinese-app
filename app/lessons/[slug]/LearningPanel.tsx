import Link from "next/link";
import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";
import { ScriptTabContent } from "./ScriptTabContent";
import { VocabularyTabContent } from "./VocabularyTabContent";
import { PracticeTabContent } from "./PracticeTabContent";

export type LearningTab = "script" | "vocabulary" | "grammar" | "practice";

export const LEARNING_TABS: LearningTab[] = ["script", "vocabulary", "grammar", "practice"];

export function learningTabFor(tab: string | undefined): LearningTab {
  return LEARNING_TABS.includes(tab as LearningTab) ? tab as LearningTab : "script";
}

type LearningPanelLabels = {
  scriptTab: string;
  vocabularyTab: string;
  grammarTab: string;
  practiceTab: string;
  showPinyin: string;
  showTranslation: string;
  grammarComingSoon: string;
  translationMissing: (languageCode: string) => string;
  noLessonSegments: string;
  noVocabulary: string;
  details: string;
  hanzi: string;
  meaning: string;
  pinyin: string;
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
};

const hiddenInputStyle = {
  position: "absolute" as const,
  opacity: 0,
  width: 0,
  height: 0,
  margin: 0,
  pointerEvents: "none" as const,
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
  const tabButtonClassName = (tab: LearningTab) =>
    `learning-tab-button cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${
      activeTab === tab ? "border-orange-200 bg-cinnabar text-white" : "border-orange-200 bg-white text-stone-700"
    }`;

  return (
    <section
      className={`flex w-full flex-col overscroll-contain rounded-[2rem] bg-paper p-5 pr-3 shadow-soft sm:p-6 sm:pr-4 ${interfaceTextAlign}`}
      dir={interfaceDirection}
      style={{
        height: "calc(100vh - 7rem)",
        maxHeight: "calc(100vh - 7rem)",
        overflow: "hidden",
        overscrollBehavior: "contain",
      }}
    >
      <input id="script-toggle-pinyin" style={hiddenInputStyle} type="checkbox" defaultChecked aria-hidden="true" tabIndex={-1} />
      <input id="script-toggle-translation" style={hiddenInputStyle} type="checkbox" defaultChecked aria-hidden="true" tabIndex={-1} />

      <div
        className="learning-toolbar border-b border-orange-100 bg-paper"
        style={{ flexShrink: 0, paddingBottom: "1rem", paddingTop: "0.5rem" }}
      >
        <div className={`learning-tabs flex flex-wrap gap-3 ${toolbarAlignment}`}>
          <Link href={learningTabHref(lesson.slug, lesson.selectedCode, "script", learnerContextQuery)} data-tab="script" className={tabButtonClassName("script")}>{labels.scriptTab}</Link>
          <Link href={learningTabHref(lesson.slug, lesson.selectedCode, "vocabulary", learnerContextQuery)} data-tab="vocabulary" className={tabButtonClassName("vocabulary")}>{labels.vocabularyTab}</Link>
          <Link href={learningTabHref(lesson.slug, lesson.selectedCode, "grammar", learnerContextQuery)} data-tab="grammar" className={tabButtonClassName("grammar")}>{labels.grammarTab}</Link>
          <Link href={learningTabHref(lesson.slug, lesson.selectedCode, "practice", learnerContextQuery)} data-tab="practice" className={tabButtonClassName("practice")}>{labels.practiceTab}</Link>
        </div>
        <div className={`script-options mt-4 ${activeTab === "script" ? "flex" : "hidden"} flex-wrap gap-2 py-1 ${toolbarAlignment}`}>
          <label htmlFor="script-toggle-pinyin" className="script-option-button cursor-pointer rounded-full border border-orange-100 bg-white/70 px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm">
            {labels.showPinyin}
          </label>
          <label htmlFor="script-toggle-translation" className="script-option-button cursor-pointer rounded-full border border-orange-100 bg-white/70 px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm">
            {labels.showTranslation}
          </label>
        </div>
      </div>

      <div
        className="learning-panels"
        style={{
          flex: "1 1 0",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          paddingRight: "0.5rem",
          paddingTop: "1rem",
          scrollbarGutter: "stable",
        }}
      >
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
        .learning-panels::-webkit-scrollbar {
          width: 8px;
        }

        .learning-panels::-webkit-scrollbar-thumb {
          background: rgba(232, 93, 63, 0.35);
          border-radius: 999px;
        }

        .vocabulary-inner-tab-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
          pointer-events: none;
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
          background: #fdf6ed;
          border-color: #e95d43;
          color: #d94f36;
        }
      `}</style>
    </section>
  );
}
