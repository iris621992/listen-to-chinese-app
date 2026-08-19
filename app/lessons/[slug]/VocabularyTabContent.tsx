import type { ReactNode } from "react";
import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";

type VocabularyTabLabels = {
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
};

function safeHtmlId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function VocabularyDetailRow({
  label,
  children,
  interfaceDirection,
  interfaceTextAlign,
  contentDirection,
  contentTextAlign,
}: {
  label: string;
  children: ReactNode;
  interfaceDirection: InterfaceTextDirection;
  interfaceTextAlign: string;
  contentDirection: "ltr" | "rtl";
  contentTextAlign: string;
}) {
  if (!children) return null;

  return (
    <div className="rounded-2xl bg-cream px-4 py-3 text-sm leading-6 text-stone-600">
      <span
        className={`font-semibold text-stone-700 ${interfaceTextAlign}`}
        dir={interfaceDirection}
      >
        {label}:
      </span>{" "}
      <span className={contentTextAlign} dir={contentDirection}>
        {children}
      </span>
    </div>
  );
}

export function VocabularyTabContent({
  lesson,
  labels,
  interfaceDirection,
  interfaceTextAlign,
  supportTextAlign,
}: {
  lesson: SupabaseLessonDetail;
  labels: VocabularyTabLabels;
  interfaceDirection: InterfaceTextDirection;
  interfaceTextAlign: string;
  supportTextAlign: string;
}) {
  if (lesson.vocabulary.length === 0) {
    return (
      <div
        className={`rounded-3xl bg-cream p-5 text-sm leading-6 text-stone-600 ${interfaceTextAlign}`}
        dir={interfaceDirection}
      >
        {labels.noVocabulary}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lesson.vocabulary.map((item) => {
        const characters = Array.from(item.chineseText);
        const innerTabId = safeHtmlId(item.id);
        const detailsTabId = `vocabulary-${innerTabId}-details`;
        const hanziTabId = `vocabulary-${innerTabId}-hanzi`;
        const innerTabName = `vocabulary-${innerTabId}-inner-tab`;
        const hasSummaryDetails = Boolean(item.phoneticText || item.translation);
        const supportIsRtl = lesson.selectedDirection === "rtl";

        return (
          <details key={item.id} className={`group rounded-2xl border border-orange-100 bg-white shadow-sm ${supportTextAlign}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden" dir={lesson.selectedDirection}>
              <span className="flex flex-col" style={{ flex: "1 1 0%", minWidth: 0 }}>
                <span
                  className="chinese-text text-xl font-bold leading-snug text-stone-900"
                  dir="ltr"
                  style={{ display: "block", width: "100%", textAlign: supportIsRtl ? "right" : "left", unicodeBidi: "isolate" }}
                >
                  {item.chineseText}
                </span>
                {hasSummaryDetails ? (
                  <span
                    className="mt-1 text-sm leading-5 text-stone-600"
                    dir={lesson.selectedDirection}
                    style={{ display: "block", width: "100%", textAlign: supportIsRtl ? "right" : "left" }}
                  >
                    {item.phoneticText ? <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{item.phoneticText}</span> : null}
                    {item.phoneticText && item.translation ? <span aria-hidden="true"> · </span> : null}
                    {item.translation ? <span dir={lesson.selectedDirection}>{item.translation}</span> : null}
                  </span>
                ) : null}
              </span>
              <span className="text-lg font-bold leading-none text-cinnabar transition-transform group-open:rotate-90" aria-hidden="true">›</span>
            </summary>
            <div className="border-t border-orange-100 px-4 pb-4 pt-3">
              <input className="vocabulary-inner-tab-input vocabulary-details-tab-input" type="radio" id={detailsTabId} name={innerTabName} defaultChecked />
              <input className="vocabulary-inner-tab-input vocabulary-hanzi-tab-input" type="radio" id={hanziTabId} name={innerTabName} />

              <div
                className={`vocabulary-inner-tab-controls mb-4 flex flex-wrap gap-2 ${interfaceTextAlign}`}
                dir={interfaceDirection}
              >
                <label className="vocabulary-inner-tab-label vocabulary-details-tab-label cursor-pointer rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm" htmlFor={detailsTabId}>
                  {labels.details}
                </label>
                <label className="vocabulary-inner-tab-label vocabulary-hanzi-tab-label cursor-pointer rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm" htmlFor={hanziTabId}>
                  {labels.hanzi}
                </label>
              </div>

              <div className="vocabulary-inner-tab-panels">
                <section className="vocabulary-inner-tab-panel vocabulary-details-panel rounded-3xl border border-orange-100 bg-white/70 p-4">
                  <div className="space-y-3">
                    {item.translation ? (
                      <VocabularyDetailRow label={labels.meaning} interfaceDirection={interfaceDirection} interfaceTextAlign={interfaceTextAlign} contentDirection={lesson.selectedDirection} contentTextAlign={supportTextAlign}>
                        {item.translation}
                      </VocabularyDetailRow>
                    ) : null}
                    {item.phoneticText ? (
                      <VocabularyDetailRow label={labels.pronunciation} interfaceDirection={interfaceDirection} interfaceTextAlign={interfaceTextAlign} contentDirection="ltr" contentTextAlign="text-left">
                        <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{item.phoneticText}</span>
                      </VocabularyDetailRow>
                    ) : null}
                    {item.usage ? (
                      <VocabularyDetailRow label={labels.usage} interfaceDirection={interfaceDirection} interfaceTextAlign={interfaceTextAlign} contentDirection={lesson.selectedDirection} contentTextAlign={supportTextAlign}>{item.usage}</VocabularyDetailRow>
                    ) : null}
                    {item.grammarPattern ? (
                      <VocabularyDetailRow label={labels.grammarPattern} interfaceDirection={interfaceDirection} interfaceTextAlign={interfaceTextAlign} contentDirection={lesson.selectedDirection} contentTextAlign={supportTextAlign}>{item.grammarPattern}</VocabularyDetailRow>
                    ) : null}
                    {item.partOfSpeech ? (
                      <VocabularyDetailRow label={labels.partOfSpeech} interfaceDirection={interfaceDirection} interfaceTextAlign={interfaceTextAlign} contentDirection={lesson.selectedDirection} contentTextAlign={supportTextAlign}>{item.partOfSpeech}</VocabularyDetailRow>
                    ) : null}
                    {item.example ? (
                      <VocabularyDetailRow label={labels.example} interfaceDirection={interfaceDirection} interfaceTextAlign={interfaceTextAlign} contentDirection="ltr" contentTextAlign="text-left">
                        <span className="chinese-text" dir="ltr" style={{ unicodeBidi: "isolate" }}>{item.example}</span>
                      </VocabularyDetailRow>
                    ) : null}
                    {item.exampleTranslation ? (
                      <VocabularyDetailRow label={labels.exampleTranslation} interfaceDirection={interfaceDirection} interfaceTextAlign={interfaceTextAlign} contentDirection={lesson.selectedDirection} contentTextAlign={supportTextAlign}>{item.exampleTranslation}</VocabularyDetailRow>
                    ) : null}
                    {item.synonyms ? (
                      <VocabularyDetailRow label={labels.synonyms} interfaceDirection={interfaceDirection} interfaceTextAlign={interfaceTextAlign} contentDirection={lesson.selectedDirection} contentTextAlign={supportTextAlign}>{item.synonyms}</VocabularyDetailRow>
                    ) : null}
                    {item.antonyms ? (
                      <VocabularyDetailRow label={labels.antonyms} interfaceDirection={interfaceDirection} interfaceTextAlign={interfaceTextAlign} contentDirection={lesson.selectedDirection} contentTextAlign={supportTextAlign}>{item.antonyms}</VocabularyDetailRow>
                    ) : null}
                    {item.usageNotes ? (
                      <VocabularyDetailRow label={labels.usageNotes} interfaceDirection={interfaceDirection} interfaceTextAlign={interfaceTextAlign} contentDirection={lesson.selectedDirection} contentTextAlign={supportTextAlign}>{item.usageNotes}</VocabularyDetailRow>
                    ) : null}
                  </div>
                </section>

                <section className="vocabulary-inner-tab-panel vocabulary-hanzi-panel rounded-3xl border border-orange-100 bg-white/70 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {characters.map((character, index) => (
                      <div key={`${item.id}-${character}-${index}`} className="rounded-2xl bg-cream p-4">
                        <p className="chinese-text text-3xl font-bold text-stone-900" dir="ltr">{character}</p>
                        {item.writingGuidance ? (
                          <p className={`mt-2 text-sm leading-6 text-stone-600 ${supportTextAlign}`} dir={lesson.selectedDirection}>
                            {item.writingGuidance}
                          </p>
                        ) : (
                          <p className={`mt-2 text-sm leading-6 text-stone-600 ${interfaceTextAlign}`} dir={interfaceDirection}>
                            {labels.writingGuidancePlaceholder}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
