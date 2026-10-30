import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFile(path, "utf8");

// Execute the real component with controlled hooks, pending loads, timers and sizes.
async function writingLifecycleHarness(realRenderer = false, intrinsicGrid = false) {
  const source = await read("app/knowledge/vocabulary/[publicId]/CharacterWritingPreview.tsx");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const hooks = [];
  const effects = [];
  const writers = [];
  const observers = [];
  const requests = [];
  const timers = new Map();
  const clipObservers = [];
  const clipWrites = [];
  const browserWindow = {
    location: { href: "https://learner.test/preview/vocabulary?uiLang=vi&lang=vi" },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
  };
  let cursor = 0;
  let timerId = 0;
  let bounds = { width: 280, height: 176 };
  const notifyMutation = () => queueMicrotask(() => {
    clipObservers.filter((observer) => !observer.disconnected).forEach((observer) => observer.callback());
  });
  const element = (nodeName) => ({
    nodeName, children: [], attributes: new Map(),
    style: { removeProperty(name) { delete this[name]; } }, parentNode: null,
    get parentElement() { return this.parentNode; },
    get clientWidth() { return bounds.width; },
    get clientHeight() { return bounds.height; },
    get id() { return this.getAttribute("id"); },
    getBoundingClientRect: () => bounds,
    addEventListener() {},
    getAttribute(name) { return this.attributes.get(name) ?? null; },
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
      if (name === "clip-path") clipWrites.push(String(value));
    },
    setAttributeNS(_namespace, name, value) { this.setAttribute(name, value); },
    appendChild(child) { child.parentNode = this; this.children.push(child); notifyMutation(); return child; },
    removeChild(child) { this.children = this.children.filter((item) => item !== child); child.parentNode = null; notifyMutation(); },
    replaceChildren() { this.children = []; notifyMutation(); },
    set innerHTML(_value) { this.replaceChildren(); },
    querySelectorAll(selector) {
      const found = [];
      const visit = (node) => {
        for (const child of node.children ?? []) {
          if ((selector === "clipPath[id]" && child.nodeName === "clipPath" && child.id)
            || (selector === "[clip-path]" && child.getAttribute?.("clip-path") !== null && child.getAttribute?.("clip-path") !== undefined)
            || (selector === "svg" && child.nodeName === "svg")) found.push(child);
          visit(child);
        }
      };
      visit(this);
      return found;
    },
  });
  const target = element("div");
  const pad = element("div");
  pad.appendChild(target);
  if (intrinsicGrid) {
    // A grid child's automatic minimum can retain its fixed-size SVG when
    // the CSS-sized pad shrinks. Measuring the child feeds the old size back.
    target.getBoundingClientRect = () => {
      const svg = target.querySelectorAll("svg")[0];
      return {
        width: Math.max(bounds.width, Number(svg?.getAttribute("width") ?? 0)),
        height: Math.max(bounds.height, Number(svg?.getAttribute("height") ?? 0)),
      };
    };
  }
  const actualHanziWriter = realRenderer ? vm.runInNewContext(
    `${await read("node_modules/hanzi-writer/dist/hanzi-writer.js")}\nHanziWriter;`,
    { window: browserWindow, document: { createElementNS: (_ns, name) => element(name), addEventListener() {} },
      setTimeout, clearTimeout, performance },
  ) : null;
  const react = {
    useMemo: (factory) => { cursor += 1; return factory(); },
    useRef: (value) => {
      const index = cursor++;
      hooks[index] ??= { current: index === 1 ? target : value };
      return hooks[index];
    },
    useState: (initial) => {
      const index = cursor++;
      hooks[index] ??= { value: initial };
      return [hooks[index].value, (value) => {
        hooks[index].value = typeof value === "function" ? value(hooks[index].value) : value;
      }];
    },
    useEffect: (effect, deps) => {
      const index = cursor++;
      const previous = hooks[index];
      if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) {
        effects.push(() => {
          previous?.cleanup?.();
          hooks[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const jsx = (type, props) => ({ type, props });
  const componentModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: componentModule, exports: componentModule.exports, AbortController,
    require: (name) => {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "fragment" };
      if (name.endsWith(".css")) return {};
      if (name === "hanzi-writer" && actualHanziWriter) return actualHanziWriter;
      if (name === "hanzi-writer") return {
        create: (container, glyph, options) => {
          const writer = {
            glyph, options, dimensions: [], animations: 0,
            updateDimensions(value) { this.dimensions.push(value); },
            animateCharacter() { this.animations += 1; return Promise.resolve(); },
          };
          writers.push(writer);
          container.children.push(writer);
          options.charDataLoader(glyph, () => options.onLoadCharDataSuccess(),
            () => options.onLoadCharDataError());
          return writer;
        },
      };
      throw new Error(`Unexpected import: ${name}`);
    },
    fetch: (url, options) => new Promise((resolve, reject) => {
      requests.push({ url, options, resolve, reject });
      options.signal.addEventListener("abort", () => reject(new Error("aborted")));
    }),
    ResizeObserver: class {
      constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
      observe(node) { this.observed = node; }
      disconnect() { this.disconnected = true; }
    },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; this.disconnected = false; clipObservers.push(this); }
      observe() {}
      disconnect() { this.disconnected = true; }
    },
    setTimeout: (callback) => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  });
  const render = (glyph = "知", language = "vi") => {
    cursor = 0;
    const tree = componentModule.exports.default({ glyph, writing: {
      sourceRepository: "chanind/hanzi-writer-data",
      sourceCommit: "68d10a4b21150cae5e1ebbd223eed289cf32d90c",
      sourcePath: `data/${glyph}.json`,
    }, labels: { replay: language, unavailable: language } });
    effects.splice(0).forEach((effect) => effect());
    return tree;
  };
  const findButton = (node) => {
    if (!node || typeof node !== "object") return null;
    if (node.type === "button") return node;
    const children = node.props?.children;
    for (const child of Array.isArray(children) ? children : [children]) {
      const result = findButton(child);
      if (result) return result;
    }
    return null;
  };
  return {
    render, writers, observers, clipObservers, clipWrites, requests, timers, target, pad, browserWindow,
    get currentWriter() { return hooks[2].current; },
    resize(width, height) { bounds = { width, height }; observers.at(-1).callback(); },
    async load(index) {
      requests[index].resolve({ ok: true, json: async () => ({
        strokes: ["M 0 0 L 100 0 L 100 100 L 0 100 Z"], medians: [[[0, 50], [100, 50]]],
      }) });
      await new Promise((resolve) => setImmediate(resolve));
    },
    runTimers() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach((callback) => callback()); },
    replay(tree) { findButton(tree).props.onClick(); },
    unmount() { hooks.forEach((hook) => hook?.cleanup?.()); },
  };
}

