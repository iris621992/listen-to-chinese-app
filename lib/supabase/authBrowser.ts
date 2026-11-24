import { createBrowserClient } from "@supabase/ssr";
import { resolveSupabasePublicConfig } from "./publicConfig";

// Separate cookie-backed authentication from the existing public read client.
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserAuthClient() {
  if (!browserClient) {
    const config = resolveSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
    browserClient = createBrowserClient(config.url, config.key);
  }
  return browserClient;
}
