import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFile(path, "utf8");
const PUBLIC_ID = `vocab_${"a".repeat(64)}`;
const K1L = "K1L_VOCABULARY_REUSABLE_TARGET_PROJECTION_RUNTIME_RECONCILIATION_V2";
const K1J = "K1J_VOCABULARY_CURRENT_V5_LEARNER_PARITY_PUBLIC_PROJECTION_V1";

function payload({
  contract = K1L,
  participant = undefined,
  requestedLocale = "vi",
  fallbackLocale = "vi",
} = {}) {
  const quick = {
    public_id: "quick_public_1",
    reading_item_public_id: "ri_public_1",
    target_expression: "知道",
    learner_explanation: "Hai từ có trọng tâm khác nhau.",
    source_use_when: "Dùng khi hiểu.",
    target_use_when: "Dùng khi biết thông tin.",
    contrast_examples: [{
      source_expression: "我懂。",
      target_expression: "我知道。",
      source_translation: "Tôi hiểu.",
      target_translation: "Tôi biết.",
      content_locale: "vi",
    }],
    content_locale: "vi",
  };
  if (participant !== undefined) quick.participant = participant;

  return {
    projection_contract: contract,
    requested_locale: requestedLocale,
    fallback_locale: fallbackLocale,
    entry: {
      public_id: PUBLIC_ID,
      display_form: "懂",
      entry_kind: "word",
      han_viet: { text: "đổng", content_locale: "vi" },
      forms: [{
        public_id: "form_public_1",
        text: "懂",
        form_type: "canonical",
        is_primary: true,
        han_viet: { text: "đổng", content_locale: "vi" },
      }],
      pronunciations: [{
        public_id: "pron_public_1",
        pronunciation: "dǒng",
        is_default: true,
        reading_items: [{
          public_id: "ri_public_1",
          item_type: "sense",
          part_of_speech_code: "verb",
          content_locale: "vi",
          learner_explanation: {
            short_label: "hiểu; rành",
            full_explanation: "Hiểu nội dung hoặc rành một lĩnh vực.",
          },
          quick_distinctions: [quick],
        }],
      }],
    },
  };
}