test("Real Hanzi Writer SVG clips survive query navigation without recreating the writer", async () => {
  const h = await writingLifecycleHarness(true);
  h.render();
  await h.load(0);
  const writer = h.currentWriter;
  assert.ok(writer);
  // Execute the installed 3.7.3 SVG renderer: it really creates absolute VI URLs.
  assert.ok(h.clipWrites.some((value) => value.includes("?uiLang=vi&lang=vi#mask-")));
  const assertLocalClips = () => {
    const masks = new Set(h.target.querySelectorAll("clipPath[id]").map((mask) => mask.id));
    const paths = h.target.querySelectorAll("[clip-path]");
    assert.equal(paths.length, 3);
    for (const path of paths) {
      const reference = path.getAttribute("clip-path");
      const url = reference.match(/^url\("([^"]+)"\)$/u)?.[1];
      assert.ok(url);
      const resolved = new URL(url, h.browserWindow.location.href);
      assert.ok(masks.has(resolved.hash.slice(1)));
      resolved.hash = "";
      assert.equal(resolved.href, h.browserWindow.location.href);
    }
    assert.equal(h.target.querySelectorAll("svg").length, 1);
  };
  assertLocalClips();
  for (const locale of ["en", "vi", "en", "vi"]) {
    h.browserWindow.location.href = `https://learner.test/preview/vocabulary?uiLang=${locale}&lang=${locale}`;
    h.render("知", locale);
    assert.equal(h.currentWriter, writer);
    assertLocalClips();
  }
  h.resize(390, 190);
  assert.equal(h.currentWriter, writer);
  assertLocalClips();
  h.runTimers(); // animation starts with valid masks, and does not replace them
  assertLocalClips();
  h.render("道", "en");
  await h.load(1);
  assert.notEqual(h.currentWriter, writer);
  assertLocalClips();
  h.unmount();
  assert.ok(h.clipObservers.every((observer) => observer.disconnected));
});

