import assert from "node:assert/strict";
import test from "node:test";
import { resolveSupabasePublicConfig } from "../../lib/supabase/publicConfig.ts";

const url = "https://projectref.supabase.co";
const publishableKey = "sb_publishable_1234567890123456789012_12345678";

test("prefers the explicit publishable-key contract", () => {
  assert.deepEqual(
    resolveSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    }),
    {
      url,
      key: publishableKey,
      keySource: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    },
  );
});

test("accepts Base64URL characters throughout a publishable key", () => {
  for (const key of [
    "sb_publishable_-234567890123456789012_12345678",
    "sb_publishable_1_34567890123456789012_12345678",
    "sb_publishable_1234567890123456789012_-2345678",
    "sb_publishable_1234567890123456789012_1_345678",
  ]) {
    assert.equal(
      resolveSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
      }).key,
      key,
    );
  }
});

test("does not accept the legacy anon-key contract", () => {
  assert.throws(
    () =>
      resolveSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-legacy-key",
      }),
    /Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
  );
});

test("fails closed for missing or malformed publishable keys", () => {
  assert.throws(
    () => resolveSupabasePublicConfig({ NEXT_PUBLIC_SUPABASE_URL: url }),
    /Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
  );
  assert.throws(
    () =>
      resolveSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "not-a-public-key",
      }),
    /Invalid NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
  );
});

test("fails closed for unsafe or non-project URLs", () => {
  for (const invalidUrl of [
    "http://projectref.supabase.co",
    "https://user:password@projectref.supabase.co",
    "https://projectref.supabase.co/rest/v1",
    "https://example.com",
    "not-a-url",
  ]) {
    assert.throws(
      () =>
        resolveSupabasePublicConfig({
          NEXT_PUBLIC_SUPABASE_URL: invalidUrl,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
        }),
      /Invalid NEXT_PUBLIC_SUPABASE_URL/,
    );
  }
});
