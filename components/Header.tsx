"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

type HeaderLabels = {
  home: string;
  library: string;
  knowledge: string;
  practice: string;
  level: string;
  language: string;
  levelAll: string;
  levelUnavailable: string;
  menu: string;
  closeMenu: string;
  brandTagline: string;
};

const HEADER_LABELS: Record<string, HeaderLabels> = {
  en: {
    home: "Home",
    library: "Library",
    knowledge: "Knowledge",
    practice: "Practice",
    level: "Level",
    language: "Language",
    levelAll: "Level · All",
    levelUnavailable: "Level unavailable",
    menu: "Menu",
    closeMenu: "Close menu",
    brandTagline: "Chinese learning library",
  },
  vi: {
    home: "Trang chủ",
    library: "Thư viện",
    knowledge: "Kiến thức",
    practice: "Luyện tập",
    level: "Cấp độ",
    language: "Ngôn ngữ",
    levelAll: "Cấp độ · Tất cả",
    levelUnavailable: "Cấp độ không khả dụng",
    menu: "Menu",
    closeMenu: "Đóng menu",
    brandTagline: "Thư viện học tiếng Trung",
  },
  ar: {
    home: "الرئيسية",
    library: "المكتبة",
    knowledge: "المعرفة",
    practice: "التدريب",
    level: "المستوى",
    language: "اللغة",
    levelAll: "المستوى · الكل",
    levelUnavailable: "المستوى غير متاح",
    menu: "القائمة",
    closeMenu: "إغلاق القائمة",
    brandTagline: "مكتبة لتعلّم الصينية",
  },
};

const headerLabelsFor = (interfaceLocaleCode: string) =>
  HEADER_LABELS[interfaceLocaleCode] ?? HEADER_LABELS.en;

const PRIMARY_DESTINATIONS = [
  { key: "home", path: "/" },
  { key: "library", path: "/resources" },
  { key: "knowledge", path: "/knowledge" },
  { key: "practice", path: "/practice" },
] as const;

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

function isActiveDestination(pathname: string, destinationPath: string) {
  if (destinationPath === "/") return pathname === "/";
  if (destinationPath === "/resources") {
    return pathname === "/resources" || pathname.startsWith("/lessons/");
  }
  return pathname === destinationPath || pathname.startsWith(`${destinationPath}/`);
}

