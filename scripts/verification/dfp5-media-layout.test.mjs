import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  assertImageWithinBudget,
  DFP5_IMAGE_HARD_BYTES,
  DFP5_RESERVED_ASPECT_RATIO,
  DFP5_VIEWPORT,
  measureRepositoryImages,
} from "../dfp/dfp5/media-layout-contract.mjs";
import { measureProductionLessonInBrowser } from "../dfp/dfp5/browser-production-gate.mjs";

const playerSourcePath = "app/lessons/[slug]/IntentYouTubePlayer.tsx";
const mediaSourcePath = "app/lessons/[slug]/LessonMediaColumn.tsx";
const pageSourcePath = "app/lessons/[slug]/SupabaseLessonPage.tsx";
const cssSourcePath = "app/globals.css";
const browserEvidence = measureProductionLessonInBrowser();

test("keeps the third-party iframe behind explicit learner intent", async () => {
  const [playerSource, mediaSource] = await Promise.all([
    readFile(playerSourcePath, "utf8"),
    readFile(mediaSourcePath, "utf8"),
  ]);
  assert.match(playerSource, /"use client"/);
  assert.match(playerSource, /useState\(false\)/);
  assert.match(playerSource, /if \(activated && validVideoId\)/);
  assert.match(playerSource, /onClick=\{\(\) => setActivated\(true\)\}/);
  assert.match(playerSource, /youtube-nocookie\.com\/embed/);
  assert.doesNotMatch(mediaSource, /<iframe/);
  assert.doesNotMatch(mediaSource, /<img|<Image/);
  assert.doesNotMatch(mediaSource, /poster=|thumbnail/i);
});

test("records the actual production route request and delivered-image ledger", {
  timeout: 120_000,
}, async () => {
  const measurements = await browserEvidence;
  assert.equal(measurements.length, 2);
  for (const measurement of measurements) {
    assert.equal(measurement.initial.requestCount > 0, true);
    assert.deepEqual(measurement.initial.iframeSources, []);
    assert.deepEqual(measurement.initial.imageSources, []);
    assert.deepEqual(
      measurement.initial.thirdPartyMediaOrImageRequests,
      [],
    );
    assert.equal(measurement.deliveredImage.mimeType, "image/svg+xml");
    assert.equal(measurement.deliveredImage.bodyBytes > 0, true);
    assert.equal(
      measurement.deliveredImage.bodyBytes < DFP5_IMAGE_HARD_BYTES,
      true,
    );
    assert.equal(measurement.deliveredImage.encodedDataLength > 0, true);
    assert.equal(
      new URL(measurement.deliveredImage.url).pathname,
      "/probe-image",
    );
    assert.equal(measurement.activationRequests.length, 1);
    assert.match(
      measurement.activationRequests[0].url,
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?autoplay=1$/,
    );
  }
});

