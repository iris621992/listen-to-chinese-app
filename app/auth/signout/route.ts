import { NextResponse } from "next/server";

import { buildAuthSiteUrl } from "@/lib/auth/authSiteUrl";
import { createServerAuthClient } from "@/lib/supabase/authServer";

export async function POST(request: Request) {
  const formData = await request.formData();
  const uiLang = formData.get("uiLang") === "vi" ? "vi" : "en";
  const supabase = await createServerAuthClient();
  const { error } = await supabase.auth.signOut({
    scope: "local",
  });

  if (error) {
    return NextResponse.redirect(
      buildAuthSiteUrl("/account", {
        error: "signout",
        uiLang,
      }),
      303,
    );
  }

  return NextResponse.redirect(buildAuthSiteUrl("/login", { uiLang }), 303);
}
