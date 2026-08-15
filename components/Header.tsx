"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  formatProficiencyLabel,
  parseProficiencyContext,
  PROFICIENCY_LEVEL_PARAM,
  PROFICIENCY_LEVEL_SYSTEM_PARAM,
} from "@/lib/proficiencyContext";

type HeaderLanguage = "en" | "vi" | "ar";

const languageOptions: { code: HeaderLanguage; label: string }[] = [
  { code: "en", label: "🇺🇸 English" },
  { code: "vi", label: "🇻🇳 Tiếng Việt" },
  { code: "ar", label: "🇸🇦 العربية" },
];
const levelOptions = Array.from({ length: 9 }, (_, index) => {
  const levelCode = `HSK${index + 1}`;
  return {
    value: `HSK:${levelCode}`,
    systemCode: "HSK",
    levelCode,
    label: `Level: HSK ${index + 1}`,
  };
});

type HeaderLabels = { resources: string; practice: string };
const HEADER_LABELS: Record<HeaderLanguage, HeaderLabels> = {
  en: { resources: "Resources", practice: "Practice" },
  vi: { resources: "Học liệu", practice: "Bài tập" },
  ar: { resources: "الموارد", practice: "التدريب" },
};

function supportedHeaderLanguage(lang: string | null): HeaderLanguage | null {
  return lang === "en" || lang === "vi" || lang === "ar" ? lang : null;
}

function contextHref(path: string, params: string) {
  const current = new URLSearchParams(params);
  const next = new URLSearchParams();
  const lang = current.get("lang");
  const levelSystem = current.get(PROFICIENCY_LEVEL_SYSTEM_PARAM);
  const level = current.get(PROFICIENCY_LEVEL_PARAM);
  if (lang) next.set("lang", lang);
  if (levelSystem) next.set(PROFICIENCY_LEVEL_SYSTEM_PARAM, levelSystem);
  if (level) next.set(PROFICIENCY_LEVEL_PARAM, level);
  const query = next.toString();
  return query ? `${path}?${query}` : path;
}

function HeaderContent({
  langCode,
  levelValue,
  levelLabel,
  hrefFor,
  onLanguageChange,
  onLevelChange,
}: {
  langCode: HeaderLanguage | null;
  levelValue: string;
  levelLabel: string | null;
  hrefFor: (path: string) => string;
  onLanguageChange?: (langCode: HeaderLanguage) => void;
  onLevelChange?: (value: string) => void;
}) {
  const selectedLangCode = langCode ?? "en";
  const labels = HEADER_LABELS[selectedLangCode];
  const isRtl = selectedLangCode === "ar";
  const knownLevel = levelOptions.some((option) => option.value === levelValue);

  return (
    <header dir={isRtl ? "rtl" : "ltr"} className="sticky top-0 z-10 border-b border-orange-100 bg-cream/90 backdrop-blur">
      <div className={`mx-auto grid max-w-[98rem] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:items-center lg:gap-8 ${isRtl ? "text-right lg:grid-cols-[1fr_auto]" : "text-left lg:grid-cols-[auto_1fr]"}`}>
        <Link href={hrefFor("/")} className={`leading-tight ${isRtl ? "justify-self-end lg:col-start-2 lg:row-start-1" : "justify-self-start"}`}>
          <div className="flex items-baseline gap-2 text-cinnabar">
            <span className="chinese-text text-3xl font-bold" aria-hidden="true">芸</span>
            <span className="text-2xl font-bold tracking-wide">YUN</span>
          </div>
          <div className="text-sm text-stone-500">Chinese Resources &amp; Practice</div>
        </Link>
        <nav className={`flex flex-wrap items-center gap-3 text-base font-semibold text-stone-700 ${isRtl ? "justify-start lg:col-start-1 lg:row-start-1" : "justify-start lg:justify-end"}`}>
          <Link href={hrefFor("/resources")} className="rounded-full px-4 py-2.5 hover:bg-orange-100">{labels.resources}</Link>
          <Link href={hrefFor("/practice")} className="rounded-full px-4 py-2.5 hover:bg-orange-100">{labels.practice}</Link>
          <select aria-label="Level" className="rounded-full border border-orange-200 bg-white px-4 py-2.5 text-base font-semibold text-stone-700" onChange={(event) => onLevelChange?.(event.target.value)} value={levelValue}>
            <option value="all">Level: All</option>
            {!knownLevel && levelValue !== "all" ? <option value={levelValue}>{levelLabel ?? "Level: unavailable"}</option> : null}
            {levelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select aria-label="Change language" className="rounded-full border border-orange-200 bg-white px-4 py-2.5 text-base font-semibold text-stone-700" onChange={(event) => onLanguageChange?.(event.target.value as HeaderLanguage)} value={selectedLangCode}>
            {languageOptions.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
          </select>
        </nav>
      </div>
    </header>
  );
}

function LocalizedHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const langCode = supportedHeaderLanguage(searchParams.get("lang"));
  const proficiency = parseProficiencyContext(
    searchParams.get(PROFICIENCY_LEVEL_SYSTEM_PARAM),
    searchParams.get(PROFICIENCY_LEVEL_PARAM),
  );
  const levelValue = proficiency.kind === "ALL"
    ? "all"
    : proficiency.kind === "EXACT"
      ? `${proficiency.systemCode}:${proficiency.levelCode}`
      : "invalid";
  const levelLabel = proficiency.kind === "EXACT"
    ? `Level: ${formatProficiencyLabel(proficiency.systemCode, proficiency.levelCode)}`
    : proficiency.kind === "INVALID"
      ? "Level: unavailable"
      : null;
  const hrefFor = (path: string) => contextHref(path, searchParams.toString());

  function pushParams(nextSearchParams: URLSearchParams) {
    const query = nextSearchParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleLanguageChange(nextLangCode: HeaderLanguage) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("lang", nextLangCode);
    nextSearchParams.delete("cursor");
    pushParams(nextSearchParams);
  }

  function handleLevelChange(nextValue: string) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("cursor");
    if (nextValue === "all") {
      nextSearchParams.delete(PROFICIENCY_LEVEL_SYSTEM_PARAM);
      nextSearchParams.delete(PROFICIENCY_LEVEL_PARAM);
      pushParams(nextSearchParams);
      return;
    }
    const selected = levelOptions.find((option) => option.value === nextValue);
    if (!selected) return;
    nextSearchParams.set(PROFICIENCY_LEVEL_SYSTEM_PARAM, selected.systemCode);
    nextSearchParams.set(PROFICIENCY_LEVEL_PARAM, selected.levelCode);
    pushParams(nextSearchParams);
  }

  return <HeaderContent langCode={langCode} levelValue={levelValue} levelLabel={levelLabel} hrefFor={hrefFor} onLanguageChange={handleLanguageChange} onLevelChange={handleLevelChange} />;
}

const fallbackHref = (path: string) => path;
export function Header() {
  return (
    <Suspense fallback={<HeaderContent langCode={null} levelValue="all" levelLabel={null} hrefFor={fallbackHref} />}>
      <LocalizedHeader />
    </Suspense>
  );
}
