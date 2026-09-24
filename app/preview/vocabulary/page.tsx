import type { Metadata } from "next";
import VocabularyDraftPreviewBridge from "./VocabularyDraftPreviewBridge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vocabulary Draft Preview | YunChinese",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VocabularyDraftPreviewPage() {
  return <VocabularyDraftPreviewBridge />;
}