test("measures the same actual production 16:9 box before and after activation", {
  timeout: 120_000,
}, async () => {
  const css = await readFile(cssSourcePath, "utf8");
  assert.equal(DFP5_RESERVED_ASPECT_RATIO, 16 / 9);
  assert.match(
    css,
    /\.intent-youtube-frame,\s*\.intent-youtube-trigger\s*\{[\s\S]*?aspect-ratio:\s*16\s*\/\s*9;/,
  );
  for (const measurement of await browserEvidence) {
    const before = measurement.beforeActivation.media;
    const after = measurement.afterActivation.media;
    assert.ok(before.width > 0);
    assert.ok(before.height > 0);
    assert.ok(Math.abs(before.width / before.height - 16 / 9) < 0.01);
    assert.ok(Math.abs(after.width / after.height - 16 / 9) < 0.01);
    assert.ok(Math.abs(before.width - after.width) < 0.5);
    assert.ok(Math.abs(before.height - after.height) < 0.5);
  }
});

test("reads actual 390x844 LTR and RTL DOM overflow from production components", {
  timeout: 120_000,
}, async () => {
  const [pageSource, css] = await Promise.all([
    readFile(pageSourcePath, "utf8"),
    readFile(cssSourcePath, "utf8"),
  ]);
  assert.match(pageSource, /className="lesson-workspace"/);
  assert.match(pageSource, /data-direction=\{interfaceDirection\}/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(
    css,
    /\.lesson-workspace,\s*\.lesson-workspace\[data-direction="rtl"\]\s*\{[\s\S]*?flex-direction:\s*column;/,
  );
  assert.match(
    css,
    /\.lesson-media-pane,\s*\.lesson-learning-pane\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?width:\s*100%;/,
  );
  assert.deepEqual(
    (await browserEvidence).map((measurement) => measurement.direction),
    ["ltr", "rtl"],
  );
  for (const measurement of await browserEvidence) {
    for (const phase of [
      measurement.beforeActivation,
      measurement.afterActivation,
    ]) {
      assert.equal(phase.root.clientWidth, DFP5_VIEWPORT.widthCssPixels);
      assert.equal(phase.root.scrollWidth, phase.root.clientWidth);
      assert.equal(phase.body.scrollWidth, phase.body.clientWidth);
      assert.equal(phase.workspace.scrollWidth, phase.workspace.clientWidth);
      assert.equal(phase.mediaPane.scrollWidth, phase.mediaPane.clientWidth);
      assert.equal(
        phase.learningPane.scrollWidth,
        phase.learningPane.clientWidth,
      );
      assert.deepEqual(phase.viewportViolations, []);
    }
  }
});

test("browser fixture imports production page, learning panel, player, and CSS", async () => {
  const [fixturePage, fixtureLayout] = await Promise.all([
    readFile("scripts/dfp/dfp5/fixture-app/app/page.tsx", "utf8"),
    readFile("scripts/dfp/dfp5/fixture-app/app/layout.tsx", "utf8"),
  ]);
  assert.match(
    fixturePage,
    /@\/app\/lessons\/\[slug\]\/SupabaseLessonPage/,
  );
  assert.match(fixturePage, /<SupabaseLessonPage/);
  assert.match(fixtureLayout, /@\/app\/globals\.css/);
});

test("enforces the below-250-KiB per-image hard limit", async () => {
  assert.equal(assertImageWithinBudget(DFP5_IMAGE_HARD_BYTES - 1), 255999);
  assert.throws(
    () => assertImageWithinBudget(DFP5_IMAGE_HARD_BYTES),
    /hard limit is below 256000 bytes/,
  );

  const fixtureRoot = await mkdtemp(path.join(tmpdir(), "dfp5-images-"));
  try {
    await writeFile(
      path.join(fixtureRoot, "within.webp"),
      Buffer.alloc(DFP5_IMAGE_HARD_BYTES - 1),
    );
    assert.deepEqual(await measureRepositoryImages(fixtureRoot), [
      { path: "within.webp", bytes: DFP5_IMAGE_HARD_BYTES - 1 },
    ]);
    await writeFile(
      path.join(fixtureRoot, "blocked.png"),
      Buffer.alloc(DFP5_IMAGE_HARD_BYTES),
    );
    await assert.rejects(
      () => measureRepositoryImages(fixtureRoot),
      /blocked\.png is 256000 bytes/,
    );
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test("measures every checked-in image under the hard budget", async () => {
  const images = await measureRepositoryImages(process.cwd());
  assert.ok(Array.isArray(images));
  for (const image of images) {
    assert.ok(image.bytes < DFP5_IMAGE_HARD_BYTES, image.path);
  }
});

test("preserves answer-free practice and data/cache regression boundaries", async () => {
  const [detailGate, cacheGate, packageJson] = await Promise.all([
    readFile("scripts/verification/dfp2-detail-boundary.test.mjs", "utf8"),
    readFile("scripts/verification/dfp4-public-cache-invalidation.test.mjs", "utf8"),
    readFile("package.json", "utf8").then(JSON.parse),
  ]);
  assert.match(detailGate, /answer-free/i);
  assert.match(cacheGate, /invalidation/i);
  assert.equal(
    packageJson.scripts["test:dfp5"],
    "node --test scripts/verification/dfp5-media-layout.test.mjs",
  );
});
