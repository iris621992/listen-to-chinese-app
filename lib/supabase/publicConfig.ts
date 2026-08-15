type PublicEnvironment = Readonly<Record<string, string | undefined>>;

export type SupabasePublicConfig = Readonly<{
  url: string;
  key: string;
  keySource: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
}>;

const PUBLISHABLE_KEY_NAME = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const URL_NAME = "NEXT_PUBLIC_SUPABASE_URL";

function requireSupabaseProjectUrl(value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${URL_NAME} environment variable.`);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid ${URL_NAME} environment variable.`);
  }

  const validHost = /^[a-z0-9]+\.supabase\.co$/u.test(url.hostname);
  const isOriginOnly =
    url.pathname === "/" &&
    !url.search &&
    !url.hash &&
    !url.username &&
    !url.password;

  if (url.protocol !== "https:" || !validHost || !isOriginOnly) {
    throw new Error(`Invalid ${URL_NAME} environment variable.`);
  }

  return url.origin;
}

function isPublishableKey(value: string): boolean {
  return /^sb_publishable_[A-Za-z0-9_-]{22}_[A-Za-z0-9_-]{8}$/u.test(value);
}

export function resolveSupabasePublicConfig(
  environment: PublicEnvironment,
): SupabasePublicConfig {
  const url = requireSupabaseProjectUrl(environment[URL_NAME]);
  const publishableKey = environment[PUBLISHABLE_KEY_NAME];

  if (publishableKey) {
    if (!isPublishableKey(publishableKey)) {
      throw new Error(`Invalid ${PUBLISHABLE_KEY_NAME} environment variable.`);
    }
    return { url, key: publishableKey, keySource: PUBLISHABLE_KEY_NAME };
  }

  throw new Error(`Missing ${PUBLISHABLE_KEY_NAME} environment variable.`);
}