async function createLoaderHarness(handler) {
  const source = await read("lib/vocabularyDetail.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const calls = [];
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require(name) {
      if (name === "@/lib/learnerLocaleRegistry") {
        return {
          getLearnerLocale(code) {
            const normalized = typeof code === "string" && code ? code : "en";
            return {
              code: normalized,
              fallbackLocaleCode: normalized === "en" ? "en" : "en",
            };
          },
        };
      }
      if (name === "@/lib/supabase/server") {
        return {
          createServerSupabaseClient() {
            return {
              async rpc(name, args) {
                calls.push({ name, args });
                return handler(name, args);
              },
            };
          },
        };
      }
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return {
    load: module.exports.loadVocabularyDetail,
    calls,
  };
}

function exactViRequest() {
  return {
    requestedLocaleCode: "vi",
    fallbackLocaleCode: "vi",
    exactContentLocaleCode: "vi",
  };
}


test("near-synonym source relation context stays independent of target description and exact locale", async () => {
  const source = {
    vi: "Hai từ có nét nghĩa gần nhau; xem thêm ở phần **Phân biệt từ**.",
    en: "The two words overlap; see **Word comparison**.",
    zh: "两词有相近的意义。",
  };
  const original = payload({ requestedLocale: "vi", fallbackLocale: "vi" });
  const ri = original.entry.pronunciations[0].reading_items[0];
  ri.lexical_relations = [{
    relation_type: "near_synonym",
    target: { display_form: "懂得", pronunciation: "dǒngde", short_label: "hiểu; biết", content_locale: "vi" },
    source_relation_context: source.vi,
  }];
  const harness = await createLoaderHarness(async () => ({ data: original, error: null }));
  const result = await harness.load(PUBLIC_ID, exactViRequest());
  assert.equal(result.status, "FOUND");
  const relation = result.detail.pronunciations[0].readingItems[0].lexicalRelations[0];
  assert.equal(relation.target.shortLabel, "hiểu; biết");
  assert.equal(relation.sourceRelationContext, source.vi);

  const legacy = payload({ requestedLocale: "vi", fallbackLocale: "vi" });
  legacy.entry.pronunciations[0].reading_items[0].lexical_relations = [{
    relation_type: "near_synonym",
    target: { display_form: "懂得", pronunciation: "dǒngde", short_label: "hiểu; biết", content_locale: "vi" },
  }];
  const oldHarness = await createLoaderHarness(async () => ({ data: legacy, error: null }));
  const old = await oldHarness.load(PUBLIC_ID, exactViRequest());
  assert.equal(old.status, "FOUND");
  assert.equal(old.detail.pronunciations[0].readingItems[0].lexicalRelations[0].sourceRelationContext, null);
});

function firstDistinction(result) {
  assert.equal(result.status, "FOUND");
  return result.detail.pronunciations[0].readingItems[0].quickDistinctions[0];
}

test("v12 is preferred and K1L parses only the approved compact participant roles", async () => {
  const participant = {
    display_form: "知道",
    pronunciation: "zhīdào",
    short_label: "biết; biết thông tin",
    content_locale: "vi",
    entry_key: "forbidden-entry-key",
    item_key: "forbidden-item-key",
    id: "forbidden-uuid",
    full_explanation: "forbidden full explanation",
    translation_equivalents: ["forbidden"],
    memory_tip: "forbidden",
    common_mistakes: ["forbidden"],
    navigation_contract: "forbidden",
    readiness: "DETAIL_READY",
    source_registry: "forbidden",
  };
  const h = await createLoaderHarness(async (name) => {
    assert.equal(name, "get_public_vocabulary_entry_v12");
    return { data: payload({ participant }), error: null };
  });

  const result = await h.load(PUBLIC_ID, exactViRequest());
  const distinction = firstDistinction(result);
  assert.deepEqual(h.calls.map((call) => call.name), ["get_public_vocabulary_entry_v12"]);
  assert.deepEqual(
    JSON.parse(JSON.stringify(distinction.participant)),
    {
      displayForm: "知道",
      pronunciation: "zhīdào",
      shortLabel: "biết; biết thông tin",
      contentLocale: "vi",
    },
  );
  const serialized = JSON.stringify(distinction.participant);
  for (const forbidden of [
    "entry_key",
    "item_key",
    "forbidden-uuid",
    "full_explanation",
    "translation_equivalents",
    "memory_tip",
    "common_mistakes",
    "navigation_contract",
    "DETAIL_READY",
    "source_registry",
  ]) {
    assert.equal(serialized.includes(forbidden), false, `participant must not expose ${forbidden}`);
  }
  assert.equal(distinction.learnerExplanation, "Hai từ có trọng tâm khác nhau.");
  assert.equal(distinction.sourceUseWhen, "Dùng khi hiểu.");
  assert.equal(distinction.targetUseWhen, "Dùng khi biết thông tin.");
  assert.equal(distinction.contrastExamples[0].targetExpression, "我知道。");
});

test("missing v12 falls back to v10 and preserves existing K1J local fallback", async () => {
  const h = await createLoaderHarness(async (name) => {
    if (name === "get_public_vocabulary_entry_v12") {
      return {
        data: null,
        error: { code: "PGRST202", message: "Could not find the function get_public_vocabulary_entry_v12" },
      };
    }
    if (name === "get_public_vocabulary_entry_v10") {
      return { data: payload({ contract: K1J }), error: null };
    }
    throw new Error(`Unexpected RPC: ${name}`);
  });

  const result = await h.load(PUBLIC_ID, exactViRequest());
  const distinction = firstDistinction(result);
  assert.deepEqual(h.calls.map((call) => call.name), [
    "get_public_vocabulary_entry_v12",
    "get_public_vocabulary_entry_v10",
  ]);
  assert.equal(distinction.participant, null);
  assert.equal(distinction.targetExpression, "知道");
  assert.equal(distinction.learnerExplanation, "Hai từ có trọng tâm khác nhau.");
  assert.equal(result.detail.hanViet?.text, "đổng");
});

test("v12 semantic/runtime errors do not fall through to older projections", async () => {
  const h = await createLoaderHarness(async (name) => ({
    data: null,
    error: { code: "42501", message: `runtime failure in ${name}` },
  }));

  const result = await h.load(PUBLIC_ID, exactViRequest());
  assert.equal(result.status, "DATABASE_ERROR");
  assert.deepEqual(h.calls.map((call) => call.name), ["get_public_vocabulary_entry_v12"]);
});

test("exact locale drops a participant from another locale without rewriting local comparison context", async () => {
  const h = await createLoaderHarness(async () => ({
    data: payload({
      participant: {
        display_form: "知道",
        pronunciation: "zhīdào",
        short_label: "know information",
        content_locale: "en",
      },
    }),
    error: null,
  }));

  const result = await h.load(PUBLIC_ID, exactViRequest());
  const distinction = firstDistinction(result);
  assert.equal(distinction.participant, null);
  assert.equal(distinction.targetExpression, "知道");
  assert.equal(distinction.learnerExplanation, "Hai từ có trọng tâm khác nhau.");
  assert.equal(distinction.sourceUseWhen, "Dùng khi hiểu.");
  assert.equal(distinction.targetUseWhen, "Dùng khi biết thông tin.");
});

test("Word Comparison keeps target Hanzi without duplicating participant pronunciation or short meaning", async () => {
  const [rich, detailCss, header, characterRail, sticky] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetail.module.css"),
    read("components/Header.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyCharacterRail.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyStickyNav.tsx"),
  ]);

  assert.match(rich, /distinction\.participant\?\.displayForm \?\? distinction\.targetExpression/u);
  assert.doesNotMatch(rich, /distinction\.participant\.pronunciation/u);
  assert.doesNotMatch(rich, /distinction\.participant\.shortLabel/u);
  assert.match(rich, /example\.sourcePinyin/u);
  assert.match(rich, /example\.targetPinyin/u);
  assert.match(rich, /styles\.distinctionPinyin/u);
  assert.match(rich, /styles\.distinctionTranslation/u);
  assert.match(rich, /distinction\.learnerExplanation/u);
  assert.match(rich, /distinction\.sourceUseWhen/u);
  assert.match(rich, /distinction\.targetUseWhen/u);
  assert.match(rich, /distinction\.contrastExamples/u);

  assert.match(detailCss, /\.workspace/u);
  assert.match(header, /HeaderContent/u);
  assert.match(characterRail, /selectedOccurrence/u);
  assert.match(sticky, /data-sticky-nav/u);
  assert.doesNotMatch(rich, /entryKey|itemKey|readiness|navigationContract|sourceRegistry/u);
});

