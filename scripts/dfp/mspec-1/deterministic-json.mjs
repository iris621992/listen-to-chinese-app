import { createHash } from "node:crypto";

function normalize(value, location = "$") {
  if (
    value === undefined
    || typeof value === "function"
    || typeof value === "symbol"
  ) {
    return undefined;
  }

  if (
    value === null
    || typeof value === "string"
    || typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Non-finite number at ${location}`);
    }
    return Object.is(value, -0) ? 0 : value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item, index) => normalize(item, `${location}[${index}]`))
      .filter((item) => item !== undefined);
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(`Unsupported value at ${location}`);
  }

  const normalized = {};
  for (const key of Object.keys(value).sort()) {
    const item = normalize(value[key], `${location}.${key}`);
    if (item !== undefined) normalized[key] = item;
  }
  return normalized;
}

export function deterministicJson(value) {
  return JSON.stringify(normalize(value));
}

export function utf8Bytes(value) {
  return Buffer.byteLength(
    typeof value === "string" ? value : deterministicJson(value),
    "utf8",
  );
}

export function sha256(value) {
  return createHash("sha256")
    .update(typeof value === "string" ? value : deterministicJson(value), "utf8")
    .digest("hex");
}
