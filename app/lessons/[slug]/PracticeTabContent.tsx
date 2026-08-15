import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";

type PracticeTabLabels = {
  exercise: string;
  noOptions: string;
  noExercises: string;
  exercisesUnavailable: string;
  openExerciseMedia: string;
};

export function PracticeTabContent({
  lesson,
  labels,
  localizedTextAlign,
}: {
  lesson: SupabaseLessonDetail;
  labels: PracticeTabLabels;
  localizedTextAlign: string;
}) {
  if (lesson.exerciseOutcomeCode !== "FOUND") {
    const message = lesson.exerciseOutcomeCode === "EMPTY_EXERCISE_LIST"
      ? labels.noExercises
      : labels.exercisesUnavailable;

    return (
      <p
        className={`rounded-3xl bg-cream p-5 text-sm text-stone-600 ${localizedTextAlign}`}
        dir={lesson.selectedDirection}
      >
        {message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {lesson.exercises.map((exercise, index) => {
        const direction = exercise.localeCode === "ar" ? "rtl" : "ltr";
        const textAlign = direction === "rtl" ? "text-right" : "text-left";

        return (
          <article
            key={exercise.id}
            className={`rounded-3xl border border-stone-200 bg-white p-4 ${textAlign}`}
            dir={direction}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
              {labels.exercise} {index + 1}
            </p>
            <h3 className="mt-3 text-lg font-bold">{exercise.question}</h3>
            <ul className="mt-4 space-y-2">
              {exercise.options.length > 0 ? exercise.options.map((option) => (
                <li className="rounded-2xl bg-cream p-3 text-sm" key={option.id}>
                  {option.text}
                </li>
              )) : (
                <li className="rounded-2xl bg-cream p-3 text-sm">{labels.noOptions}</li>
              )}
            </ul>
            {exercise.media.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm">
                {exercise.media.map((media, mediaIndex) => (
                  <li key={media.id}>
                    <a
                      className="font-semibold text-cinnabar underline decoration-orange-200 underline-offset-4"
                      href={media.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {labels.openExerciseMedia} {mediaIndex + 1} · {media.type}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