test("Production v9 fallback transports K1L vi/en/zh with authored participant and Han Viet", async () => {
  for (const locale of ["vi", "en", "zh"]) {
    const label = { vi: "biết", en: "know", zh: "知晓；懂得" }[locale];
    const doc = payload({ participant: { display_form: "知道", pronunciation: "zhīdào", short_label: label, content_locale: locale }, requestedLocale: locale, fallbackLocale: locale });
    const ri = doc.entry.pronunciations[0].reading_items[0];
    ri.content_locale = locale;
    ri.quick_distinctions[0].content_locale = locale;
    const h = await createLoaderHarness(async (rpc) => rpc === "get_public_vocabulary_entry_v9"
      ? { data: doc, error: null }
      : { data: null, error: { code: "PGRST202", message: "Missing RPC" } });
    const result = await h.load(PUBLIC_ID, { requestedLocaleCode: locale, fallbackLocaleCode: locale, exactContentLocaleCode: locale });
    const distinction = firstDistinction(result);
    assert.deepEqual(h.calls.map(c => c.name), ["get_public_vocabulary_entry_v12", "get_public_vocabulary_entry_v10", "get_public_vocabulary_entry_v9"]);
    assert.equal(distinction.participant?.shortLabel, label);
    assert.equal(distinction.targetExpression, "知道");
    assert.equal(distinction.learnerExplanation, "Hai từ có trọng tâm khác nhau.");
    assert.equal(result.detail.hanViet?.text, locale === "vi" ? "đổng" : undefined);
  }
});

