import styles from "./VocabularyPronunciationMeta.module.css";

type Props = {
  pronunciation: string;
  hanViet: string | null;
};

export default function VocabularyPronunciationMeta({ pronunciation, hanViet }: Props) {
  return (
    <div className={styles.pronLine}>
      <span className={styles.pinyin}>{pronunciation}</span>
      {hanViet ? (
        <>
          <span className={styles.dot} aria-hidden="true">·</span>
          <span className={styles.hanViet}>{hanViet}</span>
        </>
      ) : null}
    </div>
  );
}
