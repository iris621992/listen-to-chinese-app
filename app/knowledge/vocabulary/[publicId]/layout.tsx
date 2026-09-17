import type { ReactNode } from "react";
import VocabularyDetailSearch from "./VocabularyDetailSearch";
import VocabularyKnowledgeLanguageToggle from "./VocabularyKnowledgeLanguageToggle";
import styles from "./VocabularyDetailSurface.module.css";

export default function VocabularyDetailLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.surface}>
      <VocabularyDetailSearch />
      {children}
      <VocabularyKnowledgeLanguageToggle />
    </div>
  );
}
