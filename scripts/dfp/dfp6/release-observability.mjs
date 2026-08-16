import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import vm from "node:vm";
import ts from "typescript";

import {
  deterministicJson,
  utf8Bytes,
} from "../mspec-1/deterministic-json.mjs";
import { loadMeasuredFixtures } from "../mspec-1/fixtures.mjs";
import {
  createMeasurementRecorder,
  summarizeSamples,
} from "../mspec-1/measurements.mjs";
import {
  assertSanitizedTelemetry,
  DFP6_EVIDENCE_SCHEMA_VERSION,
  DFP6_RELEASE_PROFILE,
  DFP6_VERSION,
  evaluateDfp6ReleaseGate,
} from "./release-contract.mjs";
import { measureDfp6BrowserRelease } from "./browser-release-gate.mjs";

const execFileAsync = promisify(execFile);
const LOWER_HEX_40 = /^[0-9a-f]{40}$/;
const SNAPSHOT_AT = "2026-08-15T00:00:00.000Z";

function safeSampleError() {
  return { status: "failed", error: "SAMPLE_FAILED" };
}

export async function resolveExactReleaseHead({
  repositoryRoot = process.cwd(),
  runGit = execFileAsync,
} = {}) {
  const [{ stdout: head }, { stdout: status }] = await Promise.all([
    runGit("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot }),
    runGit(
      "git",
      ["status", "--porcelain=v1", "--untracked-files=all"],
      { cwd: repositoryRoot },
    ),
  ]);
  const commit = head.trim();
  if (!LOWER_HEX_40.test(commit)) {
    throw new Error("DFP-6 requires an exact lowercase 40-character Git HEAD");
  }
  if (status.trim() !== "") {
    throw new Error("DFP-6 release evidence requires a clean measured worktree");
  }
  return commit;
}

function compiledModule(source, context) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return new vm.SourceTextModule(compiled, { context });
}

async function loadDiscoveryExports() {
  const [discoverySource, proficiencySource] = await Promise.all([
    readFile("lib/lessonDiscovery.ts", "utf8"),
    readFile("lib/proficiencyContext.ts", "utf8"),
  ]);
  const context = vm.createContext({
    Buffer,
    Date,
    process: { env: {} },
    URLSearchParams,
  });
  const proficiencyModule = compiledModule(proficiencySource, context);
  await proficiencyModule.link(async (specifier) => {
    throw new Error(`Unexpected DFP-6 proficiency import: ${specifier}`);
  });
  const discoveryModule = compiledModule(discoverySource, context);
  await discoveryModule.link(async (specifier) => {
    if (specifier === "@/lib/proficiencyContext") return proficiencyModule;
    if (specifier === "@/lib/learnerLocaleRegistry") {
      return new vm.SyntheticModule(
        ["defaultLearnerLocaleCode", "getLearnerLocale"],
        function initialize() {
          this.setExport("defaultLearnerLocaleCode", "en");
          this.setExport("getLearnerLocale", (value) => {
            const code = typeof value === "string"
              ? value.trim().toLowerCase()
              : "";
            return ["en", "vi", "ar"].includes(code)
              ? { code, direction: code === "ar" ? "rtl" : "ltr" }
              : null;
          });
        },
        { context },
      );
    }
    throw new Error(`Unexpected DFP-6 discovery import: ${specifier}`);
  });
  await proficiencyModule.evaluate();
  await discoveryModule.evaluate();
  return discoveryModule.namespace;
}

