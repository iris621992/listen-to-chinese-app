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

export default function KnowledgeFamilySelector({ labels, initialFamilies = [] }: Props) {
  const [selected, setSelected] = useState<string[]>(
    initialFamilies.filter((value) => VALID_FAMILIES.has(value)),
  );
  const [moreOpen, setMoreOpen] = useState(false);
  const allSelected = selected.length === 0;
  const moreSelected = MORE_FAMILIES.some((value) => selected.includes(value));

  function toggleFamily(value: string) {
    setSelected((current) => (
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    ));
  }

  return (
    <fieldset data-family-selector aria-label={labels.groupLabel}>
      <button
        type="button"
        data-family-chip
        data-selected={allSelected ? "true" : "false"}
        aria-pressed={allSelected}
        onClick={() => setSelected([])}
      >
        {labels.all}
      </button>
      {PRIMARY_FAMILIES.map((value) => (
        <label key={value} data-family-chip data-selected={selected.includes(value) ? "true" : "false"}>
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
      <div data-family-more>
        <button
          type="button"
          data-family-chip
          data-selected={moreSelected ? "true" : "false"}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((open) => !open)}
        >
          {labels.more}
        </button>
        {moreOpen ? (
          <div data-family-more-menu>
            {MORE_FAMILIES.map((value) => (
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
        ) : null}
      </div>
    </fieldset>
  );
}