test("K1L participant stays in the data contract, not as duplicate comparison heading text", async () => {
  const rich = await read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx");
  assert.match(rich, /<details key=\{distinction\.publicId\}/u);
  assert.match(rich, /<LearnerInline text=\{distinction\.learnerExplanation\} \/>/u);
  assert.doesNotMatch(rich, /distinction\.participant\.shortLabel/u);
  assert.doesNotMatch(rich, /distinction\.participant\.pronunciation/u);
});


test("PR120 Word Comparison preserves four structured case shapes in VI EN and ZH", async () => {
  for (const locale of ["vi", "en", "zh"]) {
    const source = payload({ requestedLocale: locale, fallbackLocale: locale });
    const ri = source.entry.pronunciations[0].reading_items[0];
    ri.content_locale = locale;
    const keys = ["main_focus", "typical_phrase", "characteristic_use"];
    const row = (key) => ({
      row_key: key,
      localizations: {
        vi: { label: "Góc " + key, source_text: "知道消息 (*zhīdào xiāoxi*) — biết tin.", target_text: "懂道理 — hiểu đạo lý." },
        en: { label: "Aspect " + key, source_text: "Know **a fact**.", target_text: "Understand a meaning." },
        zh: { label: "侧重点", source_text: "侧重掌握事实或信息。", target_text: "侧重理解内容、意思或道理。" },
      },
    });
    ri.quick_distinctions = [
      { ...ri.quick_distinctions[0], public_id: "quick1", target_expression: "懂", content_locale: locale,
        comparison_rows: keys.map(row) },
      { ...ri.quick_distinctions[0], public_id: "quick2", target_expression: "了解", content_locale: locale,
        comparison_rows: keys.map(row),
        context_examples: [{ chinese: "我知道这件事，但不太了解具体情况。",
          pinyin: "Wǒ zhīdào zhè jiàn shì, dàn bú tài liǎojiě jùtǐ qíngkuàng.",
          localizations: { vi: { translation: "Tôi biết chuyện này, nhưng chưa rõ tình hình cụ thể." },
            en: { translation: "I know about this, but I’m not very familiar with the details." } } }] },
      { ...ri.quick_distinctions[0], public_id: "quick3", target_expression: "认识", content_locale: locale,
        comparison_rows: [row("meaning")],
        closing_note: { vi: "Cả hai câu đều đúng.", en: "Both sentences are correct.", zh: "两句话都可以成立。" }[locale],
        contrast_examples: [
          { source_expression: "我知道那位作家。", target_expression: "我认识那位作家。",
            source_pinyin: "Wǒ zhīdào nà wèi zuòjiā.", target_pinyin: "Wǒ rènshi nà wèi zuòjiā.",
            source_translation: "Biết đến nhà văn.", target_translation: "Quen nhà văn." },
        ] },
      { ...ri.quick_distinctions[0], public_id: "quick4", target_expression: "懂得", content_locale: locale,
        comparison_rows: ["main_focus", "typical_phrase"].map(row) },
    ];
    const harness = await createLoaderHarness(async (name) => {
      assert.equal(name, "get_public_vocabulary_entry_v12");
      return { data: source, error: null };
    });
    const result = await harness.load(PUBLIC_ID, {
      requestedLocaleCode: locale, fallbackLocaleCode: locale, exactContentLocaleCode: locale,
    });
    assert.equal(result.status, "FOUND");
    const pairs = result.detail.pronunciations[0].readingItems[0].quickDistinctions;
    assert.deepEqual(pairs.map(pair => pair.targetExpression), ["懂", "了解", "认识", "懂得"]);
    assert.deepEqual(pairs.map(pair => pair.comparisonRows.length), [3, 3, 1, 2]);
    assert.deepEqual(pairs[0].comparisonRows.map(row => row.rowKey), keys);
    assert.equal(pairs[1].contextExamples.length, 1);
    assert.equal(pairs[1].contextExamples[0].chinese, "我知道这件事，但不太了解具体情况。");
    assert.equal(pairs[1].contextExamples[0].translation === null, locale === "zh");
    assert.equal(pairs[2].contrastExamples.length, 1);
    assert.equal(pairs[2].closingNote, { vi: "Cả hai câu đều đúng.", en: "Both sentences are correct.", zh: "两句话都可以成立。" }[locale]);
    assert.equal(pairs[3].comparisonRows[0].contentLocale, locale);
  }
});

