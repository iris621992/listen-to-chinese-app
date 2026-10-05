"use client";
import {useState} from "react";
import {characterFixtures,type Locale,type State} from "./fixtures";
import styles from "./CharacterPreview.module.css";

type PreviewComponent={occurrence:string;concept:string;glyph:string;position:string;analysis:string;evidence:string};
type PreviewProfile={radical:{state:State;value?:string;display?:string};stroke:{state:State;value?:number};structure:{state:State;label?:string;formula?:string};decomposition:{state:State;notation?:string;expression?:string};components:{state:State;items?:readonly PreviewComponent[]};writing:{state:State;standard?:State;strokeOrder?:string;guidance?:State;assets?:State}};
const copy={
vi:{preview:"BẢN XEM TRƯỚC HÁN TỰ V2",notice:"Dùng dữ liệu mẫu đã duyệt để chốt giao diện. Không phải dữ liệu Production.",recognize:"Nhận diện",understand:"Hiểu",connect:"Kết nối",use:"Sử dụng",write:"Viết",reading:"Cách đọc",hanviet:"Hán Việt",meaning:"Hướng nghĩa",form:"Dạng chữ",primary:"Giản thể chính",traditional:"Phồn thể · nhận diện",shared:"Giản thể và Phồn thể cùng dạng",structure:"Cấu trúc",radical:"Bộ thủ",strokes:"Số nét",decomposition:"Phân tách hình thể",components:"Thành phần",writing:"Viết chữ",strokeOrder:"Thứ tự nét",standard:"Chuẩn viết",guidance:"Hướng dẫn viết",pending:"Đang chờ nguồn xác nhận",na:"Không áp dụng",semantic:"Gợi nghĩa",phonetic:"Gợi âm",pendingRelations:"Các liên kết Hán tự/Từ vựng đang chờ lớp quan hệ canonical; preview không tự tạo.",technical:"Tài nguyên kỹ thuật",fixture:"Chữ mẫu"},
en:{preview:"CHARACTER V2 UI PREVIEW",notice:"Uses approved golden fixtures to review the interface. This is not Production data.",recognize:"Recognize",understand:"Understand",connect:"Connect",use:"Use",write:"Write",reading:"Readings",hanviet:"Sino-Vietnamese",meaning:"Meaning orientations",form:"Form",primary:"Primary Simplified",traditional:"Traditional · recognition",shared:"Same form in Simplified and Traditional",structure:"Structure",radical:"Radical",strokes:"Strokes",decomposition:"Graphical decomposition",components:"Components",writing:"Writing",strokeOrder:"Stroke order",standard:"Writing standard",guidance:"Writing guidance",pending:"Awaiting authoritative content",na:"Not applicable",semantic:"Semantic cue",phonetic:"Phonetic cue",pendingRelations:"Character/Vocabulary links await the canonical relation layer; the preview does not invent them.",technical:"Technical assets",fixture:"Fixture"}
} as const;
function StateValue({state,locale}:{state:State,locale:Locale}){const c=copy[locale];return <span className={state==="pending"?styles.pending:styles.na}>{state==="pending"?c.pending:c.na}</span>}
export default function CharacterPreview({locale}:{locale:Locale}){
 const [fixture,setFixture]=useState<"chang"|"qing">("chang");
 const [reading,setReading]=useState(0);
 const [form,setForm]=useState(0);
 const c=copy[locale]; const item=characterFixtures[fixture]; const r=item.readings[Math.min(reading,item.readings.length-1)]; const f=item.forms[Math.min(form,item.forms.length-1)]; const p=item.profiles[f.key as keyof typeof item.profiles] as PreviewProfile;
 const selectFixture=(x:"chang"|"qing")=>{setFixture(x);setReading(0);setForm(0)};
 return <main className={styles.page} lang={locale}>
  <div className={styles.shell}>
   <div className={styles.preview}><strong>{c.preview}</strong><span>{c.notice}</span></div>
   <div className={styles.toolbar}><div><span>{c.fixture}</span><div className={styles.switcher}><button onClick={()=>selectFixture("chang")} aria-pressed={fixture==="chang"}>长 / 長</button><button onClick={()=>selectFixture("qing")} aria-pressed={fixture==="qing"}>清</button></div></div><div className={styles.locale}><a href="?uiLang=vi">VI</a><a href="?uiLang=en">EN</a></div></div>
   <nav className={styles.sticky} aria-label="Character sections">{[["recognize",c.recognize],["understand",c.understand],["connect",c.connect],["use",c.use],["write",c.write]].map(([id,label])=><a key={id} href={"#"+id}>{label}</a>)}</nav>
   <section id="recognize" className={styles.hero}>
    <div className={styles.glyph}>{f.glyph}</div><div className={styles.heroCopy}><div className={styles.badges}>{f.scripts.map(s=><span key={s}>{s==="simplified"?c.primary:s==="traditional"?c.traditional:s}</span>)}</div><h1>{f.glyph}</h1>
     <div className={styles.readings}>{item.readings.map((x,i)=><button key={x.key} aria-pressed={i===reading} onClick={()=>setReading(i)}><strong>{x.pinyin}</strong><small>{c.hanviet}: {x.hanViet}</small></button>)}</div>
     {item.forms.length>1?<div className={styles.forms}>{item.forms.map((x,i)=><button key={x.key} aria-pressed={i===form} onClick={()=>setForm(i)}><b>{x.glyph}</b><small>{x.role==="primary"?c.primary:c.traditional}</small></button>)}</div>:<p className={styles.shared}>{c.shared}</p>}
    </div>
   </section>
   <div className={styles.grid}>
    <div className={styles.main}>
     <section id="understand" className={styles.card}><p className={styles.eyebrow}>{c.understand}</p><h2>{c.meaning} · {r.pinyin}</h2><div className={styles.meanings}>{r.meanings[locale].map((m,i)=><div key={m}><span>{i+1}</span><p>{m}</p></div>)}</div></section>
     <section id="connect" className={styles.card}><p className={styles.eyebrow}>{c.connect}</p><h2>{c.structure}</h2>
      <div className={styles.facts}><article><span>{c.radical}</span>{p.radical.state==="present"?<strong>{p.radical.value} <em>{p.radical.display}</em></strong>:<StateValue state={p.radical.state} locale={locale}/>}</article><article><span>{c.strokes}</span>{p.stroke.state==="present"?<strong>{p.stroke.value}</strong>:<StateValue state={p.stroke.state} locale={locale}/>} </article><article><span>{c.structure}</span>{p.structure.state==="present"?<strong>{p.structure.label}<em>{p.structure.formula}</em></strong>:<StateValue state={p.structure.state} locale={locale}/>}</article></div>
      <div className={styles.layer}><h3>{c.decomposition}</h3>{p.decomposition.state==="present"?<div className={styles.ids}><span>{p.decomposition.notation}</span><strong>{p.decomposition.expression}</strong></div>:<StateValue state={p.decomposition.state} locale={locale}/>}</div>
      <div className={styles.layer}><h3>{c.components}</h3>{p.components.state==="present"?<div className={styles.components}>{p.components.items?.map((x)=><article key={x.occurrence}><b>{x.glyph}</b><div><strong>{x.analysis==="semantic_support"?c.semantic:c.phonetic}</strong><small>{x.position} · {x.occurrence}</small></div></article>)}</div>:<StateValue state={p.components.state} locale={locale}/>}</div>
     </section>
     <section id="use" className={styles.card}><p className={styles.eyebrow}>{c.use}</p><h2>{locale==="vi"?"Từ và quan hệ":"Words & relationships"}</h2><div className={styles.safePending}>{c.pendingRelations}</div></section>
    </div>
    <aside id="write" className={styles.side}><section className={styles.card}><p className={styles.eyebrow}>{c.write}</p><h2>{c.writing}</h2>{p.writing.state==="present"?<><div className={styles.practice}>{f.glyph}</div><dl><div><dt>{c.strokeOrder}</dt><dd>{p.writing.strokeOrder}</dd></div><div><dt>{c.standard}</dt><dd><StateValue state={p.writing.standard} locale={locale}/></dd></div><div><dt>{c.guidance}</dt><dd><StateValue state={p.writing.guidance} locale={locale}/></dd></div><div><dt>{c.technical}</dt><dd><StateValue state={p.writing.assets} locale={locale}/></dd></div></dl></>:<StateValue state={p.writing.state} locale={locale}/>}</section></aside>
   </div>
  </div>
 </main>
}