function ChevronDown() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 12 12" className="learner-chevron">
      <path
        d="M3 4.5 6 7.5 9 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function HeaderContent({
  pathname,
  interfaceLocaleCode,
  interfaceDirection,
  levelValue,
  levelLabel,
  proficiencyOptions,
  hrefFor,
  onLanguageChange,
  onLevelChange,
}: {
  pathname: string;
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
  const knownLevel = proficiencyOptions.some((option) => option.value === levelValue);
  const levelGroups = groupedLevelOptions(proficiencyOptions);
  const headerInnerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const [compactNav, setCompactNav] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = "learner-navigation-drawer";

  const selectedLevelText = useMemo(() => {
    if (levelValue === "all") return labels.levelAll;
    if (levelValue === "invalid") return labels.levelUnavailable;
    return levelLabel ?? labels.levelUnavailable;
  }, [labels.levelAll, labels.levelUnavailable, levelLabel, levelValue]);

  useEffect(() => {
    function applyCompactMode(nextCompactNav: boolean) {
      setCompactNav(nextCompactNav);
      if (!nextCompactNav) setDrawerOpen(false);
    }

    function updateCompactMode() {
      const viewportWidth = window.innerWidth;
      if (viewportWidth <= 899) {
        applyCompactMode(true);
        return;
      }
      if (viewportWidth >= 1180) {
        applyCompactMode(false);
        return;
      }

      const availableWidth = headerInnerRef.current?.clientWidth ?? 0;
      const requiredWidth = measureRef.current?.scrollWidth ?? Number.POSITIVE_INFINITY;
      applyCompactMode(requiredWidth + 8 > availableWidth);
    }

    const initialFrame = window.requestAnimationFrame(updateCompactMode);
    window.addEventListener("resize", updateCompactMode);
    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateCompactMode);
    if (headerInnerRef.current) observer?.observe(headerInnerRef.current);
    if (measureRef.current) observer?.observe(measureRef.current);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("resize", updateCompactMode);
      observer?.disconnect();
    };
  }, [interfaceLocaleCode, proficiencyOptions.length, selectedLevelText]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerPanelRef.current?.querySelector<HTMLElement>("button, a, select")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
        window.requestAnimationFrame(() => menuTriggerRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = drawerPanelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  function closeDrawerWithFocusReturn() {
    setDrawerOpen(false);
    window.requestAnimationFrame(() => menuTriggerRef.current?.focus());
  }

  function renderLevelOptions() {
    return (
      <>
        <option value="all">{labels.levelAll}</option>
        {!knownLevel && levelValue !== "all" ? (
          <option value={levelValue}>{selectedLevelText}</option>
        ) : null}
        {levelGroups.map((group) => (
          <optgroup key={group.systemCode} label={group.systemName}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>{option.levelName}</option>
            ))}
          </optgroup>
        ))}
      </>
    );
  }

  const primaryLinks = PRIMARY_DESTINATIONS.map((destination) => {
    const active = isActiveDestination(pathname, destination.path);
    return (
      <Link
        key={destination.key}
        href={hrefFor(destination.path)}
        aria-current={active ? "page" : undefined}
        className="learner-primary-link"
        onClick={() => setDrawerOpen(false)}
      >
        {labels[destination.key]}
      </Link>
    );
  });

  return (
    <header dir={interfaceDirection} className="learner-header" data-compact-nav={compactNav ? "true" : "false"}>
      <div ref={headerInnerRef} className="learner-header-inner">
        <Link href={hrefFor("/")} className="learner-brand" aria-label="YunChinese home">
          <span className="learner-brand-mark" aria-hidden="true">
            <Image
              src="/brand/yunchinese-logo.png"
              alt=""
              width={70}
              height={70}
              priority
              className="learner-brand-logo"
            />
          </span>
          <span className="learner-brand-copy">
            <strong>YunChinese</strong>
            <small>{labels.brandTagline}</small>
          </span>
        </Link>

        <div className="learner-header-full" aria-hidden={compactNav ? true : undefined}>
          <nav aria-label="Primary" className="learner-primary-nav">
            {primaryLinks}
          </nav>

          <div className="learner-header-utilities" aria-label="Learning context">
            <label className="learner-context-control learner-context-control--level">
              <span className="learner-context-label">{labels.level}</span>
              <span className="learner-select-shell">
                <select
                  aria-label={labels.level}
                  onChange={(event) => onLevelChange?.(event.target.value)}
                  value={levelValue}
                >
                  {renderLevelOptions()}
                </select>
                <ChevronDown />
              </span>
            </label>
            <label className="learner-context-control learner-context-control--language">
              <span className="learner-context-label">{labels.language}</span>
              <span className="learner-select-shell">
                <select
                  aria-label={labels.language}
                  onChange={(event) => onLanguageChange?.(event.target.value)}
                  value={interfaceLocaleCode}
                >
                  {enabledInterfaceLocales.map((locale) => (
                    <option key={locale.code} value={locale.code}>{locale.code.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown />
              </span>
            </label>
          </div>
        </div>

        <button
          ref={menuTriggerRef}
          type="button"
          className="learner-menu-trigger"
          aria-label={labels.menu}
          aria-expanded={drawerOpen}
          aria-controls={drawerId}
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon />
        </button>

        <div ref={measureRef} className="learner-header-measure" aria-hidden="true">
          <span className="learner-brand-measure">
            <span className="learner-brand-measure-mark" />
            <span className="learner-brand-measure-copy">
              <strong>YunChinese</strong>
              <small>{labels.brandTagline}</small>
            </span>
          </span>
          <span className="learner-nav-measure">
            {PRIMARY_DESTINATIONS.map((destination) => (
              <span key={destination.key}>{labels[destination.key]}</span>
            ))}
          </span>
          <span className="learner-utility-measure learner-utility-measure--level">{selectedLevelText}</span>
          <span className="learner-utility-measure learner-utility-measure--language">{interfaceLocaleCode.toUpperCase()}</span>
        </div>
      </div>

      {drawerOpen ? (
        <div id={drawerId} className="learner-drawer" role="dialog" aria-modal="true" aria-label={labels.menu}>
          <button type="button" className="learner-drawer-backdrop" aria-label={labels.closeMenu} onClick={closeDrawerWithFocusReturn} />
          <div ref={drawerPanelRef} className="learner-drawer-panel">
            <div className="learner-drawer-head">
              <strong>YunChinese</strong>
              <button type="button" className="learner-drawer-close" aria-label={labels.closeMenu} onClick={closeDrawerWithFocusReturn}>
                <CloseIcon />
              </button>
            </div>

            <nav aria-label={labels.menu} className="learner-drawer-nav">
              {primaryLinks}
            </nav>

            <div className="learner-drawer-context" aria-label="Learning context">
              <label className="learner-drawer-control">
                <span>{labels.level}</span>
                <span className="learner-select-shell">
                  <select
                    aria-label={labels.level}
                    onChange={(event) => onLevelChange?.(event.target.value)}
                    value={levelValue}
                  >
                    {renderLevelOptions()}
                  </select>
                  <ChevronDown />
                </span>
              </label>
              <label className="learner-drawer-control">
                <span>{labels.language}</span>
                <span className="learner-select-shell">
                  <select
                    aria-label={labels.language}
                    onChange={(event) => onLanguageChange?.(event.target.value)}
                    value={interfaceLocaleCode}
                  >
                    {enabledInterfaceLocales.map((locale) => (
                      <option key={locale.code} value={locale.code}>{locale.code.toUpperCase()}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </span>
              </label>
            </div>
          </div>
        </div>
      ) : null}
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
    ? formatProficiencyLabel(proficiency.systemCode, proficiency.levelCode)
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
      key={pathname}
      pathname={pathname}
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
          pathname="/"
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
