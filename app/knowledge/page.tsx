import Link from "next/link";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";
import { loadVocabularySearch } from "@/lib/vocabularySearch";
import VocabularySearchForm from "./vocabulary/VocabularySearchForm";
import styles from "./vocabulary/VocabularySearch.module.css";

// Legacy Knowledge Hub route content was removed: /knowledge is now the canonical Knowledge Search.
// Knowledge families remain Vocabulary, Characters, Grammar, Comparisons / Word Comparison, and Idioms.

type Props = {
  searchParams?: Promise<{
    q?: string;
    uiLang?: string;
    lang?: string;
    levelSystem?: string;
    level?: string;
    family?: string | string[];
  }>;
};

type Labels = {
  knowledge: string;
  vocabulary: string;
  eyebrow: string;
  title: string;
  intro: string;
  sideTitle: string;
  sideBody: string;
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
  unsupportedTitle: string;
  unsupportedBody: string;
  partialNote: string;
  open: string;
  families: {
    all: string;
    vocabulary: string;
    characters: string;
    grammar: string;
    more: string;
    comparisons: string;
    idioms: string;
  };
};

const LABELS: Record<string, Labels> = {
  en: {
    knowledge: "Knowledge",
    vocabulary: "Vocabulary",
    eyebrow: "KNOWLEDGE SEARCH",
    title: "Find what you need to understand.",
    intro: "Search a word, character, grammar point, comparison, or idiom from one place. Results lead you to the right kind of knowledge without requiring you to know the category first.",
    sideTitle: "One search, multiple knowledge families",
    sideBody: "Results are identified by content type. Result cards help you recognize and navigate; deep explanation stays on the relevant detail page.",
    search: "Search",
    searchPlaceholder: "Enter Hanzi, pinyin, or meaning…",
    hint: "Try: 椅子 · yǐzi · chair · 还",
    resultsFor: (query) => `Results for “${query}”`,
    resultNote: "Choose an entry to continue to its detailed Knowledge page.",
    emptyTitle: "Start with what you are wondering about",
    emptyBody: "Search by Hanzi, pinyin, or learner-language meaning. YunChinese does not fabricate knowledge that is not published yet.",
    noResultsTitle: "No matching knowledge yet",
    noResultsBody: "Check the Hanzi, pinyin, or meaning and try again. Missing content is not replaced with fabricated results.",
    unavailableTitle: "Results are unavailable right now",
    unavailableBody: "The published Vocabulary source could not be reached, so results are not being shown. Your query is preserved.",
    unsupportedTitle: "This knowledge family is not searchable yet",
    unsupportedBody: "The selector is part of the approved Knowledge Search flow, but the live backend currently proves Vocabulary search only. No substitute results are shown.",
    partialNote: "Vocabulary results are live. Other selected knowledge families are not searchable yet and are intentionally omitted.",
    open: "View entry",
    families: { all: "All", vocabulary: "Vocabulary", characters: "Characters", grammar: "Grammar", more: "More", comparisons: "Comparisons", idioms: "Idioms" },
  },
  vi: {
    knowledge: "Kiến thức",
    vocabulary: "Từ vựng",
    eyebrow: "TÌM KIẾM KIẾN THỨC",
    title: "Tìm đúng điều bạn cần hiểu.",
    intro: "Tra từ, Hán tự, điểm ngữ pháp, phần so sánh hoặc thành ngữ từ một nơi. Kết quả giúp bạn đi đúng tới loại kiến thức phù hợp, thay vì phải đoán trước mình nên tìm ở mục nào.",
    sideTitle: "Một ô tìm kiếm, nhiều loại kiến thức",
    sideBody: "Kết quả được nhận diện theo đúng loại nội dung. Thẻ kết quả chỉ giúp nhận biết và đi tiếp; phần giải thích sâu nằm ở trang chi tiết.",
    search: "Tìm",
    searchPlaceholder: "Nhập chữ Hán, pinyin hoặc ý nghĩa…",
    hint: "Thử: 椅子 · yǐzi · ghế · 还",
    resultsFor: (query) => `Kết quả cho “${query}”`,
    resultNote: "Chọn một mục để đi tiếp tới trang Kiến thức chi tiết.",
    emptyTitle: "Bắt đầu từ điều bạn đang thắc mắc",
    emptyBody: "Bạn có thể tìm bằng chữ Hán, pinyin hoặc ý nghĩa trong ngôn ngữ đang dùng. Nội dung chưa xuất bản sẽ không được tạo giả để lấp kết quả.",
    noResultsTitle: "Chưa tìm thấy nội dung phù hợp",
    noResultsBody: "Thử kiểm tra lại chữ Hán, pinyin hoặc ý nghĩa. Nếu nội dung chưa có trong YunChinese, trang không tạo kết quả thay thế chỉ để lấp chỗ trống.",
    unavailableTitle: "Không thể tải kết quả lúc này",
    unavailableBody: "Nguồn Từ vựng đã xuất bản hiện không khả dụng nên kết quả chưa được hiển thị. Nội dung đang tìm vẫn được giữ nguyên.",
    unsupportedTitle: "Loại kiến thức này chưa thể tìm kiếm",
    unsupportedBody: "Bộ chọn family đã thuộc flow Knowledge Search được duyệt, nhưng backend hiện mới chứng minh tìm kiếm Từ vựng. Trang không tạo kết quả thay thế giả.",
    partialNote: "Kết quả Từ vựng đang dùng dữ liệu thật. Các loại kiến thức khác đang chọn chưa có backend tìm kiếm và được cố ý bỏ qua.",
    open: "Xem mục từ",
    families: { all: "Tất cả", vocabulary: "Từ vựng", characters: "Hán tự", grammar: "Ngữ pháp", more: "Thêm", comparisons: "So sánh", idioms: "Thành ngữ" },
  },
  ar: {
    knowledge: "المعرفة",
    vocabulary: "المفردات",
    eyebrow: "بحث المعرفة",
    title: "ابحث عمّا تحتاج إلى فهمه.",
    intro: "ابحث عن كلمة أو حرف صيني أو نقطة نحوية أو مقارنة أو تعبير اصطلاحي من مكان واحد.",
    sideTitle: "بحث واحد، عائلات معرفية متعددة",
    sideBody: "تساعدك بطاقات النتائج على تحديد الوجهة الصحيحة، بينما تبقى التفاصيل في صفحة المعرفة المناسبة.",
    search: "بحث",
    searchPlaceholder: "أدخل حروفًا صينية أو Pinyin أو معنى…",
    hint: "جرّب: 椅子 · yǐzi · chair · 还",
    resultsFor: (query) => `نتائج “${query}”`,
    resultNote: "اختر مدخلاً للانتقال إلى صفحة المعرفة التفصيلية.",
    emptyTitle: "ابدأ بما تريد فهمه",
    emptyBody: "يمكنك البحث بالحروف الصينية أو Pinyin أو المعنى. لا ينشئ YunChinese محتوى غير منشور لملء النتائج.",
    noResultsTitle: "لا توجد معرفة مطابقة بعد",
    noResultsBody: "تحقق من الحروف أو Pinyin أو المعنى وحاول مرة أخرى.",
    unavailableTitle: "النتائج غير متاحة الآن",
    unavailableBody: "تعذر الوصول إلى مصدر المفردات المنشورة، لذلك لا يتم عرض نتائج الآن.",
    unsupportedTitle: "هذه العائلة المعرفية غير قابلة للبحث بعد",
    unsupportedBody: "واجهة الاختيار موجودة ضمن تدفق البحث المعتمد، لكن الخلفية الحالية تثبت بحث المفردات فقط.",
    partialNote: "نتائج المفردات حقيقية. العائلات الأخرى المحددة غير قابلة للبحث بعد وتم حذفها عمدًا.",
    open: "عرض المدخل",
    families: { all: "الكل", vocabulary: "المفردات", characters: "الحروف", grammar: "القواعد", more: "المزيد", comparisons: "المقارنات", idioms: "التعابير" },
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

const normalizeFamilies = (value: string | string[] | undefined) => {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.filter((item) => ["vocabulary", "characters", "grammar", "comparisons", "idioms"].includes(item)))];
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

export default async function KnowledgeSearchPage({ searchParams }: Props) {
  const query = await searchParams;
  const interfaceLocale = resolveInterfaceLocale(query?.uiLang, query?.lang);
  const labels = labelFor(interfaceLocale.code);
  const learnerContextQuery = preservedLearnerContextQuery({
    uiLang: query?.uiLang,
    lang: query?.lang,
    levelSystem: query?.levelSystem,
    level: query?.level,
  });
  const selectedFamilies = normalizeFamilies(query?.family);
  const vocabularySelected = selectedFamilies.length === 0 || selectedFamilies.includes("vocabulary");
  const unsupportedSelected = selectedFamilies.some((family) => family !== "vocabulary");
  const rawQuery = query?.q?.trim() ?? "";
  const result = vocabularySelected
    ? await loadVocabularySearch(rawQuery, query?.lang ?? query?.uiLang)
    : null;
  const searchQuery = result?.query ?? rawQuery;

  return (
    <main className={styles.page} dir={interfaceLocale.direction}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <span>{labels.knowledge}</span>
        <span aria-hidden="true">/</span>
        <span>{labels.eyebrow}</span>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{labels.eyebrow}</p>
          <h1>{labels.title}</h1>
          <p className={styles.intro}>{labels.intro}</p>
        </div>
        <aside className={styles.heroAside}>
          <strong>{labels.sideTitle}</strong>
          <p>{labels.sideBody}</p>
        </aside>
      </section>

      <section className={styles.searchPanel}>
        <VocabularySearchForm
          query={searchQuery}
          context={learnerContextQuery}
          placeholder={labels.searchPlaceholder}
          submitLabel={labels.search}
          ariaLabel={labels.search}
          className={styles.searchForm}
          familyLabels={labels.families}
          initialFamilies={selectedFamilies}
        />
        <p className={styles.hint}>{labels.hint}</p>
      </section>

      <section className={styles.results} aria-live="polite">
        {!rawQuery ? (
          <SearchState title={labels.emptyTitle} body={labels.emptyBody} />
        ) : !vocabularySelected ? (
          <SearchState title={labels.unsupportedTitle} body={labels.unsupportedBody} />
        ) : result?.status === "DATABASE_ERROR" || result?.status === "INVALID_INPUT" ? (
          <SearchState title={labels.unavailableTitle} body={labels.unavailableBody} />
        ) : result?.items.length === 0 ? (
          <SearchState title={labels.noResultsTitle} body={labels.noResultsBody} />
        ) : result ? (
          <>
            <div className={styles.resultsHead}>
              <div>
                <h2>{labels.resultsFor(searchQuery)}</h2>
                <p>{unsupportedSelected ? labels.partialNote : labels.resultNote}</p>
              </div>
              <span className={styles.resultCount}>{result.items.length}</span>
            </div>
            <div className={styles.resultList}>
              {result.items.map((item) => (
                <Link
                  key={item.publicId}
                  href={{
                    pathname: `/knowledge/vocabulary/${item.publicId}`,
                    query: {
                      ...learnerContextQuery,
                      q: searchQuery,
                      ...(selectedFamilies.length > 0 ? { family: selectedFamilies } : {}),
                    },
                  }}
                  className={styles.resultCard}
                >
                  <span className={styles.familyBadge}>{labels.vocabulary}</span>
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
        ) : null}
      </section>
    </main>
  );
}
