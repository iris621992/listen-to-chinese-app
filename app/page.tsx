import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LessonCard } from "@/components/LessonCard";
import { getHomeCopy } from "@/lib/homeCopy";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import { getLessonDiscoveryPage } from "@/lib/lessonDiscovery";
import {
  parseProficiencyContext,
  preservedLearnerContextQuery,
} from "@/lib/proficiencyContext";

type Props = {
  searchParams: Promise<{
    uiLang?: string;
    lang?: string;
    levelSystem?: string;
    level?: string;
  }>;
};

function ContextLink({
  href,
  query,
  className,
  children,
}: {
  href: "/" | "/resources" | "/knowledge" | "/practice";
  query: Record<string, string>;
  className: string;
  children: ReactNode;
}) {
  return <Link href={{ pathname: href, query }} className={className}>{children}</Link>;
}

export default async function Home({ searchParams }: Props) {
  const query = await searchParams;
  const interfaceLocale = resolveInterfaceLocale(query.uiLang, query.lang);
  const copy = getHomeCopy(interfaceLocale.code);
  const proficiency = parseProficiencyContext(query.levelSystem, query.level);
  const discovery = await getLessonDiscoveryPage({
    pageSize: 6,
    levelSystemCode: query.levelSystem,
    levelCode: query.level,
    requestedLocale: query.lang,
  });
  const learnerContextQuery = preservedLearnerContextQuery(query);
  const invalidLevel = proficiency.kind === "INVALID";

  const libraryCards = [
    [copy.library.videoTitle, copy.library.videoBody],
    [copy.library.listeningTitle, copy.library.listeningBody],
    [copy.library.readingTitle, copy.library.readingBody],
    [copy.library.practiceOnlyTitle, copy.library.practiceOnlyBody],
    [copy.library.reviewTitle, copy.library.reviewBody],
  ] as const;
  const knowledgeCards = [
    [copy.knowledge.vocabTitle, copy.knowledge.vocabBody],
    [copy.knowledge.idiomTitle, copy.knowledge.idiomBody],
    [copy.knowledge.compareTitle, copy.knowledge.compareBody],
    [copy.knowledge.grammarTitle, copy.knowledge.grammarBody],
  ] as const;
  const discoveryCards = [
    [copy.discovery.levelTitle, copy.discovery.levelBody],
    [copy.discovery.languageTitle, copy.discovery.languageBody],
    [copy.discovery.libraryTitle, copy.discovery.libraryBody],
  ] as const;
  const guestCards = [
    [copy.guest.guestTitle, copy.guest.guestBody],
    [copy.guest.practiceTitle, copy.guest.practiceBody],
  ] as const;
  const howCards = [
    [copy.how.discover, copy.how.discoverBody],
    [copy.how.understand, copy.how.understandBody],
    [copy.how.practice, copy.how.practiceBody],
    [copy.how.review, copy.how.reviewBody],
  ] as const;
  const positioningCards = [
    [copy.positioning.startTitle, copy.positioning.startBody],
    [copy.positioning.moveTitle, copy.positioning.moveBody],
    [copy.positioning.courseTitle, copy.positioning.courseBody],
  ] as const;

  return (
    <main className="home-page" lang={interfaceLocale.code} dir={interfaceLocale.direction}>
      <section className="home-section home-hero" data-home-section="hero">
        <div className="home-shell home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-eyebrow">{copy.hero.eyebrow}</p>
            <h1>{copy.hero.title}</h1>
            <p className="home-lead">{copy.hero.body}</p>
            <div className="home-actions">
              <ContextLink href="/resources" query={learnerContextQuery} className="home-button home-button--primary">{copy.hero.ctaLibrary}</ContextLink>
              <ContextLink href="/knowledge" query={learnerContextQuery} className="home-button home-button--secondary">{copy.hero.ctaKnowledge}</ContextLink>
              <ContextLink href="/practice" query={learnerContextQuery} className="home-button home-button--text">{copy.hero.ctaPractice}</ContextLink>
            </div>
            <p className="home-north-star">{copy.hero.northStar}</p>
          </div>
          <aside className="home-explore-panel" aria-label={copy.hero.exploreTitle}>
            <p className="home-eyebrow">{copy.hero.exploreLabel}</p>
            <h2>{copy.hero.exploreTitle}</h2>
            <p className="home-secondary">{copy.hero.exploreBody}</p>
            <div className="home-explore-list">
              <ContextLink href="/resources" query={learnerContextQuery} className="home-mini-card">
                <strong>{copy.hero.miniLibraryTitle}</strong><span>{copy.hero.miniLibraryBody}</span>
              </ContextLink>
              <ContextLink href="/knowledge" query={learnerContextQuery} className="home-mini-card">
                <strong>{copy.hero.miniKnowledgeTitle}</strong><span>{copy.hero.miniKnowledgeBody}</span>
              </ContextLink>
              <ContextLink href="/practice" query={learnerContextQuery} className="home-mini-card">
                <strong>{copy.hero.miniPracticeTitle}</strong><span>{copy.hero.miniPracticeBody}</span>
              </ContextLink>
            </div>
          </aside>
        </div>
      </section>

      <section className="home-section" data-home-section="library">
        <div className="home-shell">
          <div className="home-section-heading">
            <div><p className="home-eyebrow">{copy.library.eyebrow}</p><h2>{copy.library.title}</h2></div>
            <p className="home-secondary">{copy.library.body}</p>
          </div>
          <div className="home-library-grid">
            {libraryCards.map(([title, body]) => (
              <article className="home-card" key={title}><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
          <div className="home-section-action">
            <ContextLink href="/resources" query={learnerContextQuery} className="home-button home-button--secondary">{copy.library.cta}</ContextLink>
          </div>

          <div className="home-latest">
            <div className="home-section-heading home-section-heading--latest">
              <div><p className="home-eyebrow">{copy.library.latestEyebrow}</p><h2>{copy.library.latestTitle}</h2></div>
            </div>
            {invalidLevel ? (
              <p className="home-state">{copy.library.invalidLevel}</p>
            ) : discovery.page.items.length > 0 ? (
              <>
                <div className="home-resource-grid">
                  {discovery.page.items.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} learnerContextQuery={learnerContextQuery} />)}
                </div>
                <div className="home-section-action">
                  <ContextLink href="/resources" query={learnerContextQuery} className="home-button home-button--secondary">{copy.library.browseAll}</ContextLink>
                </div>
              </>
            ) : (
              <p className="home-state">{copy.library.empty}</p>
            )}
          </div>
        </div>
      </section>

      <section className="home-section home-section--warm" data-home-section="knowledge">
        <div className="home-shell">
          <div className="home-section-heading">
            <div><p className="home-eyebrow">{copy.knowledge.eyebrow}</p><h2>{copy.knowledge.title}</h2></div>
            <p className="home-secondary">{copy.knowledge.body}</p>
          </div>
          <div className="home-knowledge-grid">
            {knowledgeCards.map(([title, body]) => (
              <article className="home-card home-card--warm" key={title}><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
          <div className="home-section-action">
            <ContextLink href="/knowledge" query={learnerContextQuery} className="home-button home-button--secondary">{copy.knowledge.cta}</ContextLink>
          </div>
        </div>
      </section>

      <section className="home-section" data-home-section="practice">
        <div className="home-shell home-practice-grid">
          <div>
            <p className="home-eyebrow">{copy.practice.eyebrow}</p>
            <h2>{copy.practice.title}</h2>
            <p className="home-secondary home-measure">{copy.practice.body}</p>
            <div className="home-tags" aria-label={copy.practice.title}>
              {copy.practice.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <ContextLink href="/practice" query={learnerContextQuery} className="home-button home-button--primary">{copy.practice.cta}</ContextLink>
          </div>
          <article className="home-practice-feature">
            <p className="home-eyebrow home-eyebrow--sage">{copy.practice.featureEyebrow}</p>
            <h3>{copy.practice.featureTitle}</h3>
            <p>{copy.practice.featureBody}</p>
          </article>
        </div>
      </section>

      <section className="home-section home-section--sage-wash" data-home-section="discovery">
        <div className="home-shell">
          <div className="home-section-heading">
            <div><p className="home-eyebrow">{copy.discovery.eyebrow}</p><h2>{copy.discovery.title}</h2></div>
            <p className="home-secondary">{copy.discovery.body}</p>
          </div>
          <div className="home-three-grid">
            {discoveryCards.map(([title, body]) => (
              <article className="home-card home-card--quiet" key={title}><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section" data-home-section="guest">
        <div className="home-shell">
          <div className="home-section-heading">
            <div><p className="home-eyebrow">{copy.guest.eyebrow}</p><h2>{copy.guest.title}</h2></div>
            <p className="home-secondary">{copy.guest.body}</p>
          </div>
          <div className="home-two-grid">
            {guestCards.map(([title, body]) => (
              <article className="home-card home-card--sand" key={title}><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section--warm" data-home-section="how">
        <div className="home-shell">
          <div className="home-section-heading">
            <div><p className="home-eyebrow">{copy.how.eyebrow}</p><h2>{copy.how.title}</h2></div>
            <p className="home-secondary">{copy.how.body}</p>
          </div>
          <div className="home-how-grid">
            {howCards.map(([title, body], index) => (
              <article className="home-step" key={title}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3><p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section--sage" data-home-section="positioning">
        <div className="home-shell home-positioning-grid">
          <div>
            <p className="home-eyebrow home-eyebrow--sage">{copy.positioning.eyebrow}</p>
            <h2>{copy.positioning.title}</h2>
            <p className="home-sage-secondary">{copy.positioning.body}</p>
          </div>
          <div className="home-positioning-list">
            {positioningCards.map(([title, body]) => (
              <article key={title}><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section" data-home-section="growing">
        <div className="home-shell home-growing-grid">
          <div className="home-growing-art" aria-hidden="true">
            <Image src="/brand/yunchinese-logo.png" alt="" width={240} height={240} className="home-brand-logo" />
          </div>
          <div>
            <p className="home-eyebrow">{copy.growing.eyebrow}</p>
            <h2>{copy.growing.title}</h2>
            <p className="home-secondary">{copy.growing.body}</p>
            <p className="home-growing-note">{copy.growing.note}</p>
          </div>
        </div>
      </section>

      <section className="home-section home-final" data-home-section="final">
        <div className="home-shell home-final-inner">
          <div><h2>{copy.final.title}</h2><p>{copy.final.body}</p></div>
          <div className="home-actions">
            <ContextLink href="/resources" query={learnerContextQuery} className="home-button home-button--light">{copy.final.ctaLibrary}</ContextLink>
            <ContextLink href="/knowledge" query={learnerContextQuery} className="home-button home-button--ghost-light">{copy.final.ctaKnowledge}</ContextLink>
            <ContextLink href="/practice" query={learnerContextQuery} className="home-button home-button--ghost-light">{copy.final.ctaPractice}</ContextLink>
          </div>
        </div>
      </section>

      <footer className="home-footer" data-home-section="footer">
        <div className="home-shell home-footer-grid">
          <div><strong>YunChinese</strong><p>{copy.footer.tagline}</p></div>
          <nav aria-label="Home footer">
            <ContextLink href="/" query={learnerContextQuery} className="home-footer-link">{copy.nav.home}</ContextLink>
            <ContextLink href="/resources" query={learnerContextQuery} className="home-footer-link">{copy.nav.library}</ContextLink>
            <ContextLink href="/knowledge" query={learnerContextQuery} className="home-footer-link">{copy.nav.knowledge}</ContextLink>
            <ContextLink href="/practice" query={learnerContextQuery} className="home-footer-link">{copy.nav.practice}</ContextLink>
          </nav>
        </div>
      </footer>
    </main>
  );
}
