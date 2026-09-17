import type { VocabularyReadingItem } from "@/lib/vocabularyDetail";
import styles from "./VocabularyRichSupport.module.css";

type Props = {
  item: VocabularyReadingItem;
  labels: {
    collocations: string;
    classifiers: string;
    example: string;
    quickDistinction: string;
  };
};

function sentenceBehaviorLabel(labels: Props["labels"]) {
  if (labels.classifiers === "Lượng từ") return "Cách hoạt động trong câu";
  if (labels.classifiers === "كلمات القياس") return "طريقة عملها في الجملة";
  return "How it works in a sentence";
}

export default function VocabularyRichSupport({ item, labels }: Props) {
  const hasSentenceBehavior = item.collocations.length > 0 || item.classifiers.length > 0;
  const hasRichSupport =
    hasSentenceBehavior
    || item.examples.length > 0
    || item.quickDistinctions.length > 0;

  if (!hasRichSupport) return null;

  return (
    <div className={styles.supportStack}>
      {hasSentenceBehavior ? (
        <section className={styles.supportBlock}>
          <h4>{sentenceBehaviorLabel(labels)}</h4>
          <div className={styles.behaviorGrid}>
            {item.classifiers.length > 0 ? (
              <div className={styles.behaviorItem}>
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
              <div className={styles.behaviorItem}>
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
        <section className={styles.supportBlock}>
          <h4>{labels.example}</h4>
          <div className={styles.exampleList}>
            {item.examples.map((example) => (
              <div key={example.publicId} className={styles.exampleItem}>
                <span className={styles.exampleChinese}>{example.chineseText}</span>
                {example.pinyinText ? (
                  <span className={styles.examplePinyin}>{example.pinyinText}</span>
                ) : null}
                {example.translationText ? (
                  <span className={styles.exampleTranslation}>{example.translationText}</span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {item.quickDistinctions.length > 0 ? (
        <section className={`${styles.supportBlock} ${styles.distinctionBlock}`}>
          <h4>{labels.quickDistinction}</h4>
          <div className={styles.distinctionList}>
            {item.quickDistinctions.map((distinction) => (
              <div key={distinction.publicId} className={styles.distinctionItem}>
                <strong>{distinction.targetExpression}</strong>
                {distinction.learnerExplanation ? <p>{distinction.learnerExplanation}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
