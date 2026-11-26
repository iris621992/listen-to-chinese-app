import { type NextRequest } from "next/server";
import { updateAuthSession } from "@/lib/supabase/authProxy";

export async function proxy(request: NextRequest) {
  return updateAuthSession(request);
}

export const config = {
  matcher: [
    "/account/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/auth/:path*",
  ],
};
