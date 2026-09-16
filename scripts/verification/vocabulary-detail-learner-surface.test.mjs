import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("Vocabulary detail preserves K1B-K1F depth and authoritative Character delivery", async () => {
  const [loader, characterLoader, page, styles, characterRail, characterRailStyles, writing, writingStyles, sticky, rich, richStyles, pronunciationMeta, pronunciationMetaStyles, knowledge, header, packageJson] = await Promise.all([
    read("lib/vocabularyDetail.ts"),
    read("lib/vocabularyCharacterDelivery.ts"),
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
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

  assert.match(loader, /get_public_vocabulary_entry_v5/);
  assert.match(loader, /get_public_vocabulary_entry_v4/);
  assert.match(loader, /get_public_vocabulary_entry_v3/);
  assert.match(loader, /get_public_vocabulary_entry_v2/);
  assert.match(loader, /isMissingRpc/);
  assert.match(loader, /K1F_VOCABULARY_LOCALIZED_DETAIL_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1E_VOCABULARY_CHARACTER_AUDIO_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1D_VOCABULARY_RICH_SUPPORT_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1C_VOCABULARY_TE_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /hanViet:\s*contract === K1F_PROJECTION_CONTRACT \? parseHanViet\(entry\.han_viet\) : null/);
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
  assert.match(page, /learnerMeaningParts/);
  assert.match(page, /form\.publicId !== primaryForm\.publicId/);
  assert.doesNotMatch(page, /form\.text !== primaryForm\.text/);
  assert.match(page, /VocabularyPronunciationMeta/);
  assert.match(page, /hanViet=\{detail\.hanViet\?\.text \?\? null\}/);
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
  assert.doesNotMatch(page, /Ỷ TỬ|搬椅子|一把椅子/);

  assert.match(pronunciationMeta, /hanViet:\s*string \| null/);
  assert.match(pronunciationMeta, /hanViet \? \(/);
  assert.match(pronunciationMeta, /styles\.dot/);
  assert.match(pronunciationMeta, /styles\.hanViet/);
  assert.doesNotMatch(pronunciationMeta, /Ỷ TỬ|活动|椅子/);
  assert.match(pronunciationMetaStyles, /\.pinyin/);
  assert.match(pronunciationMetaStyles, /font-size:\s*21px/);
  assert.match(pronunciationMetaStyles, /\.hanViet/);
  assert.match(pronunciationMetaStyles, /font-size:\s*17px/);
  assert.match(pronunciationMetaStyles, /\.dot/);

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
  assert.match(characterRailStyles, /background:\s*#30352f/);
  assert.match(characterRailStyles, /color:\s*#fff/);
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
  assert.ok(rich.indexOf("item.classifiers.length > 0") < rich.indexOf("item.collocations.length > 0 ? ("));
  assert.match(rich, /item\.examples\.length > 0/);
  assert.match(rich, /item\.quickDistinctions\.length > 0/);
  assert.match(rich, /distinction\.learnerExplanation/);
  assert.match(rich, /return null/);
  assert.doesNotMatch(rich, /活动|椅子|出租车|运动|搬椅子|一把椅子/);
  assert.doesNotMatch(rich, /reviewed semantic zones|Sense \/ RI|translation boundary|missing_data_behavior|INTERNAL SAMPLE|provisional/i);
  assert.match(richStyles, /\.supportStack/);
  assert.match(richStyles, /\.collocationMeaning/);
  assert.match(richStyles, /\.exampleChinese/);

  assert.match(styles, /\.workspace/);
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

  for (const source of [loader, characterLoader, page, characterRail, sticky, rich, pronunciationMeta]) {
    assert.doesNotMatch(source, /出租车|出租車|chūzūchē|xe taxi/);
    assert.doesNotMatch(source, /fake example|fake collocation|fake grammar|fake classifier/i);
  }

  assert.doesNotMatch(page, /audio|speechSynthesis|Polly/i);
  assert.doesNotMatch(page, /saveButton|saved-item|content-toggle/i);

  assert.match(knowledge, /href:\s*"\/knowledge\/vocabulary"/);
  assert.doesNotMatch(knowledge, /vocab_[a-f0-9]{64}/);
  assert.match(knowledge, /preservedLearnerContextQuery/);

  assert.match(header, /\/brand\/yunchinese-logo\.png/);
});
