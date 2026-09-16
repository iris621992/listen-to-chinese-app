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
  hint: string;
  resultsFor: (query: string) => string;
  resultNote: string;
  emptyTitle: string;
  emptyBody: string;
  noResultsTitle: string;
  noResultsBody: string;
  unavailableTitle: string;
  unavailableBody: string;
  open: string;
};

const LABELS: Record<string, Labels> = {
  en: {
    knowledge: "Knowledge",
    vocabulary: "Vocabulary",
    title: "Find a word",
    intro: "Search by Chinese characters, Pinyin, or meaning. Results show only what you need to identify the right entry; detailed explanations live on the Vocabulary detail page.",
    search: "Search",
    searchPlaceholder: "Chinese, Pinyin, or meaning…",
    hint: "Examples: 椅子 · yizi · chair · activity",
    resultsFor: (query) => `Results for “${query}”`,
    resultNote: "Choose an entry to see meaning, usage, and related learning content.",
    emptyTitle: "What do you want to look up?",
    emptyBody: "Start with Chinese characters, Pinyin, or a meaning. YunChinese searches published Vocabulary entries only.",
    noResultsTitle: "No matching entry found",
    noResultsBody: "Try Chinese characters, Pinyin, or another meaning. YunChinese does not fabricate results when no published entry matches.",
    unavailableTitle: "Vocabulary search is temporarily unavailable",
    unavailableBody: "The search service could not return published Vocabulary data right now. Please try again later.",
    open: "View entry",
  },
  vi: {
    knowledge: "Kiến thức",
    vocabulary: "Từ vựng",
    title: "Tra từ",
    intro: "Tìm bằng chữ Hán, Pinyin hoặc nghĩa. Kết quả chỉ hiển thị thông tin cần thiết để bạn nhận ra đúng mục từ; phần giải thích chi tiết nằm trong trang Từ vựng.",
    search: "Tìm kiếm",
    searchPlaceholder: "Chữ Hán, Pinyin hoặc nghĩa…",
    hint: "Ví dụ: 椅子 · yizi · ghế · activity",
    resultsFor: (query) => `Kết quả cho “${query}”`,
    resultNote: "Chọn một mục từ để xem nghĩa, cách dùng và các nội dung liên quan.",
    emptyTitle: "Bạn muốn tra từ gì?",
    emptyBody: "Bắt đầu bằng chữ Hán, Pinyin hoặc một nghĩa. YunChinese chỉ tìm trong các mục Từ vựng đã xuất bản.",
    noResultsTitle: "Không tìm thấy mục phù hợp",
    noResultsBody: "Thử chữ Hán, Pinyin hoặc một nghĩa khác. YunChinese không tạo kết quả giả khi chưa có mục từ đã xuất bản phù hợp.",
    unavailableTitle: "Tìm kiếm Từ vựng hiện tạm thời không khả dụng",
    unavailableBody: "Hệ thống hiện chưa lấy được dữ liệu Từ vựng đã xuất bản. Vui lòng thử lại sau.",
    open: "Xem mục từ",
  },
  ar: {
    knowledge: "المعرفة",
    vocabulary: "المفردات",
    title: "ابحث عن كلمة",
    intro: "ابحث بالحروف الصينية أو الـ Pinyin أو المعنى. تعرض النتائج فقط ما تحتاجه للتعرّف على المدخل الصحيح، بينما تبقى الشروح التفصيلية في صفحة المفردة.",
    search: "بحث",
    searchPlaceholder: "حروف صينية أو Pinyin أو معنى…",
    hint: "أمثلة: 椅子 · yizi · chair · activity",
    resultsFor: (query) => `نتائج “${query}”`,
    resultNote: "اختر مدخلاً لعرض المعنى والاستعمال والمحتوى التعليمي المرتبط.",
    emptyTitle: "ما الذي تريد البحث عنه؟",
    emptyBody: "ابدأ بحروف صينية أو Pinyin أو معنى. يبحث YunChinese فقط في مدخلات المفردات المنشورة.",
    noResultsTitle: "لم يتم العثور على مدخل مطابق",
    noResultsBody: "جرّب الحروف الصينية أو Pinyin أو معنى آخر. لا ينشئ YunChinese نتائج غير موجودة.",
    unavailableTitle: "بحث المفردات غير متاح مؤقتًا",
    unavailableBody: "تعذر حاليًا تحميل بيانات المفردات المنشورة. يرجى المحاولة لاحقًا.",
    open: "عرض المدخل",
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

function SearchState({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.stateCard}>
      <span className={styles.stateIcon} aria-hidden="true">⌕</span>
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </div>
  );
}

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
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{labels.vocabulary}</p>
          <h1>{labels.title}</h1>
          <p className={styles.intro}>{labels.intro}</p>
        </div>
        <div className={styles.searchPanel}>
          <VocabularySearchForm
            query={searchQuery}
            context={learnerContextQuery}
            placeholder={labels.searchPlaceholder}
            submitLabel={labels.search}
            ariaLabel={labels.search}
            className={styles.searchForm}
          />
          <p className={styles.hint}>{labels.hint}</p>
        </div>
      </section>

      <section className={styles.results} aria-live="polite">
        {result.status === "EMPTY" ? (
          <SearchState title={labels.emptyTitle} body={labels.emptyBody} />
        ) : result.status === "DATABASE_ERROR" || result.status === "INVALID_INPUT" ? (
          <SearchState title={labels.unavailableTitle} body={labels.unavailableBody} />
        ) : result.items.length === 0 ? (
          <SearchState title={labels.noResultsTitle} body={labels.noResultsBody} />
        ) : (
          <>
            <div className={styles.resultsHead}>
              <div>
                <h2>{labels.resultsFor(searchQuery)}</h2>
                <p>{labels.resultNote}</p>
              </div>
              <span className={styles.resultCount}>{result.items.length}</span>
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
                      <div className={styles.resultMeta}>
                        <span>{POS_LABELS[item.partOfSpeechCode]?.[interfaceLocale.code] ?? POS_LABELS[item.partOfSpeechCode]?.en ?? item.partOfSpeechCode}</span>
                      </div>
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
