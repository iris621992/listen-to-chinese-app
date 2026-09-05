import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFile(path.join(repoRoot, relativePath), "utf8");

// NOTE: keep this verifier focused on active learner/runtime architecture invariants.
// Historical/private implementation details belong in their dedicated regression suites.

test("runtime architecture stays proficiency-framework neutral", async () => {
  const proficiencyContext = await read("lib/proficiencyContext.ts");
  const catalog = await read("lib/proficiencyCatalog.ts");
  const discovery = await read("lib/lessonDiscovery.ts");

  assert.match(proficiencyContext, /PROFICIENCY_LEVEL_SYSTEM_PARAM/);
  assert.match(proficiencyContext, /PROFICIENCY_LEVEL_PARAM/);
  assert.match(proficiencyContext, /parseProficiencyContext/);
  assert.match(catalog, /getPublicProficiencyOptions/);
  assert.match(discovery, /levelSystemCode/);
  assert.match(discovery, /levelCode/);
  assert.doesNotMatch(discovery, /HSK_ONLY|hsk-only|hskOnly/);
});

test("removed legacy runtime islands stay removed", async () => {
  const nextConfig = await read("next.config.ts");
  const packageJson = await read("package.json");

  assert.doesNotMatch(nextConfig, /legacy|deprecated/i);
  assert.doesNotMatch(packageJson, /legacy|deprecated/i);
});

test("legacy level URLs are isolated temporary compatibility redirects", async () => {
  const nextConfig = await read("next.config.ts");

  assert.match(nextConfig, /redirects/);
  assert.match(nextConfig, /levelSystem/);
  assert.match(nextConfig, /level/);
});

test("Header consumes canonical client-side locale and proficiency authorities", async () => {
  const header = await read("components/Header.tsx");

  assert.match(header, /enabledInterfaceLocales/);
  assert.match(header, /resolveInterfaceLocale/);
  assert.match(header, /getPublicProficiencyOptions/);
  assert.match(header, /parseProficiencyContext/);
  assert.match(header, /PROFICIENCY_LEVEL_SYSTEM_PARAM/);
  assert.match(header, /PROFICIENCY_LEVEL_PARAM/);
  assert.match(header, /INTERFACE_LOCALE_PARAM/);
});

test("generic proficiency context accepts independent frameworks", async () => {
  const proficiencyContext = await read("lib/proficiencyContext.ts");
  assert.match(proficiencyContext, /levelSystem/);
  assert.match(proficiencyContext, /level/);
});

test("active learner UI labels phonetic data with generic semantic APIs", async () => {
  const lessonPage = await read("app/lessons/[slug]/page.tsx");
  assert.doesNotMatch(lessonPage, /pinyinOnly|HSK_ONLY/);
});

test("Phase F P2A learner shell preserves the approved learner-first IA", async () => {
  const header = await read("components/Header.tsx");
  assert.match(header, /Home/);
  assert.match(header, /Library/);
  assert.match(header, /Knowledge/);
  assert.match(header, /Practice/);
  assert.doesNotMatch(header, /Owner|Admin/);
});

test("Phase F PR-A learner shell keeps responsive, accessibility, and brand invariants", async () => {
  const header = await read("components/Header.tsx");
  const styles = await read("app/globals.css");

  assert.match(header, /aria-expanded/);
  assert.match(header, /aria-controls/);
  assert.match(header, /Escape/);
  assert.match(header, /yunchinese-logo\.png/);
  assert.match(styles, /learner-menu-trigger/);
  assert.match(styles, /focus-visible/);
  assert.doesNotMatch(styles, /scaleX\(-1\)/);
});

test("architecture direction gate is part of every production build", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.match(packageJson.scripts?.build ?? "", /test:architecture-direction/);
});

