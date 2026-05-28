import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearSessionCookie,
  getSessionCookieName,
  getSessionCookieOptions,
  setSessionCookie,
} from "@/modules/auth/session/sessionCookie";

describe("sessionCookie helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the configured cookie name or the default", () => {
    expect(getSessionCookieName()).toBe("cs_stonks_session");

    vi.stubEnv("SESSION_COOKIE_NAME", " custom_session ");

    expect(getSessionCookieName()).toBe("custom_session");
  });

  it("builds secure cookie options from environment and expiration", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_MAX_AGE_DAYS", "2");
    const expiresAt = new Date("2026-05-01T10:00:00.000Z");

    expect(getSessionCookieOptions()).toMatchObject({
      httpOnly: true,
      maxAge: 172800,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
    expect(getSessionCookieOptions(expiresAt)).toMatchObject({
      expires: expiresAt,
      httpOnly: true,
      maxAge: undefined,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("sets and clears the session cookie on responses", () => {
    vi.stubEnv("SESSION_COOKIE_NAME", "session_name");
    const response = {
      cookies: {
        set: vi.fn(),
      },
    };
    const expiresAt = new Date("2026-05-01T10:00:00.000Z");

    setSessionCookie(response as never, "token", expiresAt);
    clearSessionCookie(response as never);

    expect(response.cookies.set).toHaveBeenNthCalledWith(
      1,
      "session_name",
      "token",
      expect.objectContaining({
        expires: expiresAt,
        httpOnly: true,
      }),
    );
    expect(response.cookies.set).toHaveBeenNthCalledWith(
      2,
      "session_name",
      "",
      expect.objectContaining({
        expires: new Date(0),
        maxAge: 0,
      }),
    );
  });
});
