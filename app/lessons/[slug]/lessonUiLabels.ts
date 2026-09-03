export type LessonUiLabels = {
  youtubeCompanionLesson: string;
  description: string;
  translationLanguage: string;
  changeLanguage: string;
  lessonText: string;
  segment: string;
  practice: string;
  exercise: string;
  showPronunciation: string;
  showTranslation: string;
  scriptTab: string;
  vocabularyTab: string;
  grammarTab: string;
  practiceTab: string;
  noVocabulary: string;
  partOfSpeech: string;
  details: string;
  hanzi: string;
  meaning: string;
  pronunciation: string;
  usage: string;
  grammarPattern: string;
  example: string;
  exampleTranslation: string;
  synonyms: string;
  antonyms: string;
  usageNotes: string;
  writingGuidancePlaceholder: string;
  grammarComingSoon: string;
  translationMissing: (languageCode: string) => string;
  noLessonSegments: string;
  noExercises: string;
  noOptions: string;
  exercisesUnavailable: string;
  openExerciseMedia: string;
  checkAnswer: string;
  checkingAnswer: string;
  answerCorrect: string;
  answerIncorrect: string;
  lessonUpdatedReload: string;
  answerCheckUnavailable: string;
  lessonUnavailable: string;
  openYouTubeLesson: string;
  youtubeVideoComingSoon: string;
};

