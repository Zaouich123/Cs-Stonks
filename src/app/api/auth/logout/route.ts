import { NextResponse } from "next/server";

import {
  clearSessionCookie,
  readSessionTokenFromCookies,
} from "@/modules/auth/session/sessionCookie";
import { SessionService } from "@/modules/auth/session/sessionService";

export async function POST() {
  const token = await readSessionTokenFromCookies();
  await new SessionService().deleteSessionByToken(token);

  const response = NextResponse.json({
    ok: true,
    data: {
      loggedOut: true,
    },
  });

  clearSessionCookie(response);

  return response;
}
