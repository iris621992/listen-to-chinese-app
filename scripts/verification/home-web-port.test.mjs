import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Learner Product Positioning v1 keeps Home focused on Knowledge and Practice", async () => {
  const home = await readFile("app/page.tsx", "utf8");
  const copy = await readFile("lib/homeCopy.ts", "utf8");
  const header = await readFile("components/Header.tsx", "utf8");
  const layout = await readFile("app/layout.tsx", "utf8");
  const homeStyles = await readFile("app/home-fidelity.css", "utf8");

  assert.match(header, /\{ key: "home", path: "\/" \}/);
  assert.match(header, /\{ key: "knowledge", path: "\/knowledge" \}/);
  assert.match(header, /\{ key: "practice", path: "\/practice" \}/);
  assert.doesNotMatch(header, /key: "video"|path: "\/resources"|video:\s*"Video"/);
  assert.doesNotMatch(header, /key: "library"|Cấp độ · Tất cả|Level · All|getPublicProficiencyOptions/);
  assert.match(header, /brandTagline: "Thư viện tiếng Trung"/);
  assert.match(header, /signIn: "Đăng nhập"/);
  assert.match(header, /disabled title=\{labels\.signInUnavailable\}/);

  const orderedSections = ["hero", "knowledge", "practice", "positioning", "account", "final", "footer"];
  let previousIndex = -1;
  for (const section of orderedSections) {
    const marker = `data-home-section="${section}"`;
    const index = home.indexOf(marker);
    assert.ok(index > previousIndex, `${section} must follow the reconciled Home order`);
    previousIndex = index;
  }

  assert.doesNotMatch(home, /data-home-section="video"|href="\/resources"|home-video-/);
  assert.match(home, /href="\/knowledge"/);
  assert.match(home, /href="\/practice"/);
  assert.match(home, /home-search-suggestions/);
  assert.doesNotMatch(home, /href="\/knowledge\/vocabulary"/);
  assert.doesNotMatch(home, /getLessonDiscoveryPage|LessonCard/);

  assert.match(copy, /THƯ VIỆN TIẾNG TRUNG/);
  assert.match(copy, /Hiểu rõ\. Dùng đúng\. Nhớ lâu\./);
  assert.match(copy, /Tra để hiểu\. Luyện để dùng được\./);
  assert.match(copy, /Vì sao dùng YunChinese\?/);
  assert.match(copy, /Dùng ngay\. Đăng nhập khi cần lưu\./);
  assert.match(copy, /Hôm nay bạn muốn tìm hiểu điều gì trong tiếng Trung\?/);
  assert.match(copy, /CHINESE LEARNING LIBRARY/);
  assert.match(copy, /Understand better\. Use it well\. Remember longer\./);
  assert.doesNotMatch(copy, /\bvideo\b|VIDEO|视频/i);

  assert.match(layout, /YunChinese \| Chinese Knowledge & Practice/);
  assert.doesNotMatch(layout, /Video|contextual video/i);

  assert.match(homeStyles, /\.home-explore-grid\{[^}]*repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(homeStyles, /\.home-search-suggestions\{/);
  assert.match(homeStyles, /\.home-knowledge-card\{[^}]*display:flex;flex-direction:column/s);
  assert.match(homeStyles, /\.home-text-link\{[^}]*margin-top:auto/s);
  assert.doesNotMatch(homeStyles, /\.home-video-/);
  assert.doesNotMatch(homeStyles, /\.home-text-link\{[^}]*position:absolute/s);
});
