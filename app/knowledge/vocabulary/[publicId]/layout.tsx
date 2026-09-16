import type { ReactNode } from "react";
import VocabularyDetailSearch from "./VocabularyDetailSearch";

export default function VocabularyDetailLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <VocabularyDetailSearch />
      {children}
    </>
  );
}
