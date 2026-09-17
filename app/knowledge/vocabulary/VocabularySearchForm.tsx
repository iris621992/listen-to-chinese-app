import KnowledgeFamilySelector from "./KnowledgeFamilySelector";

type LearnerContext = {
  uiLang?: string;
  lang?: string;
  levelSystem?: string;
  level?: string;
};

type FamilyLabels = {
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
      {familyLabels ? (
        <KnowledgeFamilySelector labels={familyLabels} initialFamilies={initialFamilies} />
      ) : null}
      <div data-search-row>
        <label>
          <span className="sr-only">{ariaLabel}</span>
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
    </form>
  );
}
