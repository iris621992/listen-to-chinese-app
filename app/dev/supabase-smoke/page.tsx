import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type SmokeResult = {
  languagesCount: number | null;
  libraries: unknown[];
  errorMessage: string | null;
};

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

async function runSupabaseSmokeTest(): Promise<SmokeResult> {
  if (!isSupabaseConfigured) {
    return {
      languagesCount: null,
      libraries: [],
      errorMessage:
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    };
  }

  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = createServerSupabaseClient();

  const [languagesResult, librariesResult] = await Promise.all([
    supabase.from("languages").select("*", { count: "exact", head: true }),
    supabase.from("libraries").select("*").limit(10),
  ]);

  const errorMessage = [languagesResult.error?.message, librariesResult.error?.message]
    .filter(Boolean)
    .join(" | ");

  return {
    languagesCount: languagesResult.count,
    libraries: librariesResult.data ?? [],
    errorMessage: errorMessage || null,
  };
}

export default async function SupabaseSmokePage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  const smokeResult = await runSupabaseSmokeTest();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <section className="rounded-[2rem] bg-paper p-6 shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cinnabar">Development smoke test</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Supabase public read</h1>
        <p className="mt-4 leading-7 text-stone-600">
          This unlinked page verifies that the app can read public data with the configured Supabase publishable client.
        </p>

        <div className="mt-8 space-y-4">
          <div className="rounded-3xl bg-cream p-5">
            <h2 className="text-xl font-semibold">Supabase env configured</h2>
            <p className="mt-2 text-3xl font-bold text-cinnabar">{isSupabaseConfigured ? "yes" : "no"}</p>
          </div>

          <div className="rounded-3xl bg-cream p-5">
            <h2 className="text-xl font-semibold">Languages count</h2>
            <p className="mt-2 text-3xl font-bold text-cinnabar">{smokeResult.languagesCount ?? "unknown"}</p>
          </div>

          <div className="rounded-3xl bg-cream p-5">
            <h2 className="text-xl font-semibold">Libraries found</h2>
            {smokeResult.libraries.length > 0 ? (
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-stone-900 p-4 text-sm leading-6 text-orange-50">
                {JSON.stringify(smokeResult.libraries, null, 2)}
              </pre>
            ) : (
              <p className="mt-2 text-stone-600">No libraries returned.</p>
            )}
          </div>

          {smokeResult.errorMessage ? (
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
              <h2 className="text-xl font-semibold">Error</h2>
              <p className="mt-2 leading-7 text-stone-700">{smokeResult.errorMessage}</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
