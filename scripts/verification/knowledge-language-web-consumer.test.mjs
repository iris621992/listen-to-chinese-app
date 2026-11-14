import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

test("Knowledge language state is canonical and independent from interface locale", async () => {
  const [contract, context, header, searchPage, searchForm, detailSearch] = await Promise.all([
    read("lib/knowledgeLanguage.ts"),
    read("lib/proficiencyContext.ts"),
    read("components/Header.tsx"),
    read("app/knowledge/page.tsx"),
    read("app/knowledge/vocabulary/VocabularySearchForm.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailSearch.tsx"),
  ]);

  assert.match(contract, /KNOWLEDGE_LANGUAGE_PARAM = "knowledgeLang"/u);
  assert.match(contract, /KnowledgeLanguage = "user" \| "zh"/u);
  assert.match(contract, /requestedLocaleCode: "zh"/u);
  assert.match(contract, /fallbackLocaleCode: "zh"/u);
  assert.match(contract, /exactContentLocaleCode: "zh"/u);

  assert.match(context, /knowledgeLang\?: string \| null/u);
  assert.match(context, /query\[KNOWLEDGE_LANGUAGE_PARAM\] = knowledgeLang/u);

  assert.match(header, /path\.startsWith\("\/knowledge"\)/u);
  assert.match(header, /nextSearchParams\.set\(INTERFACE_LOCALE_PARAM, nextInterfaceLocaleCode\)/u);
  assert.match(header, /nextSearchParams\.set\("lang", nextInterfaceLocaleCode\)/u);
  assert.match(header, /isKnowledgeLanguageValue\(nextSearchParams\.get\(KNOWLEDGE_LANGUAGE_PARAM\)\)/u);

  assert.match(searchPage, /knowledgeLang\?: string/u);
  assert.match(searchPage, /knowledgeLang: query\?\.knowledgeLang/u);
  assert.match(searchPage, /loadVocabularySearch\(rawQuery, interfaceLocale\.code, searchBy\)/u);
  assert.match(searchForm, /knowledgeLang\?: string/u);
  assert.match(detailSearch, /"knowledgeLang"/u);
});

test("Vocabulary Detail exact Chinese mode consumes truthful localized projection data", async () => {
  const [pageRoute, view, labels, loader, toggle, sticky, rich, characterRail] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailLabels.ts"),
    read("lib/vocabularyDetail.ts"),
    read("app/knowledge/vocabulary/[publicId]/KnowledgeLanguageToggle.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyStickyNav.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyCharacterRail.tsx"),
  ]);
  const page = `${pageRoute}\n${view}\n${labels}`;

  assert.match(page, /resolveKnowledgeLanguage\(query\?\.knowledgeLang\)/u);
  assert.match(page, /resolveKnowledgeContentLocale\(interfaceLocale\.code, knowledgeLanguage\)/u);
  assert.match(page, /loadVocabularyDetail\(publicId, knowledgeContentLocale\)/u);
  assert.match(page, /loadVocabularyCharacterDelivery\(publicId, interfaceLocale\.code\)/u);
  assert.match(page, /KnowledgeLanguageToggle/u);
  assert.match(page, /knowledgeLanguageUserLabel\(interfaceLocaleCode\)/u);
  assert.match(page, /if \(localeCode === "vi"\) return "Tiếng Việt"/u);
  assert.match(page, /if \(localeCode === "en"\) return "English"/u);
  assert.match(page, /const showHanViet = interfaceLocaleCode === "vi" && knowledgeLanguage === "user"/u);
  assert.equal((page.match(/showHanViet=\{showHanViet\}/gu) ?? []).length, 2);
  assert.doesNotMatch(page, /showHanViet=\{knowledgeLanguage !== "zh"\}/u);

  assert.match(loader, /KnowledgeContentLocaleRequest/u);
  assert.match(loader, /exactContentLocaleCode/u);
  assert.match(loader, /K1L_PROJECTION_CONTRACT/u);
  assert.match(loader, /K1J_PROJECTION_CONTRACT/u);
  assert.match(loader, /K1I_PROJECTION_CONTRACT/u);
  assert.match(loader, /K1H_PROJECTION_CONTRACT/u);
  assert.match(loader, /K1G_PROJECTION_CONTRACT/u);
  assert.match(loader, /K1F_PROJECTION_CONTRACT/u);
  assert.match(
    loader,
    /\[K1L_PROJECTION_CONTRACT, K1J_PROJECTION_CONTRACT, K1I_PROJECTION_CONTRACT, K1H_PROJECTION_CONTRACT, K1G_PROJECTION_CONTRACT, K1F_PROJECTION_CONTRACT\]\.includes/u,
  );
  assert.match(loader, /detail\.requestedLocale !== exactContentLocaleCode/u);
  assert.match(loader, /item\.contentLocale !== exactContentLocaleCode/u);
  assert.match(loader, /translationEquivalents: exactContentLocaleCode === "zh"/u);
  assert.match(loader, /learnerMeaning: null, contentLocale: null/u);
  assert.match(loader, /learnerNote: null, contentLocale: null/u);
  assert.match(loader, /translationText: null, contentLocale: null/u);
  assert.match(loader, /learnerExplanation: null/u);
  assert.match(loader, /sourceUseWhen: null/u);
  assert.match(loader, /targetUseWhen: null/u);
  assert.match(loader, /contentLocale: null/u);
  assert.match(loader, /const readingItemIds = new Set/u);
  assert.match(loader, /pronunciations\.flatMap/u);
  assert.match(loader, /item\.parentPublicId !== null && !readingItemIds\.has\(item\.parentPublicId\)/u);
  assert.match(loader, /if \(hasOrphanReadingItem\) return null/u);

  assert.match(toggle, /next\.set\(KNOWLEDGE_LANGUAGE_PARAM, nextValue\)/u);
  assert.match(toggle, /router\.replace/u);
  assert.match(toggle, /scroll: false/u);
  assert.match(toggle, />\s*中文\s*</u);
  assert.match(sticky, /KnowledgeLanguageToggle/u);
  assert.match(rich, /distinction\.learnerExplanation \? <p>/u);
  assert.match(characterRail, /showHanViet && character\.hanViet/u);
});

