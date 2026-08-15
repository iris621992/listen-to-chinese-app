// Demo/static lesson data only.
// This file supports early prototype routes and explicit fallback demo content.
// Production learning content should come from database/Admin-CMS later.
// Do not add real production lesson content here.
export type ScriptLine = {
  chinese: string;
  pinyin: string;
  english: string;
};

export type Exercise = {
  prompt: string;
  answer: string;
  locked?: boolean;
};

export type Lesson = {
  slug: string;
  hsk: 1 | 2 | 3 | 4 | 5 | 6;
  chineseTitle: string;
  englishTitle: string;
  description: string;
  duration: string;
  series: string;
  tags: string[];
  isFree: boolean;
  script: ScriptLine[];
  exercises: Exercise[];
};

export const lessons: Lesson[] = [
  {
    slug: "hsk1-day-01-ni-hao",
    hsk: 1,
    chineseTitle: "你好，我是小云",
    englishTitle: "Hello, I am Xiaoyun",
    description: "A gentle first listening lesson with greetings and simple self-introduction.",
    duration: "6 min",
    series: "30-Day HSK1",
    tags: ["Free", "30-Day HSK1", "Reading Practice"],
    isFree: true,
    script: [
      { chinese: "你好，我是小云。", pinyin: "Nǐ hǎo, wǒ shì Xiǎoyún.", english: "Hello, I am Xiaoyun." },
      { chinese: "我学习中文。", pinyin: "Wǒ xuéxí Zhōngwén.", english: "I study Chinese." },
      { chinese: "今天我们慢慢听。", pinyin: "Jīntiān wǒmen mànman tīng.", english: "Today we listen slowly." },
    ],
    exercises: [
      { prompt: "What does 小云 say her name is?", answer: "Xiaoyun" },
      { prompt: "Choose the meaning of 学习。", answer: "to study" },
      { prompt: "Repeat the sentence: 我学习中文。", answer: "Speaking practice" },
      { prompt: "Dictation: write the greeting sentence you hear.", answer: "你好，我是小云。", locked: true },
      { prompt: "Why does 慢慢听 help beginners?", answer: "It gives time to notice sounds and tones.", locked: true },
    ],
  },
  {
    slug: "hsk1-my-family",
    hsk: 1,
    chineseTitle: "我的家",
    englishTitle: "My Family",
    description: "Listen for basic family words in short, warm sentences.",
    duration: "8 min",
    series: "Stories",
    tags: ["Free", "Stories"],
    isFree: true,
    script: [
      { chinese: "我家有三个人。", pinyin: "Wǒ jiā yǒu sān ge rén.", english: "There are three people in my family." },
      { chinese: "爸爸喜欢喝茶。", pinyin: "Bàba xǐhuan hē chá.", english: "Dad likes drinking tea." },
      { chinese: "妈妈今天很忙。", pinyin: "Māma jīntiān hěn máng.", english: "Mom is very busy today." },
    ],
    exercises: [
      { prompt: "How many people are in the family?", answer: "Three" },
      { prompt: "Who likes tea?", answer: "Dad" },
      { prompt: "Translate: 妈妈今天很忙。", answer: "Mom is very busy today." },
      { prompt: "Listen again and mark the tones in 爸爸。", answer: "bàba", locked: true },
      { prompt: "Make a new sentence with 家。", answer: "Example: 我家有四个人。", locked: true },
    ],
  },
  {
    slug: "hsk1-morning-routine",
    hsk: 1,
    chineseTitle: "早上做什么？",
    englishTitle: "What Do You Do in the Morning?",
    description: "Simple daily routine language with clear pauses.",
    duration: "7 min",
    series: "Reading Practice",
    tags: ["Reading Practice"],
    isFree: false,
    script: [
      { chinese: "我早上七点起床。", pinyin: "Wǒ zǎoshang qī diǎn qǐchuáng.", english: "I get up at seven in the morning." },
      { chinese: "我喝水，也吃水果。", pinyin: "Wǒ hē shuǐ, yě chī shuǐguǒ.", english: "I drink water and also eat fruit." },
      { chinese: "然后我去学校。", pinyin: "Ránhòu wǒ qù xuéxiào.", english: "Then I go to school." },
    ],
    exercises: [
      { prompt: "What time does the speaker get up?", answer: "Seven o'clock" },
      { prompt: "Name one thing the speaker eats or drinks.", answer: "Water or fruit" },
      { prompt: "What does 然后 mean?", answer: "then" },
      { prompt: "Put the morning events in order.", answer: "Get up, drink/eat, go to school", locked: true },
      { prompt: "Shadow the full paragraph twice.", answer: "Speaking practice", locked: true },
    ],
  },
  {
    slug: "hsk2-buying-fruit",
    hsk: 2,
    chineseTitle: "买水果",
    englishTitle: "Buying Fruit",
    description: "Practice a short market conversation with prices and quantities.",
    duration: "9 min",
    series: "Stories",
    tags: ["Free", "Stories"],
    isFree: true,
    script: [
      { chinese: "这个苹果多少钱？", pinyin: "Zhège píngguǒ duōshao qián?", english: "How much is this apple?" },
      { chinese: "三块钱一个。", pinyin: "Sān kuài qián yí ge.", english: "Three yuan each." },
      { chinese: "我要两个，谢谢。", pinyin: "Wǒ yào liǎng ge, xièxie.", english: "I would like two, thank you." },
    ],
    exercises: [
      { prompt: "What fruit does the buyer ask about?", answer: "Apple" },
      { prompt: "How much is one apple?", answer: "Three yuan" },
      { prompt: "Translate: 我要两个。", answer: "I want two." },
      { prompt: "Role-play the buyer's lines from memory.", answer: "Speaking practice", locked: true },
      { prompt: "Change the dialogue to buy three apples.", answer: "我要三个。", locked: true },
    ],
  },
  {
    slug: "hsk2-weekend-plan",
    hsk: 2,
    chineseTitle: "周末计划",
    englishTitle: "Weekend Plans",
    description: "Listen to future plans using time words and common verbs.",
    duration: "10 min",
    series: "Reading Practice",
    tags: ["Reading Practice"],
    isFree: false,
    script: [
      { chinese: "这个周末我想去公园。", pinyin: "Zhège zhōumò wǒ xiǎng qù gōngyuán.", english: "This weekend I want to go to the park." },
      { chinese: "如果下雨，我就在家看书。", pinyin: "Rúguǒ xià yǔ, wǒ jiù zài jiā kàn shū.", english: "If it rains, I will read at home." },
      { chinese: "晚上我和朋友一起吃饭。", pinyin: "Wǎnshang wǒ hé péngyou yìqǐ chī fàn.", english: "In the evening I will eat with friends." },
    ],
    exercises: [
      { prompt: "Where does the speaker want to go?", answer: "The park" },
      { prompt: "What happens if it rains?", answer: "The speaker reads at home." },
      { prompt: "Who will the speaker eat with?", answer: "Friends" },
      { prompt: "Explain the pattern 如果...就...", answer: "If..., then...", locked: true },
      { prompt: "Create your own weekend plan in Chinese.", answer: "Open response", locked: true },
    ],
  },
];

export const hskDescriptions: Record<number, string> = {
  1: "Beginner-friendly listening with slow greetings, numbers, family, time, and everyday actions.",
  2: "Short practical stories and conversations using familiar HSK2 words and gentle pacing.",
  3: "Bridge into longer daily-life listening with more connectors and natural sentence patterns.",
  4: "Coming soon: calm intermediate listening with richer stories and review practice.",
  5: "Coming soon: longer Mandarin listening lessons for advanced comprehension growth.",
  6: "Coming soon: thoughtful advanced listening practice with natural themes and vocabulary.",
};

export function getLessonsByHsk(level: number) {
  return lessons.filter((lesson) => lesson.hsk === level);
}

export function getLesson(slug: string) {
  return lessons.find((lesson) => lesson.slug === slug);
}
