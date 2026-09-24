"use client";

import Link from "next/link";
import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import type { KnowledgeLanguage } from "@/lib/knowledgeLanguage";
import type { VocabularyCharacterOccurrence } from "@/lib/vocabularyCharacterDelivery";
import type {
  VocabularyDetail,
  VocabularyReadingItem,
  VocabularyTranslationEquivalent,
} from "@/lib/vocabularyDetail";
import KnowledgeLanguageToggle from "./KnowledgeLanguageToggle";
import VocabularyCharacterRail from "./VocabularyCharacterRail";
import VocabularyPronunciationMeta from "./VocabularyPronunciationMeta";
import VocabularyRichSupport from "./VocabularyRichSupport";
import VocabularyStickyNav from "./VocabularyStickyNav";
import styles from "./VocabularyDetail.module.css";

type Labels = {
  knowledge: string;
  vocabulary: string;
  back: string;
  pronunciation: string;
  readings: string;
  partOfSpeech: string;
  sensesUsage: string;
  sense: string;
  senses: string;
  meaning: string;
  usage: string;
  usageNote: string;
  memoryTip: string;
  collocations: string;
  classifiers: string;
  example: string;
  quickDistinction: string;
  characters: string;
  radical: string;
  strokes: string;
  hanViet: string;
  writingOpen: string;
  writingReplay: string;
  writingUnavailable: string;
  writingSource: string;
  unavailable: string;
};

type VocabularyNavItem = {
  label: string;
  href: string;
  mobileOnly?: boolean;
};

type PosGroup = {
  key: string;
  posCode: string;
  items: VocabularyReadingItem[];
};

const LABELS: Record<string, Labels> = {
  en: {
    knowledge: "Knowledge",
    vocabulary: "Vocabulary",
    back: "Back to Knowledge",
    pronunciation: "Pronunciation",
    readings: "Readings",
    partOfSpeech: "Part of speech",
    sensesUsage: "Meaning & usage",
    sense: "sense",
    senses: "senses",
    meaning: "Meaning",
    usage: "Usage",
    usageNote: "Usage note",
    memoryTip: "Memory tip",
    collocations: "Common combinations",
    classifiers: "Measure words",
    example: "Example",
    quickDistinction: "Quick distinction",
    characters: "Characters",
    radical: "Radical",
    strokes: "Strokes",
    hanViet: "Sino-Vietnamese",
    writingOpen: "View writing",
    writingReplay: "Replay",
    writingUnavailable: "Writing data is temporarily unavailable.",
    writingSource: "Stroke data",
    unavailable: "This vocabulary entry is temporarily unavailable.",
  },
  vi: {
    knowledge: "Kiến thức",
    vocabulary: "Từ vựng",
    back: "Quay lại Kiến thức",
    pronunciation: "Cách đọc",
    readings: "Cách đọc",
    partOfSpeech: "Từ loại",
    sensesUsage: "Nghĩa & cách dùng",
    sense: "nghĩa",
    senses: "nghĩa",
    meaning: "Hiểu nghĩa này",
    usage: "Cách dùng",
    usageNote: "Phạm vi sử dụng",
    memoryTip: "Gợi ý ghi nhớ",
    collocations: "Kết hợp tự nhiên",
    classifiers: "Lượng từ",
    example: "Ví dụ",
    quickDistinction: "Phân biệt nhanh",
    characters: "Hán tự",
    radical: "Bộ thủ",
    strokes: "Số nét",
    hanViet: "Hán Việt",
    writingOpen: "Xem cách viết",
    writingReplay: "Viết lại",
    writingUnavailable: "Dữ liệu cách viết tạm thời không tải được.",
    writingSource: "Dữ liệu nét",
    unavailable: "Mục từ này hiện chưa thể hiển thị.",
  },
  ar: {
    knowledge: "المعرفة",
    vocabulary: "المفردات",
    back: "العودة إلى المعرفة",
    pronunciation: "القراءة",
    readings: "القراءات",
    partOfSpeech: "نوع الكلمة",
    sensesUsage: "المعنى والاستعمال",
    sense: "معنى",
    senses: "معانٍ",
    meaning: "المعنى",
    usage: "الاستعمال",
    usageNote: "نطاق الاستعمال",
    memoryTip: "تلميح للتذكر",
    collocations: "تراكيب طبيعية",
    classifiers: "كلمات القياس",
    example: "مثال",
    quickDistinction: "تمييز سريع",
    characters: "الحروف الصينية",
    radical: "الجذر",
    strokes: "عدد الخطوط",
    hanViet: "القراءة الصينية الفيتنامية",
    writingOpen: "عرض طريقة الكتابة",
    writingReplay: "إعادة",
    writingUnavailable: "بيانات الكتابة غير متاحة مؤقتًا.",
    writingSource: "بيانات الخطوط",
    unavailable: "هذا المدخل غير متاح مؤقتًا.",
  },
};

