import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const read = path => readFile(path, "utf8");
async function compile(sourcePath, resolve) {
  const source = await read(sourcePath);
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  }}).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: name => resolve(name),
  });
  return module.exports;
}
async function getRendering() {
  const parser = await compile("lib/vocabularyRichTextBlocks.ts", () => { throw Error("pure parser must not import"); });
  const components = await compile("app/knowledge/vocabulary/[publicId]/VocabularyRichText.tsx", name => {
    if (name === "@/lib/vocabularyRichTextBlocks") return parser;
    if (name.endsWith("VocabularyRichSupport.module.css")) return { default: new Proxy({}, { get: (_, key) => String(key) }) };
    return require(name);
  });
  return { parser: parser.parseVocabularyRichTextBlocks, RichText: components.default, Inline: components.VocabularyRichInline };
}

test("accepted 知道 VI and EN usage preserve independent headings, bullets, pinyin and translations in rendered HTML", async () => {
  const React = require("react");
  const { parser, RichText } = await getRendering();
  const vi = "**1. Biết một sự việc hoặc thông tin**\n\nDùng khi đã biết một chuyện.\n\n- **我早就知道这件事了。**  \n  *Wǒ zǎo jiù zhīdào zhè jiàn shì le.*  \n  Tôi biết chuyện này từ lâu rồi.\n- **她知道会议的具体时间。**  \n  *Tā zhīdào huìyì de jùtǐ shíjiān.*  \n  Cô ấy biết thời gian cụ thể của cuộc họp.\n\n**2. Biết câu trả lời cho một câu hỏi**\n\nSau 知道 có thể là mệnh đề chứa từ nghi vấn.";
  const en = "**1. Know a fact or piece of information**\n\nUse 知道 when someone knows a fact.\n\n- **我早就知道这件事了。**  \n  *Wǒ zǎo jiù zhīdào zhè jiàn shì le.*  \n  I’ve known about this for a long time.";
  for (const source of [vi,en]) {
    const blocks=parser(source);
    assert.deepEqual(Array.from(blocks, x => x.kind), source===vi
      ? ["heading","paragraph","list","heading","paragraph"]
      : ["heading","paragraph","list"]);
    const html=renderToStaticMarkup(React.createElement(RichText,{text:source}));
    assert.equal((html.match(/<h5/g)??[]).length,source===vi?2:1);
    assert.equal((html.match(/<li/g)??[]).length,source===vi?2:1);
    assert.match(html, /<strong>我早就知道这件事了。<\/strong>/);
    assert.match(html, /<em>Wǒ zǎo jiù zhīdào zhè jiàn shì le.<\/em>/);
    assert.match(html, /<br\/>/);
    assert.doesNotMatch(html, /<p[^>]*>[^<]*\*\*1\./);
  }
});

