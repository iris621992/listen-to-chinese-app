# YunChinese Web

Public deployable learner-facing Web application for YunChinese.

## Repository role

This repository owns browser-facing implementation only:

- learner routes and page composition;
- responsive UI;
- search/result/detail presentation;
- localization and knowledge-language presentation;
- learner-safe API/RPC consumption;
- Web interaction states;
- Vercel/CI-facing deployable source.

It does **not** own canonical Knowledge semantics, private research/source authority, database trust-boundary policy, or Production content authority.

Cross-repository responsibility:

- `iris621992/listen-to-chinese-app` — deployable learner-facing Web implementation;
- `iris621992/listen-to-chinese` — private Engineering/System/DB/technical authority and project documentation governance;
- `iris621992/yunchinese-knowledge-authority` — private Knowledge semantic/research/editorial/authoring authority.

## Current learner direction

YunChinese is a commercial Knowledge-first Chinese-learning product.

Primary learner navigation direction:

```text
Home | Video(s) | Knowledge | Practice
```

Primary product pillars:

```text
Knowledge ↔ Practice
```

Current accepted Vocabulary learner baseline includes learner-safe Search → Vocabulary Detail, VI/EN interface support, Chinese knowledge-language mode, structured rich support, Character support and responsive behavior.

Do not reopen the accepted Vocabulary learner baseline merely because later Grammar, Comparisons, Practice or dedicated Character work is unfinished.

## Authority rule

Current Product/Knowledge/Engineering authority is resolved from the private project/Knowledge repositories and explicit Owner decisions.

Implementation in this repo must not redefine semantic meaning because a frontend shape is easier.

Open/Draft PR state is not authority. Parked PRs are candidates only and must be reconciled against current `main` before resumption.

## Development

Typical local flow:

```bash
npm install
npm run dev
```

Before proposing merge, run the repository's current required quality gates from `package.json` / CI. Do not assume a historical PR's test list is still current.

## Safety and data boundaries

- consume learner-safe public projections/RPCs;
- do not direct-read private Knowledge authority or protected backend tables;
- do not hard-code real semantic content merely to complete UI;
- missing optional content must omit/fail safely rather than be fabricated;
- do not expose private source/evidence material in this public repository.

## Documentation

This README is the public-safe Web onboarding entry point.

Whole-project documentation governance, active authority routing and historical/evidence classification are maintained in the private Engineering/Project hub. Private Knowledge authority remains in the private Knowledge repository.