test("Phase F PR-B Home keeps approved product, localization, discovery, and typography boundaries", async () => {
  const home = await read("app/page.tsx");
  const homeCopy = await read("lib/homeCopy.ts");
  const styles = `${await read("app/globals.css")}\n${await read("app/home-fidelity.css").catch(() => "")}`;

  assert.match(home, /getHomeCopy\(interfaceLocale\.code\)/);
  assert.match(home, /getLessonDiscoveryPage\(\{/);
  assert.match(home, /preservedLearnerContextQuery\(query\)/);
  assert.match(home, /<LessonCard\b/);
  assert.match(home, /pageSize:\s*6/);
  assert.match(home, /requestedLocale:\s*query\.lang/);
  assert.match(home, /lang=\{interfaceLocale\.code\}/);
  assert.match(home, /dir=\{interfaceLocale\.direction\}/);

  const orderedSections = [
    "hero", "library", "knowledge", "practice", "discovery", "guest",
    "how", "positioning", "growing", "final", "footer",
  ];
  let previousIndex = -1;
  for (const section of orderedSections) {
    const marker = `data-home-section="${section}"`;
    const index = home.indexOf(marker);
    assert.ok(index > previousIndex, `${section} must follow the approved Home order`);
    previousIndex = index;
  }

  assert.match(home, /href="\/resources"\s+query=\{learnerContextQuery\}/);
  assert.match(home, /href="\/knowledge"\s+query=\{learnerContextQuery\}/);
  assert.match(home, /href="\/practice"\s+query=\{learnerContextQuery\}/);
  assert.match(home, /href="\/"\s+query=\{learnerContextQuery\}/);
  assert.doesNotMatch(home, /href=["']#["']/);
  assert.doesNotMatch(home, /<input\b|<select\b|<form\b|Apply filters/);
  assert.doesNotMatch(home, /Sign in|Account|Save collections/);
  assert.doesNotMatch(home, /href=.*\/(?:vocabulary|idioms|grammar|dictation|translation)/);
  assert.doesNotMatch(home, /\bHSK\b/);
  assert.doesNotMatch(homeCopy, /\bHSK\b/);

  assert.match(homeCopy, /export type HomeLocaleCode = "en" \| "vi" \| "ar"/);
  assert.match(homeCopy, /(?:"en"|en):\s*\{/);
  assert.match(homeCopy, /(?:"vi"|vi):\s*\{/);
  assert.match(homeCopy, /(?:"ar"|ar):\s*\{/);
  assert.doesNotMatch(homeCopy, /(?:"de"|de):\s*\{/);
  assert.match(homeCopy, /Library → Resource → Practice/);
  assert.match(homeCopy, /Thư viện → Tài nguyên → Luyện tập/);
  assert.match(homeCopy, /المكتبة ← المورد ← التدريب/);
  assert.match(homeCopy, /There is no fixed sequence/);
  assert.match(homeCopy, /Không có thứ tự bắt buộc/);
  assert.match(homeCopy, /لا يوجد ترتيب ثابت/);

  // Demo-copy authority: protect the owner-approved wording where it is capability-truthful.
  assert.match(homeCopy, /Start with a resource, a language question, or focused practice/);
  assert.match(homeCopy, /Khám phá tài nguyên tiếng Trung theo loại nội dung, trình độ và ngôn ngữ/);
  assert.match(homeCopy, /استخدم تمارين مركزة للتحقق من الفهم وتعزيز اللغة المفيدة/);

  assert.match(home, /src="\/brand\/yunchinese-home-large\.webp"/);
  assert.match(styles, /\.home-brand-logo\s*\{[^}]*transform:\s*none !important/s);
  assert.match(styles, /\[dir="rtl"\] \.home-brand-logo\s*\{[^}]*transform:\s*none !important/s);
  assert.doesNotMatch(styles, /\.home-brand-logo[^}]*scaleX\(-1\)/s);
  assert.match(styles, /--home-text-secondary:\s*#575c53/);
  assert.match(styles, /--home-text-tertiary:\s*#64685f/);
  assert.match(styles, /--home-terracotta-text:\s*#8f5430/);
  assert.match(styles, /--home-text-on-sage-secondary:\s*#edf1ea/);
  assert.match(styles, /--home-terracotta-on-sage:\s*#f7ebe4/);
  assert.doesNotMatch(styles, /body\s*\{[^}]*font-weight:\s*500/s);
});
