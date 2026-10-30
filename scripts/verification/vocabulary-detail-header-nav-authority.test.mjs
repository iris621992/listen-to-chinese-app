import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("Vocabulary Detail keeps lexical identity above dedicated POS/read navigation without stacked reconciliation CSS", async () => {
  const [pageRoute, view, sticky, styles] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyStickyNav.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetail.module.css"),
  ]);
  const page = `${pageRoute}\n${view}`;

  assert.match(page, /<header id="vocabulary-entry-header"/);
  assert.match(page, /<nav className=\{styles\.sectionNav\}/);
  assert.ok(
    page.indexOf("<header id=\"vocabulary-entry-header\"") < page.indexOf("<nav className={styles.sectionNav}"),
    "POS / reading navigation must follow the lexical header instead of sharing its top row",
  );

  assert.match(sticky, /data-sticky-top-row/);
  assert.match(sticky, /data-sticky-action-slot/);
  assert.match(sticky, /data-sticky-nav/);
  assert.ok(
    sticky.indexOf("data-sticky-top-row") < sticky.indexOf("data-sticky-nav"),
    "sticky identity/action row must precede the dedicated navigation row",
  );

  assert.match(styles, /\.posSummary\s*\{[\s\S]*display:\s*none/);
  assert.match(styles, /\.sectionNav\s*\{[\s\S]*position:\s*static/);
  assert.match(styles, /data-vocabulary-sticky="true"/);
  assert.match(styles, /data-sticky-top-row/);
  assert.match(styles, /data-sticky-action-slot/);
  assert.match(styles, /\.compactNav/);

  assert.doesNotMatch(sticky, /VocabularyDemoFidelity|VocabularyTypographyRuntime|VocabularyVisualReconciliation|VocabularyHeaderNavAuthority/);
  assert.doesNotMatch(sticky, /Tiếng Việt|中文|Lưu|Save/);
  assert.doesNotMatch(page, /saveButton|saved-item|content-toggle/i);
});


test("Demo v8.3.7 preserves in-page POS anchors and authored example content", async () => {
  const [view, styles, rich, richStyles] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetail.module.css"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.module.css"),
  ]);
  assert.match(view, /data-demo-v837="true"/u);
  assert.match(view, /item\.examples\[0\]\.chineseText/u);
  assert.match(view, /id=\{\x60pos-\$\{pronunciation\.publicId\}-\$\{group\.key\}\x60\}/u);
  assert.match(styles, /data-demo-v837="true"\] \.sectionNav \{ position: sticky/u);
  assert.match(styles, /\.representativeExample/u);
  assert.match(rich, /data-vocabulary-module="related-words"/u);
  assert.match(rich, /relationType="near_synonym"/u);
  assert.match(rich, /<section className=\{styles\.translationDetails\}/u);
  assert.match(rich, /className=\{styles\.distinctionSummary\}/u);
  assert.match(richStyles, /\.collocationList \{ grid-template-columns: repeat\(3/u);
  assert.doesNotMatch(view, /Wǒ dǒng|不懂就问|hiểu; rành/u);
});