test("Real SVG follows the CSS pad when a grid child retains its previous size", async () => {
  const h = await writingLifecycleHarness(true, true);
  h.render();
  await h.load(0);
  const writer = h.currentWriter;
  // Interior pad sizes across mobile → tablet → desktop → mobile layouts.
  for (const [width, height] of [[292, 188], [164, 130], [244, 174], [292, 188], [164, 130]]) {
    h.resize(width, height);
    assert.equal(h.currentWriter, writer);
    const svgs = h.target.querySelectorAll("svg");
    assert.equal(svgs.length, 1);
    assert.equal(Number(svgs[0].getAttribute("width")), width);
    assert.equal(Number(svgs[0].getAttribute("height")), height);
    assert.deepEqual(h.target.getBoundingClientRect(), { width, height });
  }
  assert.equal(h.observers[0].observed, h.pad);
  h.unmount();
});

test("Writing preserves one instance through pending loads, language switches, animation and resize", async () => {
  const h = await writingLifecycleHarness();
  h.render();
  for (const language of ["zh", "vi", "zh", "vi"]) {
    h.render("知", language);
    h.resize(language === "vi" ? 280 : 220, 176);
  }
  assert.equal(h.writers.length, 1);
  assert.equal(h.requests.length, 1);
  assert.equal(h.target.children.length, 1);
  assert.equal(h.writers[0].dimensions.length, 4);
  await h.load(0);
  h.runTimers();
  assert.equal(h.writers[0].animations, 1);
  h.render("知", "zh");
  h.resize(390, 190);
  h.resize(390, 190);
  assert.equal(h.writers[0].dimensions.length, 5);
  assert.equal(h.writers[0].animations, 1);
  const tree = h.render();
  h.replay(tree);
  h.replay(tree);
  assert.equal(h.writers[0].animations, 3);
  assert.equal(h.writers.length, 1);
  h.unmount();
  assert.equal(h.target.children.length, 0);
});

