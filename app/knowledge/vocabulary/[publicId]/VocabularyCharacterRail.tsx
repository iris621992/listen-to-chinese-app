"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { VocabularyCharacterOccurrence } from "@/lib/vocabularyCharacterDelivery";
import CharacterWritingPreview from "./CharacterWritingPreview";
import styles from "./VocabularyCharacterRail.module.css";

type Labels = {
  characters: string;
  radical: string;
  strokes: string;
  hanViet: string;
  structure?: string;
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
  showHanViet?: boolean;
  detailAction?: DetailAction | null;
  variant?: "responsive" | "rail" | "embedded";
  anchorId?: string;
};

type QuickPreviewLabels = {
  title: string;
  subtitle: string;
  writing: string;
  pinyin: string;
  structure: string;
};

function occurrenceKey(occurrence: VocabularyCharacterOccurrence) {
  return `${occurrence.writtenFormPublicId}:${occurrence.position}:${occurrence.character.publicId}:${occurrence.lexicalContextPronunciation ?? ""}`;
}

function uniqueOccurrences(occurrences: VocabularyCharacterOccurrence[]) {
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

function subscribeToHashChange(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function activeReadingPronunciationSnapshot() {
  if (!window.location.hash.startsWith("#reading-")) return "";
  const target = document.getElementById(window.location.hash.slice(1));
  return target?.querySelector<HTMLElement>("strong")?.textContent?.trim() ?? "";
}

function quickPreviewLabels(labels: Labels): QuickPreviewLabels {
  if (labels.characters === "Hán tự") {
    return {
      title: "Hán tự trong từ này",
      subtitle: "Xem nhanh đúng hình chữ và cách đọc trong ngữ cảnh của mục từ hiện tại.",
      writing: "Cách viết",
      pinyin: "Pinyin",
      structure: labels.structure ?? "Kết cấu",
    };
  }

  if (labels.characters === "الحروف الصينية") {
    return {
      title: "الحروف الصينية في هذه الكلمة",
      subtitle: "معاينة الشكل الدقيق والقراءة في سياق المدخل الحالي.",
      writing: "طريقة الكتابة",
      pinyin: "Pinyin",
      structure: labels.structure ?? "البنية",
    };
  }

  return {
    title: "Characters in this word",
    subtitle: "Inspect the exact written form and its reading in the current lexical context.",
    writing: "Writing",
    pinyin: "Pinyin",
    structure: labels.structure ?? "Structure",
  };
}

function learnerStructureValue(occurrence: VocabularyCharacterOccurrence) {
  return occurrence.character.structureFormula;
}

export default function VocabularyCharacterRail({
  occurrences,
  labels,
  showHanViet = true,
  detailAction = null,
  variant = "responsive",
  anchorId,
}: Props) {
  const activePronunciation = useSyncExternalStore(
    subscribeToHashChange,
    activeReadingPronunciationSnapshot,
    () => "",
  );

  const characters = useMemo(() => {
    const exactOccurrences = uniqueOccurrences(occurrences);
    if (activePronunciation) {
      const pronunciationMatches = exactOccurrences.filter(
        (occurrence) => occurrence.lexicalContextPronunciation === activePronunciation,
      );
      if (pronunciationMatches.length > 0) return pronunciationMatches;
    }
    const primaryFormOccurrences = exactOccurrences.filter((occurrence) => occurrence.isPrimaryForm);
    return primaryFormOccurrences.length > 0 ? primaryFormOccurrences : exactOccurrences;
  }, [occurrences, activePronunciation]);

  if (characters.length === 0) return null;

  if (variant === "responsive") {
    return (
      <>
        <VocabularyCharacterRail
          occurrences={occurrences}
          labels={labels}
          showHanViet={showHanViet}
          detailAction={detailAction}
          variant="rail"
          anchorId="characters-rail"
        />
        <VocabularyCharacterRail
          occurrences={occurrences}
          labels={labels}
          showHanViet={showHanViet}
          detailAction={detailAction}
          variant="embedded"
          anchorId="characters"
        />
      </>
    );
  }

  return (
    <CharacterSurface
      characters={characters}
      labels={labels}
      showHanViet={showHanViet}
      detailAction={detailAction}
      variant={variant}
      anchorId={anchorId ?? (variant === "embedded" ? "characters" : "characters-rail")}
    />
  );
}

function CharacterSurface({
  characters,
  labels,
  showHanViet,
  detailAction,
  variant,
  anchorId,
}: {
  characters: VocabularyCharacterOccurrence[];
  labels: Labels;
  showHanViet: boolean;
  detailAction: DetailAction | null;
  variant: "rail" | "embedded";
  anchorId: string;
}) {
  const firstKey = occurrenceKey(characters[0]);
  const [selectedKey, setSelectedKey] = useState(firstKey);
  const selectedOccurrence =
    characters.find((occurrence) => occurrenceKey(occurrence) === selectedKey)
    ?? characters[0];
  const selectedOccurrenceKey = occurrenceKey(selectedOccurrence);
  const character = selectedOccurrence.character;
  const previewLabels = quickPreviewLabels(labels);
  const structureValue = learnerStructureValue(selectedOccurrence);
  const titleId = `${anchorId}-title`;

  return (
    <aside
      id={anchorId}
      className={`${styles.characterRail} ${variant === "embedded" ? styles.embedded : styles.desktopRail}`}
      aria-labelledby={titleId}
    >
      <div className={styles.characterRailInner}>
        <header className={styles.header}>
          <h2 id={titleId}>{previewLabels.title}</h2>
          <p className={styles.railSubtitle}>{previewLabels.subtitle}</p>
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
                aria-label={`${labels.characters}: ${occurrence.writtenForm} · ${occurrence.character.glyph}`}
                title={occurrence.writtenForm}
                onClick={() => setSelectedKey(key)}
              >
                <span className={styles.selectorGlyph}>{occurrence.character.glyph}</span>
              </button>
            );
          })}
        </div>

        <article className={styles.selectedCharacter} aria-live="polite">
          <div className={styles.writingLabel}>{previewLabels.writing}</div>
          <div className={styles.embeddedContent}>
            {character.writing ? (
              <CharacterWritingPreview
                key={`${selectedOccurrenceKey}:${character.writing.sourcePath}`}
                glyph={character.glyph}
                writing={character.writing}
                labels={{
                  replay: labels.writingReplay,
                  unavailable: labels.writingUnavailable,
                }}
              />
            ) : (
              <div className={styles.writingUnavailable}>
                <span className={styles.fallbackGlyph}>{character.glyph}</span>
                <p>{labels.writingUnavailable}</p>
              </div>
            )}

            <div className={styles.embeddedFactsColumn}>
              <div className={styles.characterFacts}>
                <div className={styles.characterFactLine}>
                  <span className={styles.bigChinese}>{character.glyph}</span>
                </div>

                {selectedOccurrence.lexicalContextPronunciation ? (
                  <div className={styles.characterFactLine}>
                    <span>{previewLabels.pinyin}: </span>
                    <strong>{selectedOccurrence.lexicalContextPronunciation}</strong>
                  </div>
                ) : null}

                {showHanViet && character.hanViet ? (
                  <div className={styles.characterFactLine}>
                    <span>{labels.hanViet}: </span>
                    <strong>{character.hanViet}</strong>
                  </div>
                ) : null}

                {structureValue ? (
                  <div className={styles.characterFactLine}>
                    <span>{previewLabels.structure}: </span>
                    <strong className={styles.structureValue}>{structureValue}</strong>
                  </div>
                ) : null}

                {character.radical ? (
                  <div className={styles.characterFactLine}>
                    <span>{labels.radical}: </span>
                    <strong className={styles.bigChinese}>{character.radical}</strong>
                  </div>
                ) : null}

                {character.strokeCount ? (
                  <div className={styles.characterFactLine}>
                    <span>{labels.strokes}: </span>
                    <strong>{character.strokeCount}</strong>
                  </div>
                ) : null}
              </div>

              {character.writing ? (
                <p className={styles.attribution}>
                  {labels.writingSource}: Hanzi Writer Data · {character.writing.licenseCode}
                </p>
              ) : null}

              {detailAction ? (
                <Link className={styles.detailAction} href={detailAction.href}>
                  {detailAction.label}
                </Link>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </aside>
  );
}
