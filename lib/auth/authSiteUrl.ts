const AUTH_SITE_URL_ENV = "AUTH_SITE_URL";

const AUTH_NEXT_PATHS = new Set([
  "/account",
  "/reset-password",
]);

function isLocalHostname(hostname: string) {
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "::1";
}

function configuredAuthSiteUrl() {
  const rawValue = process.env[AUTH_SITE_URL_ENV]?.trim();

  if (!rawValue) {
    throw new Error(`${AUTH_SITE_URL_ENV} is required for learner email auth flows.`);
  }

  let url: URL;
  try {
    url = new URL(rawValue);
  } catch {
    throw new Error(`${AUTH_SITE_URL_ENV} must be an absolute URL.`);
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(`${AUTH_SITE_URL_ENV} must not include credentials, query, or fragment.`);
  }

  const localHttp = url.protocol === "http:" && isLocalHostname(url.hostname);
  if (url.protocol !== "https:" && !localHttp) {
    throw new Error(`${AUTH_SITE_URL_ENV} must use HTTPS outside local development.`);
  }

  if (url.pathname !== "/" && url.pathname !== "") {
    throw new Error(`${AUTH_SITE_URL_ENV} must be an origin URL without a path.`);
  }

  url.pathname = "/";
  return url;
}

export function resolveAuthNextPath(value: string | null | undefined) {
  return value && AUTH_NEXT_PATHS.has(value) ? value : "/account";
}

export function buildAuthSiteUrl(
  path: string,
  searchParams?: Readonly<Record<string, string>>,
) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Auth redirect path must be site-relative.");
  }

  const base = configuredAuthSiteUrl();
  const url = new URL(path, base);

  if (url.origin !== base.origin) {
    throw new Error("Auth redirect must stay on the configured site origin.");
  }

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}
