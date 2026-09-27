"use client";

import { useState } from "react";
import type { VocabularyExample, VocabularyReadingItem } from "@/lib/vocabularyDetail";
import styles from "./VocabularyRichSupport.module.css";

type Props = {
  item: VocabularyReadingItem;
  sourceExpression: string;
  labels: {
    constructions: string;
    collocations: string;
    classifiers: string;
    example: string;
    translationEquivalent: string;
    quickDistinction: string;
    commonMistakes: string;
    relatedKnowledge: string;
    practice: string;
    showMore: string;
    collapse: string;
  };
};

function LearnerExample({
  example,
}: {
  example: VocabularyExample;
}) {
  return (
    <div className={styles.exampleItem}>
      <span className={styles.exampleChinese}>{example.chineseText}</span>
      {example.pinyinText ? (
        <span className={styles.examplePinyin}>{example.pinyinText}</span>
      ) : null}
      {example.translationText ? (
        <span className={styles.exampleTranslation}>{example.translationText}</span>
      ) : null}
    </div>
  );
}

export default function VocabularyRichSupport({ item, sourceExpression, labels }: Props) {
  const [examplesExpanded, setExamplesExpanded] = useState(false);
  const [collocationsExpanded, setCollocationsExpanded] = useState(false);
  const visibleExamples = examplesExpanded ? item.examples : item.examples.slice(0, 2);
  const visibleCollocations = collocationsExpanded
    ? item.collocations
    : item.collocations.slice(0, 4);
  const hasRelations = item.knowledgeLinks.length > 0 || item.practiceLinks.length > 0;
  const hasRichSupport =
    item.examples.length > 0
    || item.translationEquivalents.length > 0
    || item.constructions.length > 0
    || item.collocations.length > 0
    || item.classifiers.length > 0
    || item.quickDistinctions.length > 0
    || item.commonMistakes.length > 0
    || hasRelations;

  if (!hasRichSupport) return null;

  return (
    <div className={styles.supportStack}>
      {item.examples.length > 0 ? (
        <section className={styles.supportBlock} data-vocabulary-module="examples">
          <h4>{labels.example}</h4>
          <div className={styles.exampleList}>
            {visibleExamples.map((example) => (
              <LearnerExample key={example.publicId} example={example} />
            ))}
          </div>
          {item.examples.length > 2 ? (
            <button
              type="button"
              className={styles.expandButton}
              aria-expanded={examplesExpanded}
              onClick={() => setExamplesExpanded((value) => !value)}
            >
              {examplesExpanded ? labels.collapse : labels.showMore}
            </button>
          ) : null}
        </section>
      ) : null}

      {item.translationEquivalents.length > 0 ? (
        <details className={styles.translationDetails} data-vocabulary-module="translation-equivalents">
          <summary>
            <span>{labels.translationEquivalent}</span>
            <span className={styles.translationCount}>{item.translationEquivalents.length}</span>
          </summary>
          <div className={styles.translationList}>
            {item.translationEquivalents.map((translation) => (
              <div key={translation.publicId} className={styles.translationItem}>
                <strong>{translation.expression}</strong>
                {translation.contextRestriction ? <p>{translation.contextRestriction}</p> : null}
                {translation.mismatchNote ? <small>{translation.mismatchNote}</small> : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {item.constructions.length > 0 ? (
        <section className={styles.supportBlock} data-vocabulary-module="constructions">
          <h4>{labels.constructions}</h4>
          <div className={styles.constructionList}>
            {item.constructions.map((construction) => (
              <div key={construction.publicId} className={styles.constructionItem}>
                <strong className={styles.constructionPattern}>{construction.patternText}</strong>
                {construction.explanation ? <p>{construction.explanation}</p> : null}
                {construction.examples.length > 0 ? (
                  <div className={styles.constructionExamples}>
                    <span className={styles.constructionExampleLabel}>{labels.example}</span>
                    {construction.examples.map((example) => (
                      <LearnerExample key={example.publicId} example={example} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {item.collocations.length > 0 ? (
        <section className={styles.supportBlock} data-vocabulary-module="collocations">
          <h4>{labels.collocations}</h4>
          <div className={styles.collocationList}>
            {visibleCollocations.map((collocation) => (
              <div key={collocation.publicId} className={styles.collocationItem}>
                <b className={styles.collocationExpression}>{collocation.expression}</b>
                {collocation.learnerMeaning ? (
                  <span className={styles.collocationMeaning}>{collocation.learnerMeaning}</span>
                ) : null}
              </div>
            ))}
          </div>
          {item.collocations.length > 4 ? (
            <button
              type="button"
              className={styles.expandButton}
              aria-expanded={collocationsExpanded}
              onClick={() => setCollocationsExpanded((value) => !value)}
            >
              {collocationsExpanded ? labels.collapse : labels.showMore}
            </button>
          ) : null}
        </section>
      ) : null}

      {item.classifiers.length > 0 ? (
        <section className={styles.classifierBlock} data-vocabulary-module="classifiers">
          <h4>{labels.classifiers}</h4>
          <div className={styles.classifierList}>
            {item.classifiers.map((classifier) => (
              <div key={classifier.publicId} className={styles.classifierItem}>
                <strong>{classifier.expression}</strong>
                {classifier.learnerNote ? <p>{classifier.learnerNote}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {item.quickDistinctions.length > 0 ? (
        <section className={styles.distinctionBlock} data-vocabulary-module="quick-distinction">
          <h4>{labels.quickDistinction}</h4>
          <div className={styles.distinctionList}>
            {item.quickDistinctions.map((distinction) => {
              const structured = Boolean(distinction.sourceUseWhen && distinction.targetUseWhen);
              if (!structured) {
                return (
                  <div key={distinction.publicId} className={styles.distinctionItem}>
                    <strong>{distinction.targetExpression}</strong>
                    {distinction.learnerExplanation ? <p>{distinction.learnerExplanation}</p> : null}
                  </div>
                );
              }

              return (
                <article key={distinction.publicId} className={styles.structuredDistinction}>
                  {distinction.learnerExplanation ? (
                    <p className={styles.distinctionIntro}>{distinction.learnerExplanation}</p>
                  ) : null}
                  <div className={styles.distinctionCompareGrid}>
                    <section className={styles.distinctionCard}>
                      <strong className={styles.distinctionTerm}>{sourceExpression}</strong>
                      <p className={styles.distinctionUse}>{distinction.sourceUseWhen}</p>
                      {distinction.contrastExamples.length > 0 ? (
                        <div className={styles.distinctionExamples}>
                          {distinction.contrastExamples.map((example, index) => (
                            <span key={distinction.publicId + "-source-" + index}>
                              <b>{example.sourceExpression}</b>
                              {example.sourceTranslation ? (
                                <small className={styles.distinctionTranslation}>{example.sourceTranslation}</small>
                              ) : null}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </section>
                    <section className={styles.distinctionCard}>
                      <strong className={styles.distinctionTerm}>{distinction.targetExpression}</strong>
                      <p className={styles.distinctionUse}>{distinction.targetUseWhen}</p>
                      {distinction.contrastExamples.length > 0 ? (
                        <div className={styles.distinctionExamples}>
                          {distinction.contrastExamples.map((example, index) => (
                            <span key={distinction.publicId + "-target-" + index}>
                              <b>{example.targetExpression}</b>
                              {example.targetTranslation ? (
                                <small className={styles.distinctionTranslation}>{example.targetTranslation}</small>
                              ) : null}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </section>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {item.commonMistakes.length > 0 ? (
        <section className={styles.mistakeBlock} data-vocabulary-module="common-mistakes">
          <h4>{labels.commonMistakes}</h4>
          <div className={styles.mistakeList}>
            {item.commonMistakes.map((mistake) => (
              <article key={mistake.publicId} className={styles.mistakeItem}>
                {(mistake.incorrectExpression || mistake.correctExpression) ? (
                  <div className={styles.mistakeContrast}>
                    {mistake.incorrectExpression ? <span>✕ {mistake.incorrectExpression}</span> : null}
                    {mistake.correctExpression ? <strong>✓ {mistake.correctExpression}</strong> : null}
                  </div>
                ) : null}
                {mistake.learnerExplanation ? <p>{mistake.learnerExplanation}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {hasRelations ? (
        <section className={styles.relationGrid} data-vocabulary-module="relations">
          {item.knowledgeLinks.length > 0 ? (
            <div className={styles.relationBlock}>
              <h4>{labels.relatedKnowledge}</h4>
              <div className={styles.relationList}>
                {item.knowledgeLinks.map((link) => (
                  <div key={link.publicId} className={styles.relationItem}>
                    <span className={styles.relationKind}>{link.kind}</span>
                    <strong>{link.targetLabel}</strong>
                    {link.targetSubtitle ? <p>{link.targetSubtitle}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {item.practiceLinks.length > 0 ? (
            <div className={styles.practiceBlock}>
              <h4>{labels.practice}</h4>
              <div className={styles.relationList}>
                {item.practiceLinks.map((link) => (
                  <div key={link.publicId} className={styles.practiceItem}>
                    <strong>{link.targetLabel}</strong>
                    {link.targetSubtitle ? <p>{link.targetSubtitle}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
