import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { createMeasurementRecorder } from "../dfp/mspec-1/measurements.mjs";

const lessonSource = await readFile("lib/supabaseLesson.ts", "utf8");
const pageSource = await readFile("app/lessons/[slug]/page.tsx", "utf8");

async function loadActualFlowExports() {
  const compiled = ts.transpileModule(lessonSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const context = vm.createContext({
    URL,
    process: { env: {} },
    console,
  });
  const flowModule = new vm.SourceTextModule(compiled, { context });
  await flowModule.link(async (specifier) => {
    if (specifier === "@/lib/preSubmitExercises") {
      return new vm.SyntheticModule(
        ["loadPreSubmitExercises"],
        function initialize() {
          this.setExport("loadPreSubmitExercises", () => {
            throw new Error("Production dependency must be injected by the gate.");
          });
        },
        { context },
      );
    }
    if (specifier === "@/lib/learnerLocaleRegistry") {
      return new vm.SyntheticModule(
        [
          "enabledLearnerLocaleCodes",
          "getLearnerLocale",
          "resolveLearnerLocale",
        ],
        function initialize() {
          this.setExport("enabledLearnerLocaleCodes", ["en", "vi", "ar"]);
          this.setExport("getLearnerLocale", () => null);
          this.setExport("resolveLearnerLocale", () => ({
            resolvedCode: "en",
            direction: "ltr",
          }));
        },
        { context },
      );
    }
    throw new Error(`Unexpected production import: ${specifier}`);
  });
  await flowModule.evaluate();
  return flowModule.namespace;
}

const actual = await loadActualFlowExports();
const foundExerciseResult = {
  outcomeCode: "FOUND",
  requestedLocaleCode: "en",
  exercises: [{
    id: "exercise-1",
    type: "multiple_choice",
    question: "Question",
    localeCode: "en",
    options: [],
    media: [],
  }],
};
const emptyExerciseResult = {
  outcomeCode: "EMPTY_EXERCISE_LIST",
  requestedLocaleCode: "en",
  exercises: [],
};

function measuredOperation(recorder, result) {
  recorder.recordOperation({
    durationMs: 1,
    outcome: result.error ? "ERROR" : "FOUND",
  });
  return Promise.resolve(result);
}

test("actual detail-core flow stays at 4 operations and 3 rounds", async () => {
  const recorder = createMeasurementRecorder();
  const result = await actual.runDfp2DetailCoreFlow({
    loadLanguages: () =>
      measuredOperation(recorder, { data: [{ code: "en" }], error: null }),
    loadLesson: () =>
      measuredOperation(recorder, { data: { id: "lesson-1" }, error: null }),
    loadSegments: () =>
      measuredOperation(recorder, { data: [{ id: "segment-1" }], error: null }),
    loadSegmentTranslations: () =>
      measuredOperation(recorder, {
        data: [{ segment_id: "segment-1", language_code: "en" }],
        error: null,
      }),
    resolveSelectedCode: () => "en",
  }, { beginRound: () => recorder.beginRound() });
  const measurement = recorder.snapshot();
  assert.equal(result.segmentOverflow, false);
  assert.equal(measurement.dataStoreOperations, 4);
  assert.equal(measurement.dataStoreDependentRounds, 3);
});

test("actual detail-core flow fails closed before dependent work", async () => {
  for (const scenario of [
    { lesson: { data: null, error: null }, operations: 2, rounds: 1 },
    {
      lesson: { data: null, error: { message: "database" } },
      operations: 2,
      rounds: 1,
    },
  ]) {
    const recorder = createMeasurementRecorder();
    let dependentCalls = 0;
    await actual.runDfp2DetailCoreFlow({
      loadLanguages: () =>
        measuredOperation(recorder, { data: [{ code: "en" }], error: null }),
      loadLesson: () => measuredOperation(recorder, scenario.lesson),
      loadSegments: () => {
        dependentCalls += 1;
        return measuredOperation(recorder, { data: [], error: null });
      },
      loadSegmentTranslations: () => {
        dependentCalls += 1;
        return measuredOperation(recorder, { data: [], error: null });
      },
      resolveSelectedCode: () => "en",
    }, { beginRound: () => recorder.beginRound() });
    assert.equal(dependentCalls, 0);
    assert.equal(recorder.snapshot().dataStoreOperations, scenario.operations);
    assert.equal(
      recorder.snapshot().dataStoreDependentRounds,
      scenario.rounds,
    );
  }
});

test("actual detail-core empty-ID outcome skips translation round", async () => {
  const recorder = createMeasurementRecorder();
  let translationCalls = 0;
  await actual.runDfp2DetailCoreFlow({
    loadLanguages: () =>
      measuredOperation(recorder, { data: [{ code: "en" }], error: null }),
    loadLesson: () =>
      measuredOperation(recorder, { data: { id: "lesson-1" }, error: null }),
    loadSegments: () =>
      measuredOperation(recorder, { data: [], error: null }),
    loadSegmentTranslations: () => {
      translationCalls += 1;
      return measuredOperation(recorder, { data: [], error: null });
    },
    resolveSelectedCode: () => "en",
  }, { beginRound: () => recorder.beginRound() });
  assert.equal(translationCalls, 0);
  assert.equal(recorder.snapshot().dataStoreOperations, 3);
  assert.equal(recorder.snapshot().dataStoreDependentRounds, 2);
});

test("actual vocabulary flow stays at 2 operations and 2 rounds", async () => {
  const recorder = createMeasurementRecorder();
  const result = await actual.runDfp2VocabularyFlow({
    loadExercises: () => measuredOperation(recorder, foundExerciseResult),
    loadTargets: () =>
      measuredOperation(recorder, {
        data: [{ exercise_id: "exercise-1" }],
        error: null,
      }),
  }, { beginRound: () => recorder.beginRound() });
  assert.equal(result.targetsResult.data.length, 1);
  assert.equal(recorder.snapshot().dataStoreOperations, 2);
  assert.equal(recorder.snapshot().dataStoreDependentRounds, 2);
});

test("actual vocabulary empty, invalid, error, and empty-ID outcomes stop after RPC", async () => {
  for (const exerciseResult of [
    emptyExerciseResult,
    {
      outcomeCode: "INVALID_INPUT",
      requestedLocaleCode: "en",
      exercises: [],
    },
    {
      outcomeCode: "DATABASE_ERROR",
      requestedLocaleCode: "en",
      exercises: [],
    },
    { ...foundExerciseResult, exercises: [] },
  ]) {
    const recorder = createMeasurementRecorder();
    let targetCalls = 0;
    const result = await actual.runDfp2VocabularyFlow({
      loadExercises: () => measuredOperation(recorder, exerciseResult),
      loadTargets: () => {
        targetCalls += 1;
        return measuredOperation(recorder, { data: [], error: null });
      },
    }, { beginRound: () => recorder.beginRound() });
    assert.equal(result.emptyExerciseIds, true);
    assert.equal(targetCalls, 0);
    assert.equal(recorder.snapshot().dataStoreOperations, 1);
    assert.equal(recorder.snapshot().dataStoreDependentRounds, 1);
  }
});

test("actual practice flow is one answer-free RPC in one round", async () => {
  for (const exerciseResult of [
    foundExerciseResult,
    emptyExerciseResult,
    {
      outcomeCode: "INVALID_INPUT",
      requestedLocaleCode: "en",
      exercises: [],
    },
    {
      outcomeCode: "DATABASE_ERROR",
      requestedLocaleCode: "en",
      exercises: [],
    },
  ]) {
    const recorder = createMeasurementRecorder();
    const result = await actual.runDfp2PracticeFlow(
      () => measuredOperation(recorder, exerciseResult),
      { beginRound: () => recorder.beginRound() },
    );
    assert.equal(result.outcomeCode, exerciseResult.outcomeCode);
    assert.equal(recorder.snapshot().dataStoreOperations, 1);
    assert.equal(recorder.snapshot().dataStoreDependentRounds, 1);
  }
});

test("inactive lesson tabs do not load vocabulary or practice", () => {
  assert.match(pageSource, /activeTab === "vocabulary"/);
  assert.match(pageSource, /activeTab === "practice"/);
  assert.doesNotMatch(
    pageSource,
    /Promise\.all\([\s\S]{0,400}getSupabaseLessonVocabulary/,
  );
  assert.match(
    lessonSource,
    /\.from\("exercise_targets"\)[\s\S]{0,220}\.select\(VOCABULARY_RELATIONAL_PROJECTION\)/,
  );
  assert.doesNotMatch(
    lessonSource,
    /\.from\(\s*["'](exercises|exercise_options|exercise_translations|exercise_option_translations|exercise_media)["']\s*\)/,
  );
});

test("detail and vocabulary hard caps remain fail-closed", () => {
  assert.match(lessonSource, /const MAX_DETAIL_SEGMENTS = 300;/);
  assert.match(lessonSource, /const MAX_VOCABULARY_RELATION_ROWS = 300;/);
  assert.match(lessonSource, /segmentOverflow \|\| flow\.translationOverflow/);
  assert.match(lessonSource, /exercise_targets:row_budget_exceeded/);
});