test("PR120 optional fields preserve legacy 懂 and semantic display order on desktop/mobile", async () => {
  const h = await createLoaderHarness(async () => ({ data: payload(), error: null }));
  const distinction = firstDistinction(await h.load(PUBLIC_ID, exactViRequest()));
  assert.equal(distinction.comparisonRows.length, 0);
  assert.equal(distinction.contextExamples.length, 0);
  assert.equal(distinction.closingNote, null);
  const [render, css] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.module.css"),
  ]);
  assert.ok(render.indexOf("distinction.comparisonRows.map") < render.indexOf("data-comparison-contrast-examples"));
  assert.ok(render.indexOf("data-comparison-contrast-examples") < render.indexOf("data-comparison-context-examples"));
  assert.ok(render.indexOf("data-comparison-context-examples") < render.indexOf("data-comparison-closing-note"));
  assert.match(render, /const hasExtendedComparison =/u);
  assert.match(render, /if \(!structured\)/u);
  assert.match(css, /grid-template-columns:\s*minmax\(90px, 0\.8fr\) repeat\(2, minmax\(0, 1\.8fr\)\)/u);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.comparisonRow/u);
});

test("Word Comparison dashed separators align in all two-column layouts, not only pointer-coarse tablets", async () => {
  const [css, render] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.module.css"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx"),
  ]);
  const marker = "/* Word Comparison shared dashed-row alignment v3.";
  assert.equal(css.split(marker).length, 2);
  const alignedRules = css.slice(css.indexOf(marker));
  assert.match(alignedRules, /@container \(min-width: 621px\)/u);
  assert.doesNotMatch(alignedRules, /@media|pointer: coarse|hover: none|max-width: 1100px/u);
  assert.match(alignedRules, /\.distinctionCompareGridSynced\s*\{\s*grid-template-rows: auto auto auto;/u);
  assert.match(alignedRules, /\.distinctionCompareGridSynced > \.distinctionCard\s*\{[^}]*grid-row: 1 \/ span 3;[^}]*grid-template-rows: subgrid;/u);
  assert.match(css, /\.distinctionExamples\s*\{[^}]*border-top: 1px dashed #e2d9ca;/u);
  const legacy = render.slice(render.indexOf("const structured = Boolean(distinction.sourceUseWhen"));
  assert.match(legacy, /styles\.distinctionCompareGridSynced/u);
  assert.equal(legacy.split("className={styles.distinctionCardHeading}").length - 1, 2);
  assert.equal(legacy.split("className={styles.distinctionExamples}").length - 1, 2);
});