const labelFor = (localeCode: string) => LABELS[localeCode] ?? LABELS.en;

const knowledgeLanguageUserLabel = (localeCode: string) => {
  if (localeCode === "vi") return "Tiếng Việt";
  if (localeCode === "en") return "English";
  return LABELS[localeCode] ? localeCode.toUpperCase() : "English";
};

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

const requestedLocaleTranslations = (
  translations: VocabularyTranslationEquivalent[],
  requestedLocale: string,
) => {
  const language = requestedLocale.split("-")[0];
  return translations.filter((translation) => {
    const translationLanguage = translation.localeCode.split("-")[0];
    return translation.localeCode === requestedLocale || translationLanguage === language;
  });
};

const learnerMeaningParts = (
  item: VocabularyReadingItem,
  requestedLocale: string,
  _fallbackLocale: string,
) => {
  const parts = [
    item.shortLabel,
    ...requestedLocaleTranslations(item.translationEquivalents, requestedLocale)
      .map((translation) => translation.expression),
  ].filter((part): part is string => Boolean(part));

  return [...new Set(parts.map((part) => part.trim()).filter(Boolean))];
};

const groupByPartOfSpeech = (items: VocabularyReadingItem[]): PosGroup[] => {
  const groups: PosGroup[] = [];
  const groupsByCode = new Map<string, PosGroup>();

  for (const item of items) {
    const posCode = item.partOfSpeechCode ?? "unspecified";
    const existing = groupsByCode.get(posCode);
    if (existing) {
      existing.items.push(item);
      continue;
    }

    const group = {
      key: posCode,
      posCode,
      items: [item],
    };
    groupsByCode.set(posCode, group);
    groups.push(group);
  }

  return groups;
};

const distinctPosCodes = (items: VocabularyReadingItem[]) => [
  ...new Set(items.map((item) => item.partOfSpeechCode).filter((code): code is string => Boolean(code))),
];

const posAnchorMap = (pronunciationPublicId: string, groups: PosGroup[]) => {
  const anchors = new Map<string, string>();
  for (const group of groups) {
    if (group.posCode === "unspecified") continue;
    anchors.set(group.posCode, `#pos-${pronunciationPublicId}-${group.key}`);
  }
  return anchors;
};


export const vocabularyDetailLabelsFor = labelFor;

type VocabularyDetailViewProps = {
  detail: VocabularyDetail;
  characters: VocabularyCharacterOccurrence[];
  interfaceLocaleCode: string;
  interfaceDirection: InterfaceTextDirection;
  knowledgeLanguage: KnowledgeLanguage;
  learnerContextQuery: Record<string, string>;
};

