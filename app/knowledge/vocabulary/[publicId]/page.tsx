import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";
import { loadVocabularyDetail } from "@/lib/vocabularyDetail";
import styles from "./VocabularyDetail.module.css";

type Props = {
  params: Promise<{ publicId: string }>;
  searchParams?: Promise<{
    uiLang?: string;
    lang?: string;
    levelSystem?: string;
    level?: string;
  }>;
};

type Labels = {
  eyebrow: string;
  back: string;
  forms: string;
  simplified: string;
  traditional: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  translations: string;
  entryInfo: string;
  writingSystem: string;
  languageVariety: string;
  region: string;
  readings: string;
  senses: string;
  unavailable: string;
};

const LABELS: Record<string, Labels> = {
  en: {
    eyebrow: "Vocabulary",
    back: "Back to Knowledge",
    forms: "Written forms",
    simplified: "Simplified",
    traditional: "Traditional",
    pronunciation: "Pronunciation",
    partOfSpeech: "Part of speech",
    meaning: "Meaning",
    translations: "Translation equivalents",
    entryInfo: "Entry information",
    writingSystem: "Writing system",
    languageVariety: "Language variety",
    region: "Region",
    readings: "Readings",
    senses: "Senses",
    unavailable: "This vocabulary entry is temporarily unavailable.",
  },
  vi: {
    eyebrow: "Từ vựng",
    back: "Quay lại Kiến thức",
    forms: "Dạng chữ",
    simplified: "Giản thể",
    traditional: "Phồn thể",
    pronunciation: "Phiên âm",
    partOfSpeech: "Từ loại",
    meaning: "Nghĩa",
    translations: "Từ tương đương",
    entryInfo: "Thông tin từ",
    writingSystem: "Dạng chữ",
    languageVariety: "Biến thể ngôn ngữ",
    region: "Khu vực",
    readings: "Cách đọc",
    senses: "Nghĩa",
    unavailable: "Mục từ này hiện chưa thể hiển thị.",
  },
  ar: {
    eyebrow: "المفردات",
    back: "العودة إلى المعرفة",
    forms: "الأشكال الكتابية",
    simplified: "المبسطة",
    traditional: "التقليدية",
    pronunciation: "النطق",
    partOfSpeech: "نوع الكلمة",
    meaning: "المعنى",
    translations: "المكافئات الترجمية",
    entryInfo: "معلومات المدخل",
    writingSystem: "نظام الكتابة",
    languageVariety: "التنوع اللغوي",
    region: "المنطقة",
    readings: "القراءات",
    senses: "المعاني",
    unavailable: "هذا المدخل غير متاح مؤقتًا.",
  },
};

const labelFor = (localeCode: string) => LABELS[localeCode] ?? LABELS.en;

const formLabel = (scriptVariantCode: string | null, labels: Labels) => {
  if (scriptVariantCode === "simplified") return labels.simplified;
  if (scriptVariantCode === "traditional") return labels.traditional;
  return scriptVariantCode ?? labels.forms;
};

const POS_LABELS: Record<string, Record<string, string>> = {
  en: {
    noun: "Noun",
    verb: "Verb",
    adjective: "Adjective",
    adverb: "Adverb",
    pronoun: "Pronoun",
    numeral: "Numeral",
    classifier: "Classifier",
    preposition: "Preposition",
    conjunction: "Conjunction",
    particle: "Particle",
    interjection: "Interjection",
  },
  vi: {
    noun: "Danh từ",
    verb: "Động từ",
    adjective: "Tính từ",
    adverb: "Trạng từ",
    pronoun: "Đại từ",
    numeral: "Số từ",
    classifier: "Lượng từ",
    preposition: "Giới từ",
    conjunction: "Liên từ",
    particle: "Trợ từ",
    interjection: "Thán từ",
  },
  ar: {
    noun: "اسم",
    verb: "فعل",
    adjective: "صفة",
    adverb: "ظرف",
    pronoun: "ضمير",
    numeral: "عدد",
    classifier: "كلمة قياس",
    preposition: "حرف جر",
    conjunction: "حرف عطف",
    particle: "أداة",
    interjection: "تعجب",
  },
};

const REGION_LABELS: Record<string, Record<string, string>> = {
  en: {
    mainland_mandarin: "Mainland Mandarin",
  },
  vi: {
    mainland_mandarin: "Quan thoại · Trung Quốc đại lục",
  },
  ar: {
    mainland_mandarin: "الماندرين في بر الصين الرئيسي",
  },
};

const LANGUAGE_VARIETY_LABELS: Record<string, Record<string, string>> = {
  en: { mandarin: "Mandarin", cmn: "Mandarin" },
  vi: { mandarin: "Quan thoại", cmn: "Quan thoại" },
  ar: { mandarin: "الماندرين", cmn: "الماندرين" },
};

