import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

const [
  interfaceRegistry,
  learnerRegistry,
  interfaceRegistrySource,
  proficiencySource,
  headerSource,
  homeSource,
  resourcesSource,
  practicePageSource,
  lessonPageSource,
  supabaseLessonPageSource,
  learningPanelSource,
  scriptTabSource,
  vocabularyTabSource,
  practiceTabSource,
  lessonMediaSource,
  lessonUiLabelsSource,
  packageSource,
  workflowSource,
] = await Promise.all([
  read("config/interface-locales.v1.json").then(JSON.parse),
  read("config/learner-locales.v1.json").then(JSON.parse),
  read("lib/interfaceLocaleRegistry.ts"),
  read("lib/proficiencyContext.ts"),
  read("components/Header.tsx"),
  read("app/page.tsx"),
  read("app/resources/page.tsx"),
  read("app/practice/page.tsx"),
  read("app/lessons/[slug]/page.tsx"),
  read("app/lessons/[slug]/SupabaseLessonPage.tsx"),
  read("app/lessons/[slug]/LearningPanel.tsx"),
  read("app/lessons/[slug]/ScriptTabContent.tsx"),
  read("app/lessons/[slug]/VocabularyTabContent.tsx"),
  read("app/lessons/[slug]/PracticeTabContent.tsx"),
  read("app/lessons/[slug]/LessonMediaColumn.tsx"),
  read("app/lessons/[slug]/lessonUiLabels.ts"),
  read("package.json"),
  read(".github/workflows/sbca-ci.yml"),
]);

const enabledCodes = (registry) =>
  registry.locales
    .filter((locale) => locale.enabled)
    .map((locale) => locale.code)
    .sort();

const resolveMatrix = (uiLang, legacyLang) => {
  const enabled = new Map(
    interfaceRegistry.locales
      .filter((locale) => locale.enabled)
      .map((locale) => [locale.code, locale]),
  );
  const normalize = (value) =>
    typeof value === "string" ? value.trim().toLowerCase() : null;
  const hasExplicitUiLang = uiLang !== undefined && uiLang !== null;
  const explicit = enabled.get(normalize(uiLang));
  const legacy = enabled.get(normalize(legacyLang));
  const fallback = enabled.get(interfaceRegistry.defaultLocaleCode);
  return hasExplicitUiLang ? explicit ?? fallback : legacy ?? fallback;
};

test("interface locale registry is distinct and versioned", () => {
  assert.equal(interfaceRegistry.schemaVersion, "interface-locale-registry.v1");
  assert.equal(interfaceRegistry.registryVersion, 1);
  assert.equal(interfaceRegistry.defaultLocaleCode, "en");
  assert.deepEqual(enabledCodes(interfaceRegistry), ["ar", "en", "vi"]);
  assert.deepEqual(
    Object.fromEntries(
      interfaceRegistry.locales
        .filter((locale) => locale.enabled)
        .map((locale) => [locale.code, locale.direction]),
    ),
    { en: "ltr", vi: "ltr", ar: "rtl" },
  );

  assert.equal(learnerRegistry.schemaVersion, "learner-locale-registry.v1");
  assert.deepEqual(enabledCodes(learnerRegistry), ["ar", "en", "vi"]);
  assert.notEqual(
    interfaceRegistry.schemaVersion,
    learnerRegistry.schemaVersion,
    "interface and support-locale registries must remain separate contracts",
  );

  assert.match(interfaceRegistrySource, /resolveInterfaceLocale/);
  assert.match(
    interfaceRegistrySource,
    /const hasExplicitUiLang = uiLang !== null && uiLang !== undefined/,
  );
  assert.match(
    interfaceRegistrySource,
    /const selected = hasExplicitUiLang[\s\S]*?explicit \?\? fallback[\s\S]*?: legacy \?\? fallback/,
  );
  assert.match(
    interfaceRegistrySource,
    /if \(hasExplicitUiLang && explicit\)[\s\S]*?source = "uiLang"/,
  );
  assert.match(
    interfaceRegistrySource,
    /else if \(!hasExplicitUiLang && legacy\)[\s\S]*?source = "legacy-lang"/,
  );
});

