import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../../" + path, import.meta.url), "utf8");

test("learner auth is routed through a cookie-backed SSR client, not public data client", async () => {
  const [server, proxy, root, identity] = await Promise.all([
    read("lib/supabase/authServer.ts"), read("lib/supabase/authProxy.ts"),
    read("proxy.ts"), read("lib/auth/learnerIdentity.ts"),
  ]);
  assert.match(server, /createServerClient/);
  assert.match(server, /cookies/);
  assert.match(proxy, /await supabase\.auth\.getClaims\(\)/);
  assert.match(root, /"\/auth\/:path\*"/);
  assert.match(root, /"\/account\/:path\*"/);
  assert.match(identity, /\.auth\.getClaims\(\)/);
  assert.doesNotMatch(identity, /user_roles|service_role|\.auth\.getSession/);
});

test("lifecycle has server-side validation and fixed allowed callback paths", async () => {
  const [actions, callback, url, signout] = await Promise.all([
    read("app/auth/actions.ts"), read("app/auth/confirm/route.ts"),
    read("lib/auth/authSiteUrl.ts"), read("app/auth/signout/route.ts"),
  ]);
  for (const call of ["signInWithPassword", "signUp", "resetPasswordForEmail", "updateUser"]) {
    assert.ok(actions.includes(".auth." + call + "("));
  }
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /verifyOtp/);
  assert.match(callback, /resolveAuthNextPath/);
  assert.match(url, /AUTH_SITE_URL/);
  assert.match(url, /"\/account"/);
  assert.match(url, /"\/reset-password"/);
  assert.doesNotMatch(url, /request\.headers|x-forwarded-host/i);
  assert.match(signout, /scope:\s*"local"/);
  assert.match(signout, /export async function POST/);
  assert.doesNotMatch(actions + callback + signout, /service_role|user_roles/);
});

test("visible sign-in links are enabled, session-aware and VI/EN; no speculative profile writes", async () => {
  const [header, authLink, login, signup, recover, account, copy, testPackage] = await Promise.all([
    read("components/Header.tsx"), read("components/LearnerAuthLink.tsx"),
    read("app/login/page.tsx"), read("app/signup/page.tsx"),
    read("app/forgot-password/page.tsx"), read("app/account/page.tsx"),
    read("lib/auth/accountLocale.ts"), read("package.json"),
  ]);
  assert.match(header, /LearnerAuthLink/);
  assert.doesNotMatch(header, /signInUnavailable|drawerSignIn\} disabled/);
  assert.match(authLink, /getBrowserAuthClient/);
  assert.match(authLink, /onAuthStateChange/);
  assert.match(authLink, /"\/account"/);
  assert.match(authLink, /"\/login"/);
  assert.match(login + signup + recover + account, /Đăng nhập/);
  assert.match(copy, /"vi" \| "en"/);
  assert.doesNotMatch(account, /timezone_name|\.upsert\(|practice_sessions/);
  const pkg = JSON.parse(testPackage);
  assert.equal(pkg.dependencies["@supabase/ssr"], "0.12.0");
  assert.match(pkg.scripts.build, /test:learner-account/);
});

test("lockfile includes SSR and cookie and sign-out stays POST-only", async () => {
  const lock = JSON.parse(await read("package-lock.json"));
  assert.equal(lock.packages[""].dependencies["@supabase/ssr"], "0.12.0");
  assert.ok(lock.packages["node_modules/@supabase/ssr"]);
  assert.ok(lock.packages["node_modules/cookie"]);
  const layout = await read("app/account/page.tsx");
  assert.match(layout, /method="post"/);
});
