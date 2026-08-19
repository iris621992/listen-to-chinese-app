"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  enabledInterfaceLocales,
  resolveInterfaceLocale,
  type InterfaceTextDirection,
} from "@/lib/interfaceLocaleRegistry";
import {
  getPublicProficiencyOptions,
  type PublicProficiencyOption,
} from "@/lib/proficiencyCatalog";
import {
  formatProficiencyLabel,
  INTERFACE_LOCALE_PARAM,
  parseProficiencyContext,
  PROFICIENCY_LEVEL_PARAM,
  PROFICIENCY_LEVEL_SYSTEM_PARAM,
} from "@/lib/proficiencyContext";

type HeaderLabels = { resources: string; practice: string };
const HEADER_LABELS: Record<string, HeaderLabels> = {
  en: { resources: "Resources", practice: "Practice" },
  vi: { resources: "Học liệu", practice: "Bài tập" },
  ar: { resources: "الموارد", practice: "التدريب" },
};

const headerLabelsFor = (interfaceLocaleCode: string) =>
  HEADER_LABELS[interfaceLocaleCode] ?? HEADER_LABELS.en;

function contextHref(path: string, params: string) {
  const current = new URLSearchParams(params);
  const next = new URLSearchParams();
  const hasUiLang = current.has(INTERFACE_LOCALE_PARAM);
  const uiLang = current.get(INTERFACE_LOCALE_PARAM);
  const lang = current.get("lang");
  const levelSystem = current.get(PROFICIENCY_LEVEL_SYSTEM_PARAM);
  const level = current.get(PROFICIENCY_LEVEL_PARAM);
  if (hasUiLang) next.set(INTERFACE_LOCALE_PARAM, uiLang ?? "");
  if (lang) next.set("lang", lang);
  if (levelSystem) next.set(PROFICIENCY_LEVEL_SYSTEM_PARAM, levelSystem);
  if (level) next.set(PROFICIENCY_LEVEL_PARAM, level);
  const query = next.toString();
  return query ? `${path}?${query}` : path;
}

function groupedLevelOptions(options: readonly PublicProficiencyOption[]) {
  const groups = new Map<string, {
    systemCode: string;
    systemName: string;
    options: PublicProficiencyOption[];
  }>();

  for (const option of options) {
    const group = groups.get(option.systemCode);
    if (group) {
      group.options.push(option);
      continue;
    }
    groups.set(option.systemCode, {
      systemCode: option.systemCode,
      systemName: option.systemName,
      options: [option],
    });
  }
  return [...groups.values()];
}

function HeaderContent({
  interfaceLocaleCode,
  interfaceDirection,
  levelValue,
  levelLabel,
  proficiencyOptions,
  hrefFor,
  onLanguageChange,
  onLevelChange,
}: {
  interfaceLocaleCode: string;
  interfaceDirection: InterfaceTextDirection;
  levelValue: string;
  levelLabel: string | null;
  proficiencyOptions: readonly PublicProficiencyOption[];
  hrefFor: (path: string) => string;
  onLanguageChange?: (interfaceLocaleCode: string) => void;
  onLevelChange?: (value: string) => void;
}) {
  const labels = headerLabelsFor(interfaceLocaleCode);
  const isRtl = interfaceDirection === "rtl";
  const knownLevel = proficiencyOptions.some((option) => option.value === levelValue);
  const levelGroups = groupedLevelOptions(proficiencyOptions);

  return (
    <header dir={interfaceDirection} className="sticky top-0 z-10 border-b border-orange-100 bg-cream/90 backdrop-blur">
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
            {levelGroups.map((group) => (
              <optgroup key={group.systemCode} label={group.systemName}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>{option.levelName}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <select aria-label="Change language" className="rounded-full border border-orange-200 bg-white px-4 py-2.5 text-base font-semibold text-stone-700" onChange={(event) => onLanguageChange?.(event.target.value)} value={interfaceLocaleCode}>
            {enabledInterfaceLocales.map((locale) => <option key={locale.code} value={locale.code}>{locale.label}</option>)}
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
  const [proficiencyOptions, setProficiencyOptions] = useState<
    readonly PublicProficiencyOption[]
  >([]);
  const interfaceLocale = resolveInterfaceLocale(
    searchParams.get(INTERFACE_LOCALE_PARAM),
    searchParams.get("lang"),
  );
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

  useEffect(() => {
    let active = true;
    void getPublicProficiencyOptions().then((options) => {
      if (active) setProficiencyOptions(options);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = interfaceLocale.code;
    document.documentElement.dir = interfaceLocale.direction;
  }, [interfaceLocale.code, interfaceLocale.direction]);

  function pushParams(nextSearchParams: URLSearchParams) {
    const query = nextSearchParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleLanguageChange(nextInterfaceLocaleCode: string) {
    if (!enabledInterfaceLocales.some((locale) => locale.code === nextInterfaceLocaleCode)) return;
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set(INTERFACE_LOCALE_PARAM, nextInterfaceLocaleCode);
    nextSearchParams.set("lang", nextInterfaceLocaleCode);
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
    const selected = proficiencyOptions.find((option) => option.value === nextValue);
    if (!selected) return;
    nextSearchParams.set(PROFICIENCY_LEVEL_SYSTEM_PARAM, selected.systemCode);
    nextSearchParams.set(PROFICIENCY_LEVEL_PARAM, selected.levelCode);
    pushParams(nextSearchParams);
  }

  return (
    <HeaderContent
      interfaceLocaleCode={interfaceLocale.code}
      interfaceDirection={interfaceLocale.direction}
      levelValue={levelValue}
      levelLabel={levelLabel}
      proficiencyOptions={proficiencyOptions}
      hrefFor={hrefFor}
      onLanguageChange={handleLanguageChange}
      onLevelChange={handleLevelChange}
    />
  );
}

const fallbackHref = (path: string) => path;
const fallbackInterfaceLocale = resolveInterfaceLocale(null, null);

export function Header() {
  return (
    <Suspense
      fallback={(
        <HeaderContent
          interfaceLocaleCode={fallbackInterfaceLocale.code}
          interfaceDirection={fallbackInterfaceLocale.direction}
          levelValue="all"
          levelLabel={null}
          proficiencyOptions={[]}
          hrefFor={fallbackHref}
        />
      )}
    >
      <LocalizedHeader />
    </Suspense>
  );
}
