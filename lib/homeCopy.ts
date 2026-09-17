export type HomeCopy = {
  nav: { home: string; video: string; knowledge: string; practice: string };
  hero: {
    eyebrow: string; title: string; body: string;
    ctaKnowledge: string; ctaVideo: string; ctaPractice: string; note: string;
    exploreLabel: string; exploreTitle: string; exploreBody: string;
    miniKnowledgeTitle: string; miniKnowledgeBody: string;
    miniVideoTitle: string; miniVideoBody: string;
    miniPracticeTitle: string; miniPracticeBody: string;
    searchPlaceholder: string;
  };
  knowledge: {
    eyebrow: string; title: string; body: string;
    cards: readonly { icon: string; title: string; body: string; cta: string }[];
  };
  video: {
    eyebrow: string; title: string; body: string; featureTitle: string; featureBody: string;
    points: readonly { title: string; body: string }[]; cta: string;
  };
  practice: {
    eyebrow: string; title: string; body: string; tags: readonly string[];
    featureTitle: string; featureBody: string; cta: string;
  };
  how: { eyebrow: string; title: string; body: string; steps: readonly { title: string; body: string }[] };
  positioning: { eyebrow: string; title: string; body: string; points: readonly { title: string; body: string }[] };
  account: { eyebrow: string; title: string; body: string; cards: readonly { title: string; body: string }[] };
  final: { title: string; body: string; ctaKnowledge: string; ctaVideo: string };
  footer: { tagline: string };
};

export type HomeLocaleCode = "en" | "vi";

