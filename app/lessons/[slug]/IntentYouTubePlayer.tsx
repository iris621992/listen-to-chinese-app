"use client";

import { useState } from "react";

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

type IntentYouTubePlayerProps = {
  buttonLabel: string;
  direction: "ltr" | "rtl";
  title: string;
  videoId: string;
};

export function IntentYouTubePlayer({
  buttonLabel,
  direction,
  title,
  videoId,
}: IntentYouTubePlayerProps) {
  const [activated, setActivated] = useState(false);
  const validVideoId = YOUTUBE_VIDEO_ID.test(videoId);

  if (activated && validVideoId) {
    return (
      <iframe
        className="intent-youtube-frame"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <button
      aria-label={buttonLabel}
      className="intent-youtube-trigger"
      data-media-intent="youtube"
      dir={direction}
      disabled={!validVideoId}
      onClick={() => setActivated(true)}
      type="button"
    >
      <span aria-hidden="true" className="intent-youtube-play">▶</span>
      <span className="intent-youtube-label">{buttonLabel}</span>
    </button>
  );
}
