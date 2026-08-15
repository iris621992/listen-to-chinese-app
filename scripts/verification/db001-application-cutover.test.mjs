import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { parsePreSubmitExerciseRpcData } from "../../lib/preSubmitExercises.ts";

const option = () => ({ option_id: "option-1", text: "你好" });
const media = (url = "https://cdn.example.com/audio/one.mp3") => ({
  media_id: "media-1",
  media_type: "audio",
  url,
});
const exercise = (overrides = {}) => ({
  exercise_id: "exercise-1",
  exercise_type: "multiple_choice",
  prompt: "Choose the correct answer.",
  media: [],
  options: [option()],
  locale_code: "en",
  ...overrides,
});
const payload = (overrides = {}) => ([{
  outcome_code: "FOUND",
  requested_locale_code: "en",
  exercises: [exercise()],
  ...overrides,
}]);

const APPLICATION_SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const PROTECTED_TABLES = [
  "exercises",
  "exercise_options",
  "exercise_translations",
  "exercise_option_translations",
  "exercise_media",
];

async function listApplicationSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listApplicationSourceFiles(entryPath);
    return entry.isFile() && APPLICATION_SOURCE_EXTENSIONS.has(path.extname(entry.name))
      ? [entryPath]
      : [];
  }));
  return nested.flat();
}

test("accepts the exact answer-free RPC contract", () => {
  const parsed = parsePreSubmitExerciseRpcData(payload(), "en");
  assert.equal(parsed?.outcomeCode, "FOUND");
  assert.equal(parsed?.exercises[0]?.question, "Choose the correct answer.");
});

test("rejects wrapper, exercise, and option answer fields", () => {
  assert.equal(parsePreSubmitExerciseRpcData(payload({ answer: "A" }), "en"), null);
  assert.equal(parsePreSubmitExerciseRpcData(payload({ exercises: [exercise({ is_correct: true })] }), "en"), null);
  assert.equal(parsePreSubmitExerciseRpcData(payload({ exercises: [exercise({ options: [{ ...option(), is_correct: true }] })] }), "en"), null);
});

test("requires HTTPS media with the exact schema", () => {
  for (const url of ["http://cdn.example.com/file.mp3", "not a url", "https://user:password@cdn.example.com/file.mp3"]) {
    assert.equal(parsePreSubmitExerciseRpcData(payload({ exercises: [exercise({ media: [media(url)] })] }), "en"), null);
  }
  assert.equal(parsePreSubmitExerciseRpcData(payload({ exercises: [exercise({ media: [{ ...media(), storage_path: "private/raw-answer" }] })] }), "en"), null);
});

test("requires every non-FOUND outcome to carry an empty list", () => {
  const valid = [{ outcome_code: "NOT_FOUND", requested_locale_code: "en", exercises: [] }];
  assert.deepEqual(parsePreSubmitExerciseRpcData(valid, "en"), { outcomeCode: "NOT_FOUND", requestedLocaleCode: "en", exercises: [] });
  assert.equal(parsePreSubmitExerciseRpcData([{ ...valid[0], exercises: [exercise()] }], "en"), null);
});

test("allows whole-item English fallback but rejects unrelated item locales", () => {
  const fallback = payload({ requested_locale_code: "vi", exercises: [exercise({ locale_code: "en" })] });
  assert.equal(parsePreSubmitExerciseRpcData(fallback, "vi")?.exercises[0]?.localeCode, "en");
  const unrelated = payload({ requested_locale_code: "vi", exercises: [exercise({ locale_code: "ar" })] });
  assert.equal(parsePreSubmitExerciseRpcData(unrelated, "vi"), null);
});

test("all application source avoids direct protected-table reads", async () => {
  const sourceFiles = (
    await Promise.all(["app", "lib"].map(listApplicationSourceFiles))
  ).flat();

  for (const file of sourceFiles) {
    const source = await readFile(file, "utf8");
    for (const table of PROTECTED_TABLES) {
      const directRead = new RegExp(
        "\\.from\\s*\\(\\s*[\\\"']" + table + "[\\\"']\\s*\\)",
      );
      assert.doesNotMatch(source, directRead, `${file} directly reads protected table ${table}`);
    }
  }
});

test("learner and dev routes cannot reach answer-bearing fallbacks", async () => {
  const lessonSource = await readFile("lib/supabaseLesson.ts", "utf8");
  const practiceSource = await readFile("app/lessons/[slug]/PracticeTabContent.tsx", "utf8");
  const pageSource = await readFile("app/lessons/[slug]/page.tsx", "utf8");
  const devSource = await readFile("app/dev/multilingual-lesson/page.tsx", "utf8");

  assert.match(lessonSource, /\.from\("exercise_targets"\).*exerciseIds/s);
  assert.doesNotMatch(practiceSource, /isCorrect|correctAnswer|explanation|hint/i);
  assert.doesNotMatch(pageSource, /StaticLessonPage|getLesson|@\/lib\/lessons/);
  assert.match(pageSource, /status === "NOT_FOUND"\s*\|\|\s*supabaseResult\.status === "INVALID_INPUT"/);
  assert.doesNotMatch(pageSource, /status === "UNCONFIGURED"[\s\S]{0,300}notFound/);
  assert.match(devSource, /notFound\(\)/);
  assert.doesNotMatch(devSource, /createServerSupabaseClient|NEXT_PUBLIC_SUPABASE|searchParams|\.from\s*\(/);
});
