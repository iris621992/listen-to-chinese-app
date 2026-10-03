export type HomeCopy = {
  nav: { home: string; knowledge: string; practice: string };
  hero: {
    eyebrow: string; title: string; body: string;
    ctaKnowledge: string; ctaPractice: string; note: string;
    exploreLabel: string; exploreTitle: string; exploreBody: string;
    miniKnowledgeTitle: string; miniKnowledgeBody: string;
    miniPracticeTitle: string; miniPracticeBody: string;
    searchPlaceholder: string;
    suggestions: readonly { label: string; query: string }[];
  };
  knowledge: {
    eyebrow: string; title: string; body: string;
    cards: readonly { icon: string; title: string; body: string; cta: string }[];
  };
  practice: {
    eyebrow: string; title: string; body: string; tags: readonly string[];
    featureTitle: string; featureBody: string; cta: string;
  };
  positioning: {
    eyebrow: string; title: string; body: string;
    points: readonly { title: string; body: string }[];
  };
  account: {
    eyebrow: string; title: string; body: string;
    cards: readonly { title: string; body: string }[];
  };
  final: { title: string; body: string; ctaKnowledge: string; ctaPractice: string };
  footer: { brandDescriptor: string; tagline: string };
};

export type HomeLocaleCode = "en" | "vi";

