"use client";

import { useState } from "react";

type Labels = {
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
  labels: Labels;
  initialFamilies?: string[];
};

const PRIMARY_FAMILIES = ["vocabulary", "characters", "grammar"] as const;
const MORE_FAMILIES = ["comparisons", "idioms"] as const;
const VALID_FAMILIES = new Set<string>([...PRIMARY_FAMILIES, ...MORE_FAMILIES]);
const FAMILY_OPTIONS = [...PRIMARY_FAMILIES, ...MORE_FAMILIES] as const;

export default function KnowledgeFamilySelector({ labels, initialFamilies = [] }: Props) {
  const [selected, setSelected] = useState<string[]>(
    () => [...new Set(initialFamilies.filter((value) => VALID_FAMILIES.has(value)))],
  );
  const allSelected = selected.length === 0;
  const summary = allSelected
    ? labels.all
    : selected.length === 1
      ? labels[selected[0] as keyof Labels]
      : selected.map((value) => labels[value as keyof Labels]).join(", ");

  function toggleFamily(value: string) {
    setSelected((current) => (
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    ));
  }

  return (
    <fieldset data-family-selector aria-label={labels.groupLabel}>
      <span data-control-label>{labels.groupLabel}</span>
      <details data-family-dropdown>
        <summary data-family-trigger title={summary}>{summary}</summary>
        <div data-family-menu>
          <button
            type="button"
            data-family-all
            aria-pressed={allSelected}
            onClick={() => setSelected([])}
          >
            {labels.all}
          </button>
          {FAMILY_OPTIONS.map((value) => (
            <label key={value} data-family-option>
              <input
                type="checkbox"
                name="family"
                value={value}
                checked={selected.includes(value)}
                onChange={() => toggleFamily(value)}
              />
              <span>{labels[value]}</span>
            </label>
          ))}
        </div>
      </details>
    </fieldset>
  );
}