test("Writing invalidates old loads, callbacks, observers and autoplay when changing glyph or unmounting", async () => {
  const h = await writingLifecycleHarness();
  h.render();
  h.render("道");
  assert.equal(h.requests[0].options.signal.aborted, true);
  assert.equal(h.observers[0].disconnected, true);
  h.writers[0].options.onLoadCharDataSuccess();
  h.writers[0].options.onLoadCharDataError();
  h.observers[0].callback();
  await h.load(0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.writers.length, 2);
  assert.equal(h.target.children.length, 1);
  await h.load(1);
  assert.equal(h.timers.size, 1);
  const staleAutoplay = [...h.timers.values()][0];
  h.render("知");
  assert.equal(h.timers.size, 0);
  staleAutoplay();
  assert.equal(h.writers[1].animations, 0);
  await h.load(2);
  h.runTimers();
  assert.equal(h.writers[2].animations, 1);
  h.unmount();
  h.writers[2].options.onLoadCharDataSuccess();
  h.writers[2].options.onLoadCharDataError();
  assert.equal(h.requests[2].options.signal.aborted, true);
  assert.equal(h.observers[2].disconnected, true);
  assert.equal(h.timers.size, 0);
  assert.equal(h.target.children.length, 0);
});

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
  assert.match(labels, /translationEquivalent: "Translations"/u);
  assert.match(labels, /translationEquivalent: "Cách dịch"/u);
  assert.match(labels, /usageNote: "Usage"/u);
  assert.match(labels, /usageNote: "Cách dùng"/u);
  assert.match(labels, /constructions: "Usage patterns"/u);
  assert.match(labels, /quickDistinction: "Word comparison"/u);
  assert.match(labels, /collocations: "Kết hợp từ"/u);
  assert.match(labels, /quickDistinction: "Phân biệt từ"/u);
  assert.match(labels, /commonMistakes: "Lỗi thường gặp"/u);
  assert.match(labels, /nearSynonyms: "Từ gần nghĩa"/u);
  assert.match(labels, /relatedWords: "Từ liên quan"/u);
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

  assert.match(loader, /get_public_vocabulary_entry_v10/);
  assert.match(loader, /get_public_vocabulary_entry_v9/);
  assert.match(loader, /get_public_vocabulary_entry_v8/);
  assert.match(loader, /get_public_vocabulary_entry_v7/);
  assert.match(loader, /get_public_vocabulary_entry_v6/);
  assert.match(loader, /get_public_vocabulary_entry_v5/);
  assert.match(loader, /get_public_vocabulary_entry_v4/);
  assert.match(loader, /get_public_vocabulary_entry_v3/);
  assert.match(loader, /get_public_vocabulary_entry_v2/);
  assert.match(loader, /isMissingRpc/);
  assert.match(loader, /K1J_VOCABULARY_CURRENT_V5_LEARNER_PARITY_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1I_VOCABULARY_LOCALIZED_LEARNER_EXAMPLES_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1H_VOCABULARY_CONSTRUCTION_SCOPED_EXAMPLES_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1F_VOCABULARY_LOCALIZED_DETAIL_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1E_VOCABULARY_CHARACTER_AUDIO_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1D_VOCABULARY_RICH_SUPPORT_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /K1C_VOCABULARY_TE_PUBLIC_PROJECTION_V1/);
  assert.match(loader, /hanViet:\s*contract === K1J_PROJECTION_CONTRACT/);
  assert.match(loader, /forms\.find\(\(form\) => form\.isPrimary\)\?\.hanViet/);
  assert.match(loader, /parseHanViet\(entry\.han_viet\)/);
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
  assert.match(loader, /lexical_relations/);
  assert.match(loader, /related_words/);
  assert.match(loader, /parseProficiency/);
  assert.match(loader, /parseScopedUsage/);
  assert.match(loader, /learner_explanation/);
  assert.doesNotMatch(loader, /entryKey:|readingItemKey:|confidence:|evidence:|readiness:|targetState:/);
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
  assert.match(page, /secondaryForms=\{secondaryForms\}/);
  assert.match(page, /proficiency=\{headerProficiency\}/);
  assert.match(page, /translationEquivalent:\s*labels\.translationEquivalent/);
  assert.doesNotMatch(page, /extractHanCharacters/);
  assert.doesNotMatch(page, /Script=Han/);
  assert.match(page, /VocabularyStickyNav/);
  assert.match(page, /VocabularyRichSupport/);
  assert.match(page, /VocabularyCharacterRail/);
  assert.match(page, /classifiers:\s*labels\.classifiers/);
  assert.match(page, /item\.proficiency\.map/);
  assert.match(page, /item\.itemType === "usage"/);
  assert.match(page, /styles\.subsense/);
  assert.match(page, /classifiers:\s*"Lượng từ"/);
  assert.doesNotMatch(page, /translations:\s*"Từ tương đương"/);
  assert.doesNotMatch(page, /formLabel\(/);
  assert.doesNotMatch(page, /languageVarietyLabel/);
  assert.doesNotMatch(page, /Nghĩa đặc thù|Special meaning|specialMeaning/);
  assert.doesNotMatch(page, /Ỷ TỬ|搬椅子|一把椅子/);

  assert.match(pronunciationMeta, /hanViet:\s*string \| null/);
  assert.match(pronunciationMeta, /secondaryForms:\s*VocabularyForm\[\]/);
  assert.match(pronunciationMeta, /proficiency:\s*VocabularyProficiency\[\]/);
  assert.match(pronunciationMeta, /labels:\s*\{/);
  assert.match(pronunciationMeta, /styles\.secondaryLine/);
  assert.match(pronunciationMeta, /form\.scriptVariantCode === "traditional"/);
  assert.match(pronunciationMeta, /form\.scriptVariantCode === "simplified"/);
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
  assert.match(writing, /void loadedWriter\.animateCharacter\(\)/);
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
  assert.ok(rich.indexOf("item.translationEquivalents.length > 0") < rich.indexOf("nuanceRows.length > 0"));
  assert.ok(rich.indexOf("nuanceRows.length > 0") < rich.indexOf("item.collocations.length > 0"));
  assert.ok(rich.indexOf("item.collocations.length > 0") < rich.indexOf("item.classifiers.length > 0"));
  assert.ok(rich.indexOf("item.classifiers.length > 0") < rich.indexOf("item.constructions.length > 0"));
  assert.ok(rich.indexOf("item.constructions.length > 0") < rich.indexOf("item.examples.length > 0"));
  assert.ok(rich.indexOf('relationType="synonym"') < rich.indexOf('relationType="near_synonym"'));
  assert.ok(rich.indexOf('relationType="near_synonym"') < rich.indexOf('relationType="antonym"'));
  assert.ok(rich.indexOf('data-vocabulary-module="related-words"') < rich.indexOf('data-vocabulary-module="word-comparison"'));
  assert.ok(rich.indexOf('data-vocabulary-module="common-mistakes"') < rich.indexOf('data-vocabulary-module="memory-tip"'));
  assert.ok(rich.indexOf('data-vocabulary-module="memory-tip"') < rich.indexOf('data-vocabulary-module="related-knowledge"'));
  assert.ok(rich.indexOf('data-vocabulary-module="related-knowledge"') < rich.indexOf('data-vocabulary-module="practice"'));
  assert.match(rich, /item\.examples\.length > 0/);
  assert.match(rich, /useState/);
  assert.match(rich, /item\.examples\.slice\(0, 3\)/);
  assert.match(rich, /item\.collocations\.slice\(0, 6\)/);
  assert.match(rich, /construction\.examples\.length > 0/);
  assert.match(rich, /construction\.examples\.map/);
  assert.match(rich, /aria-expanded=\{examplesExpanded\}/);
  assert.match(rich, /aria-expanded=\{collocationsExpanded\}/);
  assert.match(rich, /labels\.showMore/);
  assert.match(rich, /labels\.collapse/);
  assert.match(rich, /item\.translationEquivalents\.length > 0/);
  assert.match(rich, /data-vocabulary-module="translations"/);
  assert.match(rich, /data-vocabulary-module="usage"/);
  assert.match(rich, /data-vocabulary-module="nuance-context"/);
  assert.match(rich, /data-vocabulary-module="common-combinations"/);
  assert.match(rich, /data-vocabulary-module="measure-words"/);
  assert.match(rich, /data-vocabulary-module="usage-patterns"/);
  assert.match(rich, /data-vocabulary-module="examples"/);
  assert.match(rich, /data-vocabulary-module="related-words"/);
  assert.match(rich, /data-vocabulary-module="word-comparison"/);
  assert.match(rich, /data-vocabulary-module="memory-tip"/);
  assert.match(rich, /data-vocabulary-module="related-knowledge"/);
  assert.match(rich, /data-vocabulary-module="practice"/);
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
  assert.match(loader, /get_public_vocabulary_entry_v10/);
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


test("GF0025 proficiency renders compact HSK label without a space", async () => {
  const view = await read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx");
  assert.match(view, /systemCode === "gf0025_2021"[\s\S]*\? `\$\{fallbackLabel\}\$\{levelCode\}`/u);
  assert.doesNotMatch(view, /\? `\$\{fallbackLabel\} \$\{levelCode\}`/u);
});


test("Vocabulary learner translations never render internal restriction prose", async () => {
  const rich = await read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx");
  assert.ok(rich.includes("const authoredUsageCopy = distinctLearnerProse("));
  assert.ok(rich.includes("item.usage?.context"));
  assert.ok(rich.includes("item.fullExplanation"));
  assert.ok(rich.includes("const translationSummary = item.translationEquivalents.length > 0"));
  assert.ok(rich.includes("item.usageNote"));
  assert.ok(rich.includes("LearnerProse"));
  assert.doesNotMatch(rich, /translation\.contextRestriction/);
  assert.doesNotMatch(rich, /translation\.mismatchNote/);
});

test("Vocabulary learner page falls back to the exact single Han character when K1E is empty", async () => {
  const [characterLoader, page] = await Promise.all([
    read("lib/vocabularyCharacterDelivery.ts"),
    read("app/knowledge/vocabulary/[publicId]/page.tsx"),
  ]);
  assert.match(characterLoader, /buildVocabularyCharacterFallback/);
  assert.ok(characterLoader.includes("const HAN_CHARACTER_PATTERN = /^\\p{Script=Han}$/u;"));
  assert.match(characterLoader, /detail\.forms\.find\(\(form\) => form\.isPrimary\)/);
  assert.match(characterLoader, /lexicalContextPronunciation: pronunciation\?\.pronunciation \?\? null/);
  assert.match(characterLoader, /hanViet: detail\.hanViet\?\.text \?\? null/);
  assert.match(characterLoader, /radical: null/);
  assert.match(characterLoader, /strokeCount: null/);
  assert.match(characterLoader, /structureFormula: null/);
  assert.match(characterLoader, /chanind\/hanzi-writer-data/);
  assert.match(page, /characterResult\.status === "FOUND" && characterResult\.characters\.length > 0/);
  assert.match(page, /buildVocabularyCharacterFallback\(result\.detail\)/);
});


test("Vocabulary learner POS labels never expose raw surname code", async () => {
  const view = await read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx");
  assert.match(view, /surname:\s*\{ en: "Surname", vi: "Họ"/);
  assert.match(view, /const learnerPosLabel = posLabel\(/);
  assert.match(view, /<span className=\{styles\.posLabel\}>\{learnerPosLabel\}<\/span>/);
  assert.doesNotMatch(view, /<span[^>]*>\{group\.posCode\}<\/span>/);
});

test("Vocabulary learner translations never render internal restriction or mismatch prose", async () => {
  const rich = await read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx");
  assert.match(rich, /item\.translationEquivalents\.map/);
  assert.match(rich, /<strong>\{translation\.expression\}<\/strong>/);
  assert.doesNotMatch(rich, /translation\.contextRestriction/);
  assert.doesNotMatch(rich, /translation\.mismatchNote/);
});

test("Vocabulary construction explanations render multi-idea text as separate paragraphs", async () => {
  const rich = await read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx");
  assert.ok(rich.includes("function splitLearnerProseParagraphs(text: string): string[]"));
  assert.ok(rich.includes('character === "。"'));
  assert.ok(rich.includes('character === "；"'));
  assert.ok(rich.includes('character === "\\n"'));
  assert.ok(rich.includes("construction.explanation"));
  assert.ok(rich.includes("LearnerProse"));
  assert.doesNotMatch(rich, /construction\.explanation \? <p>\{construction\.explanation\}<\/p> : null/);
});


test("Vocabulary header shows authored proficiency tags without inventing levels", async () => {
  const view = await read("app/knowledge/vocabulary/[publicId]/VocabularyDetailView.tsx");
  assert.ok(view.includes("const allProficiency = distinctProficiency(["));
  assert.ok(view.includes("allReadingItems.flatMap((item) => item.proficiency)"));
  assert.ok(view.includes("const headerProficiency = allProficiency;"));
  assert.ok(view.includes("proficiency={headerProficiency}"));
  assert.ok(view.includes("item.proficiency.map"));
});

test("Vocabulary learner prose keeps module ownership and suppresses exact duplicate copy", async () => {
  const rich = await read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx");
  assert.ok(rich.includes("function distinctLearnerProse("));
  assert.ok(rich.includes("item.usage?.context"));
  assert.ok(rich.includes("item.fullExplanation"));
  assert.ok(rich.includes("item.translationEquivalents.length === 0"));
  assert.ok(rich.includes("item.usageNote"));
  assert.ok(rich.includes("item.usageContext"));
  assert.ok(rich.includes("item.socialContext"));
  assert.ok(rich.includes("item.pragmaticExplanation"));
});

test("Vocabulary learner-facing prose shares sentence-aware paragraph rendering", async () => {
  const rich = await read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx");
  assert.ok(rich.includes("function splitLearnerProseParagraphs(text: string): string[]"));
  assert.ok(rich.includes("function LearnerProse("));
  assert.ok(rich.includes("translation-guidance"));
  assert.ok(rich.includes("memory-tip"));
  assert.ok(rich.includes("construction.explanation"));
  assert.ok(rich.includes('character === "；"'));
  assert.ok(rich.includes('character === "\\n"'));
});
