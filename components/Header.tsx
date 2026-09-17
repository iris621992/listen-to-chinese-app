"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  enabledInterfaceLocales,
  resolveInterfaceLocale,
  type InterfaceTextDirection,
} from "@/lib/interfaceLocaleRegistry";
import {
  KNOWLEDGE_LANGUAGE_PARAM,
  isKnowledgeLanguageValue,
} from "@/lib/knowledgeLanguage";
import {
  INTERFACE_LOCALE_PARAM,
  PROFICIENCY_LEVEL_PARAM,
  PROFICIENCY_LEVEL_SYSTEM_PARAM,
} from "@/lib/proficiencyContext";
import styles from "./Header.module.css";

type HeaderLabels = {
  home: string;
  video: string;
  knowledge: string;
  practice: string;
  language: string;
  menu: string;
  closeMenu: string;
  brandTagline: string;
  signIn: string;
  signInUnavailable: string;
};

const HEADER_LABELS: Record<string, HeaderLabels> = {
  en: {
    home: "Home",
    video: "Video",
    knowledge: "Knowledge",
    practice: "Practice",
    language: "Language",
    menu: "Menu",
    closeMenu: "Close menu",
    brandTagline: "Learn Chinese to understand and use it",
    signIn: "Sign in",
    signInUnavailable: "Account sign-in is not connected in this learner build yet.",
  },
  vi: {
    home: "Trang chủ",
    video: "Video",
    knowledge: "Kiến thức",
    practice: "Luyện tập",
    language: "Ngôn ngữ",
    menu: "Menu",
    closeMenu: "Đóng menu",
    brandTagline: "Học tiếng Trung để hiểu và dùng được",
    signIn: "Đăng nhập",
    signInUnavailable: "Đăng nhập tài khoản chưa được kết nối trong bản learner hiện tại.",
  },
  ar: {
    home: "الرئيسية",
    video: "الفيديو",
    knowledge: "المعرفة",
    practice: "التدريب",
    language: "اللغة",
    menu: "القائمة",
    closeMenu: "إغلاق القائمة",
    brandTagline: "تعلّم الصينية لفهمها واستخدامها",
    signIn: "تسجيل الدخول",
    signInUnavailable: "تسجيل الدخول للحساب غير متصل بعد في هذه النسخة.",
  },
};

const labelsFor = (code: string) => HEADER_LABELS[code] ?? HEADER_LABELS.en;

// Arabic remains available in the locale foundation but is intentionally hidden
// from learner-facing selection until the post-beta RTL pass.
const visibleInterfaceLocales = enabledInterfaceLocales.filter((locale) => locale.code !== "ar");

const PRIMARY_DESTINATIONS = [
  { key: "home", path: "/" },
  { key: "video", path: "/resources" },
  { key: "knowledge", path: "/knowledge" },
  { key: "practice", path: "/practice" },
] as const;

