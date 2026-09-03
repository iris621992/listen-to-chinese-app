"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

type MultipleChoiceCheckInput = {
  lessonSlug: string;
  publicationRevisionId?: string;
  exerciseId: string;
  selectedOptionId: string;
};

export type MultipleChoiceCheckOutcome =
  | { status: "CORRECT" }
  | { status: "INCORRECT" }
  | { status: "STALE_REVISION" }
  | { status: "UNAVAILABLE" };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MULTIPLE_CHOICE_CHECK_RPC = "grade_multiple_choice_current_revision_v1";

const validSlug = (value: string) => {
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 200 ? normalized : null;
};

const validUuid = (value: string | undefined) =>
  value && UUID_PATTERN.test(value) ? value : null;

export async function checkMultipleChoiceCurrentRevision(
  input: MultipleChoiceCheckInput,
): Promise<MultipleChoiceCheckOutcome> {
  const lessonSlug = validSlug(input.lessonSlug);
  const publicationRevisionId = validUuid(input.publicationRevisionId);
  const exerciseId = validUuid(input.exerciseId);
  const selectedOptionId = validUuid(input.selectedOptionId);

  if (!lessonSlug || !publicationRevisionId || !exerciseId || !selectedOptionId) {
    return { status: "UNAVAILABLE" };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.rpc(MULTIPLE_CHOICE_CHECK_RPC, {
      p_lesson_slug: lessonSlug,
      p_expected_revision_id: publicationRevisionId,
      p_exercise_id: exerciseId,
      p_selected_option_id: selectedOptionId,
    });

    if (error || !Array.isArray(data) || data.length !== 1) {
      return { status: "UNAVAILABLE" };
    }

    const row = data[0] as Record<string, unknown>;
    if (row.outcome_code === "STALE_REVISION") {
      return { status: "STALE_REVISION" };
    }
    if (row.outcome_code !== "GRADED" || typeof row.is_correct !== "boolean") {
      return { status: "UNAVAILABLE" };
    }

    return { status: row.is_correct ? "CORRECT" : "INCORRECT" };
  } catch {
    return { status: "UNAVAILABLE" };
  }
}
