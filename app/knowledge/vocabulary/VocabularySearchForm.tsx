import KnowledgeFamilySelector from "./KnowledgeFamilySelector";

type LearnerContext = {
  uiLang?: string;
  lang?: string;
  knowledgeLang?: string;
  levelSystem?: string;
  level?: string;
};

type FamilyLabels = {
  groupLabel: string;
  all: string;
  vocabulary: string;
  characters: string;
  grammar: string;
  more: string;
  comparisons: string;
  idioms: string;
};

type Props = {
  query?: string;
  action?: string;
  context: LearnerContext;
  placeholder: string;
  submitLabel: string;
  ariaLabel: string;
  className?: string;
  familyLabels?: FamilyLabels;
  initialFamilies?: string[];
};

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m12.4 12.4 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

export default function VocabularySearchForm({
  query = "",
  action = "/knowledge",
  context,
  placeholder,
  submitLabel,
  ariaLabel,
  className,
  familyLabels,
  initialFamilies = [],
}: Props) {
  return (
    <form action={action} method="get" role="search" aria-label={ariaLabel} className={className}>
      {Object.entries(context).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <div data-search-row>
        <span data-search-icon><SearchIcon /></span>
        <label>
          <input
            type="search"
            name="q"
            defaultValue={query}
            maxLength={80}
            autoComplete="off"
            enterKeyHint="search"
            placeholder={placeholder}
            aria-label={ariaLabel}
          />
        </label>
        <button type="submit">{submitLabel}</button>
      </div>
      {familyLabels ? (
        <KnowledgeFamilySelector labels={familyLabels} initialFamilies={initialFamilies} />
      ) : null}
    </form>
  );
}
