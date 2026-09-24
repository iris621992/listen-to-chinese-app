import type { ReactNode } from "react";
import VocabularyDetailSearch from "@/app/knowledge/vocabulary/[publicId]/VocabularyDetailSearch";
import styles from "@/app/knowledge/vocabulary/[publicId]/VocabularyDetailSurface.module.css";

export default function VocabularyDraftPreviewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={styles.surface}>
      <VocabularyDetailSearch />
      {children}
    </div>
  );
}
