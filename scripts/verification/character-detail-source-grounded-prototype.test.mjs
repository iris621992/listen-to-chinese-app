import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/dev/character-detail/CharacterDetailPrototype.tsx", "utf8");
const css = readFileSync("app/dev/character-detail/CharacterDetailPrototype.module.css", "utf8");

test("one common prototype architecture contains both source-grounded fixtures", () => {
  assert.match(page, /id: "chang"/);
  assert.match(page, /id: "qing"/);
  assert.match(page, /function CharacterDetailPrototype/);
  assert.match(page, /Prototype-only view model/);
});

test("长 pronunciation-specific Hán Việt and vocabulary grouping are not collapsed", () => {
  assert.match(page, /pinyin: "cháng"[\s\S]*hanViet: "trường"/);
  assert.match(page, /pinyin: "zhǎng"[\s\S]*hanViet: "trưởng"/);
  assert.match(page, /items: \["长期", "长度", "特长"\]/);
  assert.match(page, /items: \["长大", "增长", "长辈"\]/);
  assert.match(page, /setActiveReadingId\(reading\.id\)/);
});

test("form relation and stroke-order PENDING are represented without invented data", () => {
  assert.match(page, /glyph: "长"[\s\S]*strokeCount: 4[\s\S]*strokeOrderState: "PRESENT"/);
  assert.match(page, /glyph: "長"[\s\S]*strokeCount: 8[\s\S]*strokeOrderState: "PENDING"/);
  assert.match(page, /Chi tiết thứ tự nét cho \{activeForm\.glyph\} chưa được Knowledge cung cấp/);
  assert.doesNotMatch(page, /strokeSequence|strokePaths|animationData/);
});

test("清 keeps identical script forms singular and exposes exact construction roles", () => {
  assert.match(page, /identicalScriptForms: true/);
  assert.match(page, /glyph: "清"[\s\S]*label: "Giản thể = Phồn thể"/);
  assert.match(page, /radical: "水"/);
  assert.match(page, /displayForm: "氵"/);
  assert.match(page, /formula: "清 = 氵 \+ 青"/);
  assert.match(page, /glyph: "氵", role: "gợi nghĩa"/);
  assert.match(page, /glyph: "青", role: "gợi âm"/);
});

test("N/A and source gaps fail gracefully instead of fabricating learner truth", () => {
  assert.match(page, /construction: \{[\s\S]*state: "N\/A"/);
  assert.match(page, /Exact Knowledge package hiện chưa cung cấp radical cho 长 \/ 長/);
  assert.match(page, /Exact Knowledge package hiện chưa cung cấp danh sách Vocabulary links cho 清/);
  assert.match(page, /if \(construction\.state !== "PRESENT"\) return null/);
});

test("prototype remains compact and responsive across desktop/tablet/mobile", () => {
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) 330px/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /@media \(max-width: 460px\)/);
  assert.match(css, /\.orientationGrid[\s\S]*grid-template-columns: repeat\(2/);
});
