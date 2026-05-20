import { NextResponse } from "next/server";

import { SteamAuthService } from "@/modules/auth/steam/steamAuthService";

export function GET(request: Request) {
  const url = new SteamAuthService().getLoginUrl(request);

  return NextResponse.redirect(url);
}