export const LESSON_UI_LABELS: Record<"en" | "vi" | "ar", LessonUiLabels> = {
  en: {
    youtubeCompanionLesson: "YouTube companion lesson",
    description: "Read the Chinese lesson text, switch translations, and review practice questions while watching the YouTube video.",
    translationLanguage: "Translation language",
    changeLanguage: "Change language",
    lessonText: "Lesson text",
    segment: "Segment",
    practice: "Practice",
    exercise: "Exercise",
    showPronunciation: "Pronunciation",
    showTranslation: "Translation",
    scriptTab: "Script",
    vocabularyTab: "Vocabulary",
    grammarTab: "Grammar",
    practiceTab: "Practice",
    noVocabulary: "No vocabulary items are available yet.",
    partOfSpeech: "Part of speech",
    details: "Details",
    hanzi: "Hanzi",
    meaning: "Meaning",
    pronunciation: "Pronunciation",
    usage: "Usage",
    grammarPattern: "Related grammar pattern",
    example: "Example",
    exampleTranslation: "Example translation",
    synonyms: "Synonyms",
    antonyms: "Antonyms",
    usageNotes: "Usage notes",
    writingGuidancePlaceholder: "Character writing guidance will be added later.",
    grammarComingSoon: "Grammar notes coming soon.",
    translationMissing: (languageCode) => `Translation missing for ${languageCode}.`,
    noLessonSegments: "No lesson segments are available yet.",
    noExercises: "No exercises are available yet.",
    noOptions: "No options are available for this exercise yet.",
    exercisesUnavailable: "Practice exercises are temporarily unavailable.",
    openExerciseMedia: "Open exercise media",
    checkAnswer: "Check",
    checkingAnswer: "Checking…",
    answerCorrect: "Correct.",
    answerIncorrect: "Incorrect. Try another option.",
    lessonUpdatedReload: "This lesson was updated. Reload the page before checking again.",
    answerCheckUnavailable: "Unable to check this answer right now.",
    lessonUnavailable: "This lesson is temporarily unavailable. Please try again later.",
    openYouTubeLesson: "Open YouTube lesson",
    youtubeVideoComingSoon: "YouTube video coming soon",
  },
  vi: {
    youtubeCompanionLesson: "Bài học đi kèm YouTube",
    description: "Đọc nội dung bài học tiếng Trung, đổi bản dịch và ôn lại câu hỏi luyện tập trong khi xem video YouTube.",
    translationLanguage: "Ngôn ngữ bản dịch",
    changeLanguage: "Đổi ngôn ngữ",
    lessonText: "Nội dung bài học",
    segment: "Dòng",
    practice: "Bài tập",
    exercise: "Câu",
    showPronunciation: "Phiên âm",
    showTranslation: "Bản dịch",
    scriptTab: "Nội dung",
    vocabularyTab: "Từ vựng",
    grammarTab: "Ngữ pháp",
    practiceTab: "Bài tập",
    noVocabulary: "Chưa có mục từ vựng nào cho bài học này.",
    partOfSpeech: "Từ loại",
    details: "Chi tiết",
    hanzi: "Hán tự",
    meaning: "Nghĩa",
    pronunciation: "Phiên âm",
    usage: "Cách dùng",
    grammarPattern: "Mẫu ngữ pháp liên quan",
    example: "Ví dụ",
    exampleTranslation: "Bản dịch ví dụ",
    synonyms: "Từ đồng nghĩa",
    antonyms: "Từ trái nghĩa",
    usageNotes: "Ghi chú sử dụng",
    writingGuidancePlaceholder: "Hướng dẫn viết chữ sẽ được thêm sau.",
    grammarComingSoon: "Phần ghi chú ngữ pháp sẽ được thêm sau.",
    translationMissing: (languageCode) => `Thiếu bản dịch cho ${languageCode}.`,
    noLessonSegments: "Chưa có dòng nội dung bài học nào.",
    noExercises: "Chưa có bài tập nào.",
    noOptions: "Chưa có lựa chọn nào cho câu này.",
    exercisesUnavailable: "Phần bài tập hiện tạm thời chưa khả dụng.",
    openExerciseMedia: "Mở nội dung đa phương tiện",
    checkAnswer: "Kiểm tra",
    checkingAnswer: "Đang kiểm tra…",
    answerCorrect: "Chính xác.",
    answerIncorrect: "Chưa đúng. Hãy thử một lựa chọn khác.",
    lessonUpdatedReload: "Bài học vừa được cập nhật. Hãy tải lại trang trước khi kiểm tra tiếp.",
    answerCheckUnavailable: "Hiện chưa thể kiểm tra câu trả lời này.",
    lessonUnavailable: "Bài học hiện tạm thời chưa khả dụng. Vui lòng thử lại sau.",
    openYouTubeLesson: "Mở bài học YouTube",
    youtubeVideoComingSoon: "Video YouTube sắp có",
  },
  ar: {
    youtubeCompanionLesson: "درس مرافق على يوتيوب",
    description: "اقرأ نص الدرس بالصينية، وبدّل الترجمات، وراجع أسئلة التدريب أثناء مشاهدة فيديو يوتيوب.",
    translationLanguage: "لغة الترجمة",
    changeLanguage: "تغيير اللغة",
    lessonText: "نص الدرس",
    segment: "مقطع",
    practice: "تدريب",
    exercise: "سؤال",
    showPronunciation: "النطق",
    showTranslation: "الترجمة",
    scriptTab: "النص",
    vocabularyTab: "المفردات",
    grammarTab: "القواعد",
    practiceTab: "تدريب",
    noVocabulary: "لا توجد مفردات لهذا الدرس بعد.",
    partOfSpeech: "نوع الكلمة",
    details: "التفاصيل",
    hanzi: "الحروف الصينية",
    meaning: "المعنى",
    pronunciation: "النطق",
    usage: "طريقة الاستخدام",
    grammarPattern: "النمط النحوي المرتبط",
    example: "مثال",
    exampleTranslation: "ترجمة المثال",
    synonyms: "المرادفات",
    antonyms: "الأضداد",
    usageNotes: "ملاحظات الاستخدام",
    writingGuidancePlaceholder: "ستُضاف إرشادات كتابة الحرف لاحقًا.",
    grammarComingSoon: "ستُضاف ملاحظات القواعد قريبًا.",
    translationMissing: (languageCode) => `الترجمة غير متوفرة للغة ${languageCode}.`,
    noLessonSegments: "لا توجد مقاطع للدرس بعد.",
    noExercises: "لا توجد تدريبات بعد.",
    noOptions: "لا توجد خيارات لهذا السؤال بعد.",
    exercisesUnavailable: "التدريبات غير متاحة مؤقتًا.",
    openExerciseMedia: "افتح وسائط التمرين",
    checkAnswer: "تحقق",
    checkingAnswer: "جارٍ التحقق…",
    answerCorrect: "إجابة صحيحة.",
    answerIncorrect: "الإجابة غير صحيحة. جرّب خيارًا آخر.",
    lessonUpdatedReload: "تم تحديث الدرس. أعد تحميل الصفحة قبل التحقق مرة أخرى.",
    answerCheckUnavailable: "يتعذر التحقق من هذه الإجابة الآن.",
    lessonUnavailable: "هذا الدرس غير متاح مؤقتًا. يرجى المحاولة مرة أخرى لاحقًا.",
    openYouTubeLesson: "افتح درس يوتيوب",
    youtubeVideoComingSoon: "فيديو يوتيوب قادم قريبًا",
  },
};

export function labelsFor(languageCode: string) {
  return LESSON_UI_LABELS[languageCode as keyof typeof LESSON_UI_LABELS] ?? LESSON_UI_LABELS.en;
}