function contextHref(path: string, params: string) {
  const current = new URLSearchParams(params);
  const next = new URLSearchParams();
  const hasUiLang = current.has(INTERFACE_LOCALE_PARAM);
  const uiLang = current.get(INTERFACE_LOCALE_PARAM);
  const lang = current.get("lang");
  const knowledgeLanguage = current.get(KNOWLEDGE_LANGUAGE_PARAM);
  const levelSystem = current.get(PROFICIENCY_LEVEL_SYSTEM_PARAM);
  const level = current.get(PROFICIENCY_LEVEL_PARAM);
  if (hasUiLang) next.set(INTERFACE_LOCALE_PARAM, uiLang ?? "");
  if (lang) next.set("lang", lang);
  if (path.startsWith("/knowledge") && isKnowledgeLanguageValue(knowledgeLanguage)) {
    next.set(KNOWLEDGE_LANGUAGE_PARAM, knowledgeLanguage);
  }
  if (levelSystem) next.set(PROFICIENCY_LEVEL_SYSTEM_PARAM, levelSystem);
  if (level) next.set(PROFICIENCY_LEVEL_PARAM, level);
  const query = next.toString();
  return query ? `${path}?${query}` : path;
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
    <svg aria-hidden="true" focusable="false" viewBox="0 0 12 12" className={styles.chevron}>
      <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
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
  hrefFor,
  onLanguageChange,
}: {
  pathname: string;
  interfaceLocaleCode: string;
  interfaceDirection: InterfaceTextDirection;
  hrefFor: (path: string) => string;
  onLanguageChange?: (interfaceLocaleCode: string) => void;
}) {
  const labels = labelsFor(interfaceLocaleCode);
  const headerInnerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const [compactNav, setCompactNav] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = "learner-navigation-drawer";

  useEffect(() => {
    function applyCompactMode(next: boolean) {
      setCompactNav(next);
      if (!next) setDrawerOpen(false);
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
      const available = headerInnerRef.current?.clientWidth ?? 0;
      const required = measureRef.current?.scrollWidth ?? Number.POSITIVE_INFINITY;
      applyCompactMode(required + 8 > available);
    }

    const frame = window.requestAnimationFrame(updateCompactMode);
    window.addEventListener("resize", updateCompactMode);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateCompactMode);
    if (headerInnerRef.current) observer?.observe(headerInnerRef.current);
    if (measureRef.current) observer?.observe(measureRef.current);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateCompactMode);
      observer?.disconnect();
    };
  }, [interfaceLocaleCode]);

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

  const primaryLinks = PRIMARY_DESTINATIONS.map((destination) => {
    const active = isActiveDestination(pathname, destination.path);
    return (
      <Link
        key={destination.key}
        href={hrefFor(destination.path)}
        aria-current={active ? "page" : undefined}
        className={styles.primaryLink}
        onClick={() => setDrawerOpen(false)}
      >
        {labels[destination.key]}
      </Link>
    );
  });

  return (
    <header dir={interfaceDirection} className={styles.header} data-compact-nav={compactNav ? "true" : "false"}>
      <div ref={headerInnerRef} className={styles.inner}>
        <Link href={hrefFor("/")} className={styles.brand} aria-label="YunChinese home">
          <span className={styles.brandMark} aria-hidden="true">
            <Image src="/brand/yunchinese-logo.png" alt="" width={78} height={78} priority className={styles.brandLogo} />
          </span>
          <span className={styles.brandCopy}>
            <strong>YunChinese</strong>
            <small>{labels.brandTagline}</small>
          </span>
        </Link>

        <div className={`${styles.full} ${compactNav ? styles.hiddenFull : ""}`} aria-hidden={compactNav ? true : undefined}>
          <nav aria-label="Primary" className={styles.primaryNav}>{primaryLinks}</nav>
          <div className={styles.utilities} aria-label="Interface controls">
            <label className={styles.languageControl}>
              <span className={styles.srOnly}>{labels.language}</span>
              <span className={styles.selectShell}>
                <select aria-label={labels.language} value={interfaceLocaleCode} onChange={(event) => onLanguageChange?.(event.target.value)}>
                  {visibleInterfaceLocales.map((locale) => (
                    <option key={locale.code} value={locale.code}>{locale.code.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown />
              </span>
            </label>
            <button type="button" className={styles.signIn} disabled title={labels.signInUnavailable}>{labels.signIn}</button>
          </div>
        </div>

        <button
          ref={menuTriggerRef}
          type="button"
          className={`${styles.menuTrigger} ${compactNav ? styles.menuTriggerVisible : ""}`}
          aria-label={labels.menu}
          aria-expanded={drawerOpen}
          aria-controls={drawerId}
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon />
        </button>

        <div ref={measureRef} className={styles.measure} aria-hidden="true">
          <span className={styles.measureBrand}><span className={styles.measureMark} /><span><strong>YunChinese</strong><small>{labels.brandTagline}</small></span></span>
          <span className={styles.measureNav}>{PRIMARY_DESTINATIONS.map((destination) => <span key={destination.key}>{labels[destination.key]}</span>)}</span>
          <span className={styles.measureUtility}>{interfaceLocaleCode.toUpperCase()}</span>
          <span className={styles.measureSignIn}>{labels.signIn}</span>
        </div>
      </div>

      {drawerOpen ? (
        <div id={drawerId} className={styles.drawer} role="dialog" aria-modal="true" aria-label={labels.menu}>
          <button type="button" className={styles.drawerBackdrop} aria-label={labels.closeMenu} onClick={() => setDrawerOpen(false)} />
          <div ref={drawerPanelRef} className={styles.drawerPanel}>
            <div className={styles.drawerHead}>
              <strong>YunChinese</strong>
              <button type="button" className={styles.drawerClose} aria-label={labels.closeMenu} onClick={() => setDrawerOpen(false)}><CloseIcon /></button>
            </div>
            <nav aria-label={labels.menu} className={styles.drawerNav}>{primaryLinks}</nav>
            <div className={styles.drawerControls}>
              <label className={styles.drawerControl}>
                <span>{labels.language}</span>
                <span className={styles.selectShell}>
                  <select aria-label={labels.language} value={interfaceLocaleCode} onChange={(event) => onLanguageChange?.(event.target.value)}>
                    {visibleInterfaceLocales.map((locale) => <option key={locale.code} value={locale.code}>{locale.code.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown />
                </span>
              </label>
              <button type="button" className={styles.drawerSignIn} disabled title={labels.signInUnavailable}>{labels.signIn}</button>
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
  const interfaceLocale = resolveInterfaceLocale(searchParams.get(INTERFACE_LOCALE_PARAM), searchParams.get("lang"));
  const hrefFor = (path: string) => contextHref(path, searchParams.toString());

  useEffect(() => {
    document.documentElement.lang = interfaceLocale.code;
    document.documentElement.dir = interfaceLocale.direction;
  }, [interfaceLocale.code, interfaceLocale.direction]);

  function handleLanguageChange(nextInterfaceLocaleCode: string) {
    if (!visibleInterfaceLocales.some((locale) => locale.code === nextInterfaceLocaleCode)) return;
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set(INTERFACE_LOCALE_PARAM, nextInterfaceLocaleCode);
    nextSearchParams.set("lang", nextInterfaceLocaleCode);
    if (
      !pathname.startsWith("/knowledge")
      || !isKnowledgeLanguageValue(nextSearchParams.get(KNOWLEDGE_LANGUAGE_PARAM))
    ) {
      nextSearchParams.delete(KNOWLEDGE_LANGUAGE_PARAM);
    }
    nextSearchParams.delete("cursor");
    const query = nextSearchParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <HeaderContent
      key={pathname}
      pathname={pathname}
      interfaceLocaleCode={interfaceLocale.code}
      interfaceDirection={interfaceLocale.direction}
      hrefFor={hrefFor}
      onLanguageChange={handleLanguageChange}
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
          hrefFor={fallbackHref}
        />
      )}
    >
      <LocalizedHeader />
    </Suspense>
  );
}
