"use client";

import { useState } from "react";
import type {
  VocabularyExample,
  VocabularyLexicalRelation,
  VocabularyReadingItem,
  VocabularyRelationTarget,
} from "@/lib/vocabularyDetail";
import styles from "./VocabularyRichSupport.module.css";

type Props = {
  item: VocabularyReadingItem;
  sourceExpression: string;
  labels: {
    usage: string;
    nuanceContext: string;
    memoryTip: string;
    constructions: string;
    collocations: string;
    classifiers: string;
    example: string;
    translationEquivalent: string;
    synonyms: string;
    nearSynonyms: string;
    antonyms: string;
    relatedWords: string;
    quickDistinction: string;
    commonMistakes: string;
    relatedKnowledge: string;
    practice: string;
    showMore: string;
    collapse: string;
  };
};

function LearnerExample({ example }: { example: VocabularyExample }) {
  return (
    <div className={styles.exampleItem}>
      <span className={styles.exampleChinese}>{example.chineseText}</span>
      {example.pinyinText ? (
        <span className={styles.examplePinyin}>{example.pinyinText}</span>
      ) : null}
      {example.translationText ? (
        <span className={styles.exampleTranslation}>{example.translationText}</span>
      ) : null}
      {example.learnerExplanation ? <small>{example.learnerExplanation}</small> : null}
    </div>
  );
}

function RelationTarget({ target }: { target: VocabularyRelationTarget }) {
  return (
    <div className={styles.relationItem}>
      <strong>{target.displayForm}</strong>
      <span> · {target.pronunciation} — {target.shortLabel}</span>
    </div>
  );
}


function splitLearnerExplanationParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs: string[] = [];
  let buffer = "";

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    const nextCharacter = normalized[index + 1];
    buffer += character;

    const closesIdea =
      character === "。"
      || character === "！"
      || character === "？"
      || character === "!"
      || character === "?"
      || character === "；"
      || character === ";"
      || character === "\n"
      || (
        character === "."
        && (nextCharacter === undefined || /\s/u.test(nextCharacter))
      );

    if (!closesIdea) continue;

    const paragraph = buffer.trim();
    if (paragraph) paragraphs.push(paragraph);
    buffer = "";

    while (
      index + 1 < normalized.length
      && /[ \t]/u.test(normalized[index + 1])
    ) {
      index += 1;
    }
  }

  const trailingParagraph = buffer.trim();
  if (trailingParagraph) paragraphs.push(trailingParagraph);

  return paragraphs.length > 0 ? paragraphs : [normalized];
}

function RelationGroup({
  relations,
  relationType,
  label,
}: {
  relations: VocabularyLexicalRelation[];
  relationType: VocabularyLexicalRelation["relationType"];
  label: string;
}) {
  const rows = relations.filter((relation) => relation.relationType === relationType);
  if (rows.length === 0) return null;
  return (
    <section className={styles.supportBlock} data-vocabulary-module={relationType}>
      <h4>{label}</h4>
      <div className={styles.relationList}>
        {rows.map((relation, index) => (
          <RelationTarget
            key={relation.target.displayForm + relation.target.pronunciation + index}
            target={relation.target}
          />
        ))}
      </div>
    </section>
  );
}

