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
    source: string;
  };
};

const LOCKED_REPOSITORY = "chanind/hanzi-writer-data";
const LOCKED_COMMIT = "68d10a4b21150cae5e1ebbd223eed289cf32d90c";
const AUTOPLAY_DELAY_MS = 420;
const STROKE_ANIMATION_SPEED = 0.55;
const DELAY_BETWEEN_STROKES_MS = 260;

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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    syncPreference();
    mediaQuery.addEventListener?.("change", syncPreference);
    return () => mediaQuery.removeEventListener?.("change", syncPreference);
  }, []);

  useEffect(() => {
    if (failed || !sourceUrl || !targetRef.current || prefersReducedMotion === null) return;

    const target = targetRef.current;
    let active = true;
    let lastSize = 0;

    const clearAutoplayTimer = () => {
      if (autoplayTimerRef.current !== null) {
        clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };

    const renderWriter = () => {
      if (!active) return;
      const measured = Math.floor(target.getBoundingClientRect().width);
      if (measured < 1 || measured === lastSize) return;
      lastSize = measured;
      clearAutoplayTimer();
      target.replaceChildren();
      writerRef.current = null;
      setLoading(true);

      let writer: ReturnType<typeof HanziWriter.create> | null = null;
      writer = HanziWriter.create(target, glyph, {
        width: measured,
        height: measured,
        padding: Math.max(10, Math.round(measured * 0.07)),
        showOutline: true,
        showCharacter: prefersReducedMotion,
        strokeColor: "#30352f",
        outlineColor: "#ddd5c8",
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
          if (!prefersReducedMotion) {
            clearAutoplayTimer();
            autoplayTimerRef.current = setTimeout(() => {
              if (!active || !writerRef.current) return;
              void writerRef.current.animateCharacter();
              autoplayTimerRef.current = null;
            }, AUTOPLAY_DELAY_MS);
          }
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
  }, [failed, glyph, prefersReducedMotion, reloadNonce, sourceUrl]);

  if (!sourceUrl) return null;

  const replay = () => {
    if (prefersReducedMotion) return;

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

        {prefersReducedMotion === false && !loading ? (
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

      <p className={styles.attribution}>
        {labels.source}: Hanzi Writer Data · {writing.licenseCode}
      </p>
    </div>
  );
}