test("Vocabulary Detail ports approved segmented toggle without fake Save", async () => {
  const [pageRoute, view, sticky, toggle, styles] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyStickyNav.tsx"),
    read("app/knowledge/vocabulary/[publicId]/KnowledgeLanguageToggle.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetail.module.css"),
  ]);
  const page = `${pageRoute}\n${view}`;

  assert.match(styles, /\.contentToggle\s*\{[\s\S]*display:\s*inline-flex/u);
  assert.match(styles, /border:\s*1px solid #d7d0c2/u);
  assert.match(styles, /background:\s*#f8f5ee/u);
  assert.match(styles, /border-radius:\s*12px/u);
  assert.match(styles, /\.contentToggleButton\[aria-pressed="true"\]/u);
  assert.match(styles, /box-shadow:\s*0 2px 8px rgba\(45, 48, 42, 0\.08\)/u);
  assert.match(styles, /\.compactSticky \.contentToggleButton/u);
  assert.match(toggle, /data-knowledge-language-toggle="true"/u);
  assert.doesNotMatch(page, /saveButton|sticky-save|main-save|☆ Lưu|Đã lưu/u);
  assert.doesNotMatch(sticky, /sticky-save|☆ Lưu|Đã lưu/u);
});


test("Structured Quick Distinction renders authored source/target cards without prose parsing", async () => {
  const [pageRoute, view, loader, rich, styles] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx"),
    read("lib/vocabularyDetail.ts"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.module.css"),
  ]);
  const page = `${pageRoute}\n${view}`;

  assert.match(loader, /sourceUseWhen: string \| null/u);
  assert.match(loader, /targetUseWhen: string \| null/u);
  assert.match(loader, /contrastExamples: VocabularyQuickDistinctionContrastExample\[\]/u);
  assert.match(loader, /stringValue\(row\.source_use_when\)/u);
  assert.match(loader, /stringValue\(row\.target_use_when\)/u);
  assert.match(loader, /asArray\(row\.contrast_examples\)/u);
  assert.match(loader, /source_expression/u);
  assert.match(loader, /target_expression/u);

  assert.match(page, /sourceExpression=\{detail\.displayForm\}/u);
  assert.match(rich, /distinction\.sourceUseWhen/u);
  assert.match(rich, /distinction\.targetUseWhen/u);
  assert.match(rich, /example\.sourceExpression/u);
  assert.match(rich, /example\.targetExpression/u);
  assert.match(rich, /if \(!structured\)/u);
  assert.match(rich, /distinction\.learnerExplanation \? <p>/u);

  assert.doesNotMatch(rich, /distinction\.learnerExplanation\.(?:split|substring|match|replace)\(/u);
  assert.doesNotMatch(rich, /substring\(/u);
  assert.doesNotMatch(rich, /learnerExplanation\.(?:match|replace)\(/u);

  assert.match(styles, /\.distinctionCompareGrid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/u);
  assert.match(styles, /@container \(max-width: 620px\)[\s\S]*\.distinctionCompareGrid\s*\{[\s\S]*grid-template-columns:\s*1fr/u);
});

test("Vocabulary final visual corrections keep exact toggle labels and sticky rail persistence", async () => {
  const [pageRoute, view, labels, characterStyles] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailLabels.ts"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyCharacterRail.module.css"),
  ]);
  const page = `${pageRoute}\n${view}\n${labels}`;

  assert.match(page, /return "Tiếng Việt"/u);
  assert.match(page, /return "English"/u);
  assert.doesNotMatch(page, /userLanguageLabel=\{interfaceLocale\.label\}/u);
  assert.match(page, /const showHanViet = interfaceLocaleCode === "vi" && knowledgeLanguage === "user"/u);
  assert.doesNotMatch(page, /interfaceLocaleCode === "en"\s*&&\s*knowledgeLanguage === "user"/u);

  assert.match(
    characterStyles,
    /\.desktopRail\s*\{[\s\S]*display:\s*block;[\s\S]*align-self:\s*stretch;/u,
  );
  assert.match(characterStyles, /\.characterRailInner\s*\{[\s\S]*position:\s*sticky;[\s\S]*top:\s*100px/u);
  assert.match(characterStyles, /@media \(max-width: 800px\)[\s\S]*\.characterRailInner\s*\{[\s\S]*top:\s*74px/u);
  assert.match(
    characterStyles,
    /@media \(max-width: 620px\), \(max-width: 900px\) and \(max-height: 520px\)[\s\S]*\.desktopRail\s*\{[\s\S]*display:\s*none;[\s\S]*\.embedded \.characterRailInner\s*\{[\s\S]*position:\s*static;/u,
  );
});


function runHeaderLocaleSwitch(header, { pathname, from, to, query }) {
  const match = header.match(
    /  function handleLanguageChange\(nextInterfaceLocaleCode: string\) \{\n([\s\S]*?)\n  \}\n\n  return \(\n    <HeaderContent/u,
  );
  assert.ok(match, "Use the actual shared Header language handler, not a copied implementation");
  const navigations = [];
  const ctx = {
    visibleInterfaceLocales: [{ code: "vi" }, { code: "en" }],
    pathname,
    interfaceLocale: { code: from },
    searchParams: new URLSearchParams(query),
    URLSearchParams,
    INTERFACE_LOCALE_PARAM: "uiLang",
    KNOWLEDGE_LANGUAGE_PARAM: "knowledgeLang",
    isKnowledgeLanguageValue: (value) => value === "user" || value === "zh",
    router: {
      push(href, options) {
        navigations.push({ href, scroll: options?.scroll });
      },
    },
  };
  vm.runInNewContext(
    "function handleLanguageChange(nextInterfaceLocaleCode) {\n"
      + match[1]
      + "\n}\nhandleLanguageChange("
      + JSON.stringify(to)
      + ");",
    ctx,
  );
  return navigations;
}

test("Vocabulary detail VI/EN switching preserves current scroll without losing authored-page context", async () => {
  const header = await read("components/Header.tsx");
  const detail = "/knowledge/vocabulary/vocab_" + "a".repeat(64);
  const queries = [
    { from: "vi", to: "en", knowledgeLang: "user" },
    { from: "en", to: "vi", knowledgeLang: "zh" },
  ];

  for (const { from, to, knowledgeLang } of queries) {
    const navigations = runHeaderLocaleSwitch(header, {
      pathname: detail,
      from,
      to,
      query: "uiLang=" + from + "&lang=" + from + "&knowledgeLang=" + knowledgeLang
        + "&levelSystem=gf0025_2021&level=2&cursor=legacy",
    });
    assert.equal(navigations.length, 1);
    assert.equal(navigations[0].scroll, false, from + " → " + to + ": keep the current reading position");
    const href = new URL(navigations[0].href, "https://yunchinese.example");
    assert.equal(href.pathname, detail, "The headword route must not change");
    assert.equal(href.searchParams.get("uiLang"), to);
    assert.equal(href.searchParams.get("lang"), to);
    assert.equal(href.searchParams.get("knowledgeLang"), knowledgeLang);
    assert.equal(href.searchParams.get("levelSystem"), "gf0025_2021");
    assert.equal(href.searchParams.get("level"), "2");
    assert.equal(href.searchParams.has("cursor"), false, "Existing cursor behavior stays unchanged");
  }

  assert.equal(
    (header.match(/onChange=\{\(event\) => onLanguageChange\?\.\(event\.target\.value\)\}/gu) ?? []).length,
    2,
    "Desktop and mobile language controls must use the same scoped handler",
  );
});

test("Vocabulary-only scroll preservation leaves all other Header navigation unchanged", async () => {
  const header = await read("components/Header.tsx");
  const notDetail = [
    "/",
    "/knowledge",
    "/knowledge/vocabulary",
    "/knowledge/vocabulary/search",
    "/knowledge/vocabulary/vocab_" + "a".repeat(63),
    "/knowledge/vocabulary/vocab_" + "a".repeat(64) + "/extra",
    "/practice",
  ];
  for (const pathname of notDetail) {
    const navigations = runHeaderLocaleSwitch(header, {
      pathname,
      from: "vi",
      to: "en",
      query: "uiLang=vi&lang=vi&knowledgeLang=user",
    });
    assert.equal(navigations.length, 1);
    assert.equal(navigations[0].scroll, undefined, "Do not alter " + pathname + "'s prior scroll behavior");
    const url = new URL(navigations[0].href, "https://yunchinese.example");
    assert.equal(url.pathname, pathname);
  }

  const blocked = runHeaderLocaleSwitch(header, {
    pathname: "/knowledge/vocabulary/vocab_" + "a".repeat(64),
    from: "vi",
    to: "ar",
    query: "uiLang=vi&lang=vi",
  });
  assert.equal(blocked.length, 0, "Hidden interface locales must remain unavailable");

  const knowledgeToggle = await read("app/knowledge/vocabulary/[publicId]/KnowledgeLanguageToggle.tsx");
  assert.match(knowledgeToggle, /router\.replace\(.+, \{ scroll: false \}\)/u);
});
