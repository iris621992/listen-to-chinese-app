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

test("existing Word comparison surface enriches target facts without changing the accepted visual system", async () => {
  const [rich, detailCss, header, characterRail, sticky] = await Promise.all([
    read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyDetail.module.css"),
    read("components/Header.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyCharacterRail.tsx"),
    read("app/knowledge/vocabulary/[publicId]/VocabularyStickyNav.tsx"),
  ]);

  assert.match(rich, /distinction\.participant\?\.displayForm \?\? distinction\.targetExpression/u);
  assert.match(rich, /distinction\.participant\.pronunciation/u);
  assert.match(rich, /distinction\.participant\.shortLabel/u);
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