test("legacy and split URL semantics resolve independently", () => {
  assert.deepEqual(
    [resolveMatrix(undefined, undefined).code, resolveMatrix(undefined, undefined).direction],
    ["en", "ltr"],
  );
  assert.deepEqual(
    [resolveMatrix(undefined, "vi").code, resolveMatrix(undefined, "vi").direction],
    ["vi", "ltr"],
  );
  assert.deepEqual(
    [resolveMatrix(null, "ar").code, resolveMatrix(null, "ar").direction],
    ["ar", "rtl"],
  );
  assert.deepEqual(
    [resolveMatrix("en", "ar").code, resolveMatrix("en", "ar").direction],
    ["en", "ltr"],
  );
  assert.deepEqual(
    [resolveMatrix("ar", "vi").code, resolveMatrix("ar", "vi").direction],
    ["ar", "rtl"],
  );
  assert.equal(resolveMatrix("unsupported", "vi").code, "en");
  assert.equal(resolveMatrix("", "vi").code, "en");
  assert.equal(resolveMatrix("   ", "ar").code, "en");
  assert.equal(resolveMatrix("unsupported", "unsupported").code, "en");
});

test("learner context preserves uiLang and lang as separate values", () => {
  assert.match(proficiencySource, /INTERFACE_LOCALE_PARAM = "uiLang"/);
  assert.match(proficiencySource, /uiLang\?: string \| null/);
  assert.match(proficiencySource, /const uiLang = preservedQueryValue\(input\.uiLang\)/);
  assert.match(proficiencySource, /query\[INTERFACE_LOCALE_PARAM\] = uiLang/);
  assert.match(proficiencySource, /query\.lang = lang/);
});

