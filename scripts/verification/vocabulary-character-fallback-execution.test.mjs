import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Run production TypeScript, not merely source-text assertions.
const source = await readFile("lib/vocabularyCharacterDelivery.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
vm.runInNewContext(compiled, {
  exports,
  require(id) {
    assert.equal(id, "@/lib/learnerLocaleRegistry");
    return { getLearnerLocale: () => null };
  },
}, { filename: "vocabularyCharacterDelivery.ts" });
const { buildVocabularyCharacterFallback, withVocabularyCharacterDisplayFallback } = exports;

const fixture = (word, hanViet = "word-level aid") => ({
  publicId: "vocab-test",
  displayForm: word,
  hanViet: { text: hanViet },
  forms: [{
    publicId: "primary-written-form",
    text: word,
    isPrimary: true,
    scriptProfileCode: "simplified",
    scriptVariantCode: null,
  }],
  pronunciations: [{ pronunciation: "whole-word-reading", isDefault: true }],
});

test("one Han glyph keeps previously accepted contextual reading and Hán Việt", () => {
  const rows = buildVocabularyCharacterFallback(fixture("懂", "đổng"));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].character.glyph, "懂");
  assert.equal(rows[0].position, 1);
  assert.equal(rows[0].lexicalContextPronunciation, "whole-word-reading");
  assert.equal(rows[0].character.hanViet, "đổng");
  assert.equal(rows[0].character.writing.sourcePath, "data/懂.json");
});

test("one/two/three/repeated/traditional glyphs are displayable without inventing Character facts", () => {
  for (const [word, expected] of [
    ["喜欢", "喜|欢"],
    ["知道", "知|道"],
    ["出租车", "出|租|车"],
    ["喜歡", "喜|歡"],
    ["看看", "看|看"],
  ]) {
    const rows = buildVocabularyCharacterFallback(fixture(word));
    assert.equal(rows.map(x => x.character.glyph).join("|"), expected, word);
    assert.equal(rows.map(x => x.position).join(","), rows.map((_, i) => i + 1).join(","), word);
    assert.equal(new Set(rows.map(x => x.character.publicId)).size, rows.length, word);
    for (const row of rows) {
      assert.equal(row.writtenForm, word);
      assert.equal(row.writtenFormPublicId, "primary-written-form");
      assert.equal(row.lexicalContextPronunciation, null, word);
      assert.equal(row.character.standaloneReading, null, word);
      assert.equal(row.character.hanViet, null, word);
      assert.equal(row.character.radical, null, word);
      assert.equal(row.character.strokeCount, null, word);
      assert.equal(row.character.structureFormula, null, word);
      assert.equal(row.character.writing.sourcePath, "data/" + row.character.glyph + ".json", word);
    }
  }
});

test("non-Han characters are omitted without shifting the actual glyph positions", () => {
  const rows = buildVocabularyCharacterFallback(fixture("喜·欢"));
  assert.equal(rows.map(x => x.character.glyph).join("|"), "喜|欢");
  assert.equal(rows.map(x => x.position).join(","), "1,3");
  assert.equal(buildVocabularyCharacterFallback(fixture("ABC")).length, 0);
  assert.equal(buildVocabularyCharacterFallback({ ...fixture("喜欢"), forms: [] }).length, 0);
});

test("partial canonical Character delivery retains authentic facts and fills only missing glyph positions", () => {
  const detail = fixture("喜欢");
  const fallback = buildVocabularyCharacterFallback(detail);
  const canonical = {
    ...fallback[0],
    character: {
      ...fallback[0].character,
      publicId: "canonical-character-id",
      radical: "canonical-radical",
      hanViet: "canonical-reading",
      writing: null,
    },
  };
  const partial = withVocabularyCharacterDisplayFallback(detail, [canonical]);
  assert.equal(partial.length, 2);
  assert.equal(partial[0], canonical);
  assert.equal(partial[1].character.glyph, "欢");
  assert.equal(partial[1].position, 2);
  assert.equal(partial[1].character.hanViet, null);
  assert.equal(partial[0].character.radical, "canonical-radical");
  const full = [canonical, {
    ...fallback[1],
    character: { ...fallback[1].character, publicId: "canonical-character-2" },
  }];
  assert.equal(withVocabularyCharacterDisplayFallback(detail, full), full);
  const secondary = { ...canonical, writtenFormPublicId: "secondary-form", isPrimaryForm: false };
  const mixed = withVocabularyCharacterDisplayFallback(detail, [secondary]);
  assert.equal(mixed.length, 3);
  assert.equal(mixed[0], secondary);
  assert.equal(mixed.slice(1).map(x => x.character.glyph).join(""), "喜欢");
});

test("public Vocabulary and private Admin Preview use one shared fallback", async () => {
  const publicPage = await readFile("app/knowledge/vocabulary/[publicId]/page.tsx", "utf8");
  const preview = await readFile("app/preview/vocabulary/VocabularyDraftPreviewBridge.tsx", "utf8");
  for (const source of [publicPage, preview]) {
    assert.match(source, /withVocabularyCharacterDisplayFallback/);
    assert.doesNotMatch(source, /substring\(|\.split\(""\)/);
  }
  assert.match(preview, /parseVocabularyDraftPreviewCharacters/);
  assert.match(publicPage, /loadVocabularyCharacterDelivery/);
});
