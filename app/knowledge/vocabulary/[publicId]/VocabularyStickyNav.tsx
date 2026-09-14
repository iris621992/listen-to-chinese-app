"use client";

import { useEffect, useState } from "react";
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

function learnerHeaderOffset() {
  if (window.innerWidth <= 899 && window.innerHeight <= 520) return 60;
  if (window.innerWidth <= 899) return 70;
  return 88;
}

export default function VocabularyStickyNav({ headword, pronunciation, navItems }: Props) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const header = document.getElementById("vocabulary-entry-header");
      const card = document.getElementById("vocabulary-entry-card");
      if (!header || !card) {
        setActive(false);
        return;
      }
      const offset = learnerHeaderOffset();
      const headerRect = header.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      setActive(headerRect.bottom <= offset + 4 && cardRect.bottom > offset + 96);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div className={styles.compactSticky} data-active={active ? "true" : "false"} aria-hidden={!active}>
        <div className={styles.compactStickyInner}>
          <div className={styles.compactIdentity}>
            <strong>{headword}</strong>
            {pronunciation ? <span>{pronunciation}</span> : null}
          </div>
          {navItems.length > 0 ? (
            <nav className={styles.compactNav} aria-label="Vocabulary sections">
              {navItems.map((item) => (
                <a
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={item.mobileOnly ? styles.mobileOnlyNavItem : undefined}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </div>

      <aside className={styles.landscapeRail} data-active={active ? "true" : "false"} aria-hidden={!active}>
        <div className={styles.landscapeIdentity}>
          <strong>{headword}</strong>
          {pronunciation ? <span>{pronunciation}</span> : null}
        </div>
        {navItems.length > 0 ? (
          <nav aria-label="Vocabulary sections">
            {navItems.map((item) => (
              <a key={`${item.href}-${item.label}`} href={item.href}>{item.label}</a>
            ))}
          </nav>
        ) : null}
      </aside>
    </>
  );
}
