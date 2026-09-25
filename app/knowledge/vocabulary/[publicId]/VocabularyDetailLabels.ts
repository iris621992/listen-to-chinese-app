export type VocabularyDetailLabels = {
  knowledge: string;
  vocabulary: string;
  back: string;
  pronunciation: string;
  readings: string;
  partOfSpeech: string;
  sensesUsage: string;
  sense: string;
  senses: string;
  meaning: string;
  usage: string;
  usageNote: string;
  memoryTip: string;
  constructions: string;
  collocations: string;
  classifiers: string;
  example: string;
  quickDistinction: string;
  commonMistakes: string;
  relatedKnowledge: string;
  practice: string;
  usageContext: string;
  socialContext: string;
  pragmatics: string;
  characters: string;
  radical: string;
  strokes: string;
  hanViet: string;
  writingOpen: string;
  writingReplay: string;
  writingUnavailable: string;
  writingSource: string;
  unavailable: string;
};


const LABELS: Record<string, VocabularyDetailLabels> = {
  en: {
    knowledge: "Knowledge",
    vocabulary: "Vocabulary",
    back: "Back to Knowledge",
    pronunciation: "Pronunciation",
    readings: "Readings",
    partOfSpeech: "Part of speech",
    sensesUsage: "Meaning & usage",
    sense: "sense",
    senses: "senses",
    meaning: "Meaning",
    usage: "Usage",
    usageNote: "Usage note",
    memoryTip: "Memory tip",
    constructions: "Structures",
    collocations: "Common combinations",
    classifiers: "Measure words",
    example: "Example",
    quickDistinction: "Quick distinction",
    commonMistakes: "Common mistakes",
    relatedKnowledge: "Related knowledge",
    practice: "Practice",
    usageContext: "Usage & context",
    socialContext: "Social context",
    pragmatics: "Pragmatics",
    characters: "Characters",
    radical: "Radical",
    strokes: "Strokes",
    hanViet: "Sino-Vietnamese",
    writingOpen: "View writing",
    writingReplay: "Replay",
    writingUnavailable: "Writing data is temporarily unavailable.",
    writingSource: "Stroke data",
    unavailable: "This vocabulary entry is temporarily unavailable.",
  },
  vi: {
    knowledge: "Kiến thức",
    vocabulary: "Từ vựng",
    back: "Quay lại Kiến thức",
    pronunciation: "Cách đọc",
    readings: "Cách đọc",
    partOfSpeech: "Từ loại",
    sensesUsage: "Nghĩa & cách dùng",
    sense: "nghĩa",
    senses: "nghĩa",
    meaning: "Hiểu nghĩa này",
    usage: "Cách dùng",
    usageNote: "Phạm vi sử dụng",
    memoryTip: "Gợi ý ghi nhớ",
    constructions: "Cấu trúc",
    collocations: "Kết hợp tự nhiên",
    classifiers: "Lượng từ",
    example: "Ví dụ",
    quickDistinction: "Phân biệt nhanh",
    commonMistakes: "Lỗi dễ mắc",
    relatedKnowledge: "Kiến thức liên quan",
    practice: "Luyện tập",
    usageContext: "Cách dùng & ngữ cảnh",
    socialContext: "Bối cảnh xã hội",
    pragmatics: "Sắc thái & ngữ dụng",
    characters: "Hán tự",
    radical: "Bộ thủ",
    strokes: "Số nét",
    hanViet: "Hán Việt",
    writingOpen: "Xem cách viết",
    writingReplay: "Viết lại",
    writingUnavailable: "Dữ liệu cách viết tạm thời không tải được.",
    writingSource: "Dữ liệu nét",
    unavailable: "Mục từ này hiện chưa thể hiển thị.",
  },
  ar: {
    knowledge: "المعرفة",
    vocabulary: "المفردات",
    back: "العودة إلى المعرفة",
    pronunciation: "القراءة",
    readings: "القراءات",
    partOfSpeech: "نوع الكلمة",
    sensesUsage: "المعنى والاستعمال",
    sense: "معنى",
    senses: "معانٍ",
    meaning: "المعنى",
    usage: "الاستعمال",
    usageNote: "نطاق الاستعمال",
    memoryTip: "تلميح للتذكر",
    constructions: "التراكيب",
    collocations: "تراكيب طبيعية",
    classifiers: "كلمات القياس",
    example: "مثال",
    quickDistinction: "تمييز سريع",
    commonMistakes: "أخطاء شائعة",
    relatedKnowledge: "معرفة مرتبطة",
    practice: "تدريب",
    usageContext: "الاستعمال والسياق",
    socialContext: "السياق الاجتماعي",
    pragmatics: "الدلالة التداولية",
    characters: "الحروف الصينية",
    radical: "الجذر",
    strokes: "عدد الخطوط",
    hanViet: "القراءة الصينية الفيتنامية",
    writingOpen: "عرض طريقة الكتابة",
    writingReplay: "إعادة",
    writingUnavailable: "بيانات الكتابة غير متاحة مؤقتًا.",
    writingSource: "بيانات الخطوط",
    unavailable: "هذا المدخل غير متاح مؤقتًا.",
  },
};

export const vocabularyDetailLabelsFor = (localeCode: string) => LABELS[localeCode] ?? LABELS.en;

export const knowledgeLanguageUserLabel = (localeCode: string) => {
  if (localeCode === "vi") return "Tiếng Việt";
  if (localeCode === "en") return "English";
  return LABELS[localeCode] ? localeCode.toUpperCase() : "English";
};
