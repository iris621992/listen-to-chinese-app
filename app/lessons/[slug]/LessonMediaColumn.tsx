import { IntentYouTubePlayer } from "./IntentYouTubePlayer";

type LessonMedia = {
  selectedDirection: "ltr" | "rtl";
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
}: {
  lesson: LessonMedia;
  labels: LessonMediaColumnLabels;
}) {
  if (lesson.youtubeVideoId) {
    return (
      <IntentYouTubePlayer
        buttonLabel={labels.openYouTubeLesson}
        direction={lesson.selectedDirection}
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
      >
        <span aria-hidden="true" className="intent-youtube-play">▶</span>
        <span className="intent-youtube-label" dir={lesson.selectedDirection}>
          {labels.openYouTubeLesson}
        </span>
      </a>
    );
  }

  return (
    <div className="intent-youtube-trigger" role="status">
      <span aria-hidden="true" className="intent-youtube-play">▶</span>
      <span className="intent-youtube-label" dir={lesson.selectedDirection}>
        {labels.youtubeVideoComingSoon}
      </span>
    </div>
  );
}

export function LessonMediaColumn({
  lesson,
  labels,
}: {
  lesson: LessonMedia;
  labels: LessonMediaColumnLabels;
}) {
  return (
    <div className="lesson-media-card" dir="ltr">
      <div className="lesson-media-surface">
        <YouTubeMedia lesson={lesson} labels={labels} />
      </div>
    </div>
  );
}