test("accepted ZH/VI/EN 谁知道 tables render semantic row/column identity without losing long localized cells", async () => {
  const React=require("react");
  const { RichText }=await getRendering();
  const samples=[
    "**“谁知道”**有两种常见用法。\n\n| 用法 | 例句 |\n|---|---|\n| 表示意外，相当于“没想到” | 谁知道，刚出门就下雨了！ |",
    '**“谁知道”** có hai cách dùng thường gặp:\n\n| Cách dùng | Chữ Hán | Pinyin | Diễn đạt tiếng Việt |\n|---|---|---|---|\n| Diễn tả điều xảy ra ngoài dự đoán, gần nghĩa “ai ngờ”. | 谁知道，刚出门就下雨了！ | Shéi zhīdào, gāng chūmén jiù xià yǔ le! | Ai ngờ vừa ra khỏi nhà thì trời đổ mưa! |',
    '**“谁知道”** has two common uses:\n\n| Use | Chinese | Pinyin | English rendering |\n|---|---|---|---|\n| Expresses an unexpected turn of events | 谁知道，刚出门就下雨了！ | Shéi zhīdào, gāng chūmén jiù xià yǔ le! | Who would have thought? |'
  ];
  for(const text of samples){
    const html=renderToStaticMarkup(React.createElement(RichText,{text}));
    assert.match(html, /<table/);
    assert.match(html, /<thead><tr>/);
    assert.match(html, /<tbody><tr>/);
    assert.match(html, /谁知道，刚出门就下雨了！/);
    assert.doesNotMatch(html, /<p[^>]*>\|---/);
  }
});
test("legacy 懂 prose is unchanged; unknown markup is shown as text, never executed or stripped", async () => {
  const React=require("react");
  const { parser, RichText, Inline }=await getRendering();
  const plain="Hiểu nội dung một câu nói, một sự việc hoặc một kỹ năng.";
  assert.equal(parser(plain).length,1);
  assert.equal(parser(plain)[0].kind,"paragraph");
  const html=renderToStaticMarkup(React.createElement(RichText,{text:plain}));
  assert.match(html, /Hiểu nội dung một câu nói, một sự việc hoặc một kỹ năng/);
  assert.equal((html.match(/<li/g)??[]).length,0);
  const adversarial="<script>alert(1)</script> **biết** *zhīdào*";
  const safe=renderToStaticMarkup(React.createElement(Inline,{text:adversarial}));
  assert.match(safe, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(safe, /<strong>biết<\/strong>/);
  assert.match(safe, /<em>zhīdào<\/em>/);
});

test("Vocabulary notes and comparisons use one safe renderer without losing public or Draft parity",async()=>{
  const rich=await read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx");
  const preview=await read("app/preview/vocabulary/VocabularyDraftPreviewBridge.tsx");
  assert.match(rich,/VocabularyRichText text=\{text\}/);
  assert.match(rich,/VocabularyRichInline text=\{text\}/);
  assert.match(rich,/distinction\.comparisonRows\.map/);
  assert.match(rich,/distinction\.contextExamples\.map/);
  assert.match(rich,/distinction\.closingNote/);
  assert.match(preview,/YUNCHINESE_VOCABULARY_V5_RICH_RENDERING_V1/);
});

test("new authored Vocabulary v5 comparison rows are visible by default, while legacy 懂 disclosure stays unchanged", async () => {
  const rich = await read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx");
  assert.match(rich,/const hasExtendedComparison = distinction\.comparisonRows\.length > 0/);
  assert.equal((rich.match(/v5StructuredComparison/g)??[]).length,1);
  assert.equal((rich.match(/<details key=\{distinction\.publicId\} className=\{styles\.structuredDistinction\}>/g)??[]).length,1);
  const visible=rich.indexOf("v5StructuredComparison");
  const fallback=rich.indexOf("<details key={distinction.publicId} className={styles.structuredDistinction}>",visible+1);
  assert.ok(visible>0&&fallback>visible);
});


test("every structured v5 pair uses one shared table geometry for row dimensions and paired examples",async()=>{
  const rich=await read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx");
  const style=await read("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.module.css");
  assert.match(rich,/distinction\.comparisonRows\.length > 0 \|\| contrast\.length > 0/);
  assert.match(rich,/distinction\.comparisonRows\.map\(row =>/);
  assert.match(rich,/contrast\.map\(\(example, index\) =>/);
  assert.match(rich,/data-comparison-contrast-examples="true"/);
  assert.doesNotMatch(rich,/zhContrastsInRows/);
  assert.match(rich,/!zh && example\.sourceTranslation/);
  assert.match(rich,/!zh && example\.targetTranslation/);
  assert.match(style,/grid-template-columns: minmax\(90px, 0\.8fr\) repeat\(2, minmax\(0, 1\.8fr\)\)/);
  assert.match(style,/@container \(max-width: 620px\)/);
  assert.match(style,/\.v5StructuredComparison \.distinctionIntro/);
  assert.match(style,/var\(--brand-brown, #7b603b\)/);
  const legacy=rich.slice(rich.indexOf("const structured = Boolean(distinction.sourceUseWhen && distinction.targetUseWhen)"));
  assert.match(legacy,/distinctionCompareGridSynced/);
});

test("different vocabulary pairs, counts and ZH/VI/EN locales render paired examples without per-pair layouts",async()=>{
  const React=require("react");
  const support=await compile("app/knowledge/vocabulary/[publicId]/VocabularyRichSupport.tsx",name=>{
    if(name.endsWith("VocabularyRichSupport.module.css"))
      return {default:new Proxy({},{get:(_,key)=>String(key)})};
    if(name==="./VocabularyRichText")
      return {__esModule:true,default:({text})=>React.createElement("span",null,text),
        VocabularyRichInline:({text})=>React.createElement("span",null,text)};
    return require(name);
  });
  const empty={publicId:"ri",usage:null,usageNote:"",fullExplanation:"",
    usageContext:"",socialContext:"",pragmaticExplanation:"",translationEquivalents:[],
    collocations:[],classifiers:[],constructions:[],examples:[],lexicalRelations:[],
    relatedWords:[],commonMistakes:[],memoryTip:"",knowledgeLinks:[],practiceLinks:[],quickDistinctions:[]};
  const ex=(x)=>({sourceExpression:"我知道"+x+"。",targetExpression:"我认识"+x+"。",
    sourcePinyin:"Wǒ zhīdào.",targetPinyin:"Wǒ rènshi.",
    sourceTranslation:"VI source "+x,targetTranslation:"VI target "+x});
  const entry=(target,locale,dimensions,examples,extra={})=>({
    publicId:"qd-"+target,contentLocale:locale,targetExpression:target,participant:null,
    learnerExplanation:"",sourceUseWhen:"",targetUseWhen:"",
    comparisonRows:dimensions.map((label,i)=>({rowKey:"r"+i,label,sourceText:"Source "+i,targetText:"Target "+i})),
    contrastExamples:examples.map(ex),contextExamples:[],closingNote:"",...extra});
  const render=(entry)=>renderToStaticMarkup(React.createElement(support.default,{
    item:{...empty,quickDistinctions:[entry]},sourceExpression:"知道",
    labels:{quickDistinction:"Phân biệt từ"},
  }));
  const vi=render(entry("认识","vi",["Trọng tâm"],["A","B"]));
  assert.equal((vi.match(/class="comparisonRow"/g)??[]).length,4);
  assert.equal((vi.match(/data-comparison-contrast-examples="true"/g)??[]).length,2);
  assert.match(vi,/VI source A/);
  assert.match(vi,/VI target B/);
  assert.match(vi,/Ví dụ/);
  const en=render(entry("了解","en",["Focus","Scope","Context"],["C"]));
  assert.equal((en.match(/class="comparisonRow"/g)??[]).length,5);
  assert.match(en,/Examples/);
  const zh=render(entry("懂得","zh",["侧重点"],["D"]));
  assert.match(zh,/例子/);
  assert.match(zh,/Wǒ zhīdào/);
  assert.doesNotMatch(zh,/VI source D|VI target D/);
  const sparse=render(entry("理解","vi",[],["E"],{
    closingNote:"Lời kết độc lập",
    contextExamples:[{chinese:"这是另外一个例子。",pinyin:"Zhè shì lìngwài yí ge lìzi.",translation:"Ví dụ riêng."}],
  }));
  assert.equal((sparse.match(/class="comparisonRow"/g)??[]).length,2);
  assert.match(sparse,/Lời kết độc lập/);
  assert.match(sparse,/Ví dụ riêng/);
  const old=render(entry("懂","vi",[],["legacy"],{
    sourceUseWhen:"Khi biết thông tin",targetUseWhen:"Khi hiểu nghĩa",
    contextExamples:[],closingNote:"",comparisonRows:[],
  }));
  assert.doesNotMatch(old,/class="comparisonRows"/);
  assert.match(old,/distinctionCompareGridSynced/);
});
