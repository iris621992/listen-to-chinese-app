import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";
import { loadVocabularyDetail } from "@/lib/vocabularyDetail";

type Props = {
  params: Promise<{ publicId: string }>;
  searchParams?: Promise<{
    uiLang?: string;
    lang?: string;
    levelSystem?: string;
    level?: string;
  }>;
};

type Labels = {
  eyebrow: string;
  back: string;
  forms: string;
  simplified: string;
  traditional: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  translations: string;
  unavailable: string;
};

const LABELS: Record<string, Labels> = {
  en: {
    eyebrow: "Vocabulary",
    back: "Back to Knowledge",
    forms: "Written forms",
    simplified: "Simplified",
    traditional: "Traditional",
    pronunciation: "Pronunciation",
    partOfSpeech: "Part of speech",
    meaning: "Meaning",
    translations: "Translation equivalents",
    unavailable: "This vocabulary entry is temporarily unavailable.",
  },
  vi: {
    eyebrow: "Từ vựng",
    back: "Quay lại Kiến thức",
    forms: "Dạng chữ",
    simplified: "Giản thể",
    traditional: "Phồn thể",
    pronunciation: "Phiên âm",
    partOfSpeech: "Từ loại",
    meaning: "Nghĩa",
    translations: "Từ tương đương",
    unavailable: "Mục từ này hiện chưa thể hiển thị.",
  },
  ar: {
    eyebrow: "المفردات",
    back: "العودة إلى المعرفة",
    forms: "الأشكال الكتابية",
    simplified: "المبسطة",
    traditional: "التقليدية",
    pronunciation: "النطق",
    partOfSpeech: "نوع الكلمة",
    meaning: "المعنى",
    translations: "المكافئات الترجمية",
    unavailable: "هذا المدخل غير متاح مؤقتًا.",
  },
};

const labelFor = (localeCode: string) => LABELS[localeCode] ?? LABELS.en;

const formLabel = (scriptVariantCode: string | null, labels: Labels) => {
  if (scriptVariantCode === "simplified") return labels.simplified;
  if (scriptVariantCode === "traditional") return labels.traditional;
  return scriptVariantCode ?? labels.forms;
};

export default async function VocabularyDetailPage({ params, searchParams }: Props) {
  const { publicId } = await params;
  const query = await searchParams;
  const interfaceLocale = resolveInterfaceLocale(query?.uiLang, query?.lang);
  const labels = labelFor(interfaceLocale.code);
  const learnerContextQuery = preservedLearnerContextQuery({
    uiLang: query?.uiLang,
    lang: query?.lang,
    levelSystem: query?.levelSystem,
    level: query?.level,
  });
  const result = await loadVocabularyDetail(publicId, query?.lang ?? query?.uiLang);

  if (result.status === "NOT_FOUND" || result.status === "INVALID_INPUT") notFound();

  if (result.status !== "FOUND") {
    return (
      <main
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16"
        dir={interfaceLocale.direction}
      >
        <Link
          href={{ pathname: "/knowledge", query: learnerContextQuery }}
          className="text-sm font-semibold text-cinnabar hover:underline"
        >
          ← {labels.back}
        </Link>
        <p className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-6 text-stone-700">
          {labels.unavailable}
        </p>
      </main>
    );
  }

  const detail = result.detail;
  const primaryPronunciation =
    detail.pronunciations.find((item) => item.isDefault) ?? detail.pronunciations[0];
  const allReadingItems = detail.pronunciations.flatMap((item) => item.readingItems);

  return (
    <main
      className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14"
      dir={interfaceLocale.direction}
    >
      <Link
        href={{ pathname: "/knowledge", query: learnerContextQuery }}
        className="text-sm font-semibold text-cinnabar hover:underline"
      >
        ← {labels.back}
      </Link>

      <section className="mt-5 rounded-[2rem] border border-orange-100 bg-paper p-6 shadow-soft sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-cinnabar">
          {labels.eyebrow}
        </p>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight text-stone-900 sm:text-6xl">
              {detail.displayForm}
            </h1>
            {primaryPronunciation ? (
              <p className="mt-3 text-xl text-stone-600">{primaryPronunciation.pronunciation}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {detail.forms.map((form) => (
              <span
                key={form.publicId}
                className="rounded-full border border-orange-100 bg-cream px-4 py-2 text-sm text-stone-700"
              >
                <span className="font-semibold">{form.text}</span>
                <span className="mx-2 text-stone-300">·</span>
                {formLabel(form.scriptVariantCode, labels)}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-6">
        {allReadingItems.map((item, index) => (
          <section
            key={item.publicId}
            className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
              <span className="font-semibold text-stone-700">#{index + 1}</span>
              {item.partOfSpeechCode ? (
                <span className="rounded-full bg-stone-100 px-3 py-1">
                  {labels.partOfSpeech}: {item.partOfSpeechCode}
                </span>
              ) : null}
              {item.regionProfileCode ? (
                <span className="rounded-full bg-stone-100 px-3 py-1">
                  {item.regionProfileCode.replaceAll("_", " ")}
                </span>
              ) : null}
            </div>

            {item.shortLabel ? (
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
                  {labels.meaning}
                </p>
                <p className="mt-2 text-2xl font-semibold text-stone-900">{item.shortLabel}</p>
                {item.fullExplanation ? (
                  <p className="mt-2 max-w-3xl leading-7 text-stone-600">{item.fullExplanation}</p>
                ) : null}
              </div>
            ) : null}

            {item.translationEquivalents.length > 0 ? (
              <div className="mt-6 border-t border-stone-100 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
                  {labels.translations}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.translationEquivalents.map((translation) => (
                    <span
                      key={translation.publicId}
                      className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-stone-700"
                    >
                      <span className="font-semibold">{translation.expression}</span>
                      <span className="mx-2 text-stone-300">·</span>
                      {translation.localeCode}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
