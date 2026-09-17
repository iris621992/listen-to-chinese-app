"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import styles from "./VocabularyKnowledgeLanguageToggle.module.css";

const KNOWLEDGE_LANGUAGE_PARAM = "knowledgeLang";
const LEGACY_CONTENT_LOCALE_PARAM = "lang";

type KnowledgeLanguage = "user" | "zh";

type MountTargets = {
  main: HTMLElement | null;
  sticky: HTMLElement | null;
};

const USER_LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  vi: "Tiếng Việt",
  ar: "العربية",
};

function resolveKnowledgeLanguage(knowledgeLang: string | null, legacyLang: string | null): KnowledgeLanguage {
  if (knowledgeLang === "zh") return "zh";
  if (knowledgeLang === "user") return "user";
  return legacyLang?.trim().toLowerCase() === "zh" ? "zh" : "user";
}

function buildHref(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function VocabularyKnowledgeLanguageToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [targets, setTargets] = useState<MountTargets>({ main: null, sticky: null });

  const interfaceLocale = useMemo(
    () => resolveInterfaceLocale(searchParams.get("uiLang"), searchParams.get(LEGACY_CONTENT_LOCALE_PARAM)),
    [searchParams],
  );
  const knowledgeLanguage = resolveKnowledgeLanguage(
    searchParams.get(KNOWLEDGE_LANGUAGE_PARAM),
    searchParams.get(LEGACY_CONTENT_LOCALE_PARAM),
  );
  const expectedContentLocale = knowledgeLanguage === "zh" ? "zh" : interfaceLocale.code;
  const transportReady =
    searchParams.get(KNOWLEDGE_LANGUAGE_PARAM) === knowledgeLanguage
    && searchParams.get(LEGACY_CONTENT_LOCALE_PARAM)?.trim().toLowerCase() === expectedContentLocale;

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    let changed = false;

    if (next.get(KNOWLEDGE_LANGUAGE_PARAM) !== knowledgeLanguage) {
      next.set(KNOWLEDGE_LANGUAGE_PARAM, knowledgeLanguage);
      changed = true;
    }
    if (next.get(LEGACY_CONTENT_LOCALE_PARAM)?.trim().toLowerCase() !== expectedContentLocale) {
      next.set(LEGACY_CONTENT_LOCALE_PARAM, expectedContentLocale);
      changed = true;
    }

    if (changed) {
      router.replace(buildHref(pathname, next), { scroll: false });
    }
  }, [expectedContentLocale, knowledgeLanguage, pathname, router, searchParams]);

  useEffect(() => {
    let mainHost: HTMLDivElement | null = null;
    let stickyHost: HTMLDivElement | null = null;

    const mount = () => {
      const header = document.getElementById("vocabulary-entry-header");
      const stickySlot = document.querySelector<HTMLElement>("[data-sticky-action-slot]");

      if (header && !mainHost) {
        mainHost = document.createElement("div");
        mainHost.dataset.knowledgeLanguageMount = "main";
        mainHost.className = styles.mainHost;
        header.appendChild(mainHost);
      }
      if (stickySlot && !stickyHost) {
        stickyHost = document.createElement("div");
        stickyHost.dataset.knowledgeLanguageMount = "sticky";
        stickyHost.className = styles.stickyHost;
        stickySlot.appendChild(stickyHost);
      }

      setTargets((current) => (
        current.main === mainHost && current.sticky === stickyHost
          ? current
          : { main: mainHost, sticky: stickyHost }
      ));
    };

    mount();
    const observer = new MutationObserver(mount);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mainHost?.remove();
      stickyHost?.remove();
    };
  }, []);

  function choose(nextKnowledgeLanguage: KnowledgeLanguage) {
    const next = new URLSearchParams(searchParams.toString());
    next.set(KNOWLEDGE_LANGUAGE_PARAM, nextKnowledgeLanguage);
    next.set(
      LEGACY_CONTENT_LOCALE_PARAM,
      nextKnowledgeLanguage === "zh" ? "zh" : interfaceLocale.code,
    );
    next.delete("cursor");
    router.push(buildHref(pathname, next), { scroll: false });
  }

  if (!transportReady) return null;

  const userLanguageLabel = USER_LANGUAGE_LABELS[interfaceLocale.code] ?? interfaceLocale.code;
  const controlLabel = interfaceLocale.code === "vi" ? "Ngôn ngữ nội dung" : "Content language";

  const control = (compact: boolean) => (
    <div
      className={`${styles.toggle} ${compact ? styles.compact : ""}`}
      role="group"
      aria-label={controlLabel}
      data-knowledge-language={knowledgeLanguage}
    >
      <button
        type="button"
        className={knowledgeLanguage === "user" ? styles.active : undefined}
        aria-pressed={knowledgeLanguage === "user"}
        onClick={() => choose("user")}
      >
        {userLanguageLabel}
      </button>
      <button
        type="button"
        className={knowledgeLanguage === "zh" ? styles.active : undefined}
        aria-pressed={knowledgeLanguage === "zh"}
        onClick={() => choose("zh")}
      >
        中文
      </button>
    </div>
  );

  return (
    <>
      {targets.main ? createPortal(control(false), targets.main) : null}
      {targets.sticky ? createPortal(control(true), targets.sticky) : null}
    </>
  );
}
