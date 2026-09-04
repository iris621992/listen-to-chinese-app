import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { parseProficiencyContext } from "../../lib/proficiencyContext.ts";

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const RUNTIME_ROOTS = ["app", "components", "lib"];
const REMOVED_RUNTIME_PATHS = [
  "components/HskPage.tsx",
  "app/hsk1/page.tsx",
  "app/hsk2/page.tsx",
  "app/hsk3/page.tsx",
  "app/hsk4/page.tsx",
  "app/hsk5/page.tsx",
  "app/hsk6/page.tsx",
  "app/lessons/[slug]/StaticLessonPage.tsx",
  "lib/lessons.ts",
  "app/membership/page.tsx",
];
const FORBIDDEN_RUNTIME_STRUCTURES = [
  {
    label: "hard-coded proficiency system property",
    pattern: /\b(?:levelSystemCode|systemCode)\s*:\s*["'`]HSK["'`]/,
  },
  {
    label: "hard-coded proficiency level property",
    pattern: /\blevelCode\s*:\s*["'`]HSK[1-9]["'`]/,
  },
  {
    label: "hard-coded global proficiency query mutation",
    pattern: /\.set\(\s*(?:PROFICIENCY_LEVEL_SYSTEM_PARAM|["'`]levelSystem["'`])\s*,\s*["'`]HSK["'`]\s*\)/,
  },
];

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(entryPath);
    return entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))
      ? [entryPath]
      : [];
  }));
  return nested.flat();
}

const portablePath = (file) => file.split(path.sep).join("/");

test("runtime architecture stays proficiency-framework neutral", async () => {
  const sourceFiles = (
    await Promise.all(RUNTIME_ROOTS.map(listSourceFiles))
  ).flat();

  for (const file of sourceFiles) {
    const normalizedPath = portablePath(file);
    assert.doesNotMatch(
      normalizedPath,
      /^app\/hsk(?:\d+)?\//i,
      `${normalizedPath} reintroduces a proficiency-framework route architecture`,
    );
    assert.doesNotMatch(
      normalizedPath,
      /^components\/Hsk.*Page\.(?:js|jsx|ts|tsx)$/i,
      `${normalizedPath} reintroduces a proficiency-framework page component`,
    );

    const source = await readFile(file, "utf8");
    for (const invariant of FORBIDDEN_RUNTIME_STRUCTURES) {
      assert.doesNotMatch(
        source,
        invariant.pattern,
        `${normalizedPath} contains ${invariant.label}`,
      );
    }
    assert.doesNotMatch(
      source,
      /@\/lib\/lessons|StaticLessonPage/,
      `${normalizedPath} reaches the removed static lesson authoring path`,
    );
  }
});

test("removed legacy runtime islands stay removed", async () => {
  for (const removedPath of REMOVED_RUNTIME_PATHS) {
    await assert.rejects(
      access(removedPath),
      `${removedPath} must not return as runtime architecture`,
    );
  }
});

test("legacy level URLs are isolated temporary compatibility redirects", async () => {
  const config = await readFile("next.config.ts", "utf8");
  const routeMatches = config.match(/source:\s*"\/hsk[1-6]"/g) ?? [];
  assert.equal(routeMatches.length, 6);
  assert.doesNotMatch(config, /permanent:\s*true/);
  for (let level = 1; level <= 6; level += 1) {
    assert.ok(config.includes(`source: "/hsk${level}"`));
    assert.ok(
      config.includes(
        `destination: "/resources?levelSystem=HSK&level=HSK${level}"`,
      ),
    );
    assert.match(
      config,
      new RegExp(`source: "/hsk${level}"[^\\n]+permanent: false`),
    );
  }
});

