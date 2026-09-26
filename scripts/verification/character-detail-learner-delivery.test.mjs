import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const delivery = readFileSync("lib/characterDetail.ts", "utf8");
const page = readFileSync("app/knowledge/characters/[publicId]/page.tsx", "utf8");
const view = readFileSync("app/knowledge/characters/[publicId]/CharacterDetailView.tsx", "utf8");
const css = readFileSync("app/knowledge/characters/[publicId]/CharacterDetail.module.css", "utf8");

test("Character Detail consumes the shared public Character projection", () => {
  assert.match(delivery, /CHARACTER_KNOWLEDGE_PUBLIC_PROJECTION_V1/);
  assert.match(delivery, /get_public_character_entry_v1/);
  assert.match(delivery, /p_public_character_id/);
  assert.doesNotMatch(delivery, /char\.chang\.orientation\.01|char\.qing\.orientation\.01/);
});

test("runtime preserves full versus recognition-only learner scope", () => {
  assert.match(delivery, /"full"[,\s]+"recognition_only"[,\s]+"identity_only"/);
  assert.match(page, /learnerScope === "recognition_only"/);
  assert.match(page, /traditional_to_simplified/);
  assert.match(page, /redirect\(\`\/knowledge\/characters\//);
  assert.match(page, /learnerScope !== "full"/);
});

test("Character learner view reuses current Vocabulary visual and interaction authorities", () => {
  assert.match(view, /VocabularyCharacterRail/);
  assert.match(view, /VocabularyPronunciationMeta/);
  assert.match(view, /VocabularyStickyNav/);
  assert.match(view, /KnowledgeLanguageToggle/);
  assert.match(view, /VocabularyDetail\.module\.css/);
  assert.match(view, /VocabularyHeaderNavAuthority\.module\.css/);
});

test("pronunciation groups and Hán Việt remain pronunciation-linked", () => {
  assert.match(view, /selectedPronunciationId/);
  assert.match(view, /selectedPronunciation\.pinyin/);
  assert.match(view, /selectedPronunciation\.hanViet/);
  assert.match(view, /setSelectedPronunciationId\(pronunciation\.publicId\)/);
  assert.doesNotMatch(view, /split\([^\n]*pinyin|pinyin[^\n]*split/);
});

test("Character semantic modules stay distinct from Vocabulary Sense", () => {
  assert.match(view, /"meaning_orientation"/);
  assert.match(view, /"lexical_participation"/);
  assert.match(view, /"reading_recognition"/);
  assert.match(view, /componentsApplicability === "PRESENT"/);
  assert.doesNotMatch(view, /VocabularyReadingItem|Vocabulary Sense|readingItems/);
});

test("writing remains exact-glyph and shared with the approved rail", () => {
  assert.match(view, /glyph: detail\.glyph/);
  assert.match(view, /writing: detail\.writing/);
  assert.match(view, /variant="rail"/);
  assert.match(view, /variant="embedded"/);
  assert.doesNotMatch(view, /traditionalWriting|fallback.*simplified|simplified.*fallback/i);
});

test("desktop omits redundant Writing navigation while compact layouts can expose it", () => {
  assert.match(view, /mobileOnly: true/);
  assert.match(view, /mobileOnlyWriting/);
  assert.match(css, /\.mobileOnlyWriting\s*\{[\s\S]*display:\s*none\s*!important/);
  assert.match(css, /max-width:\s*639px[\s\S]*\.mobileOnlyWriting[\s\S]*display:\s*inline-flex\s*!important/);
});


test("Character acceptance Preview binding is exact-branch and Preview-only", () => {
  assert.match(delivery, /CHARACTER_ACCEPTANCE_PREVIEW_BRANCH/);
  assert.match(delivery, /agent\/character-detail-learner-delivery-v1/);
  assert.match(delivery, /process\.env\.VERCEL_ENV === "preview"/);
  assert.match(delivery, /process\.env\.VERCEL_GIT_COMMIT_REF === CHARACTER_ACCEPTANCE_PREVIEW_BRANCH/);
  assert.match(delivery, /xqvdbgjfpdxdasxycppi\.supabase\.co/);
  assert.match(delivery, /sb_publishable_/);
  assert.match(delivery, /createCharacterRuntimeSupabaseClient/);
  assert.match(delivery, /createServerSupabaseClient/);
  assert.doesNotMatch(delivery, /service_role|SUPABASE_SERVICE_ROLE/i);
});
