import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import {
  buildAuthSiteUrl,
  resolveAuthNextPath,
} from "@/lib/auth/authSiteUrl";
import { createServerAuthClient } from "@/lib/supabase/authServer";

const ALLOWED_EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "recovery",
]);

function allowedEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value || !ALLOWED_EMAIL_OTP_TYPES.has(value as EmailOtpType)) {
    return null;
  }
  return value as EmailOtpType;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = allowedEmailOtpType(searchParams.get("type"));
  const nextPath = resolveAuthNextPath(searchParams.get("next"));

  const supabase = await createServerAuthClient();
  let verified = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    verified = !error;
  }

  if (!verified) {
    return NextResponse.redirect(
      buildAuthSiteUrl("/login", {
        error: "confirmation",
      }),
    );
  }

  const uiLang = searchParams.get("uiLang") === "vi" ? "vi" : "en";
  return NextResponse.redirect(buildAuthSiteUrl(nextPath, { uiLang }));
}
