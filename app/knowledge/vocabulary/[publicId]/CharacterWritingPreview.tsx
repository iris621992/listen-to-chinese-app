"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import type { VocabularyCharacterWriting } from "@/lib/vocabularyCharacterDelivery";
import styles from "./CharacterWritingPreview.module.css";

type Props = {
  glyph: string;
  writing: VocabularyCharacterWriting;
  labels: {
    replay: string;
    unavailable: string;
  };
};

const LOCKED_REPOSITORY = "chanind/hanzi-writer-data";
const LOCKED_COMMIT = "68d10a4b21150cae5e1ebbd223eed289cf32d90c";
const AUTOPLAY_DELAY_MS = 420;
const STROKE_ANIMATION_SPEED = 0.55;
const DELAY_BETWEEN_STROKES_MS = 260;
// The demo's 104px static glyph occupies materially more visual ink than a 104px Hanzi Writer
// viewport because the source stroke geometry has its own internal whitespace. 16% padding keeps
// the real stroke drawing close to that approved visual footprint without changing the 176px pad.
const GLYPH_PADDING_RATIO = 0.16;
// Stroke-order playback is essential learning content, not decorative motion.
// Keep the full character hidden before playback even when the OS asks to reduce motion.
const prefersReducedMotion = false;

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
  const targetRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<ReturnType<typeof HanziWriter.create> | null>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (failed || !sourceUrl || !targetRef.current) return;

    const target = targetRef.current;
    let active = true;
    let lastDimensions = "";

    const clearAutoplayTimer = () => {
      if (autoplayTimerRef.current !== null) {
        clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };

    const renderWriter = () => {
      if (!active) return;
      const bounds = target.getBoundingClientRect();
      const width = Math.floor(bounds.width);
      const height = Math.floor(bounds.height);
      const dimensions = `${width}:${height}`;
      if (width < 1 || height < 1 || dimensions === lastDimensions) return;
      lastDimensions = dimensions;
      clearAutoplayTimer();
      target.replaceChildren();
      writerRef.current = null;
      setLoading(true);

      const shortEdge = Math.min(width, height);
      let writer: ReturnType<typeof HanziWriter.create> | null = null;
      writer = HanziWriter.create(target, glyph, {
        width,
        height,
        padding: Math.round(shortEdge * GLYPH_PADDING_RATIO),
        showOutline: true,
        showCharacter: prefersReducedMotion,
        strokeColor: "#2f4b3a",
        outlineColor: "#d9ded7",
        strokeAnimationSpeed: STROKE_ANIMATION_SPEED,
        delayBetweenStrokes: DELAY_BETWEEN_STROKES_MS,
        renderer: "svg",
        charDataLoader: (character, onLoad, onError) => {
          if (character !== glyph) {
            onError(new Error("writing-character-mismatch"));
            return;
          }

          fetch(sourceUrl, { cache: "force-cache" })
            .then((response) => {
              if (!response.ok) throw new Error("writing-data-unavailable");
              return response.json();
            })
            .then((payload) => {
              if (
                !payload
                || typeof payload !== "object"
                || !Array.isArray(payload.strokes)
                || !Array.isArray(payload.medians)
                || payload.strokes.length === 0
                || payload.medians.length !== payload.strokes.length
              ) {
                throw new Error("writing-data-invalid");
              }
              if (active) onLoad(payload);
            })
            .catch((error) => {
              if (active) onError(error);
            });
        },
        onLoadCharDataSuccess: () => {
          if (!active) return;
          writerRef.current = writer;
          setLoading(false);
          clearAutoplayTimer();
          autoplayTimerRef.current = setTimeout(() => {
            if (!active) return;
            void writer?.animateCharacter();
            autoplayTimerRef.current = null;
          }, AUTOPLAY_DELAY_MS);
        },
        onLoadCharDataError: () => {
          if (!active) return;
          clearAutoplayTimer();
          writerRef.current = null;
          setLoading(false);
          setFailed(true);
        },
      });
    };

    renderWriter();
    const resizeObserver = new ResizeObserver(renderWriter);
    resizeObserver.observe(target);

    return () => {
      active = false;
      clearAutoplayTimer();
      resizeObserver.disconnect();
      writerRef.current = null;
      target.replaceChildren();
    };
  }, [failed, glyph, reloadNonce, sourceUrl]);

  if (!sourceUrl) return null;

  const replay = () => {
    if (autoplayTimerRef.current !== null) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }

    if (failed || !writerRef.current) {
      setFailed(false);
      setReloadNonce((value) => value + 1);
      return;
    }

    void writerRef.current.animateCharacter();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.writingPad} aria-busy={loading}>
        {failed ? (
          <p className={styles.unavailable}>{labels.unavailable}</p>
        ) : (
          <>
            <div ref={targetRef} className={styles.writerTarget} aria-hidden="true" />
            {loading ? <span className={styles.loading} aria-hidden="true">…</span> : null}
          </>
        )}

        {!loading ? (
          <button
            type="button"
            className={styles.replayIcon}
            onClick={replay}
            aria-label={labels.replay}
            title={labels.replay}
          >
            <span aria-hidden="true">↻</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
