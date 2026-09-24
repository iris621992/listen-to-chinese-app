import type { VocabularyReadingItem } from "@/lib/vocabularyDetail";
import styles from "./VocabularyRichSupport.module.css";

type Props = {
  item: VocabularyReadingItem;
  sourceExpression: string;
  labels: {
    constructions: string;
    collocations: string;
    classifiers: string;
    example: string;
    quickDistinction: string;
    commonMistakes: string;
    relatedKnowledge: string;
    practice: string;
  };
};

function sentenceBehaviorLabel(labels: Props["labels"]) {
  if (labels.classifiers === "Lượng từ") return "Cách hoạt động trong câu";
  if (labels.classifiers === "كلمات القياس") return "طريقة عملها في الجملة";
  return "How it works in a sentence";
}

export default function VocabularyRichSupport({ item, sourceExpression, labels }: Props) {
  const hasSentenceBehavior =
    item.constructions.length > 0
    || item.collocations.length > 0
    || item.classifiers.length > 0;
  const hasRelations = item.knowledgeLinks.length > 0 || item.practiceLinks.length > 0;
  const hasRichSupport =
    hasSentenceBehavior
    || item.examples.length > 0
    || item.commonMistakes.length > 0
    || item.quickDistinctions.length > 0
    || hasRelations;

  if (!hasRichSupport) return null;

  return (
    <div className={styles.supportStack}>
      {hasSentenceBehavior ? (
        <section className={styles.supportBlock} data-vocabulary-module="sentence-behavior">
          <h4>{sentenceBehaviorLabel(labels)}</h4>
          <div className={styles.behaviorGrid}>
            {item.constructions.length > 0 ? (
              <div className={styles.behaviorItem} data-vocabulary-module="constructions">
                <strong className={styles.behaviorTitle}>{labels.constructions}</strong>
                <div className={styles.constructionList}>
                  {item.constructions.map((construction) => (
                    <div key={construction.publicId} className={styles.constructionItem}>
                      <strong className={styles.constructionPattern}>{construction.patternText}</strong>
                      {construction.explanation ? <p>{construction.explanation}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {item.classifiers.length > 0 ? (
              <div className={styles.behaviorItem} data-vocabulary-module="classifiers">
                <strong className={styles.behaviorTitle}>{labels.classifiers}</strong>
                <div className={styles.classifierList}>
                  {item.classifiers.map((classifier) => (
                    <div key={classifier.publicId} className={styles.classifierItem}>
                      <strong>{classifier.expression}</strong>
                      {classifier.learnerNote ? <p>{classifier.learnerNote}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {item.collocations.length > 0 ? (
              <div className={styles.behaviorItem} data-vocabulary-module="collocations">
                <strong className={styles.behaviorTitle}>{labels.collocations}</strong>
                <div className={styles.collocationList}>
                  {item.collocations.map((collocation) => (
                    <div key={collocation.publicId} className={styles.collocationItem}>
                      <b className={styles.collocationExpression}>{collocation.expression}</b>
                      {collocation.learnerMeaning ? (
                        <span className={styles.collocationMeaning}>{collocation.learnerMeaning}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {item.examples.length > 0 ? (
        <section className={styles.supportBlock} data-vocabulary-module="examples">
          <h4>{labels.example}</h4>
          <div className={styles.exampleList}>
            {item.examples.map((example) => (
              <div key={example.publicId} className={styles.exampleItem}>
                <span className={styles.exampleChinese}>{example.chineseText}</span>
                {example.pinyinText ? <span className={styles.examplePinyin}>{example.pinyinText}</span> : null}
                {example.translationText ? (
                  <span className={styles.exampleTranslation}>{example.translationText}</span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {item.commonMistakes.length > 0 ? (
        <section className={styles.supportBlock + " " + styles.mistakeBlock} data-vocabulary-module="common-mistakes">
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

      {item.quickDistinctions.length > 0 ? (
        <section className={styles.supportBlock + " " + styles.distinctionBlock} data-vocabulary-module="quick-distinction">
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
                            <span key={distinction.publicId + "-source-" + index}>{example.sourceExpression}</span>
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
                            <span key={distinction.publicId + "-target-" + index}>{example.targetExpression}</span>
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

      {hasRelations ? (
        <section className={styles.relationGrid} data-vocabulary-module="relations">
          {item.knowledgeLinks.length > 0 ? (
            <div className={styles.supportBlock}>
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
            <div className={styles.supportBlock}>
              <h4>{labels.practice}</h4>
              <div className={styles.relationList}>
                {item.practiceLinks.map((link) => (
                  <div key={link.publicId} className={styles.relationItem}>
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
