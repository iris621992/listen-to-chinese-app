import type { VocabularyCharacterOccurrence } from "@/lib/vocabularyCharacterDelivery";
import CharacterWritingPreview from "./CharacterWritingPreview";
import styles from "./VocabularyCharacterRail.module.css";

type Labels = {
  characters: string;
  radical: string;
  strokes: string;
  hanViet: string;
  writingOpen: string;
  writingReplay: string;
  writingUnavailable: string;
  writingSource: string;
};

type Props = {
  occurrences: VocabularyCharacterOccurrence[];
  labels: Labels;
};

function uniqueCharacters(occurrences: VocabularyCharacterOccurrence[]) {
  const result: VocabularyCharacterOccurrence[] = [];
  const seen = new Set<string>();
  for (const occurrence of occurrences) {
    const key = `${occurrence.character.publicId}:${occurrence.lexicalContextPronunciation ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(occurrence);
  }
  return result;
}

export default function VocabularyCharacterRail({ occurrences, labels }: Props) {
  const characters = uniqueCharacters(occurrences);
  if (characters.length === 0) return null;

  return (
    <aside id="characters" className={styles.characterRail} aria-labelledby="characters-title">
      <div className={styles.characterRailInner}>
        <h2 id="characters-title">{labels.characters}</h2>
        <div className={styles.characterList}>
          {characters.map((occurrence) => {
            const character = occurrence.character;
            return (
              <article key={`${character.publicId}-${occurrence.lexicalContextPronunciation ?? "context"}`} className={styles.characterCard}>
                <div className={styles.characterTile}>{character.glyph}</div>
                {occurrence.lexicalContextPronunciation ? (
                  <strong className={styles.characterReading}>{occurrence.lexicalContextPronunciation}</strong>
                ) : null}
                <dl className={styles.characterFacts}>
                  {character.hanViet ? (
                    <div><dt>{labels.hanViet}</dt><dd>{character.hanViet}</dd></div>
                  ) : null}
                  {character.radical ? (
                    <div><dt>{labels.radical}</dt><dd>{character.radical}</dd></div>
                  ) : null}
                  {character.strokeCount ? (
                    <div><dt>{labels.strokes}</dt><dd>{character.strokeCount}</dd></div>
                  ) : null}
                </dl>
                {character.writing ? (
                  <CharacterWritingPreview
                    glyph={character.glyph}
                    writing={character.writing}
                    labels={{
                      open: labels.writingOpen,
                      replay: labels.writingReplay,
                      unavailable: labels.writingUnavailable,
                      source: labels.writingSource,
                    }}
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
