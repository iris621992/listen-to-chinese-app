import Link from "next/link";
import type { ReactNode } from "react";
import { getHomeCopy } from "@/lib/homeCopy";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";

type Props = {
  searchParams: Promise<{ uiLang?: string; lang?: string; levelSystem?: string; level?: string }>;
};

type HomePath = "/" | "/resources" | "/knowledge" | "/practice";

function ContextLink({ href, query, className, children }: { href: HomePath; query: Record<string,string>; className: string; children: ReactNode; }) {
  return <Link href={{ pathname: href, query }} className={className}>{children}</Link>;
}

export default async function Home({ searchParams }: Props) {
  const query = await searchParams;
  const interfaceLocale = resolveInterfaceLocale(query.uiLang, query.lang);
  const copy = getHomeCopy(interfaceLocale.code);
  const learnerContextQuery = preservedLearnerContextQuery(query);

  return (
    <main className="home-page" lang={interfaceLocale.code} dir={interfaceLocale.direction}>
      <section className="home-section home-hero" data-home-section="hero">
        <div className="home-shell home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-eyebrow">{copy.hero.eyebrow}</p>
            <h1>{copy.hero.title}</h1>
            <p className="home-lead">{copy.hero.body}</p>
            <div className="home-actions">
              <ContextLink href="/knowledge" query={learnerContextQuery} className="home-button home-button--primary">{copy.hero.ctaKnowledge}</ContextLink>
              <ContextLink href="/resources" query={learnerContextQuery} className="home-button home-button--secondary">{copy.hero.ctaVideo}</ContextLink>
              <ContextLink href="/practice" query={learnerContextQuery} className="home-button home-button--accent">{copy.hero.ctaPractice}</ContextLink>
            </div>
            <p className="home-north-star">{copy.hero.note}</p>
          </div>
          <aside className="home-explore-panel" aria-label={copy.hero.exploreTitle}>
            <p className="home-eyebrow">{copy.hero.exploreLabel}</p>
            <h2>{copy.hero.exploreTitle}</h2>
            <p className="home-panel-intro">{copy.hero.exploreBody}</p>
            <div className="home-explore-grid">
              <ContextLink href="/knowledge" query={learnerContextQuery} className="home-mini-card"><strong>{copy.hero.miniKnowledgeTitle}</strong><span>{copy.hero.miniKnowledgeBody}</span></ContextLink>
              <ContextLink href="/resources" query={learnerContextQuery} className="home-mini-card"><strong>{copy.hero.miniVideoTitle}</strong><span>{copy.hero.miniVideoBody}</span></ContextLink>
              <ContextLink href="/practice" query={learnerContextQuery} className="home-mini-card"><strong>{copy.hero.miniPracticeTitle}</strong><span>{copy.hero.miniPracticeBody}</span></ContextLink>
            </div>
            <ContextLink href="/knowledge" query={learnerContextQuery} className="home-search-entry">⌕&nbsp;&nbsp;{copy.hero.searchPlaceholder}</ContextLink>
          </aside>
        </div>
      </section>

      <section className="home-section home-section--warm" data-home-section="knowledge">
        <div className="home-shell">
          <p className="home-eyebrow">{copy.knowledge.eyebrow}</p>
          <div className="home-section-heading"><h2>{copy.knowledge.title}</h2><p>{copy.knowledge.body}</p></div>
          <div className="home-knowledge-grid">
            {copy.knowledge.cards.map((card)=>(
              <ContextLink key={card.title} href="/knowledge" query={learnerContextQuery} className={`home-knowledge-card ${card.icon==="词"?"home-knowledge-card--feature":""}`}>
                <span className="home-card-icon chinese-text" aria-hidden="true">{card.icon}</span>
                <h3>{card.title}</h3><p>{card.body}</p><span className="home-text-link">{card.cta}</span>
                {card.icon==="词"?<span className="home-shadow-cn chinese-text" aria-hidden="true">词</span>:null}
              </ContextLink>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section" data-home-section="video">
        <div className="home-shell">
          <p className="home-eyebrow">{copy.video.eyebrow}</p>
          <div className="home-section-heading"><h2>{copy.video.title}</h2><p>{copy.video.body}</p></div>
          <article className="home-video-feature">
            <div className="home-video-visual" aria-hidden="true"><span className="home-video-play">▶</span><span className="home-video-cn chinese-text">听</span></div>
            <div className="home-video-copy"><h3>{copy.video.featureTitle}</h3><p>{copy.video.featureBody}</p><div className="home-video-points">{copy.video.points.map(point=><div className="home-video-point" key={point.title}><strong>{point.title}</strong><span>{point.body}</span></div>)}</div><ContextLink href="/resources" query={learnerContextQuery} className="home-button home-button--primary">{copy.video.cta}</ContextLink></div>
          </article>
        </div>
      </section>

      <section className="home-section home-section--sage-wash" data-home-section="practice">
        <div className="home-shell">
          <p className="home-eyebrow">{copy.practice.eyebrow}</p>
          <div className="home-section-heading"><h2>{copy.practice.title}</h2><p>{copy.practice.body}</p></div>
          <div className="home-tags">{copy.practice.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
          <article className="home-practice-feature"><div><h3>{copy.practice.featureTitle}</h3><p>{copy.practice.featureBody}</p></div><ContextLink href="/practice" query={learnerContextQuery} className="home-button home-button--light">{copy.practice.cta}</ContextLink></article>
        </div>
      </section>

      <section className="home-section" data-home-section="how">
        <div className="home-shell">
          <p className="home-eyebrow">{copy.how.eyebrow}</p>
          <div className="home-section-heading"><h2>{copy.how.title}</h2><p>{copy.how.body}</p></div>
          <div className="home-how-grid">{copy.how.steps.map((step,index)=><article className="home-step" key={step.title}><span>{String(index+1).padStart(2,"0")}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div>
        </div>
      </section>

      <section className="home-section home-section--sage" data-home-section="positioning">
        <div className="home-shell home-positioning-grid"><div><p className="home-eyebrow home-eyebrow--light">{copy.positioning.eyebrow}</p><h2>{copy.positioning.title}</h2><p className="home-sage-secondary">{copy.positioning.body}</p></div><div className="home-positioning-list">{copy.positioning.points.map(point=><article key={point.title}><strong>{point.title}</strong><span>{point.body}</span></article>)}</div></div>
      </section>

      <section className="home-section home-section--warm" data-home-section="account">
        <div className="home-shell home-account-grid"><div><p className="home-eyebrow">{copy.account.eyebrow}</p><h2>{copy.account.title}</h2><p className="home-secondary">{copy.account.body}</p></div><div className="home-account-cards">{copy.account.cards.map((card,index)=><article className="home-account-card" key={card.title}><span aria-hidden="true">{index===0?"○":"◇"}</span><div><h3>{card.title}</h3><p>{card.body}</p></div></article>)}</div></div>
      </section>

      <section className="home-section home-final" data-home-section="final"><div className="home-shell home-final-inner"><div><h2>{copy.final.title}</h2><p>{copy.final.body}</p></div><div className="home-actions"><ContextLink href="/knowledge" query={learnerContextQuery} className="home-button home-button--light">{copy.final.ctaKnowledge}</ContextLink><ContextLink href="/resources" query={learnerContextQuery} className="home-button home-button--outline-light">{copy.final.ctaVideo}</ContextLink></div></div></section>

      <footer className="home-footer" data-home-section="footer"><div className="home-shell home-footer-grid"><div><strong>YunChinese</strong><p>{copy.footer.tagline}</p></div><nav aria-label="Home footer"><ContextLink href="/" query={learnerContextQuery} className="home-footer-link">{copy.nav.home}</ContextLink><ContextLink href="/resources" query={learnerContextQuery} className="home-footer-link">{copy.nav.video}</ContextLink><ContextLink href="/knowledge" query={learnerContextQuery} className="home-footer-link">{copy.nav.knowledge}</ContextLink><ContextLink href="/practice" query={learnerContextQuery} className="home-footer-link">{copy.nav.practice}</ContextLink></nav></div></footer>
    </main>
  );
}
