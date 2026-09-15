"use client";

import { useState } from "react";
import type { VocabularyCharacterOccurrence } from "@/lib/vocabularyCharacterDelivery";
import CharacterWritingPreview from "./CharacterWritingPreview";
import styles from "./VocabularyCharacterRail.module.css";

type Labels = {
  characters: string;
  radical: string;
  strokes: string;
  hanViet: string;
  structure: string;
  structureLeftRight: string;
  structureSingle: string;
  writingOpen: string;
  writingReplay: string;
  writingUnavailable: string;
  writingSource: string;
};

type Props = {
  occurrences: VocabularyCharacterOccurrence[];
  labels: Labels;
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

function structureLabel(code: string | null, labels: Labels) {
  if (code === "left-right") return labels.structureLeftRight;
  if (code === "single") return labels.structureSingle;
  return null;
}

export default function VocabularyCharacterRail({ occurrences, labels }: Props) {
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
  const localizedStructure = structureLabel(character.structureCode, labels);

  return (
    <aside id="characters" className={styles.characterRail} aria-labelledby="characters-title">
      <div className={styles.characterRailInner}>
        <header className={styles.header}>
          <h2 id="characters-title">{labels.characters}</h2>
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
            {localizedStructure ? (
              <div><dt>{labels.structure}</dt><dd>{localizedStructure}</dd></div>
            ) : null}
            {character.radical ? (
              <div><dt>{labels.radical}</dt><dd>{character.radical}</dd></div>
            ) : null}
            {character.strokeCount ? (
              <div><dt>{labels.strokes}</dt><dd>{character.strokeCount}</dd></div>
            ) : null}
          </dl>
        </article>
      </div>
    </aside>
  );
}
