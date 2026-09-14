import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";
import {
  loadVocabularyDetail,
  type VocabularyReadingItem,
  type VocabularyTranslationEquivalent,
} from "@/lib/vocabularyDetail";
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
  knowledge: string;
  vocabulary: string;
  back: string;
  writtenForms: string;
  simplified: string;
  traditional: string;
  pronunciation: string;
  readings: string;
  partOfSpeech: string;
  sensesUsage: string;
  sense: string;
  senses: string;
  meaning: string;
  translations: string;
  languageVariety: string;
  region: string;
  unavailable: string;
};

const LABELS: Record<string, Labels> = {
  en: {
    knowledge: "Knowledge",
    vocabulary: "Vocabulary",
    back: "Back to Knowledge",
    writtenForms: "Written forms",
    simplified: "Simplified",
    traditional: "Traditional",
    pronunciation: "Pronunciation",
    readings: "Readings",
    partOfSpeech: "Part of speech",
    sensesUsage: "Meaning & usage",
    sense: "sense",
    senses: "senses",
    meaning: "Meaning",
    translations: "Translation equivalents",
    languageVariety: "Language variety",
    region: "Region",
    unavailable: "This vocabulary entry is temporarily unavailable.",
  },
  vi: {
    knowledge: "Kiến thức",
    vocabulary: "Từ vựng",
    back: "Quay lại Kiến thức",
    writtenForms: "Dạng chữ",
    simplified: "Giản thể",
    traditional: "Phồn thể",
    pronunciation: "Cách đọc",
    readings: "Cách đọc",
    partOfSpeech: "Từ loại",
    sensesUsage: "Nghĩa & cách dùng",
    sense: "nghĩa",
    senses: "nghĩa",
    meaning: "Nghĩa",
    translations: "Từ tương đương",
    languageVariety: "Biến thể ngôn ngữ",
    region: "Khu vực",
    unavailable: "Mục từ này hiện chưa thể hiển thị.",
  },
  ar: {
    knowledge: "المعرفة",
    vocabulary: "المفردات",
    back: "العودة إلى المعرفة",
    writtenForms: "الأشكال الكتابية",
    simplified: "المبسطة",
    traditional: "التقليدية",
    pronunciation: "القراءة",
    readings: "القراءات",
    partOfSpeech: "نوع الكلمة",
    sensesUsage: "المعنى والاستعمال",
    sense: "معنى",
    senses: "معانٍ",
    meaning: "المعنى",
    translations: "المكافئات الترجمية",
    languageVariety: "التنوع اللغوي",
    region: "المنطقة",
    unavailable: "هذا المدخل غير متاح مؤقتًا.",
  },
};

const labelFor = (localeCode: string) => LABELS[localeCode] ?? LABELS.en;

const POS_LABELS: Record<string, Record<string, string>> = {
  noun: { en: "Noun", vi: "Danh từ", ar: "اسم" },
  verb: { en: "Verb", vi: "Động từ", ar: "فعل" },
  adjective: { en: "Adjective", vi: "Tính từ", ar: "صفة" },
  adverb: { en: "Adverb", vi: "Phó từ", ar: "حال" },
  pronoun: { en: "Pronoun", vi: "Đại từ", ar: "ضمير" },
  preposition: { en: "Preposition", vi: "Giới từ", ar: "حرف جر" },
  conjunction: { en: "Conjunction", vi: "Liên từ", ar: "أداة ربط" },
  particle: { en: "Particle", vi: "Trợ từ", ar: "أداة" },
  measure_word: { en: "Measure word", vi: "Lượng từ", ar: "كلمة قياس" },
};

const LANGUAGE_VARIETY_LABELS: Record<string, Record<string, string>> = {
  mandarin: { en: "Mandarin", vi: "Quan thoại", ar: "الماندرين" },
};

const REGION_LABELS: Record<string, Record<string, string>> = {
  mainland_mandarin: {
    en: "Mainland China",
    vi: "Trung Quốc đại lục",
    ar: "الصين القارية",
  },
};

const localizedCodeLabel = (
  code: string | null,
  localeCode: string,
  dictionary: Record<string, Record<string, string>>,
) => {
  if (!code) return null;
  return dictionary[code]?.[localeCode] ?? dictionary[code]?.en ?? null;
};

const posLabel = (code: string | null, localeCode: string) =>
  code ? POS_LABELS[code]?.[localeCode] ?? POS_LABELS[code]?.en ?? null : null;

