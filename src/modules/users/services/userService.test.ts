import { describe, expect, it, vi } from "vitest";

import { UserService } from "@/modules/users/services/userService";

function dbUser(overrides = {}) {
  return {
    createdAt: new Date("2026-05-01T10:00:00.000Z"),
    id: "user-1",
    lastLoginAt: new Date("2026-05-01T11:00:00.000Z"),
    phoneCountryCode: null,
    phoneNumber: null,
    phoneVerified: false,
    steamAvatar: "avatar",
    steamAvatarFull: "avatar-full",
    steamAvatarMedium: "avatar-medium",
    steamId: "steam-1",
    steamPersonaName: "Trader",
    steamProfileUrl: "https://steam.test/id/trader",
    tradeLink: null,
    updatedAt: new Date("2026-05-01T12:00:00.000Z"),
    ...overrides,
  };
}

describe("UserService", () => {
  it("upserts Steam users and writes audit metadata", async () => {
    const client = {
      user: {
        upsert: vi.fn().mockResolvedValue(dbUser()),
      },
      userProfileAudit: {
        create: vi.fn(),
      },
    };

    const result = await new UserService(client as never).upsertSteamUser({
      avatar: "avatar",
      avatarFull: "avatar-full",
      avatarMedium: "avatar-medium",
      personaName: "Trader",
      profileUrl: "https://steam.test/id/trader",
      steamId: "steam-1",
    });

    expect(result.id).toBe("user-1");
    expect(client.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          steamId: "steam-1",
          steamPersonaName: "Trader",
        }),
        update: expect.objectContaining({
          steamPersonaName: "Trader",
        }),
        where: {
          steamId: "steam-1",
        },
      }),
    );
    expect(client.userProfileAudit.create).toHaveBeenCalledWith({
      data: {
        action: "profile_synced",
        metadata: {
          steamId: "steam-1",
        },
        userId: "user-1",
      },
    });
  });

  it("returns public session users or null", async () => {
    const client = {
      user: {
        findUnique: vi.fn().mockResolvedValueOnce(dbUser()).mockResolvedValueOnce(null),
      },
    };
    const service = new UserService(client as never);

    await expect(service.getPublicUserById("user-1")).resolves.toMatchObject({
      createdAt: "2026-05-01T10:00:00.000Z",
      id: "user-1",
      steamId: "steam-1",
    });
    await expect(service.getPublicUserById("missing")).resolves.toBeNull();
  });

  it("updates profile settings and records which fields changed", async () => {
    const client = {
      user: {
        update: vi.fn().mockResolvedValue(
          dbUser({
            phoneCountryCode: "+33",
            phoneNumber: "612345678",
            tradeLink: "https://steamcommunity.com/tradeoffer/new/?partner=1&token=abc",
          }),
        ),
      },
      userProfileAudit: {
        create: vi.fn(),
      },
    };

    const result = await new UserService(client as never).updateProfile("user-1", {
      phoneCountryCode: "+33",
      phoneNumber: "612345678",
      tradeLink: "https://steamcommunity.com/tradeoffer/new/?partner=1&token=abc",
    });

    expect(result).toMatchObject({
      phoneCountryCode: "+33",
      phoneNumber: "612345678",
      phoneVerified: false,
    });
    expect(client.user.update).toHaveBeenCalledWith({
      data: {
        phoneCountryCode: "+33",
        phoneNumber: "612345678",
        phoneVerified: false,
        tradeLink: "https://steamcommunity.com/tradeoffer/new/?partner=1&token=abc",
      },
      where: {
        id: "user-1",
      },
    });
    expect(client.userProfileAudit.create).toHaveBeenCalledWith({
      data: {
        action: "profile_settings_updated",
        metadata: {
          phoneUpdated: true,
          tradeLinkUpdated: true,
        },
        userId: "user-1",
      },
    });
  });
});
