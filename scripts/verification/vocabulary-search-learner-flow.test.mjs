import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(path, "utf8");

const HARD_CODED_VOCAB_ID = /vocab_[a-f0-9]{64}/u;

test("Knowledge Search is canonical at /knowledge and uses the public Vocabulary projection without fabricating unsupported families", async () => {
  const [adapter, knowledgePage, legacySearchPage, familySelector] = await Promise.all([
    read("lib/vocabularySearch.ts"),
    read("app/knowledge/page.tsx"),
    read("app/knowledge/vocabulary/page.tsx"),
    read("app/knowledge/vocabulary/KnowledgeFamilySelector.tsx"),
  ]);

  assert.match(adapter, /get_public_vocabulary_entries/u);
  assert.match(adapter, /K1B_VOCABULARY_PUBLIC_PROJECTION_V1/u);
  assert.match(adapter, /p_query:\s*query/u);
  assert.match(adapter, /p_limit:\s*RESULT_LIMIT/u);
  assert.match(adapter, /p_search_scope:\s*searchBy === "vi"/u);
  assert.match(adapter, /p_search_locale_codes:\s*searchBy === "vi"/u);
  assert.match(adapter, /p_locale_code:\s*learnerLocale\.code/u);
  assert.doesNotMatch(adapter, /p_search_locale_codes:\s*\[learnerLocale\.code\]/u);
  assert.doesNotMatch(adapter, /p_search_locale_codes:\s*enabledInterfaceLocaleCodes/u);
  assert.doesNotMatch(adapter, /\.from\(/u, "Search must use the learner-safe RPC rather than direct table reads.");

  assert.match(knowledgePage, /loadVocabularySearch\(rawQuery/u);
  assert.match(knowledgePage, /pathname:\s*`\/knowledge\/vocabulary\/\$\{item\.publicId\}`/u);
  assert.match(knowledgePage, /family:\s*selectedFamilies/u);
  assert.match(knowledgePage, /unsupportedSelected/u);
  assert.match(knowledgePage, /hiện chỉ Từ vựng có chức năng tìm kiếm đang hoạt động/u);
  assert.match(knowledgePage, /các loại kiến thức khác sẽ chỉ hiển thị khi có dữ liệu và chức năng tìm kiếm thực tế/u);
  assert.doesNotMatch(knowledgePage, /backend hiện mới chứng minh tìm kiếm Từ vựng/u);
  assert.doesNotMatch(knowledgePage, /các family khác giữ fail-closed/u);
  assert.doesNotMatch(knowledgePage, /Knowledge Hub/u);
  assert.doesNotMatch(knowledgePage, HARD_CODED_VOCAB_ID);

  assert.match(legacySearchPage, /redirect\(serialized \? `\/knowledge\?\$\{serialized\}` : "\/knowledge"\)/u);
  assert.match(legacySearchPage, /URLSearchParams/u);
  assert.match(legacySearchPage, /params\.append\(key, item\)/u);

  assert.match(familySelector, /PRIMARY_FAMILIES/u);
  assert.match(familySelector, /FAMILY_OPTIONS/u);
  assert.match(familySelector, /MORE_FAMILIES/u);
  assert.match(familySelector, /data-family-dropdown/u);
  assert.match(familySelector, /data-family-trigger/u);
  assert.match(familySelector, /aria-pressed=\{allSelected\}/u);
  assert.match(familySelector, /name="family"/u);
  assert.doesNotMatch(familySelector, /<legend/u);
  assert.match(familySelector, /aria-label=\{labels\.groupLabel\}/u);
});

test("Search forms preserve learner context, family selection, and the originating query on canonical Knowledge Search", async () => {
  const [searchForm, detailSearch, detailLayout] = await Promise.all([
    read("app/knowledge/vocabulary/VocabularySearchForm.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetailSearch.tsx"),
    read("app/knowledge/vocabulary/[publicId]/layout.tsx"),
  ]);

  for (const key of ["uiLang", "lang", "levelSystem", "level"]) {
    assert.match(detailSearch, new RegExp(`"${key}"`, "u"));
  }

  assert.match(searchForm, /action = "\/knowledge"/u);
  assert.match(searchForm, /method="get"/u);
  assert.match(searchForm, /name="q"/u);
  assert.match(searchForm, /Object\.entries\(context\)/u);
  assert.match(searchForm, /initialFamilies/u);
  assert.match(searchForm, /name="searchBy"/u);
  assert.match(searchForm, /defaultValue=\{initialSearchBy\}/u);
  assert.match(detailSearch, /useSearchParams/u);
  assert.match(detailSearch, /params\.get\("q"\)/u);
  assert.match(detailSearch, /params\.getAll\("family"\)/u);
  assert.match(detailSearch, /params\.get\("searchBy"\)/u);
  assert.match(detailSearch, /pathname:\s*"\/knowledge"/u);
  assert.match(detailSearch, /q:\s*query/u);
  assert.match(detailSearch, /family:\s*families/u);
  assert.match(detailSearch, /searchBy/u);
  assert.match(detailLayout, /<VocabularyDetailSearch \/>/u);
});

test("Search adapter validates public IDs and bounds user input", async () => {
  const adapter = await read("lib/vocabularySearch.ts");

  assert.match(adapter, /MAX_QUERY_LENGTH = 80/u);
  assert.match(adapter, /RESULT_LIMIT = 30/u);
  assert.match(adapter, /VOCABULARY_PUBLIC_ID_PATTERN/u);
  assert.match(adapter, /query\.length > MAX_QUERY_LENGTH/u);
  assert.match(adapter, /items: \[\]/u);
});


test("Bounded Knowledge Search control behavior preserves channel, locale, and URL semantics", async () => {
  const [adapter, page, form, family, css] = await Promise.all([
    read("lib/vocabularySearch.ts"),
    read("app/knowledge/page.tsx"),
    read("app/knowledge/vocabulary/VocabularySearchForm.tsx"),
    read("app/knowledge/vocabulary/KnowledgeFamilySelector.tsx"),
    read("app/knowledge/vocabulary/VocabularySearch.module.css"),
  ]);
  assert.match(adapter, /export function normalizeSearchBy/u);
  assert.match(adapter, /value === "written" \|\| value === "pinyin" \|\| value === "vi" \|\| value === "en"/u);
  assert.match(adapter, /searchBy === "vi" \|\| searchBy === "en" \? "learner" : searchBy/u);
  assert.match(adapter, /searchBy === "vi" \? \["vi"\] : searchBy === "en" \? \["en"\] : \["en", "vi"\]/u);
  assert.match(page, /normalizeSearchBy\(query\?\.searchBy\)/u);
  assert.match(page, /loadVocabularySearch\(rawQuery, interfaceLocale\.code, searchBy\)/u);
  assert.match(page, /searchScopeLabels=\{labels\.searchScope\}/u);
  assert.match(page, /searchBy !== "all" \? \{ searchBy \} : \{\}/u);
  assert.doesNotMatch(page, /className=\{styles\.searchHelp\}/u);
  for (const option of ["all", "written", "pinyin", "vi", "en"]) {
    assert.match(form, new RegExp('value="' + option + '"', "u"));
  }
  for (const familyName of ["vocabulary","characters","grammar","comparisons","idioms"]) {
    assert.match(family,new RegExp('"' + familyName + '"',"u"));
  }
  assert.match(css, /\[data-search-controls\]/u);
  assert.match(css, /@media \(max-width: 520px\)/u);
  assert.match(css, /orientation: landscape/u);
});


test("Family menu checkbox remains compact despite global 44px input minimum", async () => {
  const [globalCss, css] = await Promise.all([
    read("app/globals.css"),
    read("app/knowledge/vocabulary/VocabularySearch.module.css"),
  ]);
  assert.match(globalCss, /textarea \{ min-height: 44px; \}/u);
  assert.match(css, /\.searchForm \[data-family-option\] input\[type="checkbox"\] \{/u);
  assert.match(css, /min-height: 18px;/u);
  assert.match(css, /height: 18px;/u);
  assert.match(css, /max-height: min\(300px, 40dvh\)/u);
  assert.match(css, /overflow-y: auto;/u);
  assert.match(css, /max-height: min\(200px, 47dvh\)/u);
});
