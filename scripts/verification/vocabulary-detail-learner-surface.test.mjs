import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("Vocabulary detail is generic, live-data driven, and keeps unfinished knowledge absent", async () => {
  const [loader, page, styles, knowledge] = await Promise.all([
    read("lib/vocabularyDetail.ts"),
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetail.module.css"),
    read("app/knowledge/page.tsx"),
  ]);

  assert.match(loader, /get_public_vocabulary_entry_v2/);
  assert.match(loader, /p_public_entry_id:\s*publicId/);
  assert.match(loader, /K1C_VOCABULARY_TE_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /translation_equivalents/);

  assert.match(page, /params:\s*Promise<\{ publicId: string \}>/);
  assert.match(page, /loadVocabularyDetail\(publicId/);
  assert.match(page, /detail\.forms/);
  assert.match(page, /detail\.pronunciations/);
  assert.match(page, /groupedByPos/);
  assert.match(page, /item\.translationEquivalents/);
  assert.match(page, /POS_LABELS/);
  assert.match(page, /REGION_LABELS/);
  assert.match(page, /VocabularyDetail\.module\.css/);

  assert.match(styles, /\.entryHeader/);
  assert.match(styles, /\.workspace/);
  assert.match(styles, /\.senseCard/);
  assert.match(styles, /\.sideRail/);
  assert.match(styles, /@media \(max-width: 639px\)/);
  assert.match(styles, /@media \(max-width: 899px\) and \(orientation: landscape\)/);

  for (const source of [loader, page]) {
    assert.doesNotMatch(source, /出租车|出租車|chūzūchē|xe taxi/);
    assert.doesNotMatch(source, /fake example|fake collocation|fake grammar|fake classifier/i);
  }

  assert.match(knowledge, /\/knowledge\/vocabulary\/\$\{FIRST_VOCABULARY_PUBLIC_ID\}/);
  assert.match(knowledge, /preservedLearnerContextQuery/);
});
