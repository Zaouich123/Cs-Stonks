import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifySteamOpenIdCallback: vi.fn(),
}));

vi.mock("@/modules/auth/steam/steamOpenIdVerifier", () => ({
  verifySteamOpenIdCallback: mocks.verifySteamOpenIdCallback,
}));

import { SteamAuthService } from "@/modules/auth/steam/steamAuthService";

describe("SteamAuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("builds a Steam OpenID login URL from the request origin", () => {
    vi.stubEnv("APP_URL", "");
    const url = new SteamAuthService({} as never, {} as never, {} as never).getLoginUrl(
      new Request("https://app.test/login"),
    );

    expect(url.toString()).toContain("https://steamcommunity.com/openid/login");
    expect(url.searchParams.get("openid.return_to")).toBe("https://app.test/api/auth/steam/callback");
  });

  it("verifies callback params, syncs the Steam user, and creates a session", async () => {
    mocks.verifySteamOpenIdCallback.mockResolvedValue({ steamId: "steam-1" });
    const profile = {
      avatar: "avatar",
      avatarFull: "avatar-full",
      avatarMedium: "avatar-medium",
      personaName: "Trader",
      profileUrl: "https://steam.test/id/trader",
      steamId: "steam-1",
    };
    const user = { id: "user-1", steamId: "steam-1" };
    const session = { sessionId: "session-1", token: "token" };
    const profileClient = {
      getPlayerSummary: vi.fn().mockResolvedValue(profile),
    };
    const userService = {
      upsertSteamUser: vi.fn().mockResolvedValue(user),
    };
    const sessionService = {
      createSession: vi.fn().mockResolvedValue(session),
    };

    const result = await new SteamAuthService(
      profileClient as never,
      userService as never,
      sessionService as never,
    ).completeLogin(new Request("https://app.test/api/auth/steam/callback?openid.mode=id_res"));

    expect(mocks.verifySteamOpenIdCallback).toHaveBeenCalledWith(
      new URL("https://app.test/api/auth/steam/callback?openid.mode=id_res").searchParams,
    );
    expect(profileClient.getPlayerSummary).toHaveBeenCalledWith("steam-1");
    expect(userService.upsertSteamUser).toHaveBeenCalledWith(profile);
    expect(sessionService.createSession).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({ session, user });
  });
});
