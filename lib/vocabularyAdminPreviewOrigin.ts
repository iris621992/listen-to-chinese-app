// Vocabulary Draft Preview: explicit Admin opener trust boundary.
// This is a transport allowlist, not learner authentication or Knowledge ownership.
const PRODUCTION_ADMIN_ORIGIN = "https://admin.yunchinese.com";

export function validatedAdminPreviewOrigin(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    // Admin passes window.location.origin: only canonical HTTPS origins qualify.
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || url.port
      || url.pathname !== "/"
      || url.search
      || url.hash
    ) return null;

    const isStagingAdmin =
      url.hostname === "listen-to-chinese-staging.vercel.app"
      || (
        url.hostname.startsWith("listen-to-chinese-staging-")
        && url.hostname.endsWith(".vercel.app")
      );

    return url.origin === PRODUCTION_ADMIN_ORIGIN || isStagingAdmin
      ? url.origin
      : null;
  } catch {
    return null;
  }
}
