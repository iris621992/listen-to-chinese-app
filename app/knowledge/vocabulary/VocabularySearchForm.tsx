type LearnerContext = {
  uiLang?: string;
  lang?: string;
  levelSystem?: string;
  level?: string;
};

type Props = {
  query?: string;
  action?: string;
  context: LearnerContext;
  placeholder: string;
  submitLabel: string;
  ariaLabel: string;
  className?: string;
};

export default function VocabularySearchForm({
  query = "",
  action = "/knowledge/vocabulary",
  context,
  placeholder,
  submitLabel,
  ariaLabel,
  className,
}: Props) {
  return (
    <form action={action} method="get" role="search" aria-label={ariaLabel} className={className}>
      {Object.entries(context).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
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
    </form>
  );
}
