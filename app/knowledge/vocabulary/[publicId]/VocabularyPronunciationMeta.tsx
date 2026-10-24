import type {
  VocabularyForm,
  VocabularyProficiency,
} from "@/lib/vocabularyDetail";
import styles from "./VocabularyPronunciationMeta.module.css";

type Props = {
  pronunciation: string;
  hanViet: string | null;
  secondaryForms: VocabularyForm[];
  proficiency: VocabularyProficiency[];
  labels: {
    hanViet: string;
    traditional: string;
    simplified: string;
    writtenForm: string;
    proficiency: string;
  };
};

function formLabel(form: VocabularyForm, labels: Props["labels"]) {
  if (form.scriptVariantCode === "traditional") return labels.traditional;
  if (form.scriptVariantCode === "simplified") return labels.simplified;
  return labels.writtenForm;
}

function proficiencyLabel(row: VocabularyProficiency, labels: Props["labels"]) {
  if (row.levelSystemCode === "gf0025_2021") return `${labels.proficiency} ${row.levelCode}`;
  return `${row.levelSystemCode} ${row.levelCode}`;
}

export default function VocabularyPronunciationMeta({
  pronunciation,
  hanViet,
  secondaryForms,
  proficiency,
  labels,
}: Props) {
  const hasSecondaryMeta = Boolean(
    hanViet || secondaryForms.length > 0 || proficiency.length > 0,
  );

  return (
    <div className={styles.pronMeta}>
      <div className={styles.pronLine}>
        <span className={styles.pinyin}>{pronunciation}</span>
      </div>

      {hasSecondaryMeta ? (
        <div className={styles.secondaryLine}>
          {secondaryForms.map((form) => (
            <span key={form.publicId} className={styles.secondaryItem}>
              <span className={styles.secondaryLabel}>{formLabel(form, labels)}</span>
              <strong className={styles.traditional}>{form.text}</strong>
            </span>
          ))}

          {hanViet ? (
            <span className={styles.secondaryItem}>
              <span className={styles.secondaryLabel}>{labels.hanViet}</span>
              <strong className={styles.hanViet}>{hanViet}</strong>
            </span>
          ) : null}

          {proficiency.map((row) => (
            <span
              key={row.levelSystemCode + row.levelCode}
              className={styles.secondaryItem}
            >
              <strong>{proficiencyLabel(row, labels)}</strong>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
