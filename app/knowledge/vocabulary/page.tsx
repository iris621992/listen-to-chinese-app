import Link from "next/link";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";
import { loadVocabularySearch } from "@/lib/vocabularySearch";
import VocabularySearchForm from "./VocabularySearchForm";
import styles from "./VocabularySearch.module.css";

type Props = {
  searchParams?: Promise<{
    q?: string;
    uiLang?: string;
    lang?: string;
    levelSystem?: string;
    level?: string;
  }>;
};

type Labels = {
  knowledge: string;
  vocabulary: string;
  title: string;
  intro: string;
  search: string;
  searchPlaceholder: string;
  results: string;
  emptyPrompt: string;
  noResults: string;
  unavailable: string;
  open: string;
};

const LABELS: Record<string, Labels> = {
  en: {
    knowledge: "Knowledge",
    vocabulary: "Vocabulary",
    title: "Find a word",
    intro: "Search by Chinese characters, Pinyin, or a learner meaning. Results come from published Vocabulary knowledge.",
    search: "Search",
    searchPlaceholder: "Chinese, Pinyin, or meaning…",
    results: "Search results",
    emptyPrompt: "Start with a Chinese word, Pinyin, or a meaning you want to look up.",
    noResults: "No published vocabulary entries matched this search.",
    unavailable: "Vocabulary search is temporarily unavailable.",
    open: "Open entry",
  },
  vi: {
    knowledge: "Kiến thức",
    vocabulary: "Từ vựng",
    title: "Tra từ",
    intro: "Tìm bằng chữ Hán, Pinyin hoặc nghĩa dành cho người học. Kết quả lấy từ dữ liệu Từ vựng đã xuất bản.",
    search: "Tìm kiếm",
    searchPlaceholder: "Chữ Hán, Pinyin hoặc nghĩa…",
    results: "Kết quả tìm kiếm",
    emptyPrompt: "Nhập một từ tiếng Trung, Pinyin hoặc nghĩa bạn muốn tra.",
    noResults: "Không tìm thấy mục từ đã xuất bản phù hợp.",
    unavailable: "Tìm kiếm Từ vựng hiện tạm thời không khả dụng.",
    open: "Mở mục từ",
  },
  ar: {
    knowledge: "المعرفة",
    vocabulary: "المفردات",
    title: "ابحث عن كلمة",
    intro: "ابحث بالحروف الصينية أو الـ Pinyin أو معنى متاح للمتعلم. تأتي النتائج من بيانات المفردات المنشورة.",
    search: "بحث",
    searchPlaceholder: "حروف صينية أو Pinyin أو معنى…",
    results: "نتائج البحث",
    emptyPrompt: "ابدأ بكلمة صينية أو Pinyin أو معنى تريد البحث عنه.",
    noResults: "لم يتم العثور على مدخلات مفردات منشورة مطابقة.",
    unavailable: "بحث المفردات غير متاح مؤقتًا.",
    open: "فتح المدخل",
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

export default async function VocabularySearchPage({ searchParams }: Props) {
  const query = await searchParams;
  const interfaceLocale = resolveInterfaceLocale(query?.uiLang, query?.lang);
  const labels = labelFor(interfaceLocale.code);
  const learnerContextQuery = preservedLearnerContextQuery({
    uiLang: query?.uiLang,
    lang: query?.lang,
    levelSystem: query?.levelSystem,
    level: query?.level,
  });
  const result = await loadVocabularySearch(query?.q, query?.lang ?? query?.uiLang);
  const searchQuery = result.query;

  return (
    <main className={styles.page} dir={interfaceLocale.direction}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href={{ pathname: "/knowledge", query: learnerContextQuery }}>{labels.knowledge}</Link>
        <span aria-hidden="true">/</span>
        <span>{labels.vocabulary}</span>
      </nav>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>{labels.vocabulary}</p>
        <h1>{labels.title}</h1>
        <p className={styles.intro}>{labels.intro}</p>
        <VocabularySearchForm
          query={searchQuery}
          context={learnerContextQuery}
          placeholder={labels.searchPlaceholder}
          submitLabel={labels.search}
          ariaLabel={labels.search}
          className={styles.searchForm}
        />
      </section>

      <section className={styles.results} aria-live="polite">
        {result.status === "EMPTY" ? (
          <p className={styles.stateMessage}>{labels.emptyPrompt}</p>
        ) : result.status === "DATABASE_ERROR" || result.status === "INVALID_INPUT" ? (
          <p className={styles.stateMessage}>{labels.unavailable}</p>
        ) : result.items.length === 0 ? (
          <p className={styles.stateMessage}>{labels.noResults}</p>
        ) : (
          <>
            <div className={styles.resultsHead}>
              <h2>{labels.results}</h2>
              <span>{result.items.length}</span>
            </div>
            <div className={styles.resultList}>
              {result.items.map((item) => (
                <Link
                  key={item.publicId}
                  href={{
                    pathname: `/knowledge/vocabulary/${item.publicId}`,
                    query: { ...learnerContextQuery, q: searchQuery },
                  }}
                  className={styles.resultCard}
                >
                  <div className={styles.resultIdentity}>
                    <strong className={styles.hanzi}>{item.displayForm}</strong>
                    <span className={styles.pinyin}>{item.pronunciation}</span>
                  </div>
                  <div className={styles.resultMeaning}>
                    <strong>{item.learnerSummary}</strong>
                    {item.partOfSpeechCode ? (
                      <span>{POS_LABELS[item.partOfSpeechCode]?.[interfaceLocale.code] ?? POS_LABELS[item.partOfSpeechCode]?.en ?? item.partOfSpeechCode}</span>
                    ) : null}
                  </div>
                  <span className={styles.openLabel}>{labels.open} →</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
