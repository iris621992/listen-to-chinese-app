import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("Vocabulary detail stays generic, live-data driven, and follows the approved v4.1 hierarchy", async () => {
  const [loader, page, styles, knowledge, header] = await Promise.all([
    read("lib/vocabularyDetail.ts"),
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetail.module.css"),
    read("app/knowledge/page.tsx"),
    read("components/Header.tsx"),
  ]);

  assert.match(loader, /get_public_vocabulary_entry_v2/);
  assert.match(loader, /p_public_entry_id:\s*publicId/);
  assert.match(loader, /K1C_VOCABULARY_TE_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /translation_equivalents/);

  assert.match(page, /params:\s*Promise<\{ publicId: string \}>/);
  assert.match(page, /loadVocabularyDetail\(publicId/);
  assert.match(page, /detail\.forms/);
  assert.match(page, /detail\.pronunciations/);
  assert.match(page, /groupByPartOfSpeech/);
  assert.match(page, /item\.translationEquivalents/);
  assert.match(page, /POS_LABELS/);
  assert.match(page, /REGION_LABELS/);
  assert.match(page, /preferredTranslations/);
  assert.match(page, /styles\.breadcrumb/);
  assert.match(page, /styles\.entryCard/);
  assert.match(page, /styles\.writtenLine/);
  assert.match(page, /styles\.posSummary/);
  assert.match(page, /styles\.posFlow/);
  assert.match(page, /styles\.senseStack/);
  assert.match(page, /styles\.senseProfile/);
  assert.match(page, /VocabularyDetail\.module\.css/);

  assert.match(styles, /\.breadcrumb/);
  assert.match(styles, /\.entryCard/);
  assert.match(styles, /\.entryHeader/);
  assert.match(styles, /\.posSummary/);
  assert.match(styles, /\.sectionNav/);
  assert.match(styles, /\.entryBody/);
  assert.match(styles, /\.posSection/);
  assert.match(styles, /\.senseProfile/);
  assert.match(styles, /@media \(max-width: 639px\)/);
  assert.match(styles, /@media \(max-width: 900px\) and \(max-height: 520px\)/);

  for (const source of [loader, page]) {
    assert.doesNotMatch(source, /出租车|出租車|chūzūchē|xe taxi/);
    assert.doesNotMatch(source, /fake example|fake collocation|fake grammar|fake classifier/i);
    assert.doesNotMatch(source, /活动|博物馆|博物館|huódòng|bówùguǎn/);
  }

  assert.match(knowledge, /\/knowledge\/vocabulary\/\$\{FIRST_VOCABULARY_PUBLIC_ID\}/);
  assert.match(knowledge, /preservedLearnerContextQuery/);

  assert.match(header, /\/brand\/yunchinese-logo\.png/);
});
