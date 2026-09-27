import styles from "./VocabularyPronunciationMeta.module.css";

type Props = {
  pronunciation: string;
  hanViet: string | null;
  traditionalForms: string[];
  labels: {
    hanViet: string;
    traditional: string;
  };
};

export default function VocabularyPronunciationMeta({
  pronunciation,
  hanViet,
  traditionalForms,
  labels,
}: Props) {
  const hasSecondaryMeta = Boolean(hanViet || traditionalForms.length > 0);

  return (
    <div className={styles.pronMeta}>
      <div className={styles.pronLine}>
        <span className={styles.pinyin}>{pronunciation}</span>
      </div>

      {hasSecondaryMeta ? (
        <div className={styles.secondaryLine}>
          {hanViet ? (
            <span className={styles.secondaryItem}>
              <span className={styles.secondaryLabel}>{labels.hanViet}</span>
              <strong className={styles.hanViet}>{hanViet}</strong>
            </span>
          ) : null}

          {hanViet && traditionalForms.length > 0 ? (
            <span className={styles.dot} aria-hidden="true">·</span>
          ) : null}

          {traditionalForms.length > 0 ? (
            <span className={styles.secondaryItem}>
              <span className={styles.secondaryLabel}>{labels.traditional}</span>
              <span className={styles.traditionalForms}>
                {traditionalForms.map((form, index) => (
                  <strong key={index} className={styles.traditional}>{form}</strong>
                ))}
              </span>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
