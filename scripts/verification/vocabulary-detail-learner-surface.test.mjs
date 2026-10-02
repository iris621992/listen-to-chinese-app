import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("Vocabulary detail keeps the server/client label boundary runtime-safe", async () => {
  const [pageRoute, view, labels] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailLabels.ts"),
  ]);

  assert.match(view, /^"use client";/);
  assert.doesNotMatch(labels, /^"use client";/);
  assert.match(labels, /export const vocabularyDetailLabelsFor/);
  assert.match(labels, /export const knowledgeLanguageUserLabel/);
  assert.match(pageRoute, /import VocabularyDetailView from "\.\/VocabularyDetailView";/);
  assert.match(pageRoute, /import \{ vocabularyDetailLabelsFor \} from "\.\/VocabularyDetailLabels";/);
  assert.doesNotMatch(pageRoute, /VocabularyDetailView,\s*\{\s*vocabularyDetailLabelsFor\s*\}/);
  assert.match(view, /vocabularyDetailLabelsFor\(interfaceLocaleCode\)/);
  assert.match(view, /knowledgeLanguageUserLabel\(interfaceLocaleCode\)/);
});

test("Vocabulary detail preserves K1B-K1F depth and authoritative Character delivery", async () => {
  const [loader, characterLoader, pageRoute, view, labels, styles, characterRail, characterRailStyles, writing, writingStyles, sticky, rich, richStyles, pronunciationMeta, pronunciationMetaStyles, knowledge, header, packageJson] = await Promise.all([
    read("lib/vocabularyDetail.ts"),
    read("lib/vocabularyCharacterDelivery.ts"),
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailLabels.ts"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetail.module.css"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyCharacterRail.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyCharacterRail.module.css"),
    read("app/knowledge/vocabulary/[publicId]/CharacterWritingPreview.tsx"),
    read("app/knowledge/vocabulary/[publicId]/CharacterWritingPreview.module.css"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyStickyNav.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.module.css"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyPronunciationMeta.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyPronunciationMeta.module.css"),
    read("app/knowledge/page.tsx"),
    read("components/Header.tsx"),
    read("package.json"),
  ]);
  const page = `${pageRoute}\n${view}\n${labels}`;

  assert.match(loader, /get_public_vocabulary_entry_v9/);
  assert.match(loader, /get_public_vocabulary_entry_v8/);
  assert.match(loader, /get_public_vocabulary_entry_v7/);
  assert.match(loader, /get_public_vocabulary_entry_v6/);
  assert.match(loader, /get_public_vocabulary_entry_v5/);
  assert.match(loader, /get_public_vocabulary_entry_v4/);
  assert.match(loader, /get_public_vocabulary_entry_v3/);
  assert.match(loader, /get_public_vocabulary_entry_v2/);
  assert.match(loader, /isMissingRpc/);
  assert.match(loader, /K1I_VOCABULARY_LOCALIZED_LEARNER_EXAMPLES_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1H_VOCABULARY_CONSTRUCTION_SCOPED_EXAMPLES_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1F_VOCABULARY_LOCALIZED_DETAIL_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1E_VOCABULARY_CHARACTER_AUDIO_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1D_VOCABULARY_RICH_SUPPORT_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1C_VOCABULARY_TE_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /hanViet:\s*contract === K1I_PROJECTION_CONTRACT[\s\S]*K1H_PROJECTION_CONTRACT[\s\S]*K1G_PROJECTION_CONTRACT[\s\S]*K1F_PROJECTION_CONTRACT/);
  assert.match(loader, /\? parseHanViet\(entry\.han_viet\)/);
  assert.match(loader, /learnerMeaning:\s*stringValue\(row\.learner_meaning\)/);
  assert.match(loader, /translation_equivalents/);
  assert.match(loader, /collocations/);
  assert.match(loader, /classifiers/);
  assert.match(loader, /examples/);
  assert.match(loader, /quick_distinctions/);
  assert.match(loader, /exactRiOwner/);
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
  assert.doesNotMatch(loader, /Ỷ TỬ|搬椅子|一把椅子/);

  assert.match(characterLoader, /get_public_vocabulary_entry_v4/);
  assert.match(characterLoader, /K1E_VOCABULARY_CHARACTER_AUDIO_PUBLIC_PROJECTION_V1/);
  assert.match(characterLoader, /lexical_context_pronunciation/);
  assert.match(characterLoader, /standalone_reading/);
  assert.match(characterLoader, /source_repository/);
  assert.match(characterLoader, /source_commit/);
  assert.match(characterLoader, /source_path/);
  assert.match(characterLoader, /structure_formula/);
  assert.match(characterLoader, /structureFormula:\s*stringValue\(character\.structure_formula\)/);

  assert.match(page, /params:\s*Promise<\{ publicId: string \}>/);
  assert.match(page, /loadVocabularyDetail\(publicId/);
  assert.match(page, /loadVocabularyCharacterDelivery\(publicId/);
  assert.match(page, /detail\.forms/);
  assert.match(page, /detail\.pronunciations/);
  assert.match(page, /groupByPartOfSpeech/);
  assert.match(page, /groupsByCode = new Map<string, PosGroup>\(\)/);
  assert.match(page, /const existing = groupsByCode\.get\(posCode\)/);
  assert.match(page, /existing\.items\.push\(item\)/);
  assert.doesNotMatch(page, /groups\[groups\.length - 1\]/);
  assert.match(page, /anchors\.set\(group\.posCode, `#pos-\$\{pronunciationPublicId\}-\$\{group\.key\}`\)/);
  assert.match(page, /<span className=\{styles\.senseNum\}>\{itemIndex \+ 1\}<\/span>/);
  assert.doesNotMatch(page, /group\.startIndex/);
  assert.doesNotMatch(page, /learnerMeaningParts|requestedLocaleTranslations/);
  assert.doesNotMatch(page, /translationEquivalents/);
  assert.match(page, /vocabularySenseHeading\(allReadingItems\[0\]\)/);
  assert.match(page, /const meaningHeading = vocabularySenseHeading\(item\)/);
  assert.match(page, /<h3 className=\{styles\.meaning\}>\{meaningHeading\}<\/h3>/);
  assert.match(page, /form\.publicId !== primaryForm\.publicId/);
  assert.doesNotMatch(page, /form\.text !== primaryForm\.text/);
  assert.match(page, /VocabularyPronunciationMeta/);
  assert.match(page, /hanViet=\{showHanViet \? detail\.hanViet\?\.text \?\? null : null\}/);
  assert.match(page, /traditionalForms=\{secondaryForms\.map/);
  assert.match(page, /translationEquivalent:\s*labels\.translationEquivalent/);
  assert.doesNotMatch(page, /extractHanCharacters/);
  assert.doesNotMatch(page, /Script=Han/);
  assert.match(page, /VocabularyStickyNav/);
  assert.match(page, /VocabularyRichSupport/);
  assert.match(page, /VocabularyCharacterRail/);
  assert.match(page, /classifiers:\s*labels\.classifiers/);
  assert.match(page, /item\.usageNote/);
  assert.match(page, /item\.memoryTip/);
  assert.match(page, /item\.itemType === "usage"/);
  assert.match(page, /styles\.subsense/);
  assert.match(page, /classifiers:\s*"Lượng từ"/);
  assert.doesNotMatch(page, /translations:\s*"Từ tương đương"/);
  assert.doesNotMatch(page, /formLabel\(/);
  assert.doesNotMatch(page, /languageVarietyLabel/);
  assert.doesNotMatch(page, /Nghĩa đặc thù|Special meaning|specialMeaning/);
  assert.doesNotMatch(page, /Ỷ TỬ|搬椅子|一把椅子/);

  assert.match(pronunciationMeta, /hanViet:\s*string \| null/);
  assert.match(pronunciationMeta, /traditionalForms:\s*string\[\]/);
  assert.match(pronunciationMeta, /labels:\s*\{/);
  assert.match(pronunciationMeta, /styles\.secondaryLine/);
  assert.match(pronunciationMeta, /styles\.dot/);
  assert.match(pronunciationMeta, /styles\.hanViet/);
  assert.match(pronunciationMeta, /styles\.traditional/);
  assert.doesNotMatch(pronunciationMeta, /Ỷ TỬ|活动|椅子/);
  assert.match(pronunciationMetaStyles, /\.pinyin/);
  assert.match(pronunciationMetaStyles, /font-size:\s*24px/);
  assert.match(pronunciationMetaStyles, /\.secondaryLine/);
  assert.match(pronunciationMetaStyles, /\.hanViet/);
  assert.match(pronunciationMetaStyles, /font-size:\s*14\.5px/);
  assert.match(pronunciationMetaStyles, /\.traditional/);

  assert.match(characterRail, /^"use client";/);
  assert.match(characterRail, /useState/);
  assert.match(characterRail, /occurrenceKey/);
  assert.match(characterRail, /selectedOccurrence/);
  assert.match(characterRail, /aria-pressed=\{selected\}/);
  assert.match(characterRail, /setSelectedKey\(key\)/);
  assert.match(characterRail, /lexicalContextPronunciation/);
  assert.match(characterRail, /character\.hanViet/);
  assert.match(characterRail, /character\.radical/);
  assert.match(characterRail, /character\.strokeCount/);
  assert.match(characterRail, /CharacterWritingPreview/);
  assert.match(characterRail, /selectedOccurrenceKey/);
  assert.match(characterRail, /return occurrence\.character\.structureFormula/);
  assert.doesNotMatch(characterRail, /structureCode\s*===\s*["']single["']/);
  assert.doesNotMatch(characterRail, /structureSingle|Single-component|Độc thể/);
  assert.doesNotMatch(characterRail, /className=\{styles\.characterCard\}/);
  assert.doesNotMatch(characterRail, /characterIdentity|identityGlyph|hanVietValue/);
  assert.doesNotMatch(characterRail, /活动|椅子|出租车|运动/);
  assert.match(characterRailStyles, /\.characterSelector/);
  assert.match(characterRailStyles, /\.characterSelectorButton\[aria-pressed="true"\]/);
  assert.match(characterRailStyles, /background:\s*#eef3ea/);
  assert.match(characterRailStyles, /color:\s*#35543a/);
  assert.match(characterRailStyles, /\.selectedCharacter/);
  assert.doesNotMatch(characterRailStyles, /\.characterIdentity/);
  assert.doesNotMatch(characterRailStyles, /grid-template-columns:\s*repeat\(2/);

  assert.match(packageJson, /"hanzi-writer":\s*"3\.7\.3"/);
  assert.match(writing, /import HanziWriter from "hanzi-writer"/);
  assert.match(writing, /chanind\/hanzi-writer-data/);
  assert.match(writing, /68d10a4b21150cae5e1ebbd223eed289cf32d90c/);
  assert.match(writing, /writing\.sourcePath !== `data\/\$\{glyph\}\.json`/);
  assert.match(writing, /raw\.githubusercontent\.com/);
  assert.match(writing, /charDataLoader/);
  assert.match(writing, /character !== glyph/);
  assert.match(writing, /Array\.isArray\(payload\.strokes\)/);
  assert.match(writing, /Array\.isArray\(payload\.medians\)/);
  assert.match(writing, /HanziWriter\.create/);
  assert.match(writing, /onLoadCharDataSuccess/);
  assert.match(writing, /void writer\?\.animateCharacter\(\)/);
  assert.match(writing, /void writerRef\.current\.animateCharacter\(\)/);
  assert.match(writing, /prefers-reduced-motion: reduce|prefersReducedMotion/);
  assert.match(writing, /showCharacter:\s*prefersReducedMotion/);
  assert.match(writing, /className=\{styles\.replayIcon\}/);
  assert.doesNotMatch(writing, /opened|setOpened|openWriting|styles\.trigger|staticGlyph/);
  assert.doesNotMatch(writing, /STROKE_STEP_MS|visibleStrokeCount|hiddenStroke|setInterval/);
  assert.match(writingStyles, /linear-gradient\(45deg/);
  assert.match(writingStyles, /linear-gradient\(-45deg/);
  assert.match(writingStyles, /\.replayIcon/);
  assert.match(writingStyles, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(writingStyles, /\.trigger|\.hiddenStroke|\.visibleStroke|\.staticGlyph/);
  assert.doesNotMatch(writingStyles, /opacity:\s*0\.08/);

  assert.match(rich, /item\.collocations\.length > 0/);
  assert.match(rich, /item\.classifiers\.length > 0/);
  assert.match(rich, /classifier\.learnerNote/);
  assert.match(rich, /collocation\.learnerMeaning/);
  assert.match(rich, /styles\.collocationMeaning/);
  assert.ok(rich.indexOf("item.examples.length > 0") < rich.indexOf("item.constructions.length > 0"));
  assert.ok(rich.indexOf("item.constructions.length > 0") < rich.indexOf("item.collocations.length > 0"));
  assert.ok(rich.indexOf("item.collocations.length > 0") < rich.indexOf("item.classifiers.length > 0"));
  assert.match(rich, /item\.examples\.length > 0/);
  assert.match(rich, /useState/);
  assert.match(rich, /item\.examples\.slice\(0, 2\)/);
  assert.match(rich, /item\.collocations\.slice\(0, 4\)/);
  assert.match(rich, /construction\.examples\.length > 0/);
  assert.match(rich, /construction\.examples\.map/);
  assert.match(rich, /aria-expanded=\{examplesExpanded\}/);
  assert.match(rich, /aria-expanded=\{collocationsExpanded\}/);
  assert.match(rich, /labels\.showMore/);
  assert.match(rich, /labels\.collapse/);
  assert.match(rich, /item\.translationEquivalents\.length > 0/);
  assert.match(rich, /data-vocabulary-module="translation-equivalents"/);
  assert.match(rich, /item\.quickDistinctions\.length > 0/);
  assert.match(rich, /distinction\.learnerExplanation/);
  assert.match(rich, /return null/);
  assert.doesNotMatch(rich, /活动|椅子|出租车|运动|搬椅子|一把椅子/);
  assert.doesNotMatch(rich, /reviewed semantic zones|Sense \/ RI|translation boundary|missing_data_behavior|INTERNAL SAMPLE|provisional/i);
  assert.match(richStyles, /\.supportStack/);
  assert.match(richStyles, /\.translationDetails/);
  assert.match(richStyles, /\.classifierBlock/);
  assert.match(richStyles, /\.collocationMeaning/);
  assert.match(richStyles, /\.exampleChinese/);
  assert.match(richStyles, /\.constructionExamples/);
  assert.match(richStyles, /\.expandButton/);
  assert.match(richStyles, /\.distinctionCard[\s\S]*border-radius:\s*6px/);
  assert.match(richStyles, /\.mistakeContrast span,[\s\S]*border-radius:\s*6px/);
  assert.match(richStyles, /\.collocationItem[\s\S]*border-radius:\s*6px/);
  assert.match(richStyles, /\.classifierList[\s\S]*border-radius:\s*6px/);
  assert.match(styles, /\.metaGrid[\s\S]*display:\s*grid/);
  assert.match(styles, /\.metaItem\s*\{[^}]*border-radius:\s*8px/);
  assert.doesNotMatch(styles, /\.metaItem\s*\{[^}]*border-radius:\s*999px/);
  assert.doesNotMatch(richStyles, /\.behaviorGrid/);

  assert.match(styles, /\.workspace/);
  assert.match(styles, /\.compactSticky/);
  assert.match(styles, /\.landscapeRail/);
  assert.match(styles, /\.hasMultipleReadings:has\(\.readingSection:target\)/);
  assert.match(styles, /\.mobileOnlyNavItem\s*\{[^}]*display:\s*none\s*!important/);
  assert.match(
    styles,
    /@media \(max-width: 620px\), \(max-width: 900px\) and \(max-height: 520px\) \{[\s\S]*?\.mobileOnlyNavItem\s*\{[^}]*display:\s*inline-flex\s*!important/,
  );
  assert.match(styles, /@media \(max-width: 900px\) and \(max-height: 520px\) and \(orientation: landscape\)/);

  assert.match(sticky, /window\.addEventListener\("scroll"/);
  assert.match(sticky, /learnerHeaderOffset/);
  assert.match(sticky, /vocabulary-entry-header/);
  assert.match(sticky, /vocabulary-entry-card/);
  assert.match(sticky, /styles\.compactSticky/);
  assert.match(sticky, /styles\.landscapeRail/);
  assert.match(
    sticky,
    /window\.scrollY \+ window\.innerHeight >= document\.documentElement\.scrollHeight - 2/,
  );
  assert.match(
    sticky,
    /if \(reachedDocumentEnd\) \{[\s\S]*?visibleItems\.at\(-1\)[\s\S]*?current = terminal\.item\.href/,
  );

  for (const source of [loader, characterLoader, page, characterRail, sticky, rich, pronunciationMeta]) {
    assert.doesNotMatch(source, /出租车|出租車|chūzūchē|xe taxi/);
    assert.doesNotMatch(source, /fake example|fake collocation|fake grammar|fake classifier/i);
  }

  assert.doesNotMatch(page, /audio|speechSynthesis|Polly/i);
  assert.doesNotMatch(page, /saveButton|saved-item|content-toggle/i);

  assert.match(knowledge, /pathname:\s*`\/knowledge\/vocabulary\/\$\{item\.publicId\}`/);
  assert.doesNotMatch(knowledge, /vocab_[a-f0-9]{64}/);
  assert.match(knowledge, /preservedLearnerContextQuery/);

  assert.match(header, /\/brand\/yunchinese-logo\.png/);
});

test("Quick Distinction contrast examples preserve optional learner translations on the shared renderer", async () => {
  const [rich, loader] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx"),
    read("lib/vocabularyDetail.ts"),
  ]);

  assert.match(loader, /sourcePinyin: string \| null/);
  assert.match(loader, /targetPinyin: string \| null/);
  assert.match(loader, /sourceTranslation: string \| null/);
  assert.match(loader, /targetTranslation: string \| null/);
  assert.match(loader, /incorrectPinyin: string \| null/);
  assert.match(loader, /incorrectTranslation: string \| null/);
  assert.match(loader, /correctPinyin: string \| null/);
  assert.match(loader, /correctTranslation: string \| null/);
  assert.match(loader, /source_pinyin/);
  assert.match(loader, /target_pinyin/);
  assert.match(loader, /incorrect_pinyin/);
  assert.match(loader, /correct_pinyin/);
  assert.match(loader, /incorrect_translation/);
  assert.match(loader, /correct_translation/);
  assert.match(loader, /source_translation/);
  assert.match(loader, /target_translation/);
  assert.match(loader, /get_public_vocabulary_entry_v9/);
  assert.match(rich, /example\.sourcePinyin/);
  assert.match(rich, /example\.targetPinyin/);
  assert.match(rich, /example\.sourceTranslation/);
  assert.match(rich, /example\.targetTranslation/);
  assert.match(rich, /mistake\.incorrectPinyin/);
  assert.match(rich, /mistake\.incorrectTranslation/);
  assert.match(rich, /mistake\.correctPinyin/);
  assert.match(rich, /mistake\.correctTranslation/);
  assert.match(rich, /distinctionPinyin/);
  assert.match(rich, /distinctionTranslation/);
  assert.match(rich, /mistakePinyin/);
  assert.match(rich, /mistakeTranslation/);
});


test("Vocabulary sense headings use shortLabel as the sole learner display authority", async () => {
  const { vocabularySenseHeading } = await import("../../lib/vocabularySenseHeading.ts");

  const differentTe = {
    shortLabel: "biết; quen biết; nhận ra",
    translationEquivalents: [{ expression: "biết" }],
  };
  assert.equal(vocabularySenseHeading(differentTe), "biết; quen biết; nhận ra");

  const sameTe = {
    shortLabel: "nhận thức",
    translationEquivalents: [{ expression: "nhận thức" }],
  };
  assert.equal(vocabularySenseHeading(sameTe), "nhận thức");

  const multipleTe = {
    shortLabel: "hiểu; nhận thức",
    translationEquivalents: [
      { expression: "hiểu" },
      { expression: "nhận thức" },
      { expression: "understand" },
    ],
  };
  assert.equal(vocabularySenseHeading(multipleTe), "hiểu; nhận thức");

  const nounRi = {
    shortLabel: "sự hiểu biết; nhận thức",
    translationEquivalents: [
      { expression: "nhận thức" },
      { expression: "sự hiểu biết" },
    ],
  };
  assert.equal(vocabularySenseHeading(nounRi), "sự hiểu biết; nhận thức");
});
