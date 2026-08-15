import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL("../../" + path, import.meta.url), "utf8").replace(/\r\n?/g, "\n");

const packageJson = JSON.parse(read("package.json"));
const contract = JSON.parse(
  read("supabase/contracts/public_application_database_contract.v1.json"),
);
const preSubmit = read("lib/preSubmitExercises.ts");
const lesson = read("lib/supabaseLesson.ts");
const discovery = read("lib/lessonDiscovery.ts");
const db001 = read("scripts/verification/db001-application-cutover.test.mjs");
const workflow = read(".github/workflows/sbca-ci.yml");

const PRIVATE_PATH_PATTERNS = [
  /supabase\/candidates\//,
  /supabase\/containment\//,
  /supabase\/verification\//,
  /supabase\/remediation\//,
  /supabase\/rollback\//,
];

const PROVIDER_ID_PATTERNS = [
  /https:\/\/[a-z0-9]{15,}\.supabase\.co/i,
  /["']?(?:supabase[_-]?)?project[_-]?(?:ref|id)["']?\s*[:=]\s*["']?[a-z0-9]{20}\b/i,
];

const hasProviderIdentity = (value) =>
  PROVIDER_ID_PATTERNS.some((pattern) => pattern.test(value));

const visibilityPredicates = [
  /\.eq\("status", "published"\)/,
  /\.eq\("quality_status", "published"\)/,
  /\.eq\("access_level", "free"\)/,
  /\.not\("published_at", "is", null\)/,
  /\.lte\("published_at", /,
];

test("package exposes the public-safe SBCA-2 gate", () => {
  assert.equal(
    packageJson.scripts["test:sbca2"],
    "node --test scripts/verification/sbca2-public-invariants.test.mjs",
  );
});

test("public contract is non-executable and locks the five-condition lesson boundary", () => {
  assert.equal(contract.schemaVersion, "public-application-database-contract.v1");
  assert.equal(contract.nonExecutable, true);
  assert.deepEqual(contract.lessonVisibility, {
    status: "published",
    quality_status: "published",
    access_level: "free",
    published_at: "not_null",
    published_at_lte: "now",
  });
});

test("learner application enforces the five-condition lesson boundary", () => {
  for (const predicate of visibilityPredicates) {
    assert.match(lesson, predicate);
    assert.match(discovery, predicate);
  }
});

test("public contract locks protected answer surfaces and learner roles", () => {
  assert.deepEqual(contract.learnerRoles, ["anon", "authenticated"]);
  assert.deepEqual(contract.protectedAnswerSurfaces, [
    "exercises",
    "exercise_options",
    "exercise_translations",
    "exercise_option_translations",
    "exercise_media",
  ]);
  assert.equal(contract.answerBoundary.directSelectByLearnerRoles, false);
  assert.deepEqual(contract.preSubmitRpc.security.executeRoles, [
    "anon",
    "authenticated",
  ]);
  assert.deepEqual(contract.preSubmitRpc.security.forbiddenExecuteRoles, [
    "public",
    "service_role",
  ]);
  assert.equal(contract.preSubmitRpc.security.grantOption, false);
  assert.equal(contract.preSubmitRpc.security.dynamicSql, false);
});

test("pre-submit application parser remains exact, bounded, answer-free, and HTTPS-only", () => {
  assert.match(preSubmit, /const RPC_NAME = "get_lesson_pre_submit_exercises"/);
  assert.match(preSubmit, /const MAX_SLUG_LENGTH = 200/);
  assert.match(preSubmit, /WRAPPER_KEYS = \["outcome_code", "requested_locale_code", "exercises"\]/);
  assert.match(preSubmit, /EXERCISE_KEYS = \["exercise_id", "exercise_type", "prompt", "media", "options", "locale_code"\]/);
  assert.match(preSubmit, /OPTION_KEYS = \["option_id", "text"\]/);
  assert.match(preSubmit, /MEDIA_KEYS = \["media_id", "media_type", "url"\]/);
  assert.match(preSubmit, /parsed\.protocol !== "https:" \|\| parsed\.username \|\| parsed\.password/);

  for (const forbidden of [
    "correct_answer",
    "is_correct",
    "explanation",
    "hint",
    "solution",
    "storage_path",
  ]) {
    assert.doesNotMatch(preSubmit, new RegExp(`^[^/]*\\b${forbidden}\\b`, "im"));
  }
});

test("public DB/application regression still forbids direct protected-table reads and answer-bearing fallbacks", () => {
  assert.match(db001, /all application source avoids direct protected-table reads/);
  assert.match(db001, /learner and dev routes cannot reach answer-bearing fallbacks/);
  for (const table of contract.protectedAnswerSurfaces) {
    assert.match(db001, new RegExp(table));
  }
});

test("public gate preserves exact-head checkout and required gate context", () => {
  assert.match(workflow, /jobs:\s*\n\s*gate:/);
  assert.match(workflow, /name: gate/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$\{\{ github\.event\.pull_request\.head\.sha \}\}"/);
  assert.match(workflow, /run: npm run test:sbca2/);
});

test("provider identity detector ignores ordinary 20-character identifiers", () => {
  assert.equal(hasProviderIdentity("lessonSlugCharacters"), false);
});

test("provider identity detector rejects contextual Supabase project identities", () => {
  const fakeRef = "abcdefghijklmnopqrst";
  for (const sample of [
    `https://${fakeRef}.supabase.co`,
    `project_ref=${fakeRef}`,
    `SUPABASE_PROJECT_ID="${fakeRef}"`,
  ]) {
    assert.equal(hasProviderIdentity(sample), true);
  }
});

test("public-safe gate artifacts do not depend on private operational paths or provider identities", () => {
  const publicArtifacts = [
    JSON.stringify(packageJson),
    JSON.stringify(contract),
    read("scripts/verification/sbca2-public-invariants.test.mjs"),
    workflow,
  ].join("\n");

  for (const pattern of PRIVATE_PATH_PATTERNS) {
    assert.doesNotMatch(publicArtifacts, pattern);
  }
  assert.equal(hasProviderIdentity(publicArtifacts), false);
});
