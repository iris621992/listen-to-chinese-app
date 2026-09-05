export type HomeCopy = {
  nav: { home: string; library: string; knowledge: string; practice: string };
  hero: {
    eyebrow: string; title: string; body: string;
    ctaLibrary: string; ctaKnowledge: string; ctaPractice: string; northStar: string;
    exploreLabel: string; exploreTitle: string; exploreBody: string;
    miniLibraryTitle: string; miniLibraryBody: string;
    miniKnowledgeTitle: string; miniKnowledgeBody: string;
    miniPracticeTitle: string; miniPracticeBody: string;
  };
  library: {
    eyebrow: string; title: string; body: string;
    videoTitle: string; videoBody: string;
    listeningTitle: string; listeningBody: string;
    readingTitle: string; readingBody: string;
    practiceOnlyTitle: string; practiceOnlyBody: string;
    reviewTitle: string; reviewBody: string;
    cta: string; latestEyebrow: string; latestTitle: string;
    invalidLevel: string; empty: string; browseAll: string;
  };
  knowledge: {
    eyebrow: string; title: string; body: string;
    vocabTitle: string; vocabBody: string;
    idiomTitle: string; idiomBody: string;
    compareTitle: string; compareBody: string;
    grammarTitle: string; grammarBody: string; cta: string;
  };
  practice: {
    eyebrow: string; title: string; body: string; tags: readonly string[];
    featureEyebrow: string; featureTitle: string; featureBody: string; cta: string;
  };
  discovery: {
    eyebrow: string; title: string; body: string;
    levelTitle: string; levelBody: string;
    languageTitle: string; languageBody: string;
    libraryTitle: string; libraryBody: string;
  };
  guest: {
    eyebrow: string; title: string; body: string;
    guestTitle: string; guestBody: string; practiceTitle: string; practiceBody: string;
  };
  how: {
    eyebrow: string; title: string; body: string;
    discover: string; discoverBody: string; understand: string; understandBody: string;
    practice: string; practiceBody: string; review: string; reviewBody: string;
  };
  positioning: {
    eyebrow: string; title: string; body: string;
    startTitle: string; startBody: string; moveTitle: string; moveBody: string;
    courseTitle: string; courseBody: string;
  };
  growing: { eyebrow: string; title: string; body: string; note: string };
  final: {
    title: string; body: string; ctaLibrary: string; ctaKnowledge: string; ctaPractice: string;
  };
  footer: { tagline: string };
};

export type HomeLocaleCode = "en" | "vi" | "ar";