const formLabel = (scriptVariantCode: string | null, labels: Labels) => {
  if (scriptVariantCode === "simplified") return labels.simplified;
  if (scriptVariantCode === "traditional") return labels.traditional;
  return null;
};

const preferredTranslations = (
  translations: VocabularyTranslationEquivalent[],
  requestedLocale: string,
  fallbackLocale: string,
) => {
  const language = requestedLocale.split("-")[0];
  const exactOrRegional = translations.filter((translation) => {
    const translationLanguage = translation.localeCode.split("-")[0];
    return translation.localeCode === requestedLocale || translationLanguage === language;
  });
  if (exactOrRegional.length > 0) return exactOrRegional;

  const fallbackLanguage = fallbackLocale.split("-")[0];
  return translations.filter((translation) => {
    const translationLanguage = translation.localeCode.split("-")[0];
    return translation.localeCode === fallbackLocale || translationLanguage === fallbackLanguage;
  });
};

const groupByPartOfSpeech = (items: VocabularyReadingItem[]) => {
  const groups = new Map<string, VocabularyReadingItem[]>();
  for (const item of items) {
    const key = item.partOfSpeechCode ?? "unspecified";
    const current = groups.get(key) ?? [];
    current.push(item);
    groups.set(key, current);
  }
  return [...groups.entries()];
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
  const primaryForm = detail.forms.find((form) => form.isPrimary) ?? detail.forms[0];
  const secondaryForms = detail.forms.filter(
    (form) => form.publicId !== primaryForm.publicId && form.text !== primaryForm.text,
  );
  const allReadingItems = detail.pronunciations.flatMap((item) => item.readingItems);
  const singleSummary = allReadingItems.length === 1 ? allReadingItems[0]?.shortLabel : null;
  const languageVarietyLabel = localizedCodeLabel(
    detail.languageVarietyCode,
    interfaceLocale.code,
    LANGUAGE_VARIETY_LABELS,
  );
  const regionLabel = localizedCodeLabel(
    detail.regionProfileCode,
    interfaceLocale.code,
    REGION_LABELS,
  );
  const distinctPosCodes = [...new Set(allReadingItems.map((item) => item.partOfSpeechCode).filter(Boolean))];
  const hasReadingNavigation = detail.pronunciations.length > 1;
  const hasPosNavigation = distinctPosCodes.length > 1;

  return (
    <main className={styles.page} dir={interfaceLocale.direction}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href={{ pathname: "/knowledge", query: learnerContextQuery }}>
          {labels.knowledge}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{labels.vocabulary}</span>
        <span aria-hidden="true">/</span>
        <span className={styles.breadcrumbCurrent}>{detail.displayForm}</span>
      </nav>

      <article className={styles.entryCard}>
        <header className={styles.entryHeader}>
          <div className={styles.headTop}>
            <div className={styles.headwordWrap}>
              <div className={styles.writtenLine}>
                <h1 className={styles.headword}>{detail.displayForm}</h1>
                {secondaryForms.map((form) => (
                  <span key={form.publicId} className={styles.traditionalGroup}>
                    <span className={styles.traditional}>{form.text}</span>
                    {formLabel(form.scriptVariantCode, labels) ? (
                      <span className={styles.formRole}>
                        {formLabel(form.scriptVariantCode, labels)}
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>

              {primaryPronunciation ? (
                <div className={styles.pronLine}>
                  <span className={styles.pinyin}>{primaryPronunciation.pronunciation}</span>
                </div>
              ) : null}

              {(languageVarietyLabel || regionLabel) ? (
                <div className={styles.metaChips}>
                  {languageVarietyLabel ? (
                    <span className={styles.metaChip}>{languageVarietyLabel}</span>
                  ) : null}
                  {regionLabel ? <span className={styles.metaChip}>{regionLabel}</span> : null}
                </div>
              ) : null}

              {singleSummary ? (
                <div className={styles.entrySummary}>
                  <strong>{singleSummary}</strong>
                </div>
              ) : null}

              {hasReadingNavigation ? (
                <div className={styles.readingSelector} aria-label={labels.readings}>
                  {detail.pronunciations.map((pronunciation) => (
                    <a
                      key={pronunciation.publicId}
                      className={styles.readingButton}
                      href={`#reading-${pronunciation.publicId}`}
                    >
                      <strong>{pronunciation.pronunciation}</strong>
                      <span>{pronunciation.readingItems.length} {pronunciation.readingItems.length === 1 ? labels.sense : labels.senses}</span>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {allReadingItems.length > 0 ? (
          <div className={styles.posSummary} aria-label={labels.partOfSpeech}>
            {[...new Set(allReadingItems.map((item) => item.partOfSpeechCode ?? "unspecified"))].map(
              (code) => {
                const count = allReadingItems.filter(
                  (item) => (item.partOfSpeechCode ?? "unspecified") === code,
                ).length;
                const learnerLabel = posLabel(code === "unspecified" ? null : code, interfaceLocale.code);
                return learnerLabel ? (
                  <span key={code} className={styles.posSummaryChip}>
                    <strong>{learnerLabel}</strong>
                    <span aria-hidden="true"> · </span>
                    {count} {count === 1 ? labels.sense : labels.senses}
                  </span>
                ) : null;
              },
            )}
          </div>
        ) : null}

        {(hasReadingNavigation || hasPosNavigation) ? (
          <nav className={styles.sectionNav} aria-label={labels.sensesUsage}>
            {hasReadingNavigation
              ? detail.pronunciations.map((pronunciation) => (
                  <a key={pronunciation.publicId} href={`#reading-${pronunciation.publicId}`}>
                    {pronunciation.pronunciation}
                  </a>
                ))
              : distinctPosCodes.map((code) => (
                  <a key={code} href={`#pos-${code}`}>
                    {posLabel(code, interfaceLocale.code)}
                  </a>
                ))}
          </nav>
        ) : null}

        <div className={styles.entryBody}>
          <section aria-labelledby="vocabulary-senses-title">
            <h2 id="vocabulary-senses-title" className={styles.sectionTitle}>
              {labels.sensesUsage}
            </h2>

            <div className={styles.readingFlow}>
              {detail.pronunciations.map((pronunciation) => {
                const posGroups = groupByPartOfSpeech(pronunciation.readingItems);
                return (
                  <section
                    key={pronunciation.publicId}
                    id={`reading-${pronunciation.publicId}`}
                    className={styles.readingSection}
                  >
                    {hasReadingNavigation ? (
                      <div className={styles.readingHeading}>
                        <span className={styles.readingHeadingLabel}>{labels.pronunciation}</span>
                        <strong>{pronunciation.pronunciation}</strong>
                      </div>
                    ) : null}

                    <div className={styles.posFlow}>
                      {posGroups.map(([posCode, items]) => {
                        const learnerPosLabel = posLabel(
                          posCode === "unspecified" ? null : posCode,
                          interfaceLocale.code,
                        );
                        return (
                          <section
                            key={`${pronunciation.publicId}-${posCode}`}
                            id={`pos-${posCode}`}
                            className={styles.posSection}
                          >
                            {learnerPosLabel ? (
                              <div className={styles.posSectionHead}>
                                <span className={styles.posLabel}>{learnerPosLabel}</span>
                                <span className={styles.posCount}>
                                  {items.length} {items.length === 1 ? labels.sense : labels.senses}
                                </span>
                              </div>
                            ) : null}

                            <div className={styles.senseStack}>
                              {items.map((item, index) => {
                                const visibleTranslations = preferredTranslations(
                                  item.translationEquivalents,
                                  detail.requestedLocale,
                                  detail.fallbackLocale,
                                );
                                const itemRegion = localizedCodeLabel(
                                  item.regionProfileCode,
                                  interfaceLocale.code,
                                  REGION_LABELS,
                                );

                                return (
                                  <article key={item.publicId} className={styles.sense}>
                                    <div className={styles.senseHead}>
                                      <span className={styles.senseNum}>{index + 1}</span>
                                      <div className={styles.senseMain}>
                                        {item.shortLabel ? (
                                          <h3 className={styles.meaning}>{item.shortLabel}</h3>
                                        ) : null}
                                        {itemRegion ? (
                                          <div className={styles.tags}>
                                            <span className={styles.tag}>{itemRegion}</span>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>

                                    {(item.fullExplanation || visibleTranslations.length > 0) ? (
                                      <div className={styles.senseProfile}>
                                        {item.fullExplanation ? (
                                          <section className={styles.learningBlock}>
                                            <h4>{labels.meaning}</h4>
                                            <p>{item.fullExplanation}</p>
                                          </section>
                                        ) : null}

                                        {visibleTranslations.length > 0 ? (
                                          <section className={styles.translationBlock}>
                                            <h4>{labels.translations}</h4>
                                            <div className={styles.translationList}>
                                              {visibleTranslations.map((translation) => (
                                                <span
                                                  key={translation.publicId}
                                                  className={styles.translationChip}
                                                >
                                                  {translation.expression}
                                                </span>
                                              ))}
                                            </div>
                                          </section>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </article>
                                );
                              })}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
