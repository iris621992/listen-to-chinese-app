"use client";

import { useState } from "react";
import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import type { SupabaseLessonDetail } from "@/lib/supabaseLesson";
import {
  checkMultipleChoiceCurrentRevision,
  type MultipleChoiceCheckOutcome,
} from "./practiceActions";

type PracticeTabLabels = {
  exercise: string;
  noOptions: string;
  noExercises: string;
  exercisesUnavailable: string;
  openExerciseMedia: string;
  checkAnswer: string;
  checkingAnswer: string;
  answerCorrect: string;
  answerIncorrect: string;
  lessonUpdatedReload: string;
  answerCheckUnavailable: string;
};

type CheckStatus = MultipleChoiceCheckOutcome["status"];
type CheckState = {
  selectedOptionId: string;
  status: CheckStatus;
};

export function PracticeTabContent({
  lesson,
  labels,
  interfaceDirection,
  interfaceTextAlign,
}: {
  lesson: SupabaseLessonDetail;
  labels: PracticeTabLabels;
  interfaceDirection: InterfaceTextDirection;
  interfaceTextAlign: string;
}) {
  const [selectedOptionByExercise, setSelectedOptionByExercise] = useState<Record<string, string>>({});
  const [checkStateByExercise, setCheckStateByExercise] = useState<Record<string, CheckState>>({});
  const [checkingByExercise, setCheckingByExercise] = useState<Record<string, boolean>>({});

  const clearCheckState = (exerciseId: string) => {
    setCheckStateByExercise((current) => {
      if (!(exerciseId in current)) return current;
      const next = { ...current };
      delete next[exerciseId];
      return next;
    });
  };

  const checkMultipleChoice = async (exerciseId: string) => {
    const selectedOptionId = selectedOptionByExercise[exerciseId];
    if (!selectedOptionId || checkingByExercise[exerciseId]) return;

    setCheckingByExercise((current) => ({ ...current, [exerciseId]: true }));
    clearCheckState(exerciseId);
    try {
      const result = await checkMultipleChoiceCurrentRevision({
        lessonSlug: lesson.slug,
        publicationRevisionId: lesson.publicationRevisionId,
        exerciseId,
        selectedOptionId,
      });
      setCheckStateByExercise((current) => ({
        ...current,
        [exerciseId]: { selectedOptionId, status: result.status },
      }));
    } finally {
      setCheckingByExercise((current) => ({ ...current, [exerciseId]: false }));
    }
  };

  if (lesson.exerciseOutcomeCode !== "FOUND") {
    const message = lesson.exerciseOutcomeCode === "EMPTY_EXERCISE_LIST"
      ? labels.noExercises
      : labels.exercisesUnavailable;

    return (
      <p
        className={`rounded-3xl bg-cream p-5 text-sm text-stone-600 ${interfaceTextAlign}`}
        dir={interfaceDirection}
      >
        {message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {lesson.exercises.map((exercise, index) => {
        const exerciseDirection = exercise.localeCode === "ar" ? "rtl" : "ltr";
        const exerciseTextAlign = exerciseDirection === "rtl"
          ? "text-right"
          : "text-left";
        const isMultipleChoice = exercise.type === "multiple_choice";
        const selectedOptionId = selectedOptionByExercise[exercise.id] ?? null;
        const storedCheckState = checkStateByExercise[exercise.id] ?? null;
        const checkState = storedCheckState?.selectedOptionId === selectedOptionId
          ? storedCheckState.status
          : null;
        const isChecking = checkingByExercise[exercise.id] ?? false;

        return (
          <article
            key={exercise.id}
            className={`rounded-3xl border border-stone-200 bg-white p-4 ${exerciseTextAlign}`}
            dir={exerciseDirection}
          >
            <p
              className={`text-xs font-bold uppercase tracking-[0.2em] text-stone-500 ${interfaceTextAlign}`}
              dir={interfaceDirection}
            >
              {labels.exercise} {index + 1}
            </p>
            <h3 className="mt-3 text-lg font-bold">{exercise.question}</h3>
            <ul className="mt-4 space-y-2">
              {exercise.options.length > 0 ? exercise.options.map((option) => {
                if (!isMultipleChoice) {
                  return (
                    <li className="rounded-2xl bg-cream p-3 text-sm" key={option.id}>
                      {option.text}
                    </li>
                  );
                }

                const isSelected = selectedOptionId === option.id;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedOptionByExercise((current) => ({
                          ...current,
                          [exercise.id]: option.id,
                        }));
                        clearCheckState(exercise.id);
                      }}
                      className={`w-full rounded-2xl border p-3 text-sm font-medium transition ${
                        isSelected
                          ? "border-cinnabar bg-orange-50 text-cinnabar shadow-sm"
                          : "border-orange-100 bg-cream text-stone-700 hover:border-orange-300 hover:bg-orange-50"
                      } ${exerciseTextAlign}`}
                    >
                      {option.text}
                    </button>
                  </li>
                );
              }) : (
                <li
                  className={`rounded-2xl bg-cream p-3 text-sm ${interfaceTextAlign}`}
                  dir={interfaceDirection}
                >
                  {labels.noOptions}
                </li>
              )}
            </ul>

            {isMultipleChoice ? (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  disabled={selectedOptionId === null || isChecking}
                  onClick={() => void checkMultipleChoice(exercise.id)}
                  className="rounded-full bg-cinnabar px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isChecking ? labels.checkingAnswer : labels.checkAnswer}
                </button>
                {checkState ? (
                  <p
                    role="status"
                    className={`rounded-2xl px-3 py-2 text-sm font-medium ${
                      checkState === "CORRECT"
                        ? "bg-emerald-50 text-emerald-800"
                        : checkState === "INCORRECT"
                          ? "bg-orange-50 text-stone-700"
                          : "bg-cream text-stone-600"
                    }`}
                    dir={interfaceDirection}
                  >
                    {checkState === "CORRECT"
                      ? labels.answerCorrect
                      : checkState === "INCORRECT"
                        ? labels.answerIncorrect
                        : checkState === "STALE_REVISION"
                          ? labels.lessonUpdatedReload
                          : labels.answerCheckUnavailable}
                  </p>
                ) : null}
              </div>
            ) : null}

            {exercise.media.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm">
                {exercise.media.map((media, mediaIndex) => (
                  <li
                    key={media.id}
                    className={interfaceTextAlign}
                    dir={interfaceDirection}
                  >
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