export const HOME_COPY: Record<HomeLocaleCode, HomeCopy> = {
  en: {
    nav: {
      home: "Home",
      library: "Library",
      knowledge: "Knowledge",
      practice: "Practice",
    },
    hero: {
      eyebrow: "CHINESE RESOURCES · KNOWLEDGE · PRACTICE",
      title: "A growing library for Chinese learners.",
      body: "Explore listening, reading, vocabulary, grammar, idioms, and structured practice — all in one place.",
      ctaLibrary: "Explore Library",
      ctaKnowledge: "Browse Knowledge",
      ctaPractice: "Start Practice",
      northStar: "Library → Resource → Practice",
      exploreLabel: "EXPLORE YUNCHINESE",
      exploreTitle: "Choose where you want to begin.",
      exploreBody: "Start with a resource, a language question, or focused practice.",
      miniLibraryTitle: "Library",
      miniLibraryBody: "Video · Listening · Reading · Review Sets",
      miniKnowledgeTitle: "Knowledge",
      miniKnowledgeBody: "Vocabulary · Idioms · Word Comparison · Grammar",
      miniPracticeTitle: "Practice",
      miniPracticeBody: "Mixed · Vocabulary · Grammar · Dictation · Translation",
    },
    library: {
      eyebrow: "LIBRARY",
      title: "Find resources that fit your learning needs.",
      body: "Browse Chinese resources by type, level, and language.",
      videoTitle: "Video",
      videoBody: "Learn with Chinese video resources.",
      listeningTitle: "Listening",
      listeningBody: "Practice understanding spoken Chinese.",
      readingTitle: "Reading",
      readingBody: "Read Chinese in meaningful contexts.",
      practiceOnlyTitle: "Practice-only",
      practiceOnlyBody: "Go directly to focused exercises.",
      reviewTitle: "Review Sets",
      reviewBody: "Return to selected resources and language points.",
      cta: "Explore Library",
      latestEyebrow: "RECENTLY PUBLISHED",
      latestTitle: "Latest resources",
      invalidLevel: "The selected Level context is unavailable. Choose a valid Level in the header.",
      empty: "Published learning resources will appear here when discovery is available.",
      browseAll: "Browse all resources",
    },
    knowledge: {
      eyebrow: "KNOWLEDGE",
      title: "Understand the Chinese you read and hear.",
      body: "Explore vocabulary, idioms, grammar, and differences between similar words.",
      vocabTitle: "Vocabulary",
      vocabBody: "Explore meaning, usage, and related language.",
      idiomTitle: "Idioms",
      idiomBody: "Understand expressions and how they are used.",
      compareTitle: "Word Comparison",
      compareBody: "See how similar words differ in meaning and use.",
      grammarTitle: "Grammar",
      grammarBody: "Review patterns with clear examples.",
      cta: "Browse Knowledge",
    },
    practice: {
      eyebrow: "PRACTICE",
      title: "Practice what you discover.",
      body: "Use focused exercises to check understanding and reinforce useful language.",
      tags: ["Mixed", "Vocabulary", "Grammar", "Dictation", "Translation"],
      featureEyebrow: "RESOURCE CONTEXT",
      featureTitle: "Practice from a Resource",
      featureBody: "Start practice directly from a resource you are exploring.",
      cta: "Start Practice",
    },
    discovery: {
      eyebrow: "DISCOVERY",
      title: "Find what fits your needs.",
      body: "Use Level and Language context, then browse the Library for published resources.",
      levelTitle: "Level",
      levelBody: "Use the global Level control when you want proficiency context.",
      languageTitle: "Language",
      languageBody: "Choose the interface and support language from the header.",
      libraryTitle: "Library",
      libraryBody: "Browse published resources through the current Library.",
    },
    guest: {
      eyebrow: "GUEST-FIRST",
      title: "Explore first. No account required.",
      body: "Core browsing and available practice remain useful without signing in.",
      guestTitle: "Browse as a guest",
      guestBody: "Explore resources and use core practice without creating an account.",
      practiceTitle: "Practice from resources",
      practiceBody: "Use exercises attached to published resources when they are available.",
    },
    how: {
      eyebrow: "HOW YUNCHINESE WORKS",
      title: "Use YunChinese in the way that works for you.",
      body: "There is no fixed sequence. Start where it is useful for you.",
      discover: "Discover",
      discoverBody: "Find a resource or topic.",
      understand: "Understand",
      understandBody: "Read, listen, and look up what you need.",
      practice: "Practice",
      practiceBody: "Use focused exercises.",
      review: "Review",
      reviewBody: "Return to useful resources and knowledge.",
    },
    positioning: {
      eyebrow: "WHY YUNCHINESE",
      title: "Resources, knowledge, and practice in one place.",
      body: "Move between learning resources, language references, and focused practice without following a fixed course sequence.",
      startTitle: "Start anywhere",
      startBody: "Open the library, look something up, or begin with practice.",
      moveTitle: "Move between systems",
      moveBody: "Go from a resource to knowledge and practice without losing context.",
      courseTitle: "No fixed course path",
      courseBody: "Use the parts of YunChinese that are useful to you.",
    },
    growing: {
      eyebrow: "GROWING LIBRARY",
      title: "A library designed to grow with its resources.",
      body: "YunChinese brings together useful Chinese resources and learning tools in a library that can continue to expand over time.",
      note: "The botanical idea behind 芸 can inspire the visual language of growth, while the product remains centered on useful resources, knowledge, and practice.",
    },
    final: {
      title: "Explore YunChinese.",
      body: "Find a resource, look up something you want to understand, or start practicing.",
      ctaLibrary: "Explore Library",
      ctaKnowledge: "Browse Knowledge",
      ctaPractice: "Start Practice",
    },
    footer: {
      tagline: "Chinese resources, knowledge, and practice — together in one library.",
    },
  },

  vi: {
    nav: {
      home: "Trang chủ",
      library: "Thư viện",
      knowledge: "Kiến thức",
      practice: "Luyện tập",
    },
    hero: {
      eyebrow: "TÀI NGUYÊN · KIẾN THỨC · LUYỆN TẬP TIẾNG TRUNG",
      title: "Một thư viện ngày càng phong phú dành cho người học tiếng Trung.",
      body: "Khám phá tài nguyên nghe, đọc, từ vựng, ngữ pháp, thành ngữ và luyện tập có cấu trúc — tất cả trong cùng một nơi.",
      ctaLibrary: "Khám phá Thư viện",
      ctaKnowledge: "Xem Kiến thức",
      ctaPractice: "Bắt đầu luyện tập",
      northStar: "Thư viện → Tài nguyên → Luyện tập",
      exploreLabel: "KHÁM PHÁ YUNCHINESE",
      exploreTitle: "Chọn nơi bạn muốn bắt đầu.",
      exploreBody: "Bắt đầu từ một tài nguyên, một điều bạn muốn hiểu về ngôn ngữ hoặc một bài luyện tập tập trung.",
      miniLibraryTitle: "Thư viện",
      miniLibraryBody: "Video · Nghe · Đọc · Bộ ôn tập",
      miniKnowledgeTitle: "Kiến thức",
      miniKnowledgeBody: "Từ vựng · Thành ngữ · So sánh từ · Ngữ pháp",
      miniPracticeTitle: "Luyện tập",
      miniPracticeBody: "Tổng hợp · Từ vựng · Ngữ pháp · Chính tả · Dịch",
    },
    library: {
      eyebrow: "THƯ VIỆN",
      title: "Tìm tài nguyên phù hợp với nhu cầu học của bạn.",
      body: "Khám phá tài nguyên tiếng Trung theo loại nội dung, trình độ và ngôn ngữ.",
      videoTitle: "Video",
      videoBody: "Học với các tài nguyên video tiếng Trung.",
      listeningTitle: "Nghe",
      listeningBody: "Luyện khả năng hiểu tiếng Trung nói.",
      readingTitle: "Đọc",
      readingBody: "Đọc tiếng Trung trong những ngữ cảnh có ý nghĩa.",
      practiceOnlyTitle: "Chỉ luyện tập",
      practiceOnlyBody: "Đi thẳng vào các bài tập tập trung.",
      reviewTitle: "Bộ ôn tập",
      reviewBody: "Quay lại các tài nguyên và điểm ngôn ngữ đã chọn.",
      cta: "Khám phá Thư viện",
      latestEyebrow: "MỚI XUẤT BẢN",
      latestTitle: "Tài nguyên mới nhất",
      invalidLevel: "Ngữ cảnh Cấp độ đã chọn không khả dụng. Hãy chọn một Cấp độ hợp lệ ở phần đầu trang.",
      empty: "Tài nguyên học tập đã xuất bản sẽ xuất hiện ở đây khi có dữ liệu phù hợp.",
      browseAll: "Xem tất cả tài nguyên",
    },
    knowledge: {
      eyebrow: "KIẾN THỨC",
      title: "Hiểu tiếng Trung bạn đọc và nghe.",
      body: "Khám phá từ vựng, thành ngữ, ngữ pháp và sự khác nhau giữa các từ gần nghĩa.",
      vocabTitle: "Từ vựng",
      vocabBody: "Khám phá nghĩa, cách dùng và các nội dung liên quan.",
      idiomTitle: "Thành ngữ",
      idiomBody: "Hiểu các cách diễn đạt và cách chúng được sử dụng.",
      compareTitle: "So sánh từ",
      compareBody: "Xem các từ tương tự khác nhau thế nào về nghĩa và cách dùng.",
      grammarTitle: "Ngữ pháp",
      grammarBody: "Ôn lại cấu trúc với ví dụ rõ ràng.",
      cta: "Xem Kiến thức",
    },
    practice: {
      eyebrow: "LUYỆN TẬP",
      title: "Luyện tập những gì bạn khám phá.",
      body: "Dùng các bài tập tập trung để kiểm tra mức độ hiểu và củng cố nội dung hữu ích.",
      tags: ["Tổng hợp", "Từ vựng", "Ngữ pháp", "Chính tả", "Dịch"],
      featureEyebrow: "NGỮ CẢNH TÀI NGUYÊN",
      featureTitle: "Luyện tập từ một tài nguyên",
      featureBody: "Bắt đầu luyện tập trực tiếp từ tài nguyên bạn đang khám phá.",
      cta: "Bắt đầu luyện tập",
    },
    discovery: {
      eyebrow: "KHÁM PHÁ",
      title: "Tìm những gì phù hợp với nhu cầu của bạn.",
      body: "Dùng ngữ cảnh Cấp độ và Ngôn ngữ, sau đó duyệt Thư viện để tìm tài nguyên đã xuất bản.",
      levelTitle: "Cấp độ",
      levelBody: "Dùng điều khiển Cấp độ chung khi bạn muốn có ngữ cảnh trình độ.",
      languageTitle: "Ngôn ngữ",
      languageBody: "Chọn ngôn ngữ giao diện và ngôn ngữ hỗ trợ từ phần đầu trang.",
      libraryTitle: "Thư viện",
      libraryBody: "Duyệt các tài nguyên đã xuất bản trong Thư viện hiện tại.",
    },
    guest: {
      eyebrow: "ƯU TIÊN KHÁCH",
      title: "Khám phá trước. Không cần tài khoản.",
      body: "Việc duyệt nội dung và các bài tập hiện có vẫn hữu ích mà không cần đăng nhập.",
      guestTitle: "Khám phá với tư cách khách",
      guestBody: "Xem tài nguyên và dùng các chức năng luyện tập cốt lõi mà không cần tạo tài khoản.",
      practiceTitle: "Luyện tập từ tài nguyên",
      practiceBody: "Dùng các bài tập gắn với tài nguyên đã xuất bản khi có sẵn.",
    },
    how: {
      eyebrow: "YUNCHINESE HOẠT ĐỘNG NHƯ THẾ NÀO",
      title: "Sử dụng YunChinese theo cách phù hợp với bạn.",
      body: "Không có thứ tự bắt buộc. Hãy bắt đầu từ nơi hữu ích với bạn.",
      discover: "Khám phá",
      discoverBody: "Tìm một tài nguyên hoặc chủ đề.",
      understand: "Hiểu",
      understandBody: "Đọc, nghe và tra cứu những gì bạn cần.",
      practice: "Luyện tập",
      practiceBody: "Sử dụng các bài tập tập trung.",
      review: "Ôn lại",
      reviewBody: "Quay lại các tài nguyên và kiến thức hữu ích.",
    },
    positioning: {
      eyebrow: "VÌ SAO LÀ YUNCHINESE",
      title: "Tài nguyên, kiến thức và luyện tập trong cùng một nơi.",
      body: "Di chuyển linh hoạt giữa tài nguyên học tập, nội dung tra cứu ngôn ngữ và luyện tập tập trung mà không cần theo một lộ trình khóa học cố định.",
      startTitle: "Bắt đầu ở bất cứ đâu",
      startBody: "Mở thư viện, tra cứu một điều gì đó hoặc bắt đầu bằng luyện tập.",
      moveTitle: "Di chuyển giữa các hệ thống",
      moveBody: "Đi từ tài nguyên sang kiến thức và luyện tập mà không mất ngữ cảnh.",
      courseTitle: "Không có lộ trình khóa học cố định",
      courseBody: "Sử dụng những phần của YunChinese hữu ích với bạn.",
    },
    growing: {
      eyebrow: "THƯ VIỆN ĐANG PHÁT TRIỂN",
      title: "Một thư viện được thiết kế để phát triển cùng với tài nguyên.",
      body: "YunChinese tập hợp các tài nguyên tiếng Trung và công cụ học tập hữu ích trong một thư viện có thể tiếp tục mở rộng theo thời gian.",
      note: "Ý tưởng thực vật phía sau chữ 芸 có thể truyền cảm hứng cho ngôn ngữ hình ảnh về sự phát triển, trong khi sản phẩm vẫn tập trung vào tài nguyên, kiến thức và luyện tập hữu ích.",
    },
    final: {
      title: "Khám phá YunChinese.",
      body: "Tìm một tài nguyên, tra cứu điều bạn muốn hiểu hoặc bắt đầu luyện tập.",
      ctaLibrary: "Khám phá Thư viện",
      ctaKnowledge: "Xem Kiến thức",
      ctaPractice: "Bắt đầu luyện tập",
    },
    footer: {
      tagline: "Tài nguyên, kiến thức và luyện tập tiếng Trung — cùng trong một thư viện.",
    },
  },

  ar: {
    nav: {
      home: "الرئيسية",
      library: "المكتبة",
      knowledge: "المعرفة",
      practice: "التدريب",
    },
    hero: {
      eyebrow: "موارد صينية · معرفة · تدريب",
      title: "مكتبة متنامية لمتعلمي اللغة الصينية.",
      body: "استكشف الاستماع والقراءة والمفردات والقواعد والتعبيرات والتمارين المنظمة — كل ذلك في مكان واحد.",
      ctaLibrary: "استكشف المكتبة",
      ctaKnowledge: "تصفح المعرفة",
      ctaPractice: "ابدأ التدريب",
      northStar: "المكتبة ← المورد ← التدريب",
      exploreLabel: "استكشف YUNCHINESE",
      exploreTitle: "اختر من أين تريد أن تبدأ.",
      exploreBody: "ابدأ بمورد، أو سؤال لغوي، أو تدريب مركز.",
      miniLibraryTitle: "المكتبة",
      miniLibraryBody: "فيديو · استماع · قراءة · مجموعات مراجعة",
      miniKnowledgeTitle: "المعرفة",
      miniKnowledgeBody: "مفردات · تعبيرات · مقارنة الكلمات · قواعد",
      miniPracticeTitle: "التدريب",
      miniPracticeBody: "متنوع · مفردات · قواعد · إملاء · ترجمة",
    },
    library: {
      eyebrow: "المكتبة",
      title: "اعثر على موارد تناسب احتياجاتك في التعلّم.",
      body: "تصفح موارد اللغة الصينية حسب النوع والمستوى واللغة.",
      videoTitle: "فيديو",
      videoBody: "تعلّم باستخدام موارد الفيديو الصينية.",
      listeningTitle: "الاستماع",
      listeningBody: "تدرّب على فهم اللغة الصينية المنطوقة.",
      readingTitle: "القراءة",
      readingBody: "اقرأ الصينية في سياقات ذات معنى.",
      practiceOnlyTitle: "تدريب فقط",
      practiceOnlyBody: "انتقل مباشرة إلى تمارين مركزة.",
      reviewTitle: "مجموعات المراجعة",
      reviewBody: "عُد إلى الموارد والنقاط اللغوية المختارة.",
      cta: "استكشف المكتبة",
      latestEyebrow: "نُشر حديثًا",
      latestTitle: "أحدث الموارد",
      invalidLevel: "سياق المستوى المحدد غير متاح. اختر مستوى صالحًا من رأس الصفحة.",
      empty: "ستظهر موارد التعلّم المنشورة هنا عندما تتوفر بيانات مناسبة.",
      browseAll: "تصفح كل الموارد",
    },
    knowledge: {
      eyebrow: "المعرفة",
      title: "افهم اللغة الصينية التي تقرأها وتسمعها.",
      body: "استكشف المفردات والتعبيرات والقواعد والفروق بين الكلمات المتشابهة.",
      vocabTitle: "المفردات",
      vocabBody: "استكشف المعنى والاستخدام واللغة المرتبطة.",
      idiomTitle: "التعبيرات",
      idiomBody: "افهم التعبيرات وكيف تُستخدم.",
      compareTitle: "مقارنة الكلمات",
      compareBody: "تعرّف على الفروق بين الكلمات المتشابهة في المعنى والاستخدام.",
      grammarTitle: "القواعد",
      grammarBody: "راجع الأنماط مع أمثلة واضحة.",
      cta: "تصفح المعرفة",
    },
    practice: {
      eyebrow: "التدريب",
      title: "تدرّب على ما تكتشفه.",
      body: "استخدم تمارين مركزة للتحقق من الفهم وتعزيز اللغة المفيدة.",
      tags: ["متنوع", "مفردات", "قواعد", "إملاء", "ترجمة"],
      featureEyebrow: "سياق المورد",
      featureTitle: "تدرّب من خلال مورد",
      featureBody: "ابدأ التدريب مباشرة من مورد تستكشفه.",
      cta: "ابدأ التدريب",
    },
    discovery: {
      eyebrow: "الاكتشاف",
      title: "اعثر على ما يناسب احتياجاتك.",
      body: "استخدم سياق المستوى واللغة، ثم تصفح المكتبة للعثور على الموارد المنشورة.",
      levelTitle: "المستوى",
      levelBody: "استخدم أداة المستوى العامة عندما تحتاج إلى سياق لمستوى الكفاءة.",
      languageTitle: "اللغة",
      languageBody: "اختر لغة الواجهة ولغة الدعم من رأس الصفحة.",
      libraryTitle: "المكتبة",
      libraryBody: "تصفح الموارد المنشورة في المكتبة الحالية.",
    },
    guest: {
      eyebrow: "ابدأ كضيف",
      title: "استكشف أولًا. لا تحتاج إلى حساب.",
      body: "يبقى التصفح والتدريب المتاحان مفيدين دون تسجيل الدخول.",
      guestTitle: "تصفح كضيف",
      guestBody: "استكشف الموارد واستخدم التدريب الأساسي من دون إنشاء حساب.",
      practiceTitle: "تدرّب من الموارد",
      practiceBody: "استخدم التمارين المرتبطة بالموارد المنشورة عندما تكون متاحة.",
    },
    how: {
      eyebrow: "كيف يعمل YUNCHINESE",
      title: "استخدم YunChinese بالطريقة التي تناسبك.",
      body: "لا يوجد ترتيب ثابت. ابدأ من المكان المفيد لك.",
      discover: "اكتشف",
      discoverBody: "اعثر على مورد أو موضوع.",
      understand: "افهم",
      understandBody: "اقرأ واستمع وابحث عما تحتاج إليه.",
      practice: "تدرّب",
      practiceBody: "استخدم تمارين مركزة.",
      review: "راجع",
      reviewBody: "عُد إلى الموارد والمعرفة المفيدة.",
    },
    positioning: {
      eyebrow: "لماذا YUNCHINESE",
      title: "الموارد والمعرفة والتدريب في مكان واحد.",
      body: "تنقّل بين موارد التعلّم والمراجع اللغوية والتدريب المركز من دون اتباع تسلسل دورة ثابت.",
      startTitle: "ابدأ من أي مكان",
      startBody: "افتح المكتبة، ابحث عن شيء، أو ابدأ بالتدريب.",
      moveTitle: "تنقّل بين الأنظمة",
      moveBody: "انتقل من مورد إلى المعرفة والتدريب من دون فقدان السياق.",
      courseTitle: "لا يوجد مسار دورة ثابت",
      courseBody: "استخدم أجزاء YunChinese المفيدة لك.",
    },
    growing: {
      eyebrow: "مكتبة متنامية",
      title: "مكتبة مصممة لتنمو مع مواردها.",
      body: "يجمع YunChinese موارد صينية وأدوات تعلم مفيدة في مكتبة يمكنها الاستمرار في التوسع بمرور الوقت.",
      note: "يمكن للفكرة النباتية المرتبطة بحرف 芸 أن تلهم اللغة البصرية للنمو، بينما يظل المنتج مركزاً على الموارد والمعرفة والتدريب المفيد.",
    },
    final: {
      title: "استكشف YunChinese.",
      body: "اعثر على مورد، أو ابحث عن شيء تريد فهمه، أو ابدأ التدريب.",
      ctaLibrary: "استكشف المكتبة",
      ctaKnowledge: "تصفح المعرفة",
      ctaPractice: "ابدأ التدريب",
    },
    footer: {
      tagline: "موارد صينية ومعرفة وتدريب — معاً في مكتبة واحدة.",
    },
  },
};

export function getHomeCopy(localeCode: string): HomeCopy {
  return HOME_COPY[localeCode as HomeLocaleCode] ?? HOME_COPY.en;
}