const learnerFacingCode = (
  code: string | null,
  localeCode: string,
  dictionary: Record<string, Record<string, string>>,
) => {
  if (!code) return null;
  return dictionary[localeCode]?.[code] ?? dictionary.en?.[code] ?? null;
};

export default async function VocabularyDetailPage({ params, searchParams }: Props) {
  const { publicId } = await params;
  const query = await searchParams;
  const interfaceLocale = resolveInterfaceLocale(query?.uiLang, query?.lang);
  const labels = labelFor(interfaceLocale.code);
  const learnerContextQuery = preservedLearnerContextQuery({
    uiLang: query?.uiLang,
    lang: query?.lang,
    levelSystem: query?.levelSystem,
    level: query?.level,
  });
  const result = await loadVocabularyDetail(publicId, query?.lang ?? query?.uiLang);

  if (result.status === "NOT_FOUND" || result.status === "INVALID_INPUT") notFound();

  if (result.status !== "FOUND") {
    return (
      <main className={styles.page} dir={interfaceLocale.direction}>
        <Link
          href={{ pathname: "/knowledge", query: learnerContextQuery }}
          className={styles.backLink}
        >
          ← {labels.back}
        </Link>
        <p className={styles.unavailable}>{labels.unavailable}</p>
      </main>
    );
  }

  const detail = result.detail;
  const primaryPronunciation =
    detail.pronunciations.find((item) => item.isDefault) ?? detail.pronunciations[0];
  const secondaryForms = detail.forms.filter((form) => form.text !== detail.displayForm);
  const readingCount = detail.pronunciations.length;
  const totalSenseCount = detail.pronunciations.reduce(
    (sum, pronunciation) => sum + pronunciation.readingItems.length,
    0,
  );
  const languageVarietyLabel = learnerFacingCode(
    detail.languageVarietyCode,
    interfaceLocale.code,
    LANGUAGE_VARIETY_LABELS,
  );
  const entryRegionLabel = learnerFacingCode(
    detail.regionProfileCode,
    interfaceLocale.code,
    REGION_LABELS,
  );

  return (
    <main className={styles.page} dir={interfaceLocale.direction}>
      <Link
        href={{ pathname: "/knowledge", query: learnerContextQuery }}
        className={styles.backLink}
      >
        ← {labels.back}
      </Link>

      <section className={styles.entryHeader} aria-labelledby="vocabulary-headword">
        <div className={styles.headerTopline}>
          <p className={styles.eyebrow}>{labels.eyebrow}</p>
          <div className={styles.headerStatus}>
            {languageVarietyLabel ? (
              <span className={styles.softBadge}>{languageVarietyLabel}</span>
            ) : null}
            {entryRegionLabel ? (
              <span className={styles.softBadge}>{entryRegionLabel}</span>
            ) : null}
          </div>
        </div>

        <div className={styles.lexicalCore}>
          <div className={styles.wordLine}>
            <h1 id="vocabulary-headword" className={styles.headword}>
              {detail.displayForm}
            </h1>
            {secondaryForms.length > 0 ? (
              <div className={styles.altForms} aria-label={labels.forms}>
                {secondaryForms.map((form) => (
                  <span key={form.publicId} className={styles.formBadge}>
                    <span className={styles.formText}>{form.text}</span>
                    <span className={styles.formRole}>
                      {formLabel(form.scriptVariantCode, labels)}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {primaryPronunciation ? (
            <div className={styles.pronunciationLine}>
              <span className={styles.pronunciation}>{primaryPronunciation.pronunciation}</span>
              {readingCount > 1 ? (
                <>
                  <span className={styles.dot}>·</span>
                  <span className={styles.secondaryMeta}>
                    {readingCount} {labels.readings.toLowerCase()}
                  </span>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {readingCount > 1 ? (
          <div className={styles.readingBlock}>
            <p className={styles.readingLabel}>{labels.readings}</p>
            <div className={styles.readingTabs}>
              {detail.pronunciations.map((pronunciation) => (
                <span
                  key={pronunciation.publicId}
                  className={styles.readingTab}
                  data-active={pronunciation.publicId === primaryPronunciation?.publicId}
                >
                  {pronunciation.pronunciation}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <div className={styles.workspace}>
        <div className={styles.mainColumn}>
          {detail.pronunciations.map((pronunciation, pronunciationIndex) => {
            const groupedByPos = new Map<string, typeof pronunciation.readingItems>();
            for (const item of pronunciation.readingItems) {
              const key = item.partOfSpeechCode ?? "other";
              const current = groupedByPos.get(key) ?? [];
              groupedByPos.set(key, [...current, item]);
            }
            const posGroups = [...groupedByPos.entries()];

            return (
              <section key={pronunciation.publicId} aria-labelledby={`reading-${pronunciation.publicId}`}>
                {readingCount > 1 ? (
                  <div className={styles.sectionHeading}>
                    <div>
                      <p className={styles.sectionEyebrow}>{labels.pronunciation}</p>
                      <h2 id={`reading-${pronunciation.publicId}`} className={styles.sectionTitle}>
                        {pronunciation.pronunciation}
                      </h2>
                    </div>
                    <span className={styles.sectionCount}>
                      {pronunciation.readingItems.length} {labels.senses.toLowerCase()}
                    </span>
                  </div>
                ) : null}

                {posGroups.length > 1 ? (
                  <nav className={styles.posNav} aria-label={labels.partOfSpeech}>
                    <div className={styles.posTabs}>
                      {posGroups.map(([posCode, items], posIndex) => {
                        const posLabel =
                          learnerFacingCode(posCode, interfaceLocale.code, POS_LABELS)
                          ?? labels.partOfSpeech;
                        return (
                          <a
                            key={posCode}
                            href={`#pos-${pronunciation.publicId}-${posCode}`}
                            className={styles.posTab}
                            data-active={posIndex === 0}
                          >
                            {posLabel} ({items.length})
                          </a>
                        );
                      })}
                    </div>
                  </nav>
                ) : null}

                {posGroups.map(([posCode, items]) => {
                  const posLabel =
                    learnerFacingCode(posCode, interfaceLocale.code, POS_LABELS)
                    ?? null;
                  return (
                    <section
                      key={`${pronunciation.publicId}-${posCode}`}
                      id={`pos-${pronunciation.publicId}-${posCode}`}
                    >
                      <div className={styles.sectionHeading}>
                        <div>
                          <p className={styles.sectionEyebrow}>{labels.partOfSpeech}</p>
                          <h2 className={styles.sectionTitle}>{posLabel ?? labels.senses}</h2>
                        </div>
                        <span className={styles.sectionCount}>
                          {items.length} {labels.senses.toLowerCase()}
                        </span>
                      </div>

                      <div className={styles.senseList}>
                        {items.map((item, itemIndex) => {
                          const regionLabel = learnerFacingCode(
                            item.regionProfileCode,
                            interfaceLocale.code,
                            REGION_LABELS,
                          );
                          return (
                            <article key={item.publicId} className={styles.senseCard}>
                              <div className={styles.senseHeader}>
                                <span className={styles.senseIndex}>{itemIndex + 1}</span>
                                {posLabel ? (
                                  <span className={styles.senseType}>{posLabel}</span>
                                ) : null}
                                {regionLabel ? (
                                  <span className={styles.regionBadge}>{regionLabel}</span>
                                ) : null}
                              </div>

                              {item.shortLabel ? (
                                <div className={styles.meaningBlock}>
                                  <p className={styles.metaLabel}>{labels.meaning}</p>
                                  <p className={styles.meaning}>{item.shortLabel}</p>
                                  {item.fullExplanation ? (
                                    <p className={styles.explanation}>{item.fullExplanation}</p>
                                  ) : null}
                                </div>
                              ) : null}

                              {item.translationEquivalents.length > 0 ? (
                                <div className={styles.translationBlock}>
                                  <p className={styles.translationLabel}>{labels.translations}</p>
                                  <div className={styles.translationList}>
                                    {item.translationEquivalents.map((translation) => (
                                      <span key={translation.publicId} className={styles.translationChip}>
                                        <span className={styles.translationExpression}>
                                          {translation.expression}
                                        </span>
                                        <span className={styles.translationLocale}>
                                          {translation.localeCode}
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}

                {pronunciationIndex < detail.pronunciations.length - 1 ? (
                  <div aria-hidden="true" style={{ height: "1.25rem" }} />
                ) : null}
              </section>
            );
          })}
        </div>

        <aside className={styles.sideRail} aria-label={labels.entryInfo}>
          <section className={styles.sideCard}>
            <h2 className={styles.sideTitle}>{labels.forms}</h2>
            <div className={styles.formList}>
              {detail.forms.map((form) => (
                <div key={form.publicId} className={styles.formListItem}>
                  <span className={styles.formListText}>{form.text}</span>
                  <span className={styles.formListRole}>
                    {formLabel(form.scriptVariantCode, labels)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sideCard}>
            <h2 className={styles.sideTitle}>{labels.entryInfo}</h2>
            <div className={styles.metaList}>
              {languageVarietyLabel ? (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>{labels.languageVariety}</span>
                  <span className={styles.metaValue}>{languageVarietyLabel}</span>
                </div>
              ) : null}
              {entryRegionLabel ? (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>{labels.region}</span>
                  <span className={styles.metaValue}>{entryRegionLabel}</span>
                </div>
              ) : null}
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>{labels.readings}</span>
                <span className={styles.metaValue}>{readingCount}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>{labels.senses}</span>
                <span className={styles.metaValue}>{totalSenseCount}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