export const HOME_COPY: Record<HomeLocaleCode, HomeCopy> = {
  vi: {
    nav: { home: "Trang chủ", knowledge: "Kiến thức", practice: "Luyện tập" },
    hero: {
      eyebrow: "THƯ VIỆN TIẾNG TRUNG",
      title: "Hiểu rõ. Dùng đúng. Nhớ lâu.",
      body: "Tra cứu kiến thức tiếng Trung với giải thích rõ ràng, ví dụ dễ hiểu và những điểm cần phân biệt khi sử dụng. Học để hiểu chắc hơn, rồi luyện lại đúng phần mình cần.",
      ctaKnowledge: "Khám phá kiến thức",
      ctaPractice: "Làm bài tập",
      note: "Bắt đầu từ một từ, một chữ Hán hay bất kỳ điều gì bạn đang chưa chắc.",
      exploreLabel: "KHÁM PHÁ YUNCHINESE",
      exploreTitle: "Bạn đang muốn làm gì?",
      exploreBody: "Tra cứu điều chưa rõ, đọc sâu hơn khi muốn hiểu chắc hoặc luyện lại phần mình còn yếu.",
      miniKnowledgeTitle: "KIẾN THỨC",
      miniKnowledgeBody: "Từ vựng · Hán tự · Ngữ pháp · So sánh · Thành ngữ",
      miniPracticeTitle: "LUYỆN TẬP",
      miniPracticeBody: "Luyện theo từng chủ điểm và quay lại phần giải thích khi có chỗ chưa chắc.",
      searchPlaceholder: "Tìm từ, Hán tự, ngữ pháp, thành ngữ…",
      suggestions: [
        { label: "了", query: "了" },
        { label: "看 và 看见", query: "看 看见" },
        { label: "画蛇添足", query: "画蛇添足" },
      ],
    },
    knowledge: {
      eyebrow: "THƯ VIỆN YUNCHINESE",
      title: "Tra để hiểu. Luyện để dùng được.",
      body: "YunChinese kết nối phần kiến thức với nội dung luyện tập theo từng chủ điểm. Khi chưa chắc một điểm nào đó, bạn có thể quay lại phần giải thích liên quan để xem lại.",
      cards: [
        { icon: "词", title: "Từ vựng · 词汇", body: "Nghĩa, cách đọc, cách dùng, từ thường đi cùng, ví dụ và những điểm dễ nhầm.", cta: "Tra cứu Từ vựng →" },
        { icon: "字", title: "Hán tự · 汉字", body: "Cấu tạo chữ, bộ thủ, cách đọc, cách viết và mối liên hệ với từ vựng.", cta: "Xem Hán tự →" },
        { icon: "法", title: "Ngữ pháp · 语法", body: "Cấu trúc, cách dùng, ví dụ và những lỗi người học thường gặp.", cta: "Xem Ngữ pháp →" },
        { icon: "辨", title: "So sánh · 辨析", body: "Phân biệt những từ và cách diễn đạt gần nghĩa, dễ nhầm trong thực tế.", cta: "Xem So sánh →" },
        { icon: "成", title: "Thành ngữ & Điển cố · 成语 · 典故", body: "Nghĩa, sắc thái, cách dùng và câu chuyện đằng sau khi cần tìm hiểu sâu hơn.", cta: "Khám phá Thành ngữ & Điển cố →" },
      ],
    },
    practice: {
      eyebrow: "LUYỆN TẬP · 练习",
      title: "Luyện đúng phần mình đang học.",
      body: "Bài tập được tổ chức theo từng chủ điểm để bạn biết mình đang luyện gì, sai ở đâu và cần xem lại phần kiến thức nào.",
      tags: ["Từ vựng", "Hán tự", "Ngữ pháp", "So sánh", "Thành ngữ"],
      featureTitle: "Học đến đâu, luyện đến đó.",
      featureBody: "Mỗi bài tập tập trung vào một điểm cụ thể, để việc luyện tập gắn với điều bạn vừa học thay vì trở thành những câu hỏi rời rạc.",
      cta: "Làm bài tập",
    },
    positioning: {
      eyebrow: "VÌ SAO YUNCHINESE",
      title: "Vì sao dùng YunChinese?",
      body: "Tra nhanh khi cần, đọc sâu khi muốn và luyện lại đúng phần mình đang học.",
      points: [
        { title: "Chuyên sâu nhưng không khó đọc", body: "Một mục có thể được xem nhanh khi bạn chỉ cần tra cứu, hoặc đọc sâu hơn khi muốn hiểu rõ cách dùng và những điểm dễ nhầm." },
        { title: "Giải thích bằng ngôn ngữ của bạn", body: "Nội dung tiếng Trung được giữ làm nền, còn phần giải thích được viết theo ngôn ngữ người học để dễ hiểu và tự nhiên hơn." },
        { title: "Học xong có thể luyện lại", body: "Kiến thức và bài tập được kết nối theo từng chủ điểm, để khi làm chưa chắc bạn biết mình cần quay lại xem phần nào." },
      ],
    },
    account: {
      eyebrow: "TÀI KHOẢN",
      title: "Dùng ngay. Đăng nhập khi cần lưu.",
      body: "Bạn có thể tra cứu và đọc nội dung mà không cần tài khoản. Khi muốn lưu từ, lưu nội dung đang học, theo dõi bài đã làm hoặc quay lại những phần cần ôn, hãy đăng nhập.",
      cards: [
        { title: "Khám phá không cần tài khoản", body: "Tra cứu kiến thức và sử dụng những nội dung cơ bản trước khi quyết định đăng nhập." },
        { title: "Lưu để học tiếp", body: "Đăng nhập khi bạn muốn lưu nội dung, theo dõi tiến độ và quay lại những phần cần ôn." },
      ],
    },
    final: {
      title: "Hôm nay bạn muốn tìm hiểu điều gì trong tiếng Trung?",
      body: "Bắt đầu bằng một từ, một chữ Hán hay bất kỳ điều gì bạn đang chưa chắc.",
      ctaKnowledge: "Khám phá kiến thức",
      ctaPractice: "Làm bài tập",
    },
    footer: {
      brandDescriptor: "Thư viện tiếng Trung",
      tagline: "Hiểu rõ. Dùng đúng. Nhớ lâu.",
    },
  },
  en: {
    nav: { home: "Home", knowledge: "Knowledge", practice: "Practice" },
    hero: {
      eyebrow: "CHINESE LEARNING LIBRARY",
      title: "Understand better. Use it well. Remember longer.",
      body: "Look up Chinese with clear explanations, useful examples, and the distinctions that matter in real use. Learn until it makes sense, then practice what you need.",
      ctaKnowledge: "Explore knowledge",
      ctaPractice: "Practice",
      note: "Start with a word, a character, or anything you are still unsure about.",
      exploreLabel: "EXPLORE YUNCHINESE",
      exploreTitle: "What do you want to do?",
      exploreBody: "Look something up, go deeper when you want a clearer answer, or practice the part you want to strengthen.",
      miniKnowledgeTitle: "KNOWLEDGE",
      miniKnowledgeBody: "Vocabulary · Characters · Grammar · Comparisons · Idioms",
      miniPracticeTitle: "PRACTICE",
      miniPracticeBody: "Practice by topic and return to the explanation whenever something is still unclear.",
      searchPlaceholder: "Search words, characters, grammar, idioms…",
      suggestions: [
        { label: "了", query: "了" },
        { label: "看 vs 看见", query: "看 看见" },
        { label: "画蛇添足", query: "画蛇添足" },
      ],
    },
    knowledge: {
      eyebrow: "YUNCHINESE LIBRARY",
      title: "Look it up to understand it. Practice it to use it.",
      body: "YunChinese connects explanations with practice by topic. When something still feels uncertain, you can return to the relevant explanation and review it.",
      cards: [
        { icon: "词", title: "Vocabulary · 词汇", body: "Meaning, pronunciation, usage, common combinations, examples, and distinctions that help you avoid common confusion.", cta: "Browse Vocabulary →" },
        { icon: "字", title: "Characters · 汉字", body: "Structure, radicals, readings, writing, and links between characters and vocabulary.", cta: "Explore Characters →" },
        { icon: "法", title: "Grammar · 语法", body: "Structures, usage, examples, and the mistakes learners commonly make.", cta: "Explore Grammar →" },
        { icon: "辨", title: "Comparisons · 辨析", body: "See how similar words and expressions differ when you actually use them.", cta: "View Comparisons →" },
        { icon: "成", title: "Idioms & Allusions · 成语 · 典故", body: "Meaning, nuance, usage, and the story behind an expression when you want to go deeper.", cta: "Explore Idioms & Allusions →" },
      ],
    },
    practice: {
      eyebrow: "PRACTICE · 练习",
      title: "Practice what you are learning.",
      body: "Exercises are organized around specific topics, so you know what you are practicing, where you went wrong, and what to review.",
      tags: ["Vocabulary", "Characters", "Grammar", "Comparisons", "Idioms"],
      featureTitle: "Learn it, then put it to work.",
      featureBody: "Each exercise focuses on a clear learning point, so practice stays connected to what you have learned instead of becoming random repetition.",
      cta: "Practice now",
    },
    positioning: {
      eyebrow: "WHY YUNCHINESE",
      title: "Why use YunChinese?",
      body: "Look something up quickly when you need an answer, go deeper when you want to understand it, and practice the part you are learning.",
      points: [
        { title: "Detailed without being hard to read", body: "Scan an entry when you only need a quick answer, or read further when you want the usage, nuance, and common points of confusion." },
        { title: "Explanations in your language", body: "Chinese stays at the center, while learner explanations are written naturally for each supported language." },
        { title: "Learn, then practice", body: "Knowledge and exercises are connected by topic, so when something is still unclear you know what to review." },
      ],
    },
    account: {
      eyebrow: "ACCOUNT",
      title: "Use it now. Sign in when you want to save.",
      body: "You can browse and read without an account. Sign in when you want to save words and learning items, track practice, or return to things you want to review.",
      cards: [
        { title: "Explore without an account", body: "Browse Knowledge and use the core learning content before deciding whether to sign in." },
        { title: "Save and come back", body: "Sign in when you want to save learning items, track progress, and return to things that need review." },
      ],
    },
    final: {
      title: "What do you want to understand in Chinese today?",
      body: "Start with a word, a character, or anything you are still unsure about.",
      ctaKnowledge: "Explore knowledge",
      ctaPractice: "Practice",
    },
    footer: {
      brandDescriptor: "Chinese learning library",
      tagline: "Understand better. Use it well. Remember longer.",
    },
  },
};

export function getHomeCopy(localeCode: string): HomeCopy {
  return HOME_COPY[localeCode === "vi" ? "vi" : "en"];
}
