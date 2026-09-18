"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  KNOWLEDGE_LANGUAGE_PARAM,
  type KnowledgeLanguage,
} from "@/lib/knowledgeLanguage";
import styles from "./VocabularyDetail.module.css";

type Props = {
  value: KnowledgeLanguage;
  userLanguageLabel: string;
  compact?: boolean;
};

export default function KnowledgeLanguageToggle({
  value,
  userLanguageLabel,
  compact = false,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(nextValue: KnowledgeLanguage) {
    if (nextValue === value) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set(KNOWLEDGE_LANGUAGE_PARAM, nextValue);
    const query = next.toString();
    const hash = typeof window === "undefined" ? "" : window.location.hash;
    router.replace(`${pathname}${query ? `?${query}` : ""}${hash}`, { scroll: false });
  }

  return (
    <span
      className={styles.contentToggle}
      data-knowledge-language-toggle="true"
      data-compact={compact ? "true" : "false"}
      role="group"
      aria-label="Knowledge content language"
    >
      <button
        type="button"
        className={styles.contentToggleButton}
        aria-pressed={value === "user"}
        onClick={() => select("user")}
      >
        {userLanguageLabel}
      </button>
      <button
        type="button"
        className={styles.contentToggleButton}
        aria-pressed={value === "zh"}
        onClick={() => select("zh")}
      >
        中文
      </button>
    </span>
  );
}
