import { readFile } from "node:fs/promises";
import {
  FIXTURE_GENERATOR_VERSION,
  FIXTURE_SCHEMA_VERSION,
  MANIFEST_PATH,
  MSPEC_VERSION,
} from "./spec.mjs";
import { deterministicJson, sha256, utf8Bytes } from "./deterministic-json.mjs";

const LOCALES = [
  ["en", "English", "ltr"],
  ["vi", "Tiếng Việt", "ltr"],
  ["ar", "العربية", "rtl"],
  ["th", "ไทย", "ltr"],
  ["id", "Bahasa Indonesia", "ltr"],
  ["es", "Español", "ltr"],
  ["pt", "Português", "ltr"],
  ["fr", "Français", "ltr"],
  ["de", "Deutsch", "ltr"],
  ["ru", "Русский", "ltr"],
  ["ja", "日本語", "ltr"],
  ["ko", "한국어", "ltr"],
  ["it", "Italiano", "ltr"],
  ["tr", "Türkçe", "ltr"],
  ["he", "עברית", "rtl"],
];

const text = (label, repeat = 1) => Array.from(
  { length: repeat },
  (_, index) => `${label}-${String(index + 1).padStart(2, "0")}`,
).join(" ");

function resource(index, locale = "vi") {
  const id = String(index + 1).padStart(3, "0");
  return {
    id: `resource-${id}`,
    slug: `hsk1-day-${id}`,
    contentType: index % 2 === 0 ? "listening" : "reading",
    locale,
    title: `Bài luyện tiếng Trung ${id}`,
    summary: text(`Tóm tắt ${id}`, 5),
    level: "HSK1",
    durationSeconds: 90 + index,
    thumbnail: {
      src: `/fixtures/images/${id}.webp`,
      width: 640,
      height: 360,
    },
    publishedAt: `2026-01-${String((index % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
  };
}

function segment(index, locale = "vi") {
  const id = String(index + 1).padStart(3, "0");
  return {
    id: `segment-${id}`,
    position: index + 1,
    sourceText: `我学习中文。${id}`,
    pinyin: `wǒ xuéxí zhōngwén ${id}`,
    translation: {
      locale,
      resolvedLocale: locale,
      text: text(`Tôi học tiếng Trung ${id}`, 4),
    },
  };
}

function exercise(index, optionCount, mediaCount, locale = "vi") {
  const id = String(index + 1).padStart(3, "0");
  return {
    exerciseId: `exercise-${id}`,
    type: "multiple_choice",
    locale,
    prompt: `Chọn câu trả lời phù hợp ${id}.`,
    options: Array.from({ length: optionCount }, (_, optionIndex) => ({
      optionId: `exercise-${id}-option-${String(optionIndex + 1).padStart(2, "0")}`,
      text: `Lựa chọn ${optionIndex + 1}`,
    })),
    media: Array.from({ length: mediaCount }, (_, mediaIndex) => ({
      mediaId: `exercise-${id}-media-${String(mediaIndex + 1).padStart(2, "0")}`,
      mediaType: "audio",
      url: `https://media.invalid/fixtures/${id}/${mediaIndex + 1}.mp3`,
    })),
  };
}

function envelope(contract, fixtureId, data) {
  return {
    measurementSpec: MSPEC_VERSION,
    fixtureSchemaVersion: FIXTURE_SCHEMA_VERSION,
    fixtureGeneratorVersion: FIXTURE_GENERATOR_VERSION,
    fixtureId,
    contract,
    data,
  };
}

const BUILDERS = {
  discovery: ({ id, rows, locale = "vi" }) => envelope(
    "discovery-summary-v1",
    id,
    {
      locale,
      resources: Array.from({ length: rows }, (_, index) => resource(index, locale)),
      nextCursor: rows >= 24 ? "opaque-fixture-cursor" : null,
    },
  ),
  detail: ({ id, segments, locale = "vi" }) => envelope(
    "resource-detail-core-v1",
    id,
    {
      resource: resource(0, locale),
      media: {
        provider: "fixture",
        poster: "/fixtures/images/detail.webp",
        aspectRatio: "16/9",
      },
      segments: Array.from(
        { length: segments },
        (_, index) => segment(index, locale),
      ),
    },
  ),
  practice: ({ id, exercises, options, media, locale = "vi" }) => envelope(
    "practice-pre-submit-v1",
    id,
    {
      outcomeCode: "FOUND",
      requestedLocale: locale,
      exercises: Array.from(
        { length: exercises },
        (_, index) => exercise(index, options, media, locale),
      ),
    },
  ),
  localeRegistry: ({ id, locales }) => envelope(
    "locale-registry-v1",
    id,
    {
      locales: LOCALES.slice(0, locales).map(([code, label, direction]) => ({
        code,
        label,
        direction,
        active: true,
        fallbackLocale: code === "en" ? null : "en",
      })),
    },
  ),
};

export async function loadFixtureManifest() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  if (manifest.measurementSpec !== MSPEC_VERSION) {
    throw new Error(`Unexpected measurement spec: ${manifest.measurementSpec}`);
  }
  if (manifest.fixtureSchemaVersion !== FIXTURE_SCHEMA_VERSION) {
    throw new Error(`Unexpected fixture schema: ${manifest.fixtureSchemaVersion}`);
  }
  if (manifest.fixtureGeneratorVersion !== FIXTURE_GENERATOR_VERSION) {
    throw new Error(`Unexpected fixture generator: ${manifest.fixtureGeneratorVersion}`);
  }
  return manifest;
}

export function generateFixture(definition) {
  const builder = BUILDERS[definition.kind];
  if (!builder) throw new Error(`Unknown fixture kind: ${definition.kind}`);
  return builder(definition);
}

export function measureFixture(definition) {
  const value = generateFixture(definition);
  const serialized = deterministicJson(value);
  return {
    id: definition.id,
    schemaVersion: FIXTURE_SCHEMA_VERSION,
    hashAlgorithm: "sha256",
    sha256: sha256(serialized),
    bytes: utf8Bytes(serialized),
    serialized,
    value,
  };
}

export async function loadMeasuredFixtures() {
  const manifest = await loadFixtureManifest();
  return manifest.fixtures.map((definition) => ({
    definition,
    measurement: measureFixture(definition),
  }));
}
