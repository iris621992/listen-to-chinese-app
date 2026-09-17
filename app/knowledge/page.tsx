import Link from "next/link";
import type { ReactNode } from "react";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";
import { loadVocabularySearch } from "@/lib/vocabularySearch";
import VocabularySearchForm from "./vocabulary/VocabularySearchForm";
import styles from "./vocabulary/VocabularySearch.module.css";

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
  breadcrumbSearch: string;
  vocabulary: string;
  eyebrow: string;
  title: string;
  intro: string;
  exploreEyebrow: string;
  sideTitle: string;
  sideBody: string;
  flowSearch: string;
  flowIdentify: string;
  flowDetail: string;
  search: string;
  searchPlaceholder: string;
  tryLabel: string;
  initialTitle: string;
  initialBody: string;
  initialExamples: Array<[string, string]>;
  resultsFor: (query: string) => string;
  resultsLabel: string;
  resultNote: string;
  emptyTitle: string;
  emptyBody: string;
  unavailableTitle: string;
  unavailableBody: string;
  unsupportedTitle: string;
  unsupportedBody: string;
  partialNote: string;
  railTitle: string;
  railItems: Array<[string, string]>;
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
    breadcrumbSearch: "Search",
    vocabulary: "Vocabulary",
    eyebrow: "KNOWLEDGE SEARCH",
    title: "Find what you need to understand.",
    intro: "Search a word, character, grammar point, comparison, or idiom from one place. Results lead you to the right kind of knowledge without requiring you to know the category first.",
    exploreEyebrow: "EXPLORE KNOWLEDGE",
    sideTitle: "One search, multiple knowledge families",
    sideBody: "Results are identified by content type. Result cards help you recognize and navigate; deep explanation stays on the relevant detail page.",
    flowSearch: "Search",
    flowIdentify: "Identify",
    flowDetail: "Open detail",
    search: "Search",
    searchPlaceholder: "Enter Hanzi, pinyin, or meaning…",
    tryLabel: "Try:",
    initialTitle: "Start with what you are wondering about",
    initialBody: "Search by Hanzi, pinyin, or learner-language meaning. Published Vocabulary results are live; other Knowledge families stay fail-closed until their search backends exist.",
    initialExamples: [
      ["椅子", "Vocabulary · a specific lexical entry"],
      ["还", "Vocabulary · search the published lexical entries"],
      ["chair", "Search Vocabulary by learner-language meaning"],
    ],
    resultsFor: (query) => `Results for “${query}”`,
    resultsLabel: "results",
    resultNote: "Choose an entry to continue to its detailed Knowledge page.",
    emptyTitle: "No matching knowledge yet",
    emptyBody: "Check the Hanzi, pinyin, or meaning and try again. If YunChinese does not have the content yet, the page does not fabricate substitute results.",
    unavailableTitle: "Results are unavailable right now",
    unavailableBody: "The published Vocabulary source could not be reached, so results are not being shown. Your query is preserved.",
    unsupportedTitle: "This knowledge family is not searchable yet",
    unsupportedBody: "The selector is part of the approved Knowledge Search flow, but the live backend currently proves Vocabulary search only. No substitute results are shown.",
    partialNote: "Vocabulary results are live. Other selected knowledge families are not searchable yet and are intentionally omitted.",
    railTitle: "How to read results",
    railItems: [
      ["Identify first", "Family, headword, pronunciation, and a short meaning help you recognize the right destination."],
      ["Go deep after", "Sense detail, examples, classifiers, collocations, and other depth stay on the detail page."],
      ["Omit what is missing", "A family without real published results is not filled with fabricated placeholders."],
    ],
    families: { all: "All", vocabulary: "Vocabulary", characters: "Characters", grammar: "Grammar", more: "More", comparisons: "Comparisons", idioms: "Idioms" },
  },
  vi: {
    knowledge: "Kiến thức",
    breadcrumbSearch: "Tìm kiếm",
    vocabulary: "Từ vựng",
    eyebrow: "TÌM KIẾM KIẾN THỨC",
    title: "Tìm đúng điều bạn cần hiểu.",
    intro: "Tra từ, Hán tự, điểm ngữ pháp, phần so sánh hoặc thành ngữ từ một nơi. Kết quả giúp bạn đi đúng tới loại kiến thức phù hợp, thay vì phải đoán trước mình nên tìm ở mục nào.",
    exploreEyebrow: "KHÁM PHÁ KIẾN THỨC",
    sideTitle: "Một ô tìm kiếm, nhiều loại kiến thức",
    sideBody: "Kết quả được nhận diện theo đúng loại nội dung. Thẻ kết quả chỉ giúp nhận biết và đi tiếp; phần giải thích sâu nằm ở trang chi tiết.",
    flowSearch: "Tìm",
    flowIdentify: "Nhận diện",
    flowDetail: "Đi sâu",
    search: "Tìm",
    searchPlaceholder: "Nhập chữ Hán, pinyin hoặc ý nghĩa…",
    tryLabel: "Thử:",
    initialTitle: "Bắt đầu từ điều bạn đang thắc mắc",
    initialBody: "Bạn có thể tìm bằng chữ Hán, pinyin hoặc ý nghĩa trong ngôn ngữ đang dùng. Kết quả Từ vựng đã xuất bản đang hoạt động; các family khác giữ fail-closed cho tới khi có backend tìm kiếm thật.",
    initialExamples: [
      ["椅子", "Từ vựng · một mục từ cụ thể"],
      ["还", "Từ vựng · tìm các mục từ đã xuất bản"],
      ["ghế", "Tìm Từ vựng theo nghĩa tiếng Việt"],
    ],
    resultsFor: (query) => `Kết quả cho “${query}”`,
    resultsLabel: "kết quả",
    resultNote: "Chọn một mục để đi tiếp tới trang Kiến thức chi tiết.",
    emptyTitle: "Chưa tìm thấy nội dung phù hợp",
    emptyBody: "Thử kiểm tra lại chữ Hán, pinyin hoặc ý nghĩa. Nếu nội dung chưa có trong YunChinese, trang không tạo kết quả thay thế chỉ để lấp chỗ trống.",
    unavailableTitle: "Không thể tải kết quả lúc này",
    unavailableBody: "Nguồn Từ vựng đã xuất bản hiện không khả dụng nên kết quả chưa được hiển thị. Nội dung đang tìm vẫn được giữ nguyên.",
    unsupportedTitle: "Loại kiến thức này chưa thể tìm kiếm",
    unsupportedBody: "Bộ chọn family đã thuộc flow Knowledge Search được duyệt, nhưng backend hiện mới chứng minh tìm kiếm Từ vựng. Trang không tạo kết quả thay thế giả.",
    partialNote: "Kết quả Từ vựng đang dùng dữ liệu thật. Các loại kiến thức khác đang chọn chưa có backend tìm kiếm và được cố ý bỏ qua.",
    railTitle: "Cách đọc kết quả",
    railItems: [
      ["Nhận diện trước", "Family, headword, pinyin và ý nghĩa ngắn giúp biết đây có phải nội dung bạn cần."],
      ["Đi sâu sau", "Chi tiết Sense, ví dụ, lượng từ, collocation và các lớp sâu hơn nằm ở trang chi tiết."],
      ["Thiếu thì bỏ qua", "Family không có kết quả thật sẽ không được lấp bằng placeholder giả."],
    ],
    families: { all: "Tất cả", vocabulary: "Từ vựng", characters: "Hán tự", grammar: "Ngữ pháp", more: "Thêm", comparisons: "So sánh", idioms: "Thành ngữ" },
  },
  ar: {
    knowledge: "المعرفة",
    breadcrumbSearch: "البحث",
    vocabulary: "المفردات",
    eyebrow: "بحث المعرفة",
    title: "ابحث عمّا تحتاج إلى فهمه.",
    intro: "ابحث عن كلمة أو حرف صيني أو نقطة نحوية أو مقارنة أو تعبير اصطلاحي من مكان واحد.",
    exploreEyebrow: "استكشاف المعرفة",
    sideTitle: "بحث واحد، عائلات معرفية متعددة",
    sideBody: "تساعدك بطاقات النتائج على تحديد الوجهة الصحيحة، بينما تبقى التفاصيل في صفحة المعرفة المناسبة.",
    flowSearch: "بحث",
    flowIdentify: "تحديد",
    flowDetail: "فتح التفاصيل",
    search: "بحث",
    searchPlaceholder: "أدخل حروفًا صينية أو Pinyin أو معنى…",
    tryLabel: "جرّب:",
    initialTitle: "ابدأ بما تريد فهمه",
    initialBody: "يمكنك البحث بالحروف الصينية أو Pinyin أو المعنى. نتائج المفردات المنشورة متاحة، بينما تبقى العائلات الأخرى مغلقة بأمان حتى تتوفر خلفيات بحث حقيقية.",
    initialExamples: [
      ["椅子", "المفردات · مدخل معجمي"],
      ["还", "المفردات · البحث في المداخل المنشورة"],
      ["chair", "البحث في المفردات بالمعنى"],
    ],
    resultsFor: (query) => `نتائج “${query}”`,
    resultsLabel: "نتائج",
    resultNote: "اختر مدخلاً للانتقال إلى صفحة المعرفة التفصيلية.",
    emptyTitle: "لا توجد معرفة مطابقة بعد",
    emptyBody: "تحقق من الحروف أو Pinyin أو المعنى وحاول مرة أخرى.",
    unavailableTitle: "النتائج غير متاحة الآن",
    unavailableBody: "تعذر الوصول إلى مصدر المفردات المنشورة، لذلك لا يتم عرض نتائج الآن.",
    unsupportedTitle: "هذه العائلة المعرفية غير قابلة للبحث بعد",
    unsupportedBody: "واجهة الاختيار موجودة ضمن تدفق البحث المعتمد، لكن الخلفية الحالية تثبت بحث المفردات فقط.",
    partialNote: "نتائج المفردات حقيقية. العائلات الأخرى المحددة غير قابلة للبحث بعد وتم حذفها عمدًا.",
    railTitle: "قراءة النتائج",
    railItems: [
      ["تعرّف أولاً", "يساعد نوع المحتوى والكلمة والنطق والمعنى القصير على تحديد الوجهة المناسبة."],
      ["تعمّق لاحقًا", "تبقى التفاصيل والأمثلة والمعلومات الموسعة في صفحة التفاصيل."],
      ["احذف المفقود", "لا تُملأ العائلات غير المتاحة بنتائج مصطنعة."],
    ],
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

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M5 10h9M10.5 6.5 14 10l-3.5 3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function stateHref(
  learnerContextQuery: Record<string, string>,
  query: string,
  selectedFamilies: string[],
) {
  return {
    pathname: "/knowledge",
    query: {
      ...learnerContextQuery,
      q: query,
      ...(selectedFamilies.length > 0 ? { family: selectedFamilies } : {}),
    },
  };
}

function SearchState({
  kind,
  symbol,
  title,
  body,
  children,
}: {
  kind: "initial" | "empty" | "error" | "unsupported";
  symbol: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  const className = kind === "initial"
    ? styles.initialState
    : kind === "error"
      ? styles.errorState
      : kind === "unsupported"
        ? styles.unsupportedState
        : styles.emptyState;

  return (
    <div className={className}>
      <div className={styles.stateInner}>
        <div className={styles.stateSymbol} aria-hidden="true">{symbol}</div>
        <h2>{title}</h2>
        <p>{body}</p>
        {children}
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
  const queryExamples = [
    "椅子",
    interfaceLocale.code === "vi" ? "ghế" : "chair",
    "还",
    "觉得 认为",
  ];

  return (
    <main className={styles.page} dir={interfaceLocale.direction}>
      <div className={styles.shell}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span>{labels.knowledge}</span>
          <span aria-hidden="true">›</span>
          <strong>{labels.breadcrumbSearch}</strong>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <p className={styles.eyebrow}>{labels.eyebrow}</p>
            <h1>{labels.title}</h1>
            <p className={styles.heroCopy}>{labels.intro}</p>
          </div>
          <aside className={styles.heroAside}>
            <p className={styles.asideEyebrow}>{labels.exploreEyebrow}</p>
            <strong>{labels.sideTitle}</strong>
            <p>{labels.sideBody}</p>
            <div className={styles.heroFlow} aria-hidden="true">
              <span>{labels.flowSearch}</span>
              <b>→</b>
              <span>{labels.flowIdentify}</span>
              <b>→</b>
              <span>{labels.flowDetail}</span>
            </div>
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
          <div className={styles.searchHelp}>
            <span>{labels.tryLabel}</span>
            <div className={styles.queryExamples}>
              {queryExamples.map((example) => (
                <Link
                  key={example}
                  href={stateHref(learnerContextQuery, example, selectedFamilies)}
                  className={styles.queryChip}
                >
                  {example}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.results} aria-live="polite">
          {!rawQuery ? (
            <SearchState kind="initial" symbol="⌕" title={labels.initialTitle} body={labels.initialBody}>
              <div className={styles.initialCards}>
                {labels.initialExamples.map(([example, description]) => (
                  <Link
                    key={example}
                    href={stateHref(learnerContextQuery, example, selectedFamilies)}
                    className={styles.initialCard}
                  >
                    <strong>{example}</strong>
                    <span>{description}</span>
                  </Link>
                ))}
              </div>
            </SearchState>
          ) : !vocabularySelected ? (
            <SearchState kind="unsupported" symbol="!" title={labels.unsupportedTitle} body={labels.unsupportedBody} />
          ) : result?.status === "DATABASE_ERROR" || result?.status === "INVALID_INPUT" ? (
            <SearchState kind="error" symbol="!" title={labels.unavailableTitle} body={labels.unavailableBody} />
          ) : result?.items.length === 0 ? (
            <SearchState kind="empty" symbol="∅" title={labels.emptyTitle} body={labels.emptyBody} />
          ) : result ? (
            <>
              <div className={styles.resultsHead}>
                <div>
                  <h2>{labels.resultsFor(searchQuery)}</h2>
                  <p>{unsupportedSelected ? labels.partialNote : labels.resultNote}</p>
                </div>
                <span className={styles.resultsCount}>{result.items.length} {labels.resultsLabel}</span>
              </div>

              <div className={`${styles.resultsGrid} ${selectedFamilies.length > 0 ? styles.resultsGridSolo : ""}`}>
                <div className={styles.resultsColumn}>
                  <section className={styles.group}>
                    <div className={styles.groupHead}>
                      <div className={styles.groupTitle}>
                        <span className={styles.groupIcon} aria-hidden="true">词</span>
                        {labels.vocabulary}
                      </div>
                      <div className={styles.groupLine} />
                      <span className={styles.groupCount}>{result.items.length}</span>
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
                          <div className={styles.resultMain}>
                            <div className={styles.resultTitleRow}>
                              <span className={styles.resultHanzi}>{item.displayForm}</span>
                              <span className={styles.resultPinyin}>{item.pronunciation}</span>
                            </div>
                            {item.partOfSpeechCode ? (
                              <div className={styles.resultMeta}>
                                <span className={styles.tag}>
                                  {POS_LABELS[item.partOfSpeechCode]?.[interfaceLocale.code]
                                    ?? POS_LABELS[item.partOfSpeechCode]?.en
                                    ?? item.partOfSpeechCode}
                                </span>
                              </div>
                            ) : null}
                            <div className={styles.resultSummary}>{item.learnerSummary}</div>
                          </div>
                          <span className={styles.resultArrow} aria-hidden="true"><ArrowIcon /></span>
                        </Link>
                      ))}
                    </div>
                  </section>
                </div>

                {selectedFamilies.length === 0 ? (
                  <aside className={styles.contextRail}>
                    <h3>{labels.railTitle}</h3>
                    {labels.railItems.map(([title, body]) => (
                      <div className={styles.railItem} key={title}>
                        <strong>{title}</strong>
                        {body}
                      </div>
                    ))}
                  </aside>
                ) : null}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
