"use client";

import { useState } from "react";

type Labels = {
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

export default function KnowledgeFamilySelector({ labels, initialFamilies = [] }: Props) {
  const [selected, setSelected] = useState<string[]>(
    initialFamilies.filter((value) => [...PRIMARY_FAMILIES, ...MORE_FAMILIES].includes(value as never)),
  );
  const allSelected = selected.length === 0;

  function toggleFamily(value: string) {
    setSelected((current) => (
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    ));
  }

  return (
    <fieldset data-family-selector aria-label="Knowledge families">
      <legend className="sr-only">Knowledge families</legend>
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
      <details data-family-more open={MORE_FAMILIES.some((value) => selected.includes(value))}>
        <summary data-family-chip data-selected={MORE_FAMILIES.some((value) => selected.includes(value)) ? "true" : "false"}>
          {labels.more}
        </summary>
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
      </details>
    </fieldset>
  );
}
