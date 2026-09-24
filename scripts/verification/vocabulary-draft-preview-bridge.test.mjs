import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("Vocabulary Draft Preview uses the exact shared learner renderer", async () => {
  const [publicPage, view, previewBridge, previewLayout] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx"),
    read("app/preview/vocabulary/VocabularyDraftPreviewBridge.tsx"),
    read("app/preview/vocabulary/layout.tsx"),
  ]);

  assert.match(publicPage, /VocabularyDetailView/);
  assert.match(publicPage, /<VocabularyDetailView/);
  assert.match(previewBridge, /VocabularyDetailView/);
  assert.match(previewBridge, /<VocabularyDetailView/);
  assert.match(previewLayout, /VocabularyDetailSearch/);

  assert.match(view, /VocabularyStickyNav/);
  assert.match(view, /VocabularyRichSupport/);
  assert.match(view, /VocabularyCharacterRail/);
  assert.match(view, /VocabularyPronunciationMeta/);
  assert.match(view, /VocabularyDetail\.module\.css/);
  assert.match(view, /constructions: labels\.constructions/);
  assert.match(view, /commonMistakes: labels\.commonMistakes/);
  assert.match(previewBridge, /parseVocabularyDraftPreviewCharacters/);
  assert.match(previewBridge, /characters=\{characters\}/);

  assert.doesNotMatch(previewBridge, /styles\.entryCard|styles\.senseStack|styles\.readingFlow/);
});

test("Vocabulary Draft Preview handoff is short-lived, opener-bound, and fail closed", async () => {
  const [previewBridge, previewPage, nextConfig] = await Promise.all([
    read("app/preview/vocabulary/VocabularyDraftPreviewBridge.tsx"),
    read("app/preview/vocabulary/page.tsx"),
    read("next.config.ts"),
  ]);

  assert.match(previewBridge, /HANDOFF_TTL_MS = 10 \* 60 \* 1000/);
  assert.match(previewBridge, /window\.opener/);
  assert.match(previewBridge, /event\.source !== opener/);
  assert.match(previewBridge, /validatedAdminStagingOrigin/);
  assert.match(previewBridge, /searchParams\.get\("sourceOrigin"\)/);
  assert.match(previewBridge, /event\.origin !== openerOrigin/);
  assert.match(previewBridge, /opener\.postMessage\(ready, openerOrigin\)/);
  assert.doesNotMatch(previewBridge, /postMessage\([^\n]+, "\*"/);
  assert.match(previewBridge, /sessionStorage/);
  assert.match(previewBridge, /HANDOFF_EXPIRED/);
  assert.match(previewBridge, /OWNER_HANDOFF_REQUIRED/);
  assert.match(previewBridge, /HANDOFF_TIMEOUT/);
  assert.match(previewBridge, /payloads\[locale\]/);

  assert.doesNotMatch(previewBridge, /fetch\(|createClient\(|service[_-]?role|get_public_vocabulary_entry/i);
  assert.doesNotMatch(previewBridge, /JSON\.stringify\([^\n]*URLSearchParams|payload=.*JSON/i);

  assert.match(previewPage, /index: false/);
  assert.match(previewPage, /follow: false/);
  assert.match(nextConfig, /source: "\/preview\/vocabulary"/);
  assert.match(nextConfig, /Cache-Control", value: "no-store, max-age=0"/);
  assert.match(nextConfig, /X-Robots-Tag", value: "noindex, nofollow, noarchive"/);
});

test("Vocabulary Draft Preview parser accepts Draft identity without weakening public loader", async () => {
  const [draftParser, publicLoader] = await Promise.all([
    read("lib/vocabularyDraftPreview.ts"),
    read("lib/vocabularyDetail.ts"),
  ]);

  assert.match(draftParser, /preview_only !== true/);
  assert.match(draftParser, /K1F_VOCABULARY_LOCALIZED_DETAIL_PUBLIC_PROJECTION_V1/);
  assert.match(draftParser, /publicId: "draft-preview"/);
  assert.match(draftParser, /content_locale/);
  assert.match(draftParser, /translation_equivalents/);
  assert.match(draftParser, /collocations/);
  assert.match(draftParser, /classifiers/);
  assert.match(draftParser, /examples/);
  assert.match(draftParser, /quick_distinctions/);
  assert.match(draftParser, /lexical_constructions/);
  assert.match(draftParser, /common_mistakes/);
  assert.match(draftParser, /knowledge_links/);
  assert.match(draftParser, /practice_links/);
  assert.match(draftParser, /usage_context/);
  assert.match(draftParser, /admin_review_extensions/);
  assert.match(draftParser, /parseVocabularyDraftPreviewCharacters/);
  assert.match(draftParser, /parentPublicId/);

  assert.match(publicLoader, /VOCABULARY_PUBLIC_ID_PATTERN/);
  assert.match(publicLoader, /if \(!VOCABULARY_PUBLIC_ID_PATTERN\.test\(publicId\)\)/);
  assert.doesNotMatch(publicLoader, /draft-preview/);
});

test("Vocabulary final approved learner modules stay on the shared renderer", async () => {
  const [rich, loader] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx"),
    read("lib/vocabularyDetail.ts"),
  ]);

  assert.match(rich, /data-vocabulary-module="constructions"/);
  assert.match(rich, /data-vocabulary-module="common-mistakes"/);
  assert.match(rich, /data-vocabulary-module="quick-distinction"/);
  assert.match(rich, /data-vocabulary-module="relations"/);
  assert.match(rich, /item\.examples\.length/);
  assert.match(rich, /item\.collocations\.length/);
  assert.match(rich, /item\.classifiers\.length/);

  assert.match(loader, /get_public_vocabulary_entry_v6/);
  assert.match(loader, /get_public_vocabulary_entry_v5/);
  assert.match(loader, /K1G_VOCABULARY_FINAL_APPROVED_SURFACE_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /constructions:/);
  assert.match(loader, /commonMistakes:/);
  assert.match(loader, /knowledgeLinks:/);
  assert.match(loader, /practiceLinks:/);
});


test("Vocabulary Draft Preview parser preserves localized Quick Distinction contrast translations", async () => {
  const draftParser = await read("lib/vocabularyDraftPreview.ts");

  assert.match(draftParser, /sourceTranslation: stringValue\(row\.source_translation\)/);
  assert.match(draftParser, /targetTranslation: stringValue\(row\.target_translation\)/);
  assert.match(draftParser, /contentLocale: stringValue\(row\.content_locale\)/);
});
