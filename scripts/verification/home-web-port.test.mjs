import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Home Web Port v1 preserves approved v3.2 direction", async () => {
  const home = await readFile("app/page.tsx", "utf8");
  const copy = await readFile("lib/homeCopy.ts", "utf8");
  const header = await readFile("components/Header.tsx", "utf8");
  const homeStyles = await readFile("app/home-fidelity.css", "utf8");

  assert.match(header, /\{ key: "video", path: "\/resources" \}/);
  assert.doesNotMatch(header, /key: "library"|Cấp độ · Tất cả|Level · All|getPublicProficiencyOptions/);
  assert.match(header, /signIn: "Đăng nhập"/);
  assert.match(header, /disabled title=\{labels\.signInUnavailable\}/);

  assert.match(home, /data-home-section="knowledge"/);
  assert.match(home, /data-home-section="video"/);
  assert.match(home, /data-home-section="practice"/);
  assert.match(home, /href="\/knowledge"/);
  assert.doesNotMatch(home, /href="\/knowledge\/vocabulary"/);
  assert.doesNotMatch(home, /getLessonDiscoveryPage|LessonCard/);

  assert.match(copy, /Hiểu tiếng Trung rõ hơn\. Dùng tự nhiên hơn\./);
  assert.match(copy, /Không có một lộ trình bắt buộc\./);
  assert.match(copy, /Understand Chinese more clearly\. Use it more naturally\./);
  assert.doesNotMatch(copy, /miniLibrary|ctaLibrary|listeningTitle|readingTitle/);

  assert.match(homeStyles, /\.home-knowledge-card\{[^}]*display:flex;flex-direction:column/s);
  assert.match(homeStyles, /\.home-text-link\{[^}]*margin-top:auto/s);
  assert.doesNotMatch(homeStyles, /\.home-text-link\{[^}]*position:absolute/s);
});