test("header consumes interface registry and keeps temporary single-control compatibility", () => {
  assert.match(headerSource, /enabledInterfaceLocales/);
  assert.match(headerSource, /resolveInterfaceLocale\(\s*searchParams\.get\(INTERFACE_LOCALE_PARAM\),\s*searchParams\.get\("lang"\)/s);
  assert.doesNotMatch(headerSource, /type HeaderLanguage =/);
  assert.doesNotMatch(headerSource, /const languageOptions/);
  assert.match(headerSource, /next\.set\(INTERFACE_LOCALE_PARAM, uiLang\)/);
  assert.match(headerSource, /next\.set\("lang", lang\)/);
  assert.match(headerSource, /nextSearchParams\.set\(INTERFACE_LOCALE_PARAM, nextInterfaceLocaleCode\)/);
  assert.match(headerSource, /nextSearchParams\.set\("lang", nextInterfaceLocaleCode\)/);
  assert.match(headerSource, /document\.documentElement\.lang = interfaceLocale\.code/);
  assert.match(headerSource, /document\.documentElement\.dir = interfaceLocale\.direction/);

  for (const code of enabledCodes(interfaceRegistry)) {
    assert.match(
      headerSource,
      new RegExp(`\\n  ${code}: \\{`),
      `Header UI catalogue must include ${code}`,
    );
    assert.match(
      lessonUiLabelsSource,
      new RegExp(`\\n  ${code}: \\{`),
      `Lesson UI catalogue must include ${code}`,
    );
  }
});

test("routes preserve uiLang while data discovery remains bound to lang", () => {
  for (const [name, source] of [
    ["home", homeSource],
    ["resources", resourcesSource],
    ["practice", practicePageSource],
    ["lesson", lessonPageSource],
  ]) {
    assert.match(source, /uiLang\?: string/, `${name} must accept uiLang`);
  }

  assert.match(homeSource, /requestedLocale:\s*query\.lang/);
  assert.match(resourcesSource, /requestedLocale:\s*query\.lang/);
  assert.doesNotMatch(homeSource, /requestedLocale:\s*query\.uiLang/);
  assert.doesNotMatch(resourcesSource, /requestedLocale:\s*query\.uiLang/);

  assert.match(lessonPageSource, /resolveInterfaceLocale\(query\?\.uiLang, query\?\.lang\)/);
  assert.match(lessonPageSource, /getSupabaseLessonCore\(slug, query\?\.lang\)/);
  assert.doesNotMatch(lessonPageSource, /getSupabaseLessonCore\(slug, query\?\.uiLang\)/);
  assert.match(lessonPageSource, /uiLang:\s*query\?\.uiLang/);
  assert.match(lessonPageSource, /interfaceLocaleCode=\{interfaceLocale\.code\}/);
  assert.match(lessonPageSource, /interfaceDirection=\{interfaceLocale\.direction\}/);
});

test("lesson UI labels and shell direction use interface locale, not support locale", () => {
  assert.match(supabaseLessonPageSource, /labelsFor\(interfaceLocaleCode\)/);
  assert.doesNotMatch(supabaseLessonPageSource, /labelsFor\(lesson\.selectedCode\)/);
  assert.match(supabaseLessonPageSource, /data-direction=\{interfaceDirection\}/);
  assert.match(supabaseLessonPageSource, /supportTextAlign = lesson\.selectedDirection === "rtl"/);

  assert.match(learningPanelSource, /dir=\{interfaceDirection\}/);
  assert.match(learningPanelSource, /toolbarAlignment = interfaceDirection === "rtl"/);
  assert.match(learningPanelSource, /lang:\s*languageCode/);
  assert.match(learningPanelSource, /interfaceDirection=\{interfaceDirection\}/);
  assert.match(learningPanelSource, /supportTextAlign=\{supportTextAlign\}/);
});

test("script and vocabulary keep support content direction while UI fallback/control direction is independent", () => {
  assert.match(scriptTabSource, /dir=\{lesson\.selectedDirection\}/);
  assert.match(scriptTabSource, /labels\.translationMissing\(lesson\.selectedCode\)/);
  assert.match(scriptTabSource, /dir=\{interfaceDirection\}/);
  assert.match(scriptTabSource, /labels\.noLessonSegments/);

  assert.match(vocabularyTabSource, /summary[^]*dir=\{lesson\.selectedDirection\}/);
  assert.match(vocabularyTabSource, /vocabulary-inner-tab-controls[^]*dir=\{interfaceDirection\}/);
  assert.match(vocabularyTabSource, /label=\{labels\.meaning\}[^]*contentDirection=\{lesson\.selectedDirection\}/);
  assert.match(vocabularyTabSource, /item\.writingGuidance \? \(/);
  assert.match(vocabularyTabSource, /labels\.writingGuidancePlaceholder/);
  assert.match(vocabularyTabSource, /dir=\{interfaceDirection\}/);
});

test("practice content direction stays exercise-owned while UI labels use interface direction", () => {
  assert.match(practiceTabSource, /exerciseDirection = exercise\.localeCode === "ar" \? "rtl" : "ltr"/);
  assert.match(practiceTabSource, /dir=\{exerciseDirection\}/);
  assert.match(practiceTabSource, /labels\.exercise/);
  assert.match(practiceTabSource, /labels\.noOptions/);
  assert.match(practiceTabSource, /labels\.openExerciseMedia/);
  assert.match(practiceTabSource, /dir=\{interfaceDirection\}/);
});

test("media CTA direction is interface-owned", () => {
  assert.doesNotMatch(lessonMediaSource, /selectedDirection/);
  assert.match(lessonMediaSource, /interfaceDirection: InterfaceTextDirection/);
  assert.match(lessonMediaSource, /direction=\{interfaceDirection\}/);
  assert.match(lessonMediaSource, /dir=\{interfaceDirection\}/);
});

test("HC-1 gate is wired without dependency changes", () => {
  const packageJson = JSON.parse(packageSource);
  assert.equal(
    packageJson.scripts["test:hc1"],
    "node --test scripts/verification/hc1-locale-context-boundary.test.mjs",
  );
  assert.match(workflowSource, /HC-1 locale-context boundary gate/);
  assert.match(workflowSource, /run: npm run test:hc1/);
});
