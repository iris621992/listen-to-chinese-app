"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./VocabularyDetailSearch.module.css";

type Labels = {
  search: string;
  placeholder: string;
  backToResults: string;
};

const LABELS: Record<string, Labels> = {
  en: {
    search: "Search",
    placeholder: "Chinese, Pinyin, or meaning…",
    backToResults: "Back to search results",
  },
  vi: {
    search: "Tìm kiếm",
    placeholder: "Chữ Hán, Pinyin hoặc nghĩa…",
    backToResults: "Quay lại kết quả tìm kiếm",
  },
  ar: {
    search: "بحث",
    placeholder: "حروف صينية أو Pinyin أو معنى…",
    backToResults: "العودة إلى نتائج البحث",
  },
};

const CONTEXT_KEYS = ["uiLang", "lang", "levelSystem", "level"] as const;

export default function VocabularyDetailSearch() {
  const params = useSearchParams();
  const localeCode = params.get("uiLang") ?? params.get("lang") ?? "en";
  const labels = LABELS[localeCode] ?? LABELS.en;
  const query = params.get("q")?.trim() ?? "";

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
          href={{ pathname: "/knowledge/vocabulary", query: { ...context, q: query } }}
          className={styles.backLink}
        >
          ← {labels.backToResults}
        </Link>
      ) : null}
      <form action="/knowledge/vocabulary" method="get" role="search" aria-label={labels.search} className={styles.form}>
        {Object.entries(context).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <label>
          <span className="sr-only">{labels.search}</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            maxLength={80}
            autoComplete="off"
            enterKeyHint="search"
            placeholder={labels.placeholder}
            aria-label={labels.search}
          />
        </label>
        <button type="submit">{labels.search}</button>
      </form>
    </div>
  );
}
