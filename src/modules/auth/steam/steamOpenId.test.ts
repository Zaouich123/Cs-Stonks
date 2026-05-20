import { describe, expect, it } from "vitest";

import { buildSteamOpenIdLoginUrl } from "@/modules/auth/steam/steamOpenId";
import { extractSteamIdFromClaimedId } from "@/modules/auth/steam/steamOpenIdVerifier";

describe("steam OpenID helpers", () => {
  it("builds a Steam OpenID login URL with the expected parameters", () => {
    const url = buildSteamOpenIdLoginUrl("http://localhost:3000");

    expect(url.origin + url.pathname).toBe("https://steamcommunity.com/openid/login");
    expect(url.searchParams.get("openid.ns")).toBe("http://specs.openid.net/auth/2.0");
    expect(url.searchParams.get("openid.mode")).toBe("checkid_setup");
    expect(url.searchParams.get("openid.return_to")).toBe(
      "http://localhost:3000/api/auth/steam/callback",
    );
    expect(url.searchParams.get("openid.realm")).toBe("http://localhost:3000");
    expect(url.searchParams.get("openid.identity")).toBe(
      "http://specs.openid.net/auth/2.0/identifier_select",
    );
    expect(url.searchParams.get("openid.claimed_id")).toBe(
      "http://specs.openid.net/auth/2.0/identifier_select",
    );
  });

  it("extracts the SteamID from a claimed id", () => {
    expect(
      extractSteamIdFromClaimedId("https://steamcommunity.com/openid/id/76561198000000000"),
    ).toBe("76561198000000000");
  });
});
