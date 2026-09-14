import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("Vocabulary detail preserves K1B/K1C depth and the approved v4.1 learner behavior", async () => {
  const [loader, page, styles, sticky, knowledge, header] = await Promise.all([
    read("lib/vocabularyDetail.ts"),
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetail.module.css"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyStickyNav.tsx"),
    read("app/knowledge/page.tsx"),
    read("components/Header.tsx"),
  ]);

  assert.match(loader, /get_public_vocabulary_entry_v2/);
  assert.match(loader, /p_public_entry_id:\s*publicId/);
  assert.match(loader, /K1C_VOCABULARY_TE_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /translation_equivalents/);
  assert.match(loader, /parent_public_id/);
  assert.match(loader, /usage_type/);
  assert.match(loader, /is_subsense/);
  assert.match(loader, /register_code/);
  assert.match(loader, /domain_code/);
  assert.match(loader, /usage_note/);
  assert.match(loader, /memory_tip/);
  assert.match(loader, /applicable_form_public_ids/);
  assert.match(loader, /context_restriction/);
  assert.match(loader, /preference_status/);

  assert.match(page, /params:\s*Promise<\{ publicId: string \}>/);
  assert.match(page, /loadVocabularyDetail\(publicId/);
  assert.match(page, /detail\.forms/);
  assert.match(page, /detail\.pronunciations/);
  assert.match(page, /groupByPartOfSpeech/);
  assert.match(page, /learnerMeaningParts/);
  assert.match(page, /extractHanCharacters/);
  assert.match(page, /VocabularyStickyNav/);
  assert.match(page, /styles\.characterRail/);
  assert.match(page, /item\.usageNote/);
  assert.match(page, /item\.memoryTip/);
  assert.match(page, /item\.itemType === "usage"/);
  assert.match(page, /styles\.subsense/);
  assert.doesNotMatch(page, /translations:\s*"Từ tương đương"/);
  assert.doesNotMatch(page, /formLabel\(/);
  assert.doesNotMatch(page, /languageVarietyLabel/);

  assert.match(styles, /\.workspace/);
  assert.match(styles, /\.characterRailInner[\s\S]*position:\s*sticky/);
  assert.match(styles, /\.compactSticky/);
  assert.match(styles, /\.landscapeRail/);
  assert.match(styles, /\.hasMultipleReadings:has\(\.readingSection:target\)/);
  assert.match(styles, /\.mobileOnlyNavItem/);
  assert.match(styles, /@media \(max-width: 900px\) and \(max-height: 520px\) and \(orientation: landscape\)/);

  assert.match(sticky, /window\.addEventListener\("scroll"/);
  assert.match(sticky, /learnerHeaderOffset/);
  assert.match(sticky, /vocabulary-entry-header/);
  assert.match(sticky, /vocabulary-entry-card/);
  assert.match(sticky, /styles\.compactSticky/);
  assert.match(sticky, /styles\.landscapeRail/);

  for (const source of [loader, page, sticky]) {
    assert.doesNotMatch(source, /出租车|出租車|chūzūchē|xe taxi/);
    assert.doesNotMatch(source, /fake example|fake collocation|fake grammar|fake classifier/i);
    assert.doesNotMatch(source, /活动|博物馆|博物館|huódòng|bówùguǎn/);
  }

  assert.doesNotMatch(page, /audio|speechSynthesis|Polly/i);
  assert.doesNotMatch(page, /saveButton|saved-item|content-toggle/i);

  assert.match(knowledge, /\/knowledge\/vocabulary\/\$\{FIRST_VOCABULARY_PUBLIC_ID\}/);
  assert.match(knowledge, /preservedLearnerContextQuery/);

  assert.match(header, /\/brand\/yunchinese-logo\.png/);
});
