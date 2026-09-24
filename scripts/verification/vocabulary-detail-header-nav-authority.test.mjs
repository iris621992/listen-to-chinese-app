import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("Vocabulary Detail keeps POS navigation in a dedicated row and preserves the future header action slot", async () => {
  const [pageRoute, view, sticky, authority] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyStickyNav.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyHeaderNavAuthority.module.css"),
  ]);
  const page = `${pageRoute}\n${view}`;

  assert.match(page, /<header id="vocabulary-entry-header"/);
  assert.match(page, /<nav className=\{styles\.sectionNav\}/);
  assert.ok(
    page.indexOf("<header id=\"vocabulary-entry-header\"") < page.indexOf("<nav className={styles.sectionNav}"),
    "POS / reading navigation must follow the lexical header instead of sharing its top row",
  );

  assert.match(sticky, /VocabularyHeaderNavAuthority\.module\.css/);
  assert.match(sticky, /data-sticky-top-row/);
  assert.match(sticky, /data-sticky-action-slot/);
  assert.match(sticky, /data-sticky-nav/);
  assert.ok(
    sticky.indexOf("data-sticky-top-row") < sticky.indexOf("data-sticky-nav"),
    "sticky identity/action row must precede the dedicated navigation row",
  );

  assert.match(authority, /#vocabulary-entry-card > div\[aria-label\]/);
  assert.match(authority, /display:\s*none !important/);
  assert.match(authority, /#vocabulary-entry-card > nav/);
  assert.match(authority, /data-sticky-action-slot/);
  assert.match(authority, /data-sticky-nav/);

  assert.doesNotMatch(sticky, /Tiếng Việt|中文|Lưu|Save/);
  assert.doesNotMatch(page, /saveButton|saved-item|content-toggle/i);
});
