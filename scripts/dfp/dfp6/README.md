# DFP-6 release observability

This directory implements the public-safe DFP-6 release gate for the deployable
application authority.

It is intentionally **release-time synthetic evidence**, not a Production logging
or provider-monitoring package.

## Locked boundary

DFP-6 reuses `DFP-MSPEC-1` and the completed DFP-2 through DFP-5 production-flow
contracts. It does not change application loaders, routes, cache behavior, SQL,
Supabase configuration, Vercel configuration, or dependencies.

The gate:

- binds evidence to the exact 40-character Git HEAD and requires a clean worktree;
- runs the actual discovery/detail/practice flow functions with deterministic local
  adapters and records one warm-up plus 30 measured server-assembly samples;
- records data-store operations, dependent rounds, auth/session counts and
  duration, returned-row counts, bounded outcome codes, and application-data bytes;
- reuses the existing DFP-5 fixture app that imports production lesson components;
- measures the production-component fixture under the exact `DFP-MSPEC-1`
  390 x 844 viewport, network, CPU, browser-cache, service-worker, sample, and
  nearest-rank percentile profile;
- records HTML, RSC, route-required JavaScript, LCP, INP, and CLS;
- exercises DFP-4 invalidation success and retry outcomes without a provider;
- emits sanitized exact-head JSON evidence and fails on blocking thresholds.

## Thresholds

Server-assembly blocking thresholds:

- discovery p95: 600 ms;
- detail core p95: 900 ms;
- practice pre-submit p95: 800 ms.

Targets remain 300 ms, 500 ms, and 400 ms respectively.

Browser blocking thresholds are inherited from `DFP-MSPEC-1`:

- HTML <= 96 KiB;
- RSC <= 160 KiB;
- route-required JavaScript <= 250 KiB;
- LCP p75 <= 4.0 s;
- INP p75 <= 500 ms;
- CLS p75 <= 0.25.

A target miss is preserved in evidence even when it stays below the blocking
threshold. Failed samples are retained and make the release gate fail closed.

## Evidence privacy

The evidence schema forbids secret/token/credential fields, answer or grading
fields, transcripts/translations, database URLs, and Supabase configuration
values. It stores only bounded metrics, exact source identity, public-safe fixture
hashes, tool/profile identity, outcome codes, and gate results.

Real lesson bodies, learner data, provider responses, environment values, and
Production database data must never be emitted by this package.

## Provider boundary

No Production database, Supabase provider, Vercel API, secret, environment value,
or external learner-content endpoint is accessed by this gate.

The browser fixture is loopback-only. External browser requests are blocked.

Field evidence is explicitly `NOT_COLLECTED` by this package. Any future Vercel,
Supabase, runtime-log, or real-user field evidence requires a separate approval
and belongs in the private governance/evidence authority. Field evidence may
supplement but never replace this synthetic release gate.

## Commands

```sh
npm run test:dfp6
npm run --silent measure:dfp6:release > /tmp/dfp6-release-evidence.json
```

`measure:dfp6:release` exits non-zero when the generated evidence does not satisfy
the blocking DFP-6 release gate.