export default function VocabularyDetailView({
  detail,
  characters,
  interfaceLocaleCode,
  interfaceDirection,
  knowledgeLanguage,
  learnerContextQuery,
}: VocabularyDetailViewProps) {
  const labels = labelFor(interfaceLocaleCode);
  const showHanViet = interfaceLocaleCode === "vi" && knowledgeLanguage === "user";
  const primaryPronunciation =
    detail.pronunciations.find((item) => item.isDefault) ?? detail.pronunciations[0];
  const primaryForm = detail.forms.find((form) => form.isPrimary) ?? detail.forms[0];
  const secondaryForms = detail.forms.filter((form) => form.publicId !== primaryForm.publicId);
  const allReadingItems = detail.pronunciations.flatMap((item) => item.readingItems);
  const singleSummary = allReadingItems.length === 1
    ? learnerMeaningParts(allReadingItems[0], detail.requestedLocale, detail.fallbackLocale).join(", ")
    : null;
  const allPosCodes = distinctPosCodes(allReadingItems);
  const hasReadingNavigation = detail.pronunciations.length > 1;

  const primaryGroups = primaryPronunciation
    ? groupByPartOfSpeech(primaryPronunciation.readingItems)
    : [];
  const primaryPosAnchors = primaryPronunciation
    ? posAnchorMap(primaryPronunciation.publicId, primaryGroups)
    : new Map<string, string>();
  const hasPosNavigation = !hasReadingNavigation
    && allPosCodes.length > 1
    && allPosCodes.every((code) => primaryPosAnchors.has(code));

  const navItems: VocabularyNavItem[] = hasReadingNavigation
    ? detail.pronunciations.map((pronunciation) => ({
        label: pronunciation.pronunciation,
        href: `#reading-${pronunciation.publicId}`,
      }))
    : hasPosNavigation
      ? allPosCodes.map((code) => ({
          label: posLabel(code, interfaceLocaleCode) ?? code,
          href: primaryPosAnchors.get(code)!,
        }))
      : [];

  if (characters.length > 0) {
    navItems.push({ label: labels.characters, href: "#characters", mobileOnly: true });
  }

  const characterLabels = {
    characters: labels.characters,
    radical: labels.radical,
    strokes: labels.strokes,
    hanViet: labels.hanViet,
    writingOpen: labels.writingOpen,
    writingReplay: labels.writingReplay,
    writingUnavailable: labels.writingUnavailable,
    writingSource: labels.writingSource,
  };

  return (
    <main className={styles.page} dir={interfaceDirection}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href={{ pathname: "/knowledge", query: learnerContextQuery }}>
          {labels.knowledge}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{labels.vocabulary}</span>
        <span aria-hidden="true">/</span>
        <span className={styles.breadcrumbCurrent}>{detail.displayForm}</span>
      </nav>

      <VocabularyStickyNav
        headword={detail.displayForm}
        pronunciation={primaryPronunciation?.pronunciation ?? null}
        navItems={navItems}
        knowledgeLanguage={knowledgeLanguage}
        userLanguageLabel={knowledgeLanguageUserLabel(interfaceLocaleCode)}
      />

      <div className={styles.workspace}>
        <article id="vocabulary-entry-card" className={styles.entryCard}>
          <header id="vocabulary-entry-header" className={styles.entryHeader}>
            <div className={styles.headwordWrap}>
              <div className={styles.writtenLine}>
                <h1 className={styles.headword}>{detail.displayForm}</h1>
                {secondaryForms.map((form) => (
                  <span key={form.publicId} className={styles.traditional}>{form.text}</span>
                ))}
              </div>

              {primaryPronunciation ? (
                <VocabularyPronunciationMeta
                  pronunciation={primaryPronunciation.pronunciation}
                  hanViet={detail.hanViet?.text ?? null}
                />
              ) : null}

              {singleSummary ? <p className={styles.entrySummary}>{singleSummary}</p> : null}

              {hasReadingNavigation ? (
                <div className={styles.readingSelector} aria-label={labels.readings}>
                  {detail.pronunciations.map((pronunciation) => (
                    <a
                      key={pronunciation.publicId}
                      className={styles.readingButton}
                      href={`#reading-${pronunciation.publicId}`}
                    >
                      <strong>{pronunciation.pronunciation}</strong>
                      <span>
                        {pronunciation.readingItems.length} {pronunciation.readingItems.length === 1 ? labels.sense : labels.senses}
                      </span>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
            <div className={styles.headerActions}>
              <KnowledgeLanguageToggle
                value={knowledgeLanguage}
                userLanguageLabel={knowledgeLanguageUserLabel(interfaceLocaleCode)}
              />
            </div>
          </header>

          {!hasReadingNavigation && allReadingItems.length > 0 ? (
            <div className={styles.posSummary} aria-label={labels.partOfSpeech}>
              {allPosCodes.map((code) => {
                const count = allReadingItems.filter((item) => item.partOfSpeechCode === code).length;
                const learnerLabel = posLabel(code, interfaceLocaleCode);
                const anchor = primaryPosAnchors.get(code);
                if (!learnerLabel) return null;
                const content = (
                  <>
                    <strong>{learnerLabel}</strong>
                    <span aria-hidden="true"> · </span>
                    {count} {count === 1 ? labels.sense : labels.senses}
                  </>
                );
                return anchor ? (
                  <a key={code} className={styles.posSummaryChip} href={anchor}>{content}</a>
                ) : (
                  <span key={code} className={styles.posSummaryChip}>{content}</span>
                );
              })}
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
                : allPosCodes.map((code) => (
                    <a key={code} href={primaryPosAnchors.get(code)}>
                      {posLabel(code, interfaceLocaleCode)}
                    </a>
                  ))}
            </nav>
          ) : null}

          <div className={styles.entryBody}>
            <section aria-labelledby="vocabulary-senses-title">
              <h2 id="vocabulary-senses-title" className={styles.sectionTitle}>
                {labels.sensesUsage}
              </h2>

              <div className={`${styles.readingFlow} ${hasReadingNavigation ? styles.hasMultipleReadings : ""}`}>
                {detail.pronunciations.map((pronunciation) => {
                  const posGroups = groupByPartOfSpeech(pronunciation.readingItems);
                  return (
                    <section
                      key={pronunciation.publicId}
                      id={`reading-${pronunciation.publicId}`}
                      className={`${styles.readingSection} ${pronunciation.publicId === primaryPronunciation?.publicId ? styles.defaultReading : ""}`}
                    >
                      {hasReadingNavigation ? (
                        <div className={styles.readingHeading}>
                          <span>{labels.pronunciation}</span>
                          <strong>{pronunciation.pronunciation}</strong>
                        </div>
                      ) : null}

                      <div className={styles.posFlow}>
                        {posGroups.map((group) => {
                          const learnerPosLabel = posLabel(
                            group.posCode === "unspecified" ? null : group.posCode,
                            interfaceLocaleCode,
                          );
                          return (
                            <section
                              key={`${pronunciation.publicId}-${group.key}`}
                              id={`pos-${pronunciation.publicId}-${group.key}`}
                              className={styles.posSection}
                            >
                              {learnerPosLabel ? (
                                <div className={styles.posSectionHead}>
                                  <span className={styles.posLabel}>{learnerPosLabel}</span>
                                  <span className={styles.posCount}>
                                    {group.items.length} {group.items.length === 1 ? labels.sense : labels.senses}
                                  </span>
                                </div>
                              ) : null}

                              <div className={styles.senseStack}>
                                {group.items.map((item, itemIndex) => {
                                  const meaningParts = learnerMeaningParts(
                                    item,
                                    detail.requestedLocale,
                                    detail.fallbackLocale,
                                  );
                                  const itemRegion = localizedCodeLabel(
                                    item.regionProfileCode,
                                    interfaceLocaleCode,
                                    REGION_LABELS,
                                  );
                                  const hasLearningProfile = Boolean(
                                    item.fullExplanation || item.usageNote || item.memoryTip,
                                  );

                                  return (
                                    <article
                                      key={item.publicId}
                                      className={`${styles.sense} ${(item.isSubsense || item.parentPublicId) ? styles.subsense : ""}`}
                                    >
                                      <div className={styles.senseHead}>
                                        <span className={styles.senseNum}>{itemIndex + 1}</span>
                                        <div className={styles.senseMain}>
                                          {item.itemType === "usage" ? (
                                            <span className={styles.usageType}>{labels.usage}</span>
                                          ) : null}
                                          {meaningParts.length > 0 ? (
                                            <h3 className={styles.meaning}>{meaningParts.join(", ")}</h3>
                                          ) : null}
                                          {itemRegion ? (
                                            <div className={styles.tags}>
                                              <span className={styles.tag}>{itemRegion}</span>
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>

                                      {hasLearningProfile ? (
                                        <div className={styles.senseProfile}>
                                          {item.fullExplanation ? (
                                            <section className={styles.learningBlock}>
                                              <h4>{labels.meaning}</h4>
                                              <p>{item.fullExplanation}</p>
                                            </section>
                                          ) : null}
                                          {item.usageNote ? (
                                            <section className={`${styles.learningBlock} ${styles.learningBlockSoft}`}>
                                              <h4>{labels.usageNote}</h4>
                                              <p>{item.usageNote}</p>
                                            </section>
                                          ) : null}
                                          {item.memoryTip ? (
                                            <section className={`${styles.learningBlock} ${styles.learningBlockAccent}`}>
                                              <h4>{labels.memoryTip}</h4>
                                              <p>{item.memoryTip}</p>
                                            </section>
                                          ) : null}
                                        </div>
                                      ) : null}

                                      <VocabularyRichSupport
                                        item={item}
                                        sourceExpression={detail.displayForm}
                                        labels={{
                                          collocations: labels.collocations,
                                          classifiers: labels.classifiers,
                                          example: labels.example,
                                          quickDistinction: labels.quickDistinction,
                                        }}
                                      />
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

            {characters.length > 0 ? (
              <div className={styles.mobileCharacterPanel}>
                <VocabularyCharacterRail
                  occurrences={characters}
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
          occurrences={characters}
          labels={characterLabels}
          showHanViet={showHanViet}
          variant="rail"
          anchorId="characters-rail"
        />
      </div>
    </main>
  );
}
