import { cookies } from "next/headers";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { NextResponse } from "next/server";

import { SessionService, getSessionMaxAgeSeconds } from "@/modules/auth/session/sessionService";

export function getSessionCookieName() {
  return process.env.SESSION_COOKIE_NAME?.trim() || "cs_stonks_session";
}

export function getSessionCookieOptions(expiresAt?: Date): Partial<ResponseCookie> {
  return {
    expires: expiresAt,
    httpOnly: true,
    maxAge: expiresAt ? undefined : getSessionMaxAgeSeconds(),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

export async function readSessionTokenFromCookies() {
  const cookieStore = await cookies();

  return cookieStore.get(getSessionCookieName())?.value ?? null;
}

export async function getCurrentSession() {
  const token = await readSessionTokenFromCookies();

  return new SessionService().getSessionByToken(token);
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions(expiresAt));
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(getSessionCookieName(), "", {
    ...getSessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
}
