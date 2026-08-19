import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import { IntentYouTubePlayer } from "./IntentYouTubePlayer";

type LessonMedia = {
  title: string;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
};

type LessonMediaColumnLabels = {
  openYouTubeLesson: string;
  youtubeVideoComingSoon: string;
};

function YouTubeMedia({
  lesson,
  labels,
  interfaceDirection,
}: {
  lesson: LessonMedia;
  labels: LessonMediaColumnLabels;
  interfaceDirection: InterfaceTextDirection;
}) {
  if (lesson.youtubeVideoId) {
    return (
      <IntentYouTubePlayer
        buttonLabel={labels.openYouTubeLesson}
        direction={interfaceDirection}
        title={lesson.title}
        videoId={lesson.youtubeVideoId}
      />
    );
  }

  if (lesson.youtubeUrl) {
    return (
      <a
        className="intent-youtube-trigger"
        href={lesson.youtubeUrl}
        rel="noreferrer"
        target="_blank"
        dir={interfaceDirection}
      >
        <span aria-hidden="true" className="intent-youtube-play">▶</span>
        <span className="intent-youtube-label">
          {labels.openYouTubeLesson}
        </span>
      </a>
    );
  }

  return (
    <div
      className="intent-youtube-trigger"
      role="status"
      dir={interfaceDirection}
    >
      <span aria-hidden="true" className="intent-youtube-play">▶</span>
      <span className="intent-youtube-label">
        {labels.youtubeVideoComingSoon}
      </span>
    </div>
  );
}

export function LessonMediaColumn({
  lesson,
  labels,
  interfaceDirection,
}: {
  lesson: LessonMedia;
  labels: LessonMediaColumnLabels;
  interfaceDirection: InterfaceTextDirection;
}) {
  return (
    <div className="lesson-media-card" dir={interfaceDirection}>
      <div className="lesson-media-surface">
        <YouTubeMedia
          lesson={lesson}
          labels={labels}
          interfaceDirection={interfaceDirection}
        />
      </div>
    </div>
  );
}
