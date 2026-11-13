export type CharacterDetailLabels = {
  knowledge: string;
  characters: string;
  meaning: string;
  roleInWords: string;
  reading: string;
  structure: string;
  recognition: string;
  writing: string;
  radical: string;
  radicalForm: string;
  strokes: string;
  hanViet: string;
  representativeWords: string;
  noVocabularyLinks: string;
  writingOpen: string;
  writingReplay: string;
  writingUnavailable: string;
  writingSource: string;
  unavailable: string;
};

const LABELS: Record<string, CharacterDetailLabels> = {
  vi: {
    knowledge: "Kiến thức",
    characters: "Hán tự",
    meaning: "Ý nghĩa",
    roleInWords: "Vai trò trong từ",
    reading: "Cách đọc",
    structure: "Cấu tạo",
    recognition: "Nhận diện",
    writing: "Cách viết",
    radical: "Bộ thủ",
    radicalForm: "Dạng trong chữ",
    strokes: "Số nét",
    hanViet: "Hán Việt",
    representativeWords: "Từ tiêu biểu",
    noVocabularyLinks: "Chưa có mục Từ vựng canonical phù hợp để liên kết.",
    writingOpen: "Mở cách viết",
    writingReplay: "Phát lại thứ tự nét",
    writingUnavailable: "Chưa có dữ liệu cách viết đã được phê duyệt.",
    writingSource: "Dữ liệu nét",
    unavailable: "Nội dung Hán tự hiện chưa khả dụng.",
  },
  en: {
    knowledge: "Knowledge",
    characters: "Characters",
    meaning: "Meaning",
    roleInWords: "Role in words",
    reading: "Reading",
    structure: "Structure",
    recognition: "Recognition",
    writing: "Writing",
    radical: "Radical",
    radicalForm: "Form in glyph",
    strokes: "Strokes",
    hanViet: "Sino-Vietnamese",
    representativeWords: "Representative words",
    noVocabularyLinks: "No matching canonical Vocabulary entries are available to link yet.",
    writingOpen: "Open writing",
    writingReplay: "Replay stroke order",
    writingUnavailable: "Approved writing data is not available yet.",
    writingSource: "Stroke data",
    unavailable: "Character knowledge is currently unavailable.",
  },
};

export function characterDetailLabelsFor(localeCode: string) {
  return LABELS[localeCode] ?? LABELS.en;
}
