"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import type { KnowledgeLanguage } from "@/lib/knowledgeLanguage";
import type {
  CharacterDetail,
  CharacterModule,
  CharacterPronunciation,
} from "@/lib/characterDetail";
import type { VocabularyCharacterOccurrence } from "@/lib/vocabularyCharacterDelivery";
import KnowledgeLanguageToggle from "../../vocabulary/[publicId]/KnowledgeLanguageToggle";
import VocabularyCharacterRail from "../../vocabulary/[publicId]/VocabularyCharacterRail";
import VocabularyPronunciationMeta from "../../vocabulary/[publicId]/VocabularyPronunciationMeta";
import VocabularyStickyNav from "../../vocabulary/[publicId]/VocabularyStickyNav";
import { knowledgeLanguageUserLabel } from "../../vocabulary/[publicId]/VocabularyDetailLabels";
import "../../vocabulary/[publicId]/VocabularyDemoFidelity.module.css";
import "../../vocabulary/[publicId]/VocabularyTypographyRuntime.module.css";
import "../../vocabulary/[publicId]/VocabularyVisualReconciliation.module.css";
import "../../vocabulary/[publicId]/VocabularyHeaderNavAuthority.module.css";
import vocabStyles from "../../vocabulary/[publicId]/VocabularyDetail.module.css";
import { characterDetailLabelsFor } from "./CharacterDetailLabels";
import styles from "./CharacterDetail.module.css";

type Props = {
  detail: CharacterDetail;
  interfaceLocaleCode: string;
  interfaceDirection: InterfaceTextDirection;
  knowledgeLanguage: KnowledgeLanguage;
  learnerContextQuery: Record<string, string>;
};

type NavItem = {
  label: string;
  href: string;
  mobileOnly?: boolean;
};

function moduleText(module: CharacterModule, knowledgeLanguage: KnowledgeLanguage) {
  return knowledgeLanguage === "zh"
    ? module.canonicalZh
    : module.localizedText ?? module.canonicalZh;
}

function moduleFor(
  detail: CharacterDetail,
  kind: string,
  pronunciation: string | null = null,
) {
  return detail.modules.find((module) => (
    module.kind === kind
    && module.applicability === "PRESENT"
    && module.pronunciation === pronunciation
  )) ?? null;
}

function modulesFor(
  detail: CharacterDetail,
  kind: string,
  pronunciation: string | null,
) {
  return detail.modules.filter((module) => (
    module.kind === kind
    && module.applicability === "PRESENT"
    && module.pronunciation === pronunciation
  ));
}

function selectedPronunciationOrFirst(
  pronunciations: CharacterPronunciation[],
  selectedPublicId: string,
) {
  return pronunciations.find((item) => item.publicId === selectedPublicId) ?? pronunciations[0];
}