test("Header consumes canonical client-side locale and proficiency authorities", async () => {
  const header = await readFile("components/Header.tsx", "utf8");
  const layout = await readFile("app/layout.tsx", "utf8");
  const catalog = await readFile("lib/proficiencyCatalog.ts", "utf8");

  assert.match(header, /enabledInterfaceLocales/);
  assert.match(header, /resolveInterfaceLocale/);
  assert.doesNotMatch(header, /enabledLearnerLocales/);
  assert.doesNotMatch(header, /const\s+languageOptions\b/);
  assert.doesNotMatch(header, /Array\.from\(\{\s*length:\s*9/);
  assert.doesNotMatch(header, /["'`]HSK(?:[1-9])?["'`]/);
  assert.match(header, /useEffect/);
  assert.match(header, /getPublicProficiencyOptions/);
  assert.doesNotMatch(layout, /getPublicProficiencyOptions|proficiencyCatalog|await\s+/);
  assert.match(layout, /<Header\s*\/>/);
  assert.match(catalog, /\.from\("level_systems"\)/);
  assert.match(catalog, /levels\(code,name,sort_order,is_active\)/);
  assert.match(catalog, /typeof window === "undefined"/);
  assert.match(catalog, /import\("@\/lib\/supabase\/client"\)/);
  assert.doesNotMatch(catalog, /next\/cache|supabase\/server/);
  assert.doesNotMatch(catalog, /\bHSK(?:[1-9])?\b/);
});

test("generic proficiency context accepts independent frameworks", () => {
  assert.deepEqual(
    parseProficiencyContext("HSK", "HSK1"),
    { kind: "EXACT", systemCode: "HSK", levelCode: "HSK1" },
  );
  assert.deepEqual(
    parseProficiencyContext("TOCFL", "A1"),
    { kind: "EXACT", systemCode: "TOCFL", levelCode: "A1" },
  );
});

test("active learner UI labels phonetic data with generic semantic APIs", async () => {
  const labels = await readFile("app/lessons/[slug]/lessonUiLabels.ts", "utf8");
  const learningPanel = await readFile("app/lessons/[slug]/LearningPanel.tsx", "utf8");
  const vocabulary = await readFile("app/lessons/[slug]/VocabularyTabContent.tsx", "utf8");

  for (const source of [labels, learningPanel, vocabulary]) {
    assert.doesNotMatch(source, /\bshowPinyin\b|\blabels\.pinyin\b|pinyin:\s*string/);
  }
  assert.match(labels, /showPronunciation:\s*string/);
  assert.match(labels, /pronunciation:\s*string/);
  assert.match(learningPanel, /labels\.showPronunciation/);
  assert.match(vocabulary, /labels\.pronunciation/);
  assert.match(labels, /Pronunciation/);
  assert.match(labels, /Phiên âm/);
  assert.match(labels, /النطق/);
});

test("Phase F P2A learner shell preserves the approved learner-first IA", async () => {
  const header = await readFile("components/Header.tsx", "utf8");
  const knowledge = await readFile("app/knowledge/page.tsx", "utf8");

  assert.match(header, /const PRIMARY_DESTINATIONS = \[/);
  assert.match(header, /\{ key: "home", path: "\/" \}/);
  assert.match(header, /\{ key: "library", path: "\/resources" \}/);
  assert.match(header, /\{ key: "knowledge", path: "\/knowledge" \}/);
  assert.match(header, /\{ key: "practice", path: "\/practice" \}/);
  assert.match(header, /aria-label="Primary"/);
  assert.match(header, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(header, /aria-label="Learning context"/);
  assert.doesNotMatch(header, /Owner|Admin/);

  assert.match(header, /const hasUiLang = current\.has\(INTERFACE_LOCALE_PARAM\)/);
  assert.match(header, /if \(hasUiLang\) next\.set\(INTERFACE_LOCALE_PARAM, uiLang \?\? ""\)/);
  assert.match(header, /if \(lang\) next\.set\("lang", lang\)/);
  assert.match(header, /if \(levelSystem\) next\.set\(PROFICIENCY_LEVEL_SYSTEM_PARAM, levelSystem\)/);
  assert.match(header, /if \(level\) next\.set\(PROFICIENCY_LEVEL_PARAM, level\)/);
  assert.match(header, /nextSearchParams\.set\(INTERFACE_LOCALE_PARAM, nextInterfaceLocaleCode\)/);
  assert.match(header, /nextSearchParams\.set\("lang", nextInterfaceLocaleCode\)/);
  assert.match(header, /enabledInterfaceLocales/);
  assert.match(header, /getPublicProficiencyOptions/);

  assert.match(knowledge, /Knowledge Hub/);
  assert.match(knowledge, /Vocabulary/);
  assert.match(knowledge, /Idioms/);
  assert.match(knowledge, /Word Comparison/);
  assert.match(knowledge, /Grammar/);
  assert.match(knowledge, /preservedLearnerContextQuery/);
  assert.doesNotMatch(knowledge, /supabase/i);
});

test("Phase F PR-A learner shell keeps responsive, accessibility, and brand invariants", async () => {
  const header = await readFile("components/Header.tsx", "utf8");
  const styles = await readFile("app/globals.css", "utf8");

  await access("public/brand/yunchinese-logo.png");
  assert.match(header, /src="\/brand\/yunchinese-logo\.png"/);
  assert.match(header, /ResizeObserver/);
  assert.match(header, /viewportWidth <= 899/);
  assert.match(header, /viewportWidth >= 1180/);
  assert.match(header, /aria-expanded=\{drawerOpen\}/);
  assert.match(header, /aria-controls=\{drawerId\}/);
  assert.match(header, /event\.key === "Escape"/);
  assert.match(header, /menuTriggerRef\.current\?\.focus\(\)/);
  assert.doesNotMatch(header, /Sign in|Account/);
  assert.doesNotMatch(header, /\/vocabulary|\/idioms|\/grammar|\/dictation|\/translation/);

  assert.match(styles, /\.learner-header\[data-compact-nav="true"\]/);
  assert.match(styles, /@media \(max-width: 899px\) and \(orientation: landscape\) and \(max-height: 520px\)/);
  assert.match(styles, /@media \(max-width: 599px\)/);
  assert.match(styles, /min-height: 44px/);
  assert.match(styles, /\[dir="rtl"\] \.learner-brand-logo/);
  assert.match(styles, /transform: none !important/);
  assert.doesNotMatch(styles, /scaleX\(-1\)/);
});

test("architecture direction gate is part of every production build", async () => {
  const packageDocument = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(
    packageDocument.scripts["test:architecture-direction"],
    "node --test scripts/verification/architecture-direction.test.mjs",
  );
  assert.match(
    packageDocument.scripts.build,
    /npm run test:architecture-direction\s*&&\s*next build/,
  );
});
