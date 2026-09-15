"use client";

import Link from "next/link";
import { useState } from "react";
import type { VocabularyCharacterOccurrence } from "@/lib/vocabularyCharacterDelivery";
import CharacterWritingPreview from "./CharacterWritingPreview";
import styles from "./VocabularyCharacterRail.module.css";

type Labels = {
  characters: string;
  radical: string;
  strokes: string;
  hanViet: string;
  structure?: string;
  structureSingle?: string;
  writingOpen: string;
  writingReplay: string;
  writingUnavailable: string;
  writingSource: string;
};

type DetailAction = {
  href: string;
  label: string;
};

type Props = {
  occurrences: VocabularyCharacterOccurrence[];
  labels: Labels;
  detailAction?: DetailAction | null;
};

type QuickPreviewLabels = {
  title: string;
  writing: string;
  structure: string;
  single: string;
};

function occurrenceKey(occurrence: VocabularyCharacterOccurrence) {
  return `${occurrence.character.publicId}:${occurrence.lexicalContextPronunciation ?? ""}`;
}

function uniqueCharacters(occurrences: VocabularyCharacterOccurrence[]) {
  const result: VocabularyCharacterOccurrence[] = [];
  const seen = new Set<string>();
  for (const occurrence of occurrences) {
    const key = occurrenceKey(occurrence);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(occurrence);
  }
  return result;
}

function simplifiedMainlandCharacters(occurrences: VocabularyCharacterOccurrence[]) {
  return uniqueCharacters(
    occurrences.filter((occurrence) => (
      occurrence.scriptVariantCode === "simplified"
      || occurrence.scriptProfileCode === "simplified_mainland"
    )),
  );
}

function quickPreviewLabels(labels: Labels): QuickPreviewLabels {
  if (labels.characters === "Hán tự") {
    return {
      title: "Hán tự trong từ này",
      writing: "Cách viết",
      structure: labels.structure ?? "Kết cấu",
      single: labels.structureSingle ?? "Độc thể",
    };
  }

  if (labels.characters === "الحروف الصينية") {
    return {
      title: "الحروف الصينية في هذه الكلمة",
      writing: "طريقة الكتابة",
      structure: labels.structure ?? "البنية",
      single: labels.structureSingle ?? "حرف مفرد البنية",
    };
  }

  return {
    title: "Characters in this word",
    writing: "Writing",
    structure: labels.structure ?? "Structure",
    single: labels.structureSingle ?? "Single-component",
  };
}

function learnerStructureValue(occurrence: VocabularyCharacterOccurrence, labels: QuickPreviewLabels) {
  if (occurrence.character.structureFormula) return occurrence.character.structureFormula;
  if (occurrence.character.structureCode === "single") return labels.single;
  return null;
}

export default function VocabularyCharacterRail({ occurrences, labels, detailAction = null }: Props) {
  const characters = simplifiedMainlandCharacters(occurrences);
  const [selectedKey, setSelectedKey] = useState(() => (
    characters.length > 0 ? occurrenceKey(characters[0]) : ""
  ));

  if (characters.length === 0) return null;

  const selectedOccurrence =
    characters.find((occurrence) => occurrenceKey(occurrence) === selectedKey)
    ?? characters[0];
  const selectedOccurrenceKey = occurrenceKey(selectedOccurrence);
  const character = selectedOccurrence.character;
  const previewLabels = quickPreviewLabels(labels);
  const structureValue = learnerStructureValue(selectedOccurrence, previewLabels);

  return (
    <aside id="characters" className={styles.characterRail} aria-labelledby="characters-title">
      <div className={styles.characterRailInner}>
        <header className={styles.header}>
          <h2 id="characters-title">{previewLabels.title}</h2>
        </header>

        <div className={styles.characterSelector} role="group" aria-label={labels.characters}>
          {characters.map((occurrence) => {
            const key = occurrenceKey(occurrence);
            const selected = key === selectedOccurrenceKey;
            return (
              <button
                key={key}
                type="button"
                className={styles.characterSelectorButton}
                aria-pressed={selected}
                aria-label={`${labels.characters}: ${occurrence.character.glyph}`}
                onClick={() => setSelectedKey(key)}
              >
                <span className={styles.selectorGlyph}>{occurrence.character.glyph}</span>
              </button>
            );
          })}
        </div>

        <article className={styles.selectedCharacter} aria-live="polite">
          <div className={styles.writingLabel}>{previewLabels.writing}</div>
          {character.writing ? (
            <CharacterWritingPreview
              key={`${selectedOccurrenceKey}:${character.writing.sourcePath}`}
              glyph={character.glyph}
              writing={character.writing}
              labels={{
                replay: labels.writingReplay,
                unavailable: labels.writingUnavailable,
                source: labels.writingSource,
              }}
            />
          ) : (
            <div className={styles.writingUnavailable}>
              <span className={styles.fallbackGlyph}>{character.glyph}</span>
              <p>{labels.writingUnavailable}</p>
            </div>
          )}

          <dl className={styles.characterFacts}>
            {selectedOccurrence.lexicalContextPronunciation ? (
              <div><dt>Pinyin</dt><dd>{selectedOccurrence.lexicalContextPronunciation}</dd></div>
            ) : null}
            {character.hanViet ? (
              <div><dt>{labels.hanViet}</dt><dd>{character.hanViet}</dd></div>
            ) : null}
            {structureValue ? (
              <div className={styles.structureFact}>
                <dt>{previewLabels.structure}</dt>
                <dd>{structureValue}</dd>
              </div>
            ) : null}
            {character.radical ? (
              <div><dt>{labels.radical}</dt><dd className={styles.hanziValue}>{character.radical}</dd></div>
            ) : null}
            {character.strokeCount ? (
              <div><dt>{labels.strokes}</dt><dd>{character.strokeCount}</dd></div>
            ) : null}
          </dl>

          {detailAction ? (
            <Link className={styles.detailAction} href={detailAction.href}>
              {detailAction.label}
            </Link>
          ) : null}
        </article>
      </div>
    </aside>
  );
}
