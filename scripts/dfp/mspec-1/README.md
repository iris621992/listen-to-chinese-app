# DFP-0 measurement foundation

This directory is test and measurement tooling only. It does not import application
loaders, call a provider or database, alter a released route, or authorize a
`DFP-MSPEC-1` conformance claim.

## Automated gates

```sh
npm run test:dfp0
npm run measure:dfp0:fixtures
```

The first command locks deterministic JSON serialization, UTF-8 byte measurement,
SHA-256 fixture identity, exact profile constants, nearest-rank percentiles,
failed-sample retention, operation/round/auth/row recording, complete evidence
identity, exact source-commit binding, loopback-only browser requests, redirect
and bootstrap/framework byte attribution, service-worker bypass, and the test-only
HTTP adapter.
It also locks fail-closed serialization of request-guard violations and
cryptographic response-body binding for the canonical HTML/vitals
instrumentation, fixture RSC payload, and interaction JavaScript.
Evidence locale and authorization class must match the canonical fixture route,
and evidence may claim `DFP-MSPEC-1` only for the locked 10/p75 synthetic-page
or 30/p95 server-assembly sampling profile.

The second command regenerates every named minimum, representative, and
maximum-approved fixture measurement. It fails on fixture-set, schema, content
hash, byte-count, or hard application-data payload-budget drift.

## Browser measurement

Start the fixture adapter:

```sh
node scripts/dfp/mspec-1/fixture-adapter.mjs --port=4173
```

In another shell, run an installed Chromium-family browser against that local
adapter:

```sh
npm run measure:dfp0:browser -- \
  --browser=/absolute/path/to/chromium \
  --origin=http://127.0.0.1:4173 \
  --fixture=detail-representative \
  --commit="$(git rev-parse HEAD)" \
  --locale=vi \
  --authorization-class=public \
  --output=/tmp/dfp-mspec-1-detail.json
```

The runner requires a completely clean worktree, including no untracked files,
and rejects `--commit` unless it matches the exact measured Git HEAD. It
rejects `--locale` or `--authorization-class` values that do not match the
canonical fixture route. It
intercepts every page request, permits only loopback HTTP, blocks any attempted
external request, bypasses service workers through the Network domain, and
records the browser/CDP version, profile, cache state, fixture hash, every sample
including failures, p75 nearest-rank summaries, decoded HTML/RSC bytes, encoded
cache-miss JavaScript body bytes, redirect bodies, bootstrap/framework request
attribution, LCP, INP, CLS, response-body identity checks, runner failures, and
blocking-gate results. Evidence receives PASS only when every measured HTML, RSC,
and instrumentation body matches the canonical local adapter. A blocked external
request is serialized into failed samples and runner-failure evidence before the
process exits with failure.

The required synthetic profile is 390 × 844 CSS pixels at device-pixel ratio 3,
1.6 Mbps down, 750 Kbps up, 150 ms RTT, 4× CPU slowdown, empty browser cache,
disabled/bypassed service workers, and 10 cold navigations. A browser run is
evidence only for its exact commit and fixture; it does not by itself establish
system-wide conformance.
