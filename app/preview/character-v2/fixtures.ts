export type State = "present" | "n_a" | "pending";
export type Locale = "vi" | "en";

export const characterFixtures = {
  chang: {
    key: "char.chang", primaryForm: "simplified",
    forms: [
      { key:"simplified", glyph:"长", scripts:["simplified"], role:"primary" },
      { key:"traditional", glyph:"長", scripts:["traditional"], role:"recognition_reference" },
    ],
    readings: [
      { key:"chang", pinyin:"cháng", hanViet:"trường", meanings:{vi:["Khoảng cách dài hoặc thời gian kéo dài.","Độ dài hoặc khoảng cách giữa hai điểm.","Sở trường, ưu điểm hoặc thế mạnh.","Giỏi hoặc có sở trường làm một việc."],en:["Long in distance or duration.","Length or distance between two points.","A strength, advantage, or special skill.","Being skilled at doing something."]}},
      { key:"zhang", pinyin:"zhǎng", hanViet:"trưởng", meanings:{vi:["Lớn tuổi hơn hoặc có vai vế cao hơn.","Đứng đầu theo tuổi hoặc thứ bậc.","Người lãnh đạo hoặc người phụ trách.","Mọc ra, sinh ra hoặc xuất hiện.","Sinh trưởng hoặc phát triển.","Tăng lên, thường với sự vật trừu tượng."],en:["Older or senior in generation.","Eldest or highest in seniority order.","A leader or person in charge.","Producing, sprouting, or growing something.","Growth and development.","Increase, often with abstract matters."]}},
    ],
    profiles: {
      simplified:{ radical:{state:"pending" as State}, stroke:{state:"present" as State,value:4}, structure:{state:"present" as State,code:"single",label:"独体字",formula:"长"}, decomposition:{state:"n_a" as State}, components:{state:"n_a" as State}, writing:{state:"present" as State,standard:"pending" as State,strokeOrder:"3154",guidance:"n_a" as State,assets:"pending" as State}},
      traditional:{ radical:{state:"pending" as State}, stroke:{state:"pending" as State}, structure:{state:"pending" as State}, decomposition:{state:"pending" as State}, components:{state:"pending" as State}, writing:{state:"pending" as State}},
    },
  },
  qing: {
    key:"char.qing", primaryForm:"shared",
    forms:[{key:"shared",glyph:"清",scripts:["simplified","traditional"],role:"primary"}],
    readings:[{key:"qing",pinyin:"qīng",hanViet:"thanh",meanings:{vi:["Trong, sạch; không vẩn đục.","Thuần, không pha tạp.","Rõ ràng, minh bạch."],en:["Clear or clean; not turbid.","Pure or unmixed.","Clear or distinct."]}}],
    profiles:{shared:{radical:{state:"present" as State,value:"水",display:"氵"},stroke:{state:"present" as State,value:11},structure:{state:"present" as State,code:"left_right",label:"左右结构",formula:"⿰ 氵 + 青"},decomposition:{state:"present" as State,notation:"IDS",expression:"⿰氵青"},components:{state:"present" as State,items:[
      {occurrence:"occ.qing.shui",concept:"component.qing.shui",glyph:"氵",position:"left",analysis:"semantic_support",evidence:"ev.qing.component.shui"},
      {occurrence:"occ.qing.qing",concept:"component.qing.qing",glyph:"青",position:"right",analysis:"phonetic_support",evidence:"ev.qing.component.qing"},
    ]},writing:{state:"present" as State,standard:"pending" as State,strokeOrder:"44111212511",guidance:"n_a" as State,assets:"pending" as State}}},
  },
} as const;
