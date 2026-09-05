import Link from "next/link";
import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";

type MainTabLabels = {
  mainTitle: string;
  mainBody: string;
  mainScriptTitle: string;
  mainScriptBody: string;
  mainVocabularyTitle: string;
  mainVocabularyBody: string;
  mainGrammarTitle: string;
  mainGrammarBody: string;
  mainPracticeTitle: string;
  mainPracticeBody: string;
};

type MainTabLink = {
  href: string;
  title: string;
  body: string;
};

export function MainTabContent({
  labels,
  links,
  interfaceDirection,
  interfaceTextAlign,
}: {
  labels: MainTabLabels;
  links: MainTabLink[];
  interfaceDirection: InterfaceTextDirection;
  interfaceTextAlign: string;
}) {
  return (
    <div
      className={`resource-main-state ${interfaceTextAlign}`}
      dir={interfaceDirection}
    >
      <div className="resource-main-intro">
        <h2>{labels.mainTitle}</h2>
        <p>{labels.mainBody}</p>
      </div>

      <div className="resource-main-grid">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="resource-main-card">
            <strong>{item.title}</strong>
            <span>{item.body}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