export default function CharacterDetailView({
  detail,
  interfaceLocaleCode,
  interfaceDirection,
  knowledgeLanguage,
  learnerContextQuery,
}: Props) {
  const labels = characterDetailLabelsFor(interfaceLocaleCode);
  const showHanViet = interfaceLocaleCode === "vi" && knowledgeLanguage === "user";
  const [selectedPronunciationId, setSelectedPronunciationId] = useState(
    detail.pronunciations[0]?.publicId ?? "",
  );
  const selectedPronunciation = selectedPronunciationOrFirst(
    detail.pronunciations,
    selectedPronunciationId,
  );

  const pronunciationExplanation = selectedPronunciation
    ? moduleFor(detail, "pronunciation_explanation", selectedPronunciation.pinyin)
    : null;
  const lexicalParticipation = selectedPronunciation
    ? moduleFor(detail, "lexical_participation", selectedPronunciation.pinyin)
    : null;
  const meaningOrientations = selectedPronunciation
    ? modulesFor(detail, "meaning_orientation", selectedPronunciation.pinyin)
    : [];
  const readingRecognition = moduleFor(detail, "reading_recognition");
  const structureExplanation = moduleFor(detail, "structure_explanation");
  const formRelationExplanation = moduleFor(detail, "form_relation_explanation");
  const formRecognition = moduleFor(detail, "form_recognition");

  const hasConstruction = Boolean(
    detail.radical
    || detail.radicalDisplayForm
    || detail.structure.applicability === "PRESENT"
    || detail.componentsApplicability === "PRESENT",
  );
  const hasRecognition = Boolean(formRelationExplanation || formRecognition || detail.forms.length > 0);

  const navItems: NavItem[] = [
    { label: labels.meaning, href: "#character-meaning" },
    { label: labels.roleInWords, href: "#character-role" },
    ...(readingRecognition ? [{ label: labels.reading, href: "#character-reading" }] : []),
    ...(hasConstruction ? [{ label: labels.structure, href: "#character-structure" }] : []),
    ...(hasRecognition ? [{ label: labels.recognition, href: "#character-recognition" }] : []),
    ...(detail.writing ? [{ label: labels.writing, href: "#characters", mobileOnly: true }] : []),
  ];

  const secondaryForms = detail.forms.filter((form) => form.glyph !== detail.glyph);

  const railOccurrence = useMemo<VocabularyCharacterOccurrence[]>(() => {
    if (!selectedPronunciation) return [];
    return [{
      writtenFormPublicId: detail.publicId,
      writtenForm: detail.glyph,
      isPrimaryForm: true,
      scriptProfileCode: null,
      scriptVariantCode: null,
      position: 1,
      lexicalContextPronunciation: selectedPronunciation.pinyin,
      character: {
        publicId: detail.publicId,
        glyph: detail.glyph,
        standaloneReading: selectedPronunciation.pinyin,
        hanViet: selectedPronunciation.hanViet,
        radical: detail.radical,
        strokeCount: detail.strokeCount,
        structureCode: detail.structure.code,
        structureFormula: detail.structure.formula,
        componentNote: null,
        writing: detail.writing,
      },
    }];
  }, [detail, selectedPronunciation]);

  const characterLabels = {
    characters: labels.characters,
    radical: labels.radical,
    strokes: labels.strokes,
    hanViet: labels.hanViet,
    structure: labels.structure,
    writingOpen: labels.writingOpen,
    writingReplay: labels.writingReplay,
    writingUnavailable: labels.writingUnavailable,
    writingSource: labels.writingSource,
  };

  return (
    <main className={vocabStyles.page} dir={interfaceDirection}>
      <nav className={vocabStyles.breadcrumb} aria-label="Breadcrumb">
        <Link href={{ pathname: "/knowledge", query: learnerContextQuery }}>
          {labels.knowledge}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{labels.characters}</span>
        <span aria-hidden="true">/</span>
        <span className={vocabStyles.breadcrumbCurrent}>{detail.glyph}</span>
      </nav>

      <VocabularyStickyNav
        headword={detail.glyph}
        pronunciation={selectedPronunciation?.pinyin ?? null}
        navItems={navItems}
        knowledgeLanguage={knowledgeLanguage}
        userLanguageLabel={knowledgeLanguageUserLabel(interfaceLocaleCode)}
      />

      <div className={vocabStyles.workspace}>
        <article id="vocabulary-entry-card" className={vocabStyles.entryCard}>
          <header id="vocabulary-entry-header" className={vocabStyles.entryHeader}>
            <div className={vocabStyles.headwordWrap}>
              <div className={vocabStyles.writtenLine}>
                <h1 className={vocabStyles.headword}>{detail.glyph}</h1>
                {secondaryForms.map((form) => (
                  <span key={form.publicId} className={vocabStyles.traditional}>{form.glyph}</span>
                ))}
              </div>

              {selectedPronunciation ? (
                <VocabularyPronunciationMeta
                  pronunciation={selectedPronunciation.pinyin}
                  hanViet={showHanViet ? selectedPronunciation.hanViet : null}
                />
              ) : null}

              {detail.pronunciations.length > 1 ? (
                <div className={vocabStyles.readingSelector} aria-label={labels.reading}>
                  {detail.pronunciations.map((pronunciation) => {
                    const selected = pronunciation.publicId === selectedPronunciation?.publicId;
                    return (
                      <button
                        key={pronunciation.publicId}
                        type="button"
                        className={`${vocabStyles.readingButton} ${selected ? styles.readingButtonActive : ""}`}
                        aria-pressed={selected}
                        onClick={() => setSelectedPronunciationId(pronunciation.publicId)}
                      >
                        <strong>{pronunciation.pinyin}</strong>
                        {showHanViet && pronunciation.hanViet ? <span>{pronunciation.hanViet}</span> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className={vocabStyles.headerActions}>
              <KnowledgeLanguageToggle
                value={knowledgeLanguage}
                userLanguageLabel={knowledgeLanguageUserLabel(interfaceLocaleCode)}
              />
            </div>
          </header>

          <nav className={vocabStyles.sectionNav} aria-label={`${labels.characters} sections`}>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={item.mobileOnly ? styles.mobileOnlyWriting : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className={vocabStyles.entryBody}>
            <div className={styles.moduleFlow}>
              <section className={styles.moduleBlock} id="character-meaning">
                <h2>{labels.meaning}</h2>
                {pronunciationExplanation ? (
                  <p className={styles.moduleLead}>
                    {moduleText(pronunciationExplanation, knowledgeLanguage)}
                  </p>
                ) : null}
                {meaningOrientations.length > 0 ? (
                  <div className={styles.behaviorGrid}>
                    {meaningOrientations.map((orientation, index) => (
                      <div key={orientation.publicId} className={styles.behaviorItem}>
                        <strong className={styles.behaviorTitle}>{index + 1}</strong>
                        <p className={styles.behaviorCopy}>{moduleText(orientation, knowledgeLanguage)}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className={`${styles.moduleBlock} ${styles.soft}`} id="character-role">
                <h2>{labels.roleInWords}</h2>
                {lexicalParticipation ? (
                  <p className={styles.moduleLead}>{moduleText(lexicalParticipation, knowledgeLanguage)}</p>
                ) : null}
              </section>

              {readingRecognition ? (
                <section className={`${styles.moduleBlock} ${styles.accent}`} id="character-reading">
                  <h2>{labels.reading}</h2>
                  <p className={styles.moduleLead}>{moduleText(readingRecognition, knowledgeLanguage)}</p>
                </section>
              ) : null}

              {hasConstruction ? (
                <section className={styles.moduleBlock} id="character-structure">
                  <h2>{labels.structure}</h2>
                  <div className={styles.constructionMeta}>
                    {detail.radical ? (
                      <span className={styles.constructionMetaItem}>
                        <strong>{labels.radical}:</strong> <span className={styles.song}>{detail.radical}</span>
                      </span>
                    ) : null}
                    {detail.radicalDisplayForm && detail.radicalDisplayForm !== detail.radical ? (
                      <span className={styles.constructionMetaItem}>
                        <strong>{labels.radicalForm}:</strong> <span className={styles.song}>{detail.radicalDisplayForm}</span>
                      </span>
                    ) : null}
                    {knowledgeLanguage === "zh" && detail.structure.classificationZh ? (
                      <span className={styles.constructionMetaItem}>
                        <strong>结构:</strong> {detail.structure.classificationZh}
                      </span>
                    ) : null}
                  </div>

                  {detail.structure.formula ? (
                    <p className={`${styles.moduleLead} ${styles.structureFormula}`}>
                      {detail.structure.formula}
                    </p>
                  ) : null}
                  {structureExplanation ? (
                    <p className={styles.moduleLead}>{moduleText(structureExplanation, knowledgeLanguage)}</p>
                  ) : null}

                  {detail.componentsApplicability === "PRESENT" && detail.components.length > 0 ? (
                    <div className={styles.componentList}>
                      {detail.components.map((component) => (
                        <div key={component.logicalKey} className={styles.componentItem}>
                          <span className={`${styles.componentGlyph} ${styles.song}`}>{component.glyph}</span>
                          <div className={styles.componentCopy}>
                            {(knowledgeLanguage === "zh" ? component.canonicalRoleZh : component.localizedRoleLabel ?? component.canonicalRoleZh) ? (
                              <strong>{knowledgeLanguage === "zh" ? component.canonicalRoleZh : component.localizedRoleLabel ?? component.canonicalRoleZh}</strong>
                            ) : null}
                            <p>{knowledgeLanguage === "zh" ? component.canonicalZh : component.localizedText ?? component.canonicalZh}</p>
                          </div>
                          {(knowledgeLanguage === "zh" ? component.canonicalRoleZh : component.localizedRoleLabel ?? component.canonicalRoleZh) ? (
                            <span className={styles.rolePill}>{knowledgeLanguage === "zh" ? component.canonicalRoleZh : component.localizedRoleLabel ?? component.canonicalRoleZh}</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {hasRecognition ? (
                <section className={styles.moduleBlock} id="character-recognition">
                  <h2>{labels.recognition}</h2>
                  <div className={styles.formRow}>
                    <span className={`${styles.formGlyph} ${styles.song}`}>{detail.glyph}</span>
                    {secondaryForms.map((form) => (
                      <span key={form.publicId} className={styles.formPair}>
                        <span className={styles.formArrow} aria-hidden="true">↔</span>
                        <span className={`${styles.formGlyph} ${styles.song}`}>{form.glyph}</span>
                      </span>
                    ))}
                  </div>
                  {formRelationExplanation ? (
                    <p className={styles.moduleLead}>{moduleText(formRelationExplanation, knowledgeLanguage)}</p>
                  ) : null}
                  {formRecognition ? (
                    <p className={styles.moduleLead}>{moduleText(formRecognition, knowledgeLanguage)}</p>
                  ) : null}
                </section>
              ) : null}
            </div>

            {railOccurrence.length > 0 ? (
              <div className={vocabStyles.mobileCharacterPanel}>
                <VocabularyCharacterRail
                  occurrences={railOccurrence}
                  labels={characterLabels}
                  showHanViet={showHanViet}
                  variant="embedded"
                  anchorId="characters"
                />
              </div>
            ) : null}
          </div>
        </article>

        <VocabularyCharacterRail
          occurrences={railOccurrence}
          labels={characterLabels}
          showHanViet={showHanViet}
          variant="rail"
          anchorId="characters-rail"
        />
      </div>
    </main>
  );
}
