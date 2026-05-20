import { NextResponse } from "next/server";

import { setSessionCookie } from "@/modules/auth/session/sessionCookie";
import { getAppUrl } from "@/modules/auth/steam/steamOpenId";
import { SteamAuthService } from "@/modules/auth/steam/steamAuthService";

export async function GET(request: Request) {
  const appUrl = getAppUrl(request);

  try {
    const { session } = await new SteamAuthService().completeLogin(request);
    const response = NextResponse.redirect(new URL("/profile", appUrl));

    setSessionCookie(response, session.token, session.expiresAt);

    return response;
  } catch {
    const redirectUrl = new URL("/auth", appUrl);
    redirectUrl.searchParams.set("error", "steam_login_failed");

    return NextResponse.redirect(redirectUrl);
  }
}
