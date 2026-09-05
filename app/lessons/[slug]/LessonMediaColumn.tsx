import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import type { SupabaseLessonContentType } from "@/lib/supabaseLesson";
import { IntentYouTubePlayer } from "./IntentYouTubePlayer";

type LessonMedia = {
  title: string;
  contentType?: SupabaseLessonContentType;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
};

type LessonMediaColumnLabels = {
  openYouTubeLesson: string;
  youtubeVideoComingSoon: string;
  listeningTitle: string;
  listeningBody: string;
  openListeningSource: string;
  listeningSourceUnavailable: string;
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

function listeningSourceUrl(lesson: LessonMedia) {
  if (lesson.youtubeUrl) return lesson.youtubeUrl;
  if (!lesson.youtubeVideoId) return null;
  return `https://www.youtube.com/watch?v=${encodeURIComponent(lesson.youtubeVideoId)}`;
}

function ListeningMedia({
  lesson,
  labels,
  interfaceDirection,
}: {
  lesson: LessonMedia;
  labels: LessonMediaColumnLabels;
  interfaceDirection: InterfaceTextDirection;
}) {
  const sourceUrl = listeningSourceUrl(lesson);

  return (
    <div
      className="lesson-listening-surface"
      dir={interfaceDirection}
    >
      <div className="lesson-listening-copy">
        <span aria-hidden="true" className="lesson-listening-icon">♪</span>
        <div>
          <strong>{labels.listeningTitle}</strong>
          <p>{labels.listeningBody}</p>
        </div>
      </div>

      {sourceUrl ? (
        <a
          className="lesson-listening-action"
          href={sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          {labels.openListeningSource}
        </a>
      ) : (
        <p className="lesson-listening-status" role="status">
          {labels.listeningSourceUnavailable}
        </p>
      )}
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
  const isListening = lesson.contentType === "listening";

  return (
    <div
      className={`lesson-media-card${isListening ? " lesson-media-card--listening" : ""}`}
      dir={interfaceDirection}
    >
      {isListening ? (
        <ListeningMedia
          lesson={lesson}
          labels={labels}
          interfaceDirection={interfaceDirection}
        />
      ) : (
        <div className="lesson-media-surface">
          <YouTubeMedia
            lesson={lesson}
            labels={labels}
            interfaceDirection={interfaceDirection}
          />
        </div>
      )}

      <style>{`
        .lesson-listening-surface {
          width: 100%;
          border: 1px solid var(--border-subtle);
          border-radius: 1.5rem;
          background: var(--surface-subtle);
          padding: 1.25rem;
          color: var(--text-primary);
          box-shadow: 0 14px 34px rgba(55, 52, 43, 0.07);
        }

        .lesson-listening-copy {
          display: flex;
          min-width: 0;
          align-items: flex-start;
          gap: 1rem;
        }

        .lesson-listening-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border-subtle);
          border-radius: 999px;
          background: var(--surface-raised);
          color: var(--interactive-primary);
          font-size: 1.25rem;
          font-weight: 800;
        }

        .lesson-listening-copy strong {
          display: block;
          color: var(--text-primary);
          font-size: 1.1rem;
        }

        .lesson-listening-copy p {
          max-width: 44rem;
          margin: 0.4rem 0 0;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        .lesson-listening-action {
          min-height: 44px;
          margin-top: 1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--interactive-primary);
          border-radius: 999px;
          background: var(--surface-raised);
          padding: 0.6rem 1rem;
          color: var(--interactive-primary);
          font-weight: 750;
        }

        .lesson-listening-action:hover {
          background: var(--surface-card);
        }

        .lesson-listening-status {
          margin: 1rem 0 0;
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        @media (max-width: 599px) {
          .lesson-listening-surface {
            padding: 1rem;
          }

          .lesson-listening-copy {
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
