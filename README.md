# YunChinese Web

Public/deployable learner-facing Next.js application for YunChinese.

YunChinese is a commercial Chinese-learning product built around:

```text
Knowledge ↔ Practice
```

This repository implements learner/browser-facing experiences. It does **not** own canonical Knowledge semantics, private research/source authority, physical database authority or Production operational evidence.

## Repository responsibilities

- `iris621992/listen-to-chinese-app` — learner-facing Web implementation, responsive UI, browser behavior and public-safe consumer logic.
- `iris621992/listen-to-chinese` — private Engineering/System/DB/trust-boundary authority and cross-project documentation governance.
- `iris621992/yunchinese-knowledge-authority` — private Knowledge semantic/research/editorial/authoring authority.

No Web implementation may redefine Knowledge semantics because a UI or payload shape is easier.

## Current learner baseline

Current merged `main` includes the accepted Vocabulary learner flow and current Knowledge-language behavior:

- Knowledge Search → Vocabulary result → generic Vocabulary Detail;
- learner-safe Vocabulary delivery;
- VI/EN learner UI;
- Chinese knowledge-language mode;
- structured rich support;
- Character rail;
- responsive/sticky learner behavior;
- truthful omission/failure for unavailable content.

Current implementation evidence does not replace Product/Knowledge authority.

## Development

Install dependencies:

```bash
npm ci
```

Run locally:

```bash
npm run dev
```

Production build / current regression chain:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Focused verification scripts are defined in `package.json`, including Vocabulary Search, Vocabulary Detail, Knowledge language, Home, architecture-direction, DFP and public security invariants.

## Documentation / authority

Current project-wide documentation governance and the authority matrix live in the private Engineering/project repository.

This public/deployable repository intentionally does not duplicate private Knowledge source material, private operational evidence or internal security/provider records.

When a task depends on exact current authority, resolve the relevant repository `main` and current ACTIVE contract rather than relying on an old PR description or chat handoff.

## Open / parked pull requests

An Open/Draft PR is a **candidate**, not current authority.

At this documentation checkpoint:

- PR #14 — parked Resource Detail candidate; not authority.
- PR #17 — parked / Owner-decision-required Videos candidate; not authority.

If a parked candidate is resumed after `main` has advanced, reconcile it against current `main` and current Product/Knowledge authority rather than assuming its old branch is directly merge-ready.

## Data and security boundary

Learner Web consumes approved learner-safe/public delivery contracts. It must not direct-read protected private Knowledge/lexical authority tables or expose private operational/source material.

Admin implementation, privileged write paths, schema changes, Supabase/Production mutation and other sensitive operations require their own approved Engineering contracts and execution boundaries.