export default function VocabularyRichSupport({ item, sourceExpression, labels }: Props) {
  const [examplesExpanded, setExamplesExpanded] = useState(false);
  const [collocationsExpanded, setCollocationsExpanded] = useState(false);
  const visibleExamples = examplesExpanded ? item.examples : item.examples.slice(0, 2);
  const visibleCollocations = collocationsExpanded
    ? item.collocations
    : item.collocations.slice(0, 4);

  const usageCopy = item.usage?.context;
  const translationSummary = item.translationEquivalents.length > 0
    ? item.usageNote
    : null;
  const nuanceRows = [
    item.usageContext,
    item.socialContext,
    item.pragmaticExplanation,
  ].filter((value): value is string => Boolean(value));

  const hasRichSupport = Boolean(
    usageCopy
    || translationSummary
    || nuanceRows.length
    || item.translationEquivalents.length
    || item.collocations.length
    || item.classifiers.length
    || item.constructions.length
    || item.examples.length
    || item.lexicalRelations.length
    || item.relatedWords.length
    || item.quickDistinctions.length
    || item.commonMistakes.length
    || item.memoryTip
    || item.knowledgeLinks.length
    || item.practiceLinks.length
  );

  if (!hasRichSupport) return null;

  return (
    <div className={styles.supportStack}>
      {usageCopy ? (
        <section className={styles.supportBlock} data-vocabulary-module="usage">
          <h4>{labels.usage}</h4>
          <p>{usageCopy}</p>
        </section>
      ) : null}

      {item.translationEquivalents.length > 0 ? (
        <details className={styles.translationDetails} data-vocabulary-module="translations">
          <summary>
            <span>{labels.translationEquivalent}</span>
            <span className={styles.translationCount}>{item.translationEquivalents.length}</span>
          </summary>
          {translationSummary ? <p>{translationSummary}</p> : null}
          <div className={styles.translationList}>
            {item.translationEquivalents.map((translation) => (
              <div key={translation.publicId} className={styles.translationItem}>
                <strong>{translation.expression}</strong>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {nuanceRows.length > 0 ? (
        <section className={styles.supportBlock} data-vocabulary-module="nuance-context">
          <h4>{labels.nuanceContext}</h4>
          {nuanceRows.map((row, index) => <p key={index}>{row}</p>)}
        </section>
      ) : null}

      {item.collocations.length > 0 ? (
        <section className={styles.supportBlock} data-vocabulary-module="common-combinations">
          <h4>{labels.collocations}</h4>
          <div className={styles.collocationList}>
            {visibleCollocations.map((collocation) => (
              <div key={collocation.publicId} className={styles.collocationItem}>
                <b className={styles.collocationExpression}>{collocation.expression}</b>
                {collocation.learnerMeaning ? (
                  <span className={styles.collocationMeaning}>{collocation.learnerMeaning}</span>
                ) : null}
                {collocation.examples.length > 0 ? (
                  <div className={styles.constructionExamples}>
                    {collocation.examples.map((example) => (
                      <LearnerExample key={example.publicId} example={example} />
                    ))}
                  </div>
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
        <section className={styles.classifierBlock} data-vocabulary-module="measure-words">
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

      {item.constructions.length > 0 ? (
        <section className={styles.supportBlock} data-vocabulary-module="usage-patterns">
          <h4>{labels.constructions}</h4>
          <div className={styles.constructionList}>
            {item.constructions.map((construction) => (
              <div key={construction.publicId} className={styles.constructionItem}>
                <strong className={styles.constructionPattern}>{construction.patternText}</strong>
                {construction.explanation
                  ? splitLearnerExplanationParagraphs(construction.explanation).map((paragraph, index) => (
                      <p key={`${construction.publicId}-explanation-${index}`}>{paragraph}</p>
                    ))
                  : null}
                {construction.examples.length > 0 ? (
                  <div className={styles.constructionExamples}>
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

      <RelationGroup relations={item.lexicalRelations} relationType="synonym" label={labels.synonyms} />
      <RelationGroup relations={item.lexicalRelations} relationType="near_synonym" label={labels.nearSynonyms} />
      <RelationGroup relations={item.lexicalRelations} relationType="antonym" label={labels.antonyms} />

      {item.relatedWords.length > 0 ? (
        <section className={styles.supportBlock} data-vocabulary-module="related-words">
          <h4>{labels.relatedWords}</h4>
          <div className={styles.relationList}>
            {item.relatedWords.map((related, index) => (
              <RelationTarget
                key={related.target.displayForm + related.target.pronunciation + index}
                target={related.target}
              />
            ))}
          </div>
        </section>
      ) : null}

      {item.quickDistinctions.length > 0 ? (
        <section className={styles.distinctionBlock} data-vocabulary-module="word-comparison">
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
                      <div className={styles.distinctionExamples}>
                        {distinction.contrastExamples.map((example, index) => (
                          <span key={distinction.publicId + "-source-" + index}>
                            <b>{example.sourceExpression}</b>
                            {example.sourcePinyin ? <small className={styles.distinctionPinyin}>{example.sourcePinyin}</small> : null}
                            {example.sourceTranslation ? <small className={styles.distinctionTranslation}>{example.sourceTranslation}</small> : null}
                          </span>
                        ))}
                      </div>
                    </section>
                    <section className={styles.distinctionCard}>
                      <strong className={styles.distinctionTerm}>{distinction.targetExpression}</strong>
                      <p className={styles.distinctionUse}>{distinction.targetUseWhen}</p>
                      <div className={styles.distinctionExamples}>
                        {distinction.contrastExamples.map((example, index) => (
                          <span key={distinction.publicId + "-target-" + index}>
                            <b>{example.targetExpression}</b>
                            {example.targetPinyin ? <small className={styles.distinctionPinyin}>{example.targetPinyin}</small> : null}
                            {example.targetTranslation ? <small className={styles.distinctionTranslation}>{example.targetTranslation}</small> : null}
                          </span>
                        ))}
                      </div>
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
                <div className={styles.mistakeContrast}>
                  {mistake.incorrectExpression ? (
                    <span>
                      <b className={styles.mistakeExpression}>✕ {mistake.incorrectExpression}</b>
                      {mistake.incorrectPinyin ? <small className={styles.mistakePinyin}>{mistake.incorrectPinyin}</small> : null}
                      {mistake.incorrectTranslation ? <small className={styles.mistakeTranslation}>{mistake.incorrectTranslation}</small> : null}
                    </span>
                  ) : null}
                  {mistake.correctExpression ? (
                    <strong>
                      <b className={styles.mistakeExpression}>✓ {mistake.correctExpression}</b>
                      {mistake.correctPinyin ? <small className={styles.mistakePinyin}>{mistake.correctPinyin}</small> : null}
                      {mistake.correctTranslation ? <small className={styles.mistakeTranslation}>{mistake.correctTranslation}</small> : null}
                    </strong>
                  ) : null}
                </div>
                {mistake.learnerExplanation ? <p>{mistake.learnerExplanation}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {item.memoryTip ? (
        <section className={styles.supportBlock} data-vocabulary-module="memory-tip">
          <h4>{labels.memoryTip}</h4>
          <p>{item.memoryTip}</p>
        </section>
      ) : null}

      {item.knowledgeLinks.length > 0 ? (
        <section className={styles.supportBlock} data-vocabulary-module="related-knowledge">
          <h4>{labels.relatedKnowledge}</h4>
          <div className={styles.relationList}>
            {item.knowledgeLinks.map((link) => (
              <div key={link.publicId} className={styles.relationItem}>
                <strong>{link.targetLabel}</strong>
                {link.targetSubtitle ? <p>{link.targetSubtitle}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {item.practiceLinks.length > 0 ? (
        <section className={styles.supportBlock} data-vocabulary-module="practice">
          <h4>{labels.practice}</h4>
          <div className={styles.relationList}>
            {item.practiceLinks.map((link) => (
              <div key={link.publicId} className={styles.practiceItem}>
                <strong>{link.targetLabel}</strong>
                {link.targetSubtitle ? <p>{link.targetSubtitle}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
