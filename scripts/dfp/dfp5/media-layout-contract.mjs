import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export const DFP5_VIEWPORT = Object.freeze({
  widthCssPixels: 390,
  heightCssPixels: 844,
});
export const DFP5_MOBILE_BREAKPOINT_CSS_PIXELS = 767;
export const DFP5_IMAGE_HARD_BYTES = 250 * 1024;
export const DFP5_RESERVED_ASPECT_RATIO = 16 / 9;

export function assertImageWithinBudget(byteLength, label = "image") {
  if (!Number.isSafeInteger(byteLength) || byteLength < 0) {
    throw new Error(`${label} byte length must be a non-negative safe integer`);
  }
  if (byteLength >= DFP5_IMAGE_HARD_BYTES) {
    throw new Error(
      `${label} is ${byteLength} bytes; hard limit is below ${DFP5_IMAGE_HARD_BYTES} bytes`,
    );
  }
  return byteLength;
}

const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

export async function measureRepositoryImages(root, {
  ignoredDirectoryNames = new Set([".git", ".next", "node_modules"]),
} = {}) {
  const measured = [];

  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && ignoredDirectoryNames.has(entry.name)) continue;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath);
        continue;
      }
      if (!entry.isFile() || !IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        continue;
      }
      const measurement = await stat(absolutePath);
      assertImageWithinBudget(
        measurement.size,
        path.relative(root, absolutePath),
      );
      measured.push({
        path: path.relative(root, absolutePath).replaceAll(path.sep, "/"),
        bytes: measurement.size,
      });
    }
  }

  await visit(root);
  return measured.sort((left, right) => left.path.localeCompare(right.path));
}
