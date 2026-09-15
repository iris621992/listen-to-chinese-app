"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import type { VocabularyCharacterWriting } from "@/lib/vocabularyCharacterDelivery";
import styles from "./CharacterWritingPreview.module.css";

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
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [replayNonce, setReplayNonce] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    syncPreference();
    mediaQuery.addEventListener?.("change", syncPreference);
    return () => mediaQuery.removeEventListener?.("change", syncPreference);
  }, []);

  useEffect(() => {
    if (!opened || failed || !sourceUrl || !targetRef.current) return;

    const target = targetRef.current;
    let active = true;
    let lastSize = 0;

    const renderWriter = () => {
      if (!active) return;
      const measured = Math.floor(target.getBoundingClientRect().width);
      if (measured < 1 || measured === lastSize) return;
      lastSize = measured;
      target.replaceChildren();
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
        strokeAnimationSpeed: 1.15,
        delayBetweenStrokes: 140,
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
          setLoading(false);
          if (!prefersReducedMotion) {
            void writer?.animateCharacter();
          }
        },
        onLoadCharDataError: () => {
          if (!active) return;
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
      resizeObserver.disconnect();
      target.replaceChildren();
    };
  }, [failed, glyph, opened, prefersReducedMotion, replayNonce, sourceUrl]);

  if (!sourceUrl) return null;

  const openWriting = () => {
    setFailed(false);
    setOpened(true);
    setReplayNonce((value) => value + 1);
  };

  const replay = () => {
    setFailed(false);
    setReplayNonce((value) => value + 1);
  };

  return (
    <div className={styles.wrap}>
      <div
        className={styles.writingPad}
        role="img"
        aria-label={`${labels.open}: ${glyph}`}
        aria-busy={opened && loading}
      >
        {!opened ? (
          <span className={styles.staticGlyph} aria-hidden="true">{glyph}</span>
        ) : failed ? (
          <p className={styles.unavailable}>{labels.unavailable}</p>
        ) : (
          <>
            <div ref={targetRef} className={styles.writerTarget} aria-hidden="true" />
            {loading ? <span className={styles.loading} aria-hidden="true">…</span> : null}
          </>
        )}
      </div>

      <div className={styles.controls}>
        {!opened || failed ? (
          <button type="button" className={styles.trigger} onClick={openWriting}>
            {labels.open}
          </button>
        ) : !prefersReducedMotion && !loading ? (
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
