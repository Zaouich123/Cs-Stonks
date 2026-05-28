import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SessionService,
  getSessionMaxAgeSeconds,
  hashSessionToken,
} from "@/modules/auth/session/sessionService";

function dbUser() {
  return {
    createdAt: new Date("2026-05-01T10:00:00.000Z"),
    id: "user-1",
    lastLoginAt: null,
    phoneCountryCode: null,
    phoneNumber: null,
    phoneVerified: false,
    steamAvatar: null,
    steamAvatarFull: null,
    steamAvatarMedium: null,
    steamId: "steam-1",
    steamPersonaName: "Trader",
    steamProfileUrl: null,
    tradeLink: null,
    updatedAt: new Date("2026-05-01T10:00:00.000Z"),
  };
}

describe("SessionService", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("uses configured max age and hashes tokens with the configured secret", () => {
    vi.stubEnv("SESSION_MAX_AGE_DAYS", "2");
    vi.stubEnv("SESSION_SECRET", "secret");

    expect(getSessionMaxAgeSeconds()).toBe(172800);
    expect(hashSessionToken("token")).toHaveLength(64);
    expect(hashSessionToken("token")).toBe(hashSessionToken("token"));
    expect(hashSessionToken("token")).not.toBe(hashSessionToken("other"));
  });

  it("creates sessions with hashed tokens", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T10:00:00.000Z"));
    vi.stubEnv("SESSION_MAX_AGE_DAYS", "1");
    const client = {
      session: {
        create: vi.fn().mockResolvedValue({ id: "session-1" }),
      },
    };

    const session = await new SessionService(client as never).createSession("user-1");

    expect(session).toMatchObject({
      expiresAt: new Date("2026-05-02T10:00:00.000Z"),
      sessionId: "session-1",
    });
    expect(session.token).toEqual(expect.any(String));
    expect(client.session.create).toHaveBeenCalledWith({
      data: {
        expiresAt: new Date("2026-05-02T10:00:00.000Z"),
        sessionTokenHash: hashSessionToken(session.token),
        userId: "user-1",
      },
    });
  });

  it("returns active sessions and deletes expired sessions", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T10:00:00.000Z"));
    const client = {
      session: {
        delete: vi.fn(),
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({
            expiresAt: new Date("2026-05-01T11:00:00.000Z"),
            id: "session-1",
            user: dbUser(),
          })
          .mockResolvedValueOnce({
            expiresAt: new Date("2026-05-01T09:00:00.000Z"),
            id: "session-2",
            user: dbUser(),
          }),
      },
    };
    const service = new SessionService(client as never);

    await expect(service.getSessionByToken(null)).resolves.toBeNull();
    await expect(service.getSessionByToken("token")).resolves.toMatchObject({
      sessionId: "session-1",
      user: {
        id: "user-1",
        steamId: "steam-1",
      },
    });
    await expect(service.getSessionByToken("expired")).resolves.toBeNull();
    expect(client.session.delete).toHaveBeenCalledWith({
      where: {
        id: "session-2",
      },
    });
  });

  it("deletes sessions by token and ignores empty tokens", async () => {
    const client = {
      session: {
        deleteMany: vi.fn(),
      },
    };
    const service = new SessionService(client as never);

    await service.deleteSessionByToken(null);
    await service.deleteSessionByToken("token");

    expect(client.session.deleteMany).toHaveBeenCalledTimes(1);
    expect(client.session.deleteMany).toHaveBeenCalledWith({
      where: {
        sessionTokenHash: hashSessionToken("token"),
      },
    });
  });
});
