"use client";

import { useEffect, useState } from "react";
import "./VocabularyDemoFidelity.module.css";
import "./VocabularyTypographyRuntime.module.css";
import "./VocabularyVisualReconciliation.module.css";
import styles from "./VocabularyDetail.module.css";

type NavItem = {
  label: string;
  href: string;
  mobileOnly?: boolean;
};

type Props = {
  headword: string;
  pronunciation: string | null;
  navItems: NavItem[];
};

type StickyGeometry = {
  left: number;
  top: number;
  width: number;
};

function learnerHeaderOffset() {
  if (window.innerWidth <= 899 && window.innerHeight <= 520) return 60;
  if (window.innerWidth <= 899) return 70;
  return 88;
}

function sameGeometry(a: StickyGeometry | null, b: StickyGeometry) {
  if (!a) return false;
  return Math.abs(a.left - b.left) < 0.5
    && Math.abs(a.top - b.top) < 0.5
    && Math.abs(a.width - b.width) < 0.5;
}

function targetFor(item: NavItem) {
  if (!item.href.startsWith("#")) return null;
  return document.getElementById(item.href.slice(1));
}

export default function VocabularyStickyNav({ headword, pronunciation, navItems }: Props) {
  const [active, setActive] = useState(false);
  const [activePronunciation, setActivePronunciation] = useState(pronunciation);
  const [effectiveNavItems, setEffectiveNavItems] = useState(navItems);
  const [activeHref, setActiveHref] = useState<string | null>(navItems[0]?.href ?? null);
  const [geometry, setGeometry] = useState<StickyGeometry | null>(null);

  useEffect(() => {
    const hasReadingNavigation = navItems.some((item) => item.href.startsWith("#reading-"));
    const hasPosNavigation = navItems.some((item) => item.href.startsWith("#pos-"));
    const hasCharacterNavigation = navItems.some((item) => item.href === "#characters");

    if (hasReadingNavigation || hasPosNavigation || !hasCharacterNavigation) {
      setEffectiveNavItems(navItems);
      return;
    }

    const posSections = Array.from(
      document.querySelectorAll<HTMLElement>("#vocabulary-entry-card section[id^='pos-']"),
    );
    if (posSections.length !== 1) {
      setEffectiveNavItems(navItems);
      return;
    }

    const label =
      posSections[0].querySelector<HTMLElement>("[class*='posLabel']")?.textContent?.trim()
      ?? posSections[0].querySelector<HTMLElement>("span")?.textContent?.trim();
    if (!label) {
      setEffectiveNavItems(navItems);
      return;
    }

    setEffectiveNavItems([
      { label, href: `#${posSections[0].id}`, mobileOnly: true },
      ...navItems,
    ]);
  }, [navItems]);

  useEffect(() => {
    const syncPronunciation = () => {
      const selected = navItems.find(
        (item) => item.href.startsWith("#reading-") && item.href === window.location.hash,
      );
      setActivePronunciation(selected?.label ?? pronunciation);
    };

    syncPronunciation();
    window.addEventListener("hashchange", syncPronunciation);
    return () => window.removeEventListener("hashchange", syncPronunciation);
  }, [navItems, pronunciation]);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const header = document.getElementById("vocabulary-entry-header");
      const card = document.getElementById("vocabulary-entry-card");
      if (!header || !card) {
        setActive(false);
        setGeometry(null);
        return;
      }

      const offset = learnerHeaderOffset();
      const headerRect = header.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const nextGeometry = {
        left: Math.max(0, cardRect.left),
        top: offset,
        width: Math.max(0, cardRect.width),
      };
      setGeometry((previous) => sameGeometry(previous, nextGeometry) ? previous : nextGeometry);
      setActive(headerRect.bottom <= offset + 4 && cardRect.bottom > offset + 96);

      const visibleItems = effectiveNavItems.flatMap((item) => {
        const target = targetFor(item);
        return target && target.offsetParent !== null ? [{ item, target }] : [];
      });

      if (visibleItems.length > 0) {
        const threshold = offset + 84;
        let current = visibleItems[0].item.href;
        for (const entry of visibleItems) {
          if (entry.target.getBoundingClientRect().top <= threshold) current = entry.item.href;
        }
        setActiveHref(current);
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [effectiveNavItems]);

  useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>("#vocabulary-entry-card > nav a[href^='#']");
    links.forEach((link) => {
      const current = link.getAttribute("href") === activeHref;
      if (current) {
        link.setAttribute("data-current", "true");
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("data-current");
        link.removeAttribute("aria-current");
      }
    });
  }, [activeHref]);

  const compactStyle = geometry
    ? { left: geometry.left, top: geometry.top, width: geometry.width, right: "auto" as const }
    : undefined;

  return (
    <>
      <div
        className={styles.compactSticky}
        data-active={active ? "true" : "false"}
        data-vocabulary-sticky="true"
        aria-hidden={!active}
        style={compactStyle}
      >
        <div className={styles.compactStickyInner}>
          <div className={styles.compactIdentity}>
            <strong>{headword}</strong>
            {activePronunciation ? <span>{activePronunciation}</span> : null}
          </div>
          {effectiveNavItems.length > 0 ? (
            <nav className={styles.compactNav} aria-label="Vocabulary sections">
              {effectiveNavItems.map((item) => {
                const current = item.href === activeHref;
                return (
                  <a
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className={item.mobileOnly ? styles.mobileOnlyNavItem : undefined}
                    data-current={current ? "true" : undefined}
                    aria-current={current ? "location" : undefined}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          ) : null}
        </div>
      </div>

      <aside
        className={styles.landscapeRail}
        data-active={active ? "true" : "false"}
        data-vocabulary-landscape-rail="true"
        aria-hidden={!active}
      >
        <div className={styles.landscapeIdentity}>
          <strong>{headword}</strong>
          {activePronunciation ? <span>{activePronunciation}</span> : null}
        </div>
        {effectiveNavItems.length > 0 ? (
          <nav aria-label="Vocabulary sections">
            {effectiveNavItems.map((item) => {
              const current = item.href === activeHref;
              return (
                <a
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  data-current={current ? "true" : undefined}
                  aria-current={current ? "location" : undefined}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        ) : null}
      </aside>
    </>
  );
}
