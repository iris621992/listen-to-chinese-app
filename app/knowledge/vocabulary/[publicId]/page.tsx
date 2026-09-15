import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";
import { loadVocabularyCharacterDelivery } from "@/lib/vocabularyCharacterDelivery";
import {
  loadVocabularyDetail,
  type VocabularyReadingItem,
  type VocabularyTranslationEquivalent,
} from "@/lib/vocabularyDetail";
import VocabularyCharacterRail from "./VocabularyCharacterRail";
import VocabularyRichSupport from "./VocabularyRichSupport";
import VocabularyStickyNav from "./VocabularyStickyNav";
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
  structure: string;
  structureLeftRight: string;
  structureSingle: string;
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
    structure: "Structure",
    structureLeftRight: "left–right",
    structureSingle: "single-component",
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
    meaning: "Nghĩa",
    usage: "Cách dùng",
    usageNote: "Lưu ý cách dùng",
    memoryTip: "Gợi ý ghi nhớ",
    collocations: "Kết hợp thường gặp",
    classifiers: "Lượng từ",
    example: "Ví dụ",
    quickDistinction: "Phân biệt nhanh",
    characters: "Hán tự",
    radical: "Bộ thủ",
    strokes: "Số nét",
    hanViet: "Hán Việt",
    structure: "Kết cấu",
    structureLeftRight: "trái–phải",
    structureSingle: "độc thể",
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
    usageNote: "ملاحظة الاستعمال",
    memoryTip: "تلميح للتذكر",
    collocations: "تراكيب شائعة",
    classifiers: "كلمات القياس",
    example: "مثال",
    quickDistinction: "تمييز سريع",
    characters: "الحروف الصينية",
    radical: "الجذر",
    strokes: "عدد الخطوط",
    hanViet: "القراءة الصينية الفيتنامية",
    structure: "البنية",
    structureLeftRight: "يسار–يمين",
    structureSingle: "مكوّن واحد",
    writingOpen: "عرض طريقة الكتابة",
    writingReplay: "إعادة",
    writingUnavailable: "بيانات الكتابة غير متاحة مؤقتًا.",
    writingSource: "بيانات الخطوط",
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

const learnerMeaningParts = (
  item: VocabularyReadingItem,
  requestedLocale: string,
  fallbackLocale: string,
) => {
  const parts = [
    item.shortLabel,
    ...preferredTranslations(item.translationEquivalents, requestedLocale, fallbackLocale)
      .map((translation) => translation.expression),
  ].filter((part): part is string => Boolean(part));
  return [...new Set(parts.map((part) => part.trim()).filter(Boolean))];
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
  const [result, characterResult] = await Promise.all([
    loadVocabularyDetail(publicId, query?.lang ?? query?.uiLang),
    loadVocabularyCharacterDelivery(publicId, query?.lang ?? query?.uiLang),
  ]);

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

  const navItems: VocabularyNavItem[] = [
    { label: labels.meaning, href: "#meaning" },
    { label: labels.usage, href: "#usage" },
    ...(characterResult.status === "FOUND" && characterResult.characters.length > 0
      ? [{ label: labels.characters, href: "#characters", mobileOnly: true }]
      : []),
  ];

  return (
    <main className={styles.page} dir={interfaceLocale.direction}>
      <div className={styles.pageInner}>
        <Link
          href={{ pathname: "/knowledge", query: learnerContextQuery }}
          className={styles.backLink}
        >
          ← {labels.back}
        </Link>

        <VocabularyStickyNav items={navItems} />

        <section className={styles.entryHeader} id="vocabulary-entry-header">
          <div className={styles.entryHeaderText}>
            <p className={styles.eyebrow}>{labels.vocabulary}</p>
            <h1>{primaryForm?.writtenForm ?? detail.displayHeadword}</h1>
            {primaryPronunciation ? (
              <p className={styles.primaryPronunciation}>{primaryPronunciation.hanyuPinyin}</p>
            ) : null}
          </div>
        </section>

        <div className={styles.workspace}>
          <div className={styles.mainColumn}>
            <section id="meaning" className={styles.sectionCard}>
              <h2>{labels.meaning}</h2>
              {groupByPartOfSpeech(detail.readingItems).map(([partOfSpeechCode, items]) => (
                <div key={partOfSpeechCode} className={styles.readingGroup}>
                  {posLabel(partOfSpeechCode, interfaceLocale.code) ? (
                    <p className={styles.partOfSpeechLabel}>
                      {posLabel(partOfSpeechCode, interfaceLocale.code)}
                    </p>
                  ) : null}
                  {items.map((item) => {
                    const meaningParts = learnerMeaningParts(
                      item,
                      interfaceLocale.code,
                      interfaceLocale.fallbackLocaleCode ?? "en",
                    );
                    return (
                      <article key={item.publicId} className={styles.readingSection} id={item.publicId}>
                        <div className={styles.readingHeading}>
                          <span className={styles.readingIndex}>{item.displayOrder}</span>
                          <div>
                            {meaningParts.length > 0 ? (
                              <h3>{meaningParts.join("; ")}</h3>
                            ) : null}
                            <p className={styles.readingMeta}>
                              {item.itemType === "usage" ? labels.usage : labels.sense}
                            </p>
                          </div>
                        </div>

                        {item.learnerExplanation ? (
                          <p className={styles.learnerExplanation}>{item.learnerExplanation}</p>
                        ) : null}

                        {item.usageNote ? (
                          <div className={styles.supportNote}>
                            <strong>{labels.usageNote}</strong>
                            <p>{item.usageNote}</p>
                          </div>
                        ) : null}

                        {item.memoryTip ? (
                          <div className={styles.supportNote}>
                            <strong>{labels.memoryTip}</strong>
                            <p>{item.memoryTip}</p>
                          </div>
                        ) : null}

                        <VocabularyRichSupport
                          item={item}
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
              ))}
            </section>

            <section id="usage" className={styles.sectionCard}>
              <h2>{labels.usage}</h2>
              {detail.readingItems.map((item) => (
                item.regionCode || item.registerCode || item.domainCode ? (
                  <article key={item.publicId} className={styles.usageRow}>
                    <strong>{learnerMeaningParts(
                      item,
                      interfaceLocale.code,
                      interfaceLocale.fallbackLocaleCode ?? "en",
                    ).join("; ") || `${labels.sense} ${item.displayOrder}`}</strong>
                    <div className={styles.usageTags}>
                      {localizedCodeLabel(item.regionCode, interfaceLocale.code, REGION_LABELS) ? (
                        <span>{localizedCodeLabel(item.regionCode, interfaceLocale.code, REGION_LABELS)}</span>
                      ) : null}
                      {item.registerCode ? <span>{item.registerCode}</span> : null}
                      {item.domainCode ? <span>{item.domainCode}</span> : null}
                    </div>
                  </article>
                ) : null
              ))}
            </section>
          </div>

          {characterResult.status === "FOUND" ? (
            <VocabularyCharacterRail occurrences={characterResult.characters} labels={labels} />
          ) : null}
        </div>
      </div>
    </main>
  );
}
