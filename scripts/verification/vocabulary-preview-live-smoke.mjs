import assert from "node:assert/strict";

// Live non-Production acceptance smoke. Run explicitly against an exact-head
// Vercel Preview after validating its Staging binding. This script performs
// public GETs only; it never changes data or accesses privileged endpoints.
// Usage: node scripts/verification/vocabulary-preview-live-smoke.mjs https://<preview-host>

const target = process.argv[2];
if (!target) {
  console.error("FAIL: exact-head Preview URL is required; CI/build alone is not runtime acceptance.");
  process.exit(2);
}
const origin = new URL(target);
assert.equal(origin.protocol, "https:", "Only HTTPS Preview hosts are supported");
assert.equal(origin.pathname, "/", "Provide a Preview origin, not an arbitrary URL");
assert.equal(origin.search, "", "Provide a Preview origin without query arguments");
assert.equal(origin.hash, "", "Provide a Preview origin without a fragment");

async function load(path) {
  const response = await fetch(new URL(path, origin), {
    headers: { accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200, `HTTP ${response.status} for ${path}`);
  const html = await response.text();
  assert.ok(html.length > 100, `Empty HTML for ${path}`);
  return html;
}

const cases = [
  ["en", "/knowledge?q=dong&uiLang=en"],
  ["vi", "/knowledge?q=dong&uiLang=vi"],
];

for (const [locale, path] of cases) {
  const html = await load(path);
  assert.doesNotMatch(
    html,
    /Results are unavailable right now|The published Vocabulary source could not be reached|Không thể tải kết quả lúc này|Nguồn Từ vựng đã xuất bản hiện không khả dụng/u,
    `${locale}: public Vocabulary RPC must work on the actual Preview deployment`,
  );
  assert.match(html, /懂/u, `${locale}: Staging's published 懂 entry must appear`);
  const detailPath = html.match(/\/knowledge\/vocabulary\/vocab_[a-f0-9]{64}/u)?.[0];
  assert.ok(detailPath, `${locale}: the search result must include a real Vocabulary Detail link`);
  const detail = await load(detailPath + `?uiLang=${locale}`);
  assert.match(detail, /懂/u, `${locale}: Detail must render the published entry`);
  console.log(`PASS: ${locale} search → published Vocabulary Detail`);
}

console.log("PASS: live public Preview smoke. This does NOT attest Admin Draft/Published parity or visual responsive acceptance.");