async function loadDetailExports() {
  const source = await readFile("lib/supabaseLesson.ts", "utf8");
  const context = vm.createContext({
    Buffer,
    Date,
    process: { env: {} },
    URL,
    URLSearchParams,
  });
  const sourceModule = compiledModule(source, context);
  await sourceModule.link(async (specifier) => {
    if (specifier === "@/lib/preSubmitExercises") {
      return new vm.SyntheticModule(
        ["loadPreSubmitExercises"],
        function initialize() {
          this.setExport("loadPreSubmitExercises", () => {
            throw new Error("DFP-6 injects the answer-free release fixture.");
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
    throw new Error(`Unexpected DFP-6 detail import: ${specifier}`);
  });
  await sourceModule.evaluate();
  return sourceModule.namespace;
}

async function loadCacheExports() {
  const source = await readFile("lib/publicContentCache.ts", "utf8");
  const context = vm.createContext({
    Buffer,
    Date,
    Error,
    Set,
  });
  const sourceModule = compiledModule(source, context);
  await sourceModule.link(async (specifier) => {
    throw new Error(`Unexpected DFP-6 cache import: ${specifier}`);
  });
  await sourceModule.evaluate();
  return sourceModule.namespace;
}

const uuidFor = (number) =>
  `00000000-0000-4000-8000-${number.toString(16).padStart(12, "0")}`;

function discoveryRows() {
  return Array.from({ length: 25 }, (_, index) => ({
    id: uuidFor(1000 - index),
    slug: `release-fixture-${index}`,
    title_original: `Fixture ${index}`,
    title_support_default: `Fixture ${index}`,
    content_type: "listening",
    duration_seconds: 120,
    access_level: "free",
    published_at: new Date(
      Date.parse(SNAPSHOT_AT) - (index + 1) * 1000,
    ).toISOString(),
    updated_at: new Date(
      Date.parse(SNAPSHOT_AT) - (index + 1) * 1000,
    ).toISOString(),
    level: { code: "HSK1", system: { code: "HSK" } },
  }));
}

function recordResult(recorder, collection, result, startedAt) {
  recorder.recordOperation({
    durationMs: Math.max(0, performance.now() - startedAt),
    outcome: result?.error ? "ERROR" : "FOUND",
  });
  const count = Array.isArray(result?.data)
    ? result.data.length
    : result?.data ? 1 : 0;
  recorder.recordRows(collection, count);
  return Promise.resolve(result);
}

function safeRows(snapshot) {
  return Object.fromEntries(
    Object.entries(snapshot.rows ?? {}).map(([name, count]) => [name, count]),
  );
}

async function executeDiscovery(actual) {
  const recorder = createMeasurementRecorder();
  const rows = discoveryRows();
  const result = await actual.runDfp3DiscoveryFlow(
    { requestedLocale: "en", now: () => new Date(SNAPSHOT_AT) },
    async (query) => {
      recorder.beginRound();
      const startedAt = performance.now();
      const data = rows.slice(0, query.limit);
      await recordResult(recorder, "lessons", { data, error: null }, startedAt);
      return { data, error: null };
    },
  );
  const snapshot = recorder.snapshot();
  return {
    outcomeCode: result.status,
    dataStoreOperations: snapshot.dataStoreOperations,
    dataStoreDependentRounds: snapshot.dataStoreDependentRounds,
    authSessionOperations: snapshot.authSessionOperations,
    authSessionDependentRounds: snapshot.authSessionDependentRounds,
    authSessionDurationMs: snapshot.authSessionDurationMs,
    rows: safeRows(snapshot),
    applicationDataBytes: Buffer.byteLength(JSON.stringify(result.page), "utf8"),
  };
}

async function executeDetail(actual) {
  const recorder = createMeasurementRecorder();
  const query = (collection, data) => {
    const startedAt = performance.now();
    return recordResult(recorder, collection, { data, error: null }, startedAt);
  };
  const result = await actual.runDfp2DetailCoreFlow({
    loadLanguages: () => query("languages", [{ code: "en" }]),
    loadLesson: () => query("lessons", { id: "lesson-1" }),
    loadSegments: () =>
      query("lesson_segments", [{ id: "segment-1" }, { id: "segment-2" }]),
    loadSegmentTranslations: () =>
      query("localized_segments", [
        { segment_id: "segment-1", language_code: "en" },
        { segment_id: "segment-2", language_code: "en" },
      ]),
    resolveSelectedCode: () => "en",
  }, { beginRound: () => recorder.beginRound() });
  const snapshot = recorder.snapshot();
  const outcomeCode =
    result.segmentOverflow || result.translationOverflow ? "ROW_LIMIT" : "FOUND";
  const publicShape = {
    languageCount: result.languagesResult?.data?.length ?? 0,
    segmentCount: result.segmentsResult?.data?.length ?? 0,
    segmentTranslationCount: result.segmentTranslationsResult?.data?.length ?? 0,
  };
  return {
    outcomeCode,
    dataStoreOperations: snapshot.dataStoreOperations,
    dataStoreDependentRounds: snapshot.dataStoreDependentRounds,
    authSessionOperations: snapshot.authSessionOperations,
    authSessionDependentRounds: snapshot.authSessionDependentRounds,
    authSessionDurationMs: snapshot.authSessionDurationMs,
    rows: safeRows(snapshot),
    applicationDataBytes: utf8Bytes(deterministicJson(publicShape)),
  };
}

async function executePractice(actual) {
  const recorder = createMeasurementRecorder();
  const fixtureResult = {
    outcomeCode: "FOUND",
    requestedLocaleCode: "en",
    exercises: [{
      id: "exercise-1",
      type: "multiple_choice",
      question: "Fixture prompt",
      localeCode: "en",
      options: [],
      media: [],
    }],
  };
  const result = await actual.runDfp2PracticeFlow(
    () => {
      const startedAt = performance.now();
      recorder.recordOperation({
        durationMs: Math.max(0, performance.now() - startedAt),
        outcome: fixtureResult.outcomeCode,
      });
      recorder.recordRows("pre_submit_exercises", fixtureResult.exercises.length);
      return Promise.resolve(fixtureResult);
    },
    { beginRound: () => recorder.beginRound() },
  );
  const snapshot = recorder.snapshot();
  return {
    outcomeCode: result.outcomeCode,
    dataStoreOperations: snapshot.dataStoreOperations,
    dataStoreDependentRounds: snapshot.dataStoreDependentRounds,
    authSessionOperations: snapshot.authSessionOperations,
    authSessionDependentRounds: snapshot.authSessionDependentRounds,
    authSessionDurationMs: snapshot.authSessionDurationMs,
    rows: safeRows(snapshot),
    applicationDataBytes: utf8Bytes(deterministicJson({
      outcomeCode: result.outcomeCode,
      exerciseCount: result.exercises.length,
    })),
  };
}

async function measureServerFlow(flowName, execute) {
  const warmUps = DFP6_RELEASE_PROFILE.serverAssembly.warmUpRequests;
  for (let index = 0; index < warmUps; index += 1) {
    await execute();
  }

  const samples = [];
  for (
    let index = 0;
    index < DFP6_RELEASE_PROFILE.serverAssembly.measuredSamples;
    index += 1
  ) {
    const startedAt = performance.now();
    try {
      const observation = await execute();
      samples.push({
        index: index + 1,
        status: "ok",
        durationMs: Math.max(0, performance.now() - startedAt),
        ...observation,
      });
    } catch {
      samples.push({ index: index + 1, ...safeSampleError() });
    }
  }

  const summaryInput = samples.map((sample) => sample.status === "ok"
    ? { status: "ok", value: sample.durationMs }
    : safeSampleError());
  const summary = summarizeSamples(
    summaryInput,
    DFP6_RELEASE_PROFILE.serverAssembly.percentile,
    DFP6_RELEASE_PROFILE.serverAssembly.measuredSamples,
  );
  return {
    flowName,
    cacheState: "synthetic-local-adapter",
    sampleCount: samples.length,
    percentile: DFP6_RELEASE_PROFILE.serverAssembly.percentile,
    percentileMethod: DFP6_RELEASE_PROFILE.serverAssembly.percentileMethod,
    samples,
    summary,
  };
}

export async function measureActualServerFlows() {
  const [discovery, detail] = await Promise.all([
    loadDiscoveryExports(),
    loadDetailExports(),
  ]);
  return {
    discovery: await measureServerFlow(
      "discovery",
      () => executeDiscovery(discovery),
    ),
    detail: await measureServerFlow("detail", () => executeDetail(detail)),
    practice: await measureServerFlow(
      "practice",
      () => executePractice(detail),
    ),
  };
}

export async function measureInvalidationOutcomes() {
  const actual = await loadCacheExports();
  const event = {
    schemaVersion: "publication-invalidation.v1",
    eventId: "dfp6-release-fixture",
    eventKind: "unpublish",
    committedAt: SNAPSHOT_AT,
    resourceId: "fixture-resource",
    slug: "fixture-resource",
    affectedLocaleCodes: ["en"],
  };
  const observations = [];
  const success = await actual.executePublicationInvalidation(event, {
    wasApplied: async () => false,
    invalidateTags: async () => {},
    markApplied: async () => {},
    observe: async (observation) => observations.push(observation.outcome),
  });
  const retry = await actual.executePublicationInvalidation(
    { ...event, eventId: "dfp6-release-fixture-retry" },
    {
      wasApplied: async () => false,
      invalidateTags: async () => {
        throw new Error("synthetic invalidation failure");
      },
      markApplied: async () => {},
      observe: async (observation) => observations.push(observation.outcome),
    },
  );
  return {
    success: success.status,
    retry: retry.status,
    terminalFailureObserved: false,
    observedOutcomeCodes: [...new Set(observations)].sort(),
  };
}

export async function measurePayloadFixtures() {
  const fixtures = await loadMeasuredFixtures();
  return fixtures
    .filter(({ definition }) =>
      definition.sizeClass === "representative"
      && ["discovery", "detail", "practice"].includes(definition.kind))
    .map(({ definition, measurement }) => ({
      id: definition.id,
      kind: definition.kind,
      bytes: measurement.bytes,
      sha256: measurement.sha256,
    }))
    .sort((left, right) => left.kind.localeCompare(right.kind));
}

export async function buildDfp6ReleaseEvidence({
  commit,
  includeBrowser = true,
} = {}) {
  const exactCommit = commit ?? await resolveExactReleaseHead();
  if (!LOWER_HEX_40.test(exactCommit)) {
    throw new Error("DFP-6 release evidence requires an exact commit SHA");
  }

  const server = await measureActualServerFlows();
  const payloadFixtures = await measurePayloadFixtures();
  const invalidation = await measureInvalidationOutcomes();
  const browser = includeBrowser
    ? await measureDfp6BrowserRelease({ commit: exactCommit })
    : {
        summary: {},
        gate: { pass: false },
        evidenceStatus: "NOT_MEASURED",
      };
  const gate = evaluateDfp6ReleaseGate({
    browser,
    invalidation,
    payloadFixtures,
    server,
  });

  const evidence = {
    schemaVersion: DFP6_EVIDENCE_SCHEMA_VERSION,
    dfp6Version: DFP6_VERSION,
    measurementSpec: "DFP-MSPEC-1",
    evidenceClass: "synthetic-release",
    fieldEvidence: "NOT_COLLECTED",
    commit: exactCommit,
    generatedAt: new Date().toISOString(),
    server,
    payloadFixtures,
    invalidation,
    browser,
    gate,
    limitations: [
      "No Production database or provider was accessed.",
      "Server data-store calls use deterministic local adapters; field latency is not claimed.",
      "Field evidence remains separate and is not substituted for synthetic release evidence.",
    ],
  };
  assertSanitizedTelemetry(evidence);
  return evidence;
}

async function main() {
  const evidence = await buildDfp6ReleaseEvidence();
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
  if (!evidence.gate.pass) process.exitCode = 1;
}

if (
  process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    process.stderr.write(
      `DFP-6 release measurement failed: ${
        error instanceof Error ? error.message : String(error)
      }\n`,
    );
    process.exitCode = 1;
  });
}