export const HOME_COPY: Record<HomeLocaleCode, HomeCopy> = {
  vi: {
    nav: { home: "Trang chủ", video: "Video", knowledge: "Kiến thức", practice: "Luyện tập" },
    hero: {
      eyebrow: "KIẾN THỨC · VIDEO · LUYỆN TẬP",
      title: "Hiểu tiếng Trung rõ hơn. Dùng tự nhiên hơn.",
      body: "Tra cứu điều bạn chưa chắc, xem tiếng Trung trong ngữ cảnh và luyện đúng điểm mình cần — không bị buộc vào một lộ trình khóa học cố định.",
      ctaKnowledge: "Tra cứu Kiến thức", ctaVideo: "Xem Video", ctaPractice: "Luyện tập",
      note: "Bắt đầu từ câu hỏi, nội dung hoặc kỹ năng bạn đang cần.",
      exploreLabel: "KHÁM PHÁ YUNCHINESE", exploreTitle: "Bạn muốn bắt đầu từ đâu?",
      exploreBody: "Chọn đúng điểm vào thay vì phải đi theo một khóa học tuyến tính.",
      miniKnowledgeTitle: "KIẾN THỨC", miniKnowledgeBody: "Từ vựng · Hán tự · So sánh · Thành ngữ · Ngữ pháp",
      miniVideoTitle: "VIDEO", miniVideoBody: "Xem tiếng Trung trong ngữ cảnh và mở rộng sang điểm kiến thức liên quan.",
      miniPracticeTitle: "LUYỆN TẬP", miniPracticeBody: "Luyện theo mục tiêu: từ vựng, ngữ pháp, nghe chép, dịch và ôn tập.",
      searchPlaceholder: "Bạn muốn tra điều gì?",
    },
    knowledge: {
      eyebrow: "KIẾN THỨC · 知识", title: "Tra cứu để hiểu đúng trước khi ghi nhớ.",
      body: "Phần Kiến thức giải thích nghĩa, cách dùng, khác biệt và những điểm người học dễ nhầm — không chỉ là một danh sách định nghĩa.",
      cards: [
        { icon: "词", title: "Từ vựng · 词汇", body: "Nghĩa, cách đọc, Hán Việt khi có, lượng từ, kết hợp tự nhiên, ví dụ, sắc thái và phân biệt nhanh.", cta: "Tra cứu Từ vựng →" },
        { icon: "字", title: "Hán tự · 汉字", body: "Hiểu chữ, cấu trúc, bộ thủ, cách đọc và cách viết khi dữ liệu phù hợp được cung cấp.", cta: "Xem Hán tự →" },
        { icon: "辨", title: "So sánh · 辨析", body: "Phân biệt những từ hoặc cách diễn đạt gần nhau bằng khác biệt thực tế trong cách dùng.", cta: "Xem So sánh →" },
        { icon: "成", title: "Thành ngữ · 成语", body: "Hiểu nghĩa, sắc thái và ngữ cảnh sử dụng thay vì chỉ ghi nhớ một bản dịch ngắn.", cta: "Xem Thành ngữ →" },
        { icon: "法", title: "Ngữ pháp · 语法", body: "Tra cấu trúc, chức năng, cách dùng và ví dụ theo nhu cầu thay vì phải học tuần tự.", cta: "Xem Ngữ pháp →" },
      ],
    },
    video: {
      eyebrow: "VIDEO · 视频", title: "Gặp tiếng Trung trong ngữ cảnh thật hơn.",
      body: "Video là nguồn tài liệu giúp người học gặp từ và cấu trúc ngữ pháp trong ngữ cảnh thực tế, sau đó có thể chuyển sang Kiến thức hoặc Luyện tập khi cần.",
      featureTitle: "Xem video, rồi đi sâu vào điều bạn vừa gặp.",
      featureBody: "Video không phải toàn bộ sản phẩm và cũng không phải một khóa học bắt buộc. Đây là nơi để bạn tiếp xúc với tiếng Trung, nhận ra điều chưa hiểu và mở sang phần Kiến thức tương ứng.",
      points: [
        { title: "Theo cấp độ", body: "Dùng cấp độ như bộ lọc và ngữ cảnh." },
        { title: "Nối sang Kiến thức", body: "Từ hoặc cấu trúc đáng chú ý có thể dẫn sang mục Kiến thức tương ứng." },
      ],
      cta: "Khám phá Video",
    },
    practice: {
      eyebrow: "LUYỆN TẬP · 练习", title: "Luyện đúng điểm bạn cần, không phụ thuộc vào video.",
      body: "Luyện tập là một trụ cột độc lập. Bài tập có thể bắt đầu từ Kiến thức, từ Video hoặc trực tiếp từ nhu cầu của người học.",
      tags: ["Tổng hợp", "Từ vựng", "Ngữ pháp", "Phân biệt", "Nghe chép", "Dịch"],
      featureTitle: "Từ hiểu → dùng → ghi nhớ.",
      featureBody: "Mỗi bài tập nên nhắm vào một điểm kiến thức cụ thể để người học biết mình đang luyện điều gì và vì sao câu trả lời đúng hoặc sai.",
      cta: "Bắt đầu Luyện tập",
    },
    how: {
      eyebrow: "CÁCH YUNCHINESE HOẠT ĐỘNG", title: "Bắt đầu ở nơi hữu ích nhất với bạn.",
      body: "Không có một lộ trình bắt buộc. YunChinese kết nối các hệ thống để bạn đi từ thắc mắc đến hiểu, luyện và ghi nhớ mà không mất ngữ cảnh.",
      steps: [
        { title: "Tra cứu", body: "Tìm từ, Hán tự, ngữ pháp, thành ngữ hoặc điểm cần phân biệt." },
        { title: "Hiểu & phân biệt", body: "Nắm nghĩa, cách dùng, phạm vi và khác biệt quan trọng." },
        { title: "Luyện tập", body: "Làm bài tập nhắm đúng điểm kiến thức thay vì luyện ngẫu nhiên." },
        { title: "Ghi nhớ", body: "Quay lại những điểm cần ôn và xây trí nhớ dài hạn." },
      ],
    },
    positioning: {
      eyebrow: "VÌ SAO YUNCHINESE", title: "Không phải khóa học cố định. Không chỉ là từ điển.",
      body: "YunChinese kết hợp Kiến thức, Video và Luyện tập để người học tự chọn điểm bắt đầu nhưng vẫn có đủ chiều sâu để hiểu và sử dụng tiếng Trung tốt hơn.",
      points: [
        { title: "Kiến thức có chiều sâu", body: "Nội dung được tổ chức theo cấu trúc dữ liệu ngữ nghĩa đã chốt, không ép mọi mục từ vào cùng một khuôn." },
        { title: "Video có vai trò rõ ràng", body: "Là nguồn ngữ liệu và ngữ cảnh, không phải cấu trúc trung tâm của toàn sản phẩm." },
        { title: "Luyện tập nối đúng điểm kiến thức", body: "Bài tập được thiết kế để luyện đúng điều người học vừa tra cứu hoặc đang cần cải thiện." },
      ],
    },
    account: {
      eyebrow: "TÀI KHOẢN", title: "Khám phá trước. Đăng nhập khi bạn muốn lưu tiến độ.",
      body: "Phần cốt lõi vẫn hữu ích cho người học chưa đăng nhập; tài khoản bổ sung khả năng lưu, theo dõi và ôn lại khi cần.",
      cards: [
        { title: "Dùng như khách", body: "Tra cứu Kiến thức và khám phá Video mà không cần tạo tài khoản trước." },
        { title: "Lưu và quay lại", body: "Đăng nhập khi bạn muốn lưu mục học, tiến độ Luyện tập và những điểm cần ôn." },
      ],
    },
    final: { title: "Bắt đầu từ điều bạn đang muốn hiểu.", body: "Tra cứu một điểm tiếng Trung, xem Video để có ngữ cảnh, hoặc luyện đúng kỹ năng bạn cần.", ctaKnowledge: "Khám phá Kiến thức", ctaVideo: "Xem Video" },
    footer: { tagline: "Kiến thức, Video và Luyện tập được kết nối để người học tiếng Trung hiểu sâu hơn và dùng tự nhiên hơn." },
  },
  en: {
    nav: { home: "Home", video: "Video", knowledge: "Knowledge", practice: "Practice" },
    hero: {
      eyebrow: "KNOWLEDGE · VIDEO · PRACTICE",
      title: "Understand Chinese more clearly. Use it more naturally.",
      body: "Look up what you are unsure about, meet Chinese in context, and practice exactly what you need — without being locked into a fixed course path.",
      ctaKnowledge: "Browse Knowledge", ctaVideo: "Explore Video", ctaPractice: "Practice",
      note: "Start from the question, content, or skill that matters to you now.",
      exploreLabel: "EXPLORE YUNCHINESE", exploreTitle: "Where do you want to begin?",
      exploreBody: "Choose the entry point that helps you now instead of following a linear course.",
      miniKnowledgeTitle: "KNOWLEDGE", miniKnowledgeBody: "Vocabulary · Characters · Comparisons · Idioms · Grammar",
      miniVideoTitle: "VIDEO", miniVideoBody: "Meet Chinese in context and open the related knowledge when you need more depth.",
      miniPracticeTitle: "PRACTICE", miniPracticeBody: "Practice by goal: vocabulary, grammar, dictation, translation, and review.",
      searchPlaceholder: "What do you want to look up?",
    },
    knowledge: {
      eyebrow: "KNOWLEDGE · 知识", title: "Look things up to understand them correctly before you memorize them.",
      body: "Knowledge explains meaning, usage, distinctions, and common learner confusion — not just short definitions.",
      cards: [
        { icon: "词", title: "Vocabulary · 词汇", body: "Meaning, pronunciation, learner support, measure words, natural combinations, examples, nuance, and quick distinctions.", cta: "Browse Vocabulary →" },
        { icon: "字", title: "Characters · 汉字", body: "Understand character structure, radicals, readings, and writing information when reliable data is available.", cta: "Explore Characters →" },
        { icon: "辨", title: "Comparisons · 辨析", body: "See how similar words and expressions differ in real usage.", cta: "View Comparisons →" },
        { icon: "成", title: "Idioms · 成语", body: "Understand meaning, nuance, and context instead of memorizing only a short translation.", cta: "Explore Idioms →" },
        { icon: "法", title: "Grammar · 语法", body: "Look up structures, functions, usage, and examples when you need them rather than following a fixed sequence.", cta: "Explore Grammar →" },
      ],
    },
    video: {
      eyebrow: "VIDEO · 视频", title: "Meet Chinese in richer context.",
      body: "Video is a learning resource that helps learners encounter words and grammar structures in real-world contexts, then move to Knowledge or Practice when needed.",
      featureTitle: "Watch a video, then go deeper into what you just encountered.",
      featureBody: "Video is not the whole product and not a mandatory course path. It gives you Chinese input, exposes what you do not yet understand, and connects you to the relevant Knowledge.",
      points: [
        { title: "Filter by level", body: "Use level as context and filtering." },
        { title: "Connect to Knowledge", body: "Notable words and structures can lead into the corresponding knowledge entries." },
      ],
      cta: "Explore Video",
    },
    practice: {
      eyebrow: "PRACTICE · 练习", title: "Practice what you need, independently of video.",
      body: "Practice is its own pillar. Exercises can begin from Knowledge, from Video, or directly from a learner need.",
      tags: ["Mixed", "Vocabulary", "Grammar", "Distinctions", "Dictation", "Translation"],
      featureTitle: "From understanding → use → retention.",
      featureBody: "Each exercise should target a specific concept so learners know what they are practicing and why an answer is right or wrong.",
      cta: "Start Practice",
    },
    how: {
      eyebrow: "HOW YUNCHINESE WORKS", title: "Start where it is most useful to you.",
      body: "There is no mandatory sequence. YunChinese connects its systems so you can move from a question to understanding, practice, and retention without losing context.",
      steps: [
        { title: "Look up", body: "Find a word, character, grammar point, idiom, or distinction you need." },
        { title: "Understand & distinguish", body: "Learn the meaning, usage, scope, and important differences." },
        { title: "Practice", body: "Work on exercises that target the exact concept instead of random repetition." },
        { title: "Retain", body: "Return to what needs review and build longer-term memory." },
      ],
    },
    positioning: {
      eyebrow: "WHY YUNCHINESE", title: "Not a fixed course. Not just a dictionary.",
      body: "YunChinese connects Knowledge, Video, and Practice so learners can choose where to begin while still getting enough depth to understand and use Chinese better.",
      points: [
        { title: "Knowledge with depth", body: "Content follows its semantic contract instead of forcing every entry into the same shallow template." },
        { title: "Video with a clear role", body: "It is input and context, not the organizing center of the whole product." },
        { title: "Practice tied to concepts", body: "Exercises target the specific knowledge a learner just looked up or needs to improve." },
      ],
    },
    account: {
      eyebrow: "ACCOUNT", title: "Explore first. Sign in when you want to save progress.",
      body: "Core learning remains useful before sign-in; an account adds saving, progress, and review when you need them.",
      cards: [
        { title: "Use as a guest", body: "Browse Knowledge and explore Video without creating an account first." },
        { title: "Save and return", body: "Sign in when you want to save learning items, Practice progress, and review targets." },
      ],
    },
    final: { title: "Start from what you want to understand.", body: "Look up a Chinese point, use Video for context, or practice the exact skill you need.", ctaKnowledge: "Browse Knowledge", ctaVideo: "Explore Video" },
    footer: { tagline: "Knowledge, Video, and Practice are connected so Chinese learners can understand more deeply and use the language more naturally." },
  },
};

export function getHomeCopy(localeCode: string): HomeCopy {
  return HOME_COPY[localeCode === "vi" ? "vi" : "en"];
}