"use client";

import { useEffect, useMemo, useState } from "react";
import type { VocabularyCharacterWriting } from "@/lib/vocabularyCharacterDelivery";
import styles from "./CharacterWritingPreview.module.css";

type HanziWriterData = { strokes?: unknown };

type Props = {
  glyph: string;
  writing: VocabularyCharacterWriting;
  labels: {
    open: string;
    replay: string;
    unavailable: string;
    source: string;
  };
};

const LOCKED_REPOSITORY = "chanind/hanzi-writer-data";
const LOCKED_COMMIT = "68d10a4b21150cae5e1ebbd223eed289cf32d90c";
const STROKE_STEP_MS = 460;

function writingDataUrl(glyph: string, writing: VocabularyCharacterWriting) {
  if (
    writing.sourceRepository !== LOCKED_REPOSITORY
    || writing.sourceCommit !== LOCKED_COMMIT
    || writing.sourcePath !== `data/${glyph}.json`
  ) {
    return null;
  }
  return `https://raw.githubusercontent.com/${LOCKED_REPOSITORY}/${LOCKED_COMMIT}/data/${encodeURIComponent(glyph)}.json`;
}

export default function CharacterWritingPreview({ glyph, writing, labels }: Props) {
  const sourceUrl = useMemo(() => writingDataUrl(glyph, writing), [glyph, writing]);
  const [opened, setOpened] = useState(false);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [visibleStrokeCount, setVisibleStrokeCount] = useState(0);
  const [playNonce, setPlayNonce] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!opened || strokes.length > 0 || failed || !sourceUrl) return;
    let cancelled = false;
    fetch(sourceUrl)
      .then((response) => {
        if (!response.ok) throw new Error("writing-data-unavailable");
        return response.json() as Promise<HanziWriterData>;
      })
      .then((payload) => {
        if (cancelled || !Array.isArray(payload.strokes)) return;
        const parsed = payload.strokes.filter(
          (stroke): stroke is string => typeof stroke === "string" && stroke.length > 0,
        );
        if (parsed.length === 0) throw new Error("writing-data-empty");
        setVisibleStrokeCount(0);
        setStrokes(parsed);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => { cancelled = true; };
  }, [failed, opened, sourceUrl, strokes.length]);

  useEffect(() => {
    if (!opened || strokes.length === 0) return;

    setVisibleStrokeCount(0);
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setVisibleStrokeCount(Math.min(count, strokes.length));
      if (count >= strokes.length) window.clearInterval(timer);
    }, STROKE_STEP_MS);

    return () => window.clearInterval(timer);
  }, [opened, playNonce, strokes]);

  if (!sourceUrl) return null;

  const openWriting = () => {
    setFailed(false);
    setOpened(true);
    if (strokes.length > 0) {
      setVisibleStrokeCount(0);
      setPlayNonce((value) => value + 1);
    }
  };

  const replay = () => {
    setVisibleStrokeCount(0);
    setPlayNonce((value) => value + 1);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.writingPad} aria-live="polite">
        {!opened ? (
          <span className={styles.staticGlyph} aria-hidden="true">{glyph}</span>
        ) : failed ? (
          <p className={styles.unavailable}>{labels.unavailable}</p>
        ) : strokes.length > 0 ? (
          <svg
            className={styles.canvas}
            viewBox="0 0 1024 1024"
            role="img"
            aria-label={`${labels.open}: ${glyph}`}
          >
            <g transform="translate(0 900) scale(1 -1)">
              {strokes.map((stroke, index) => (
                <path
                  key={`${glyph}-${index}`}
                  d={stroke}
                  className={index < visibleStrokeCount ? styles.visibleStroke : styles.hiddenStroke}
                />
              ))}
            </g>
          </svg>
        ) : (
          <span className={styles.loading} aria-hidden="true">…</span>
        )}
      </div>

      <div className={styles.controls}>
        {!opened || failed ? (
          <button type="button" className={styles.trigger} onClick={openWriting}>
            {labels.open}
          </button>
        ) : strokes.length > 0 ? (
          <button type="button" className={styles.replay} onClick={replay}>
            {labels.replay}
          </button>
        ) : null}
      </div>

      {opened ? (
        <p className={styles.attribution}>
          {labels.source}: Hanzi Writer Data · {writing.licenseCode}
        </p>
      ) : null}
    </div>
  );
}
