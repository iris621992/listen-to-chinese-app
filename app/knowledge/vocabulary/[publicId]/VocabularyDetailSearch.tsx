"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import VocabularySearchForm from "../VocabularySearchForm";
import searchStyles from "../VocabularySearch.module.css";
import styles from "./VocabularyDetailSearch.module.css";

type Labels = {
  search: string;
  placeholder: string;
  backToResults: string;
  families: {
    groupLabel: string;
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
    search: "Search",
    placeholder: "Enter Hanzi, pinyin, or meaning…",
    backToResults: "Back to search results",
    families: { groupLabel: "Knowledge families", all: "All", vocabulary: "Vocabulary", characters: "Characters", grammar: "Grammar", more: "More", comparisons: "Comparisons", idioms: "Idioms" },
  },
  vi: {
    search: "Tìm",
    placeholder: "Nhập chữ Hán, pinyin hoặc ý nghĩa…",
    backToResults: "Quay lại kết quả tìm kiếm",
    families: { groupLabel: "Loại kiến thức", all: "Tất cả", vocabulary: "Từ vựng", characters: "Hán tự", grammar: "Ngữ pháp", more: "Thêm", comparisons: "So sánh", idioms: "Thành ngữ" },
  },
  ar: {
    search: "بحث",
    placeholder: "أدخل حروفًا صينية أو Pinyin أو معنى…",
    backToResults: "العودة إلى نتائج البحث",
    families: { groupLabel: "عائلات المعرفة", all: "الكل", vocabulary: "المفردات", characters: "الحروف", grammar: "القواعد", more: "المزيد", comparisons: "المقارنات", idioms: "التعابير" },
  },
};

const CONTEXT_KEYS = ["uiLang", "lang", "knowledgeLang", "levelSystem", "level"] as const;

export default function VocabularyDetailSearch() {
  const params = useSearchParams();
  const localeCode = params.get("uiLang") ?? params.get("lang") ?? "en";
  const labels = LABELS[localeCode] ?? LABELS.en;
  const query = params.get("q")?.trim() ?? "";
  const families = params.getAll("family");

  const context = Object.fromEntries(
    CONTEXT_KEYS.flatMap((key) => {
      const value = params.get(key);
      return value ? [[key, value]] : [];
    }),
  );

  return (
    <div className={styles.wrap}>
      {query ? (
        <Link
          href={{
            pathname: "/knowledge",
            query: {
              ...context,
              q: query,
              ...(families.length > 0 ? { family: families } : {}),
            },
          }}
          className={styles.backLink}
        >
          ← {labels.backToResults}
        </Link>
      ) : null}
      <VocabularySearchForm
        query={query}
        context={context}
        placeholder={labels.placeholder}
        submitLabel={labels.search}
        ariaLabel={labels.search}
        className={`${searchStyles.searchPanel} ${searchStyles.searchForm} ${styles.compactForm}`}
        familyLabels={labels.families}
        initialFamilies={families}
      />
    </div>
  );
}
