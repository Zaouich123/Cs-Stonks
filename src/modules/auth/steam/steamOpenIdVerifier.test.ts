import { describe, expect, it, vi } from "vitest";

import { verifySteamOpenIdCallback } from "@/modules/auth/steam/steamOpenIdVerifier";

function buildValidParams() {
  return new URLSearchParams({
    "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000000",
    "openid.identity": "https://steamcommunity.com/openid/id/76561198000000000",
    "openid.mode": "id_res",
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.return_to": "http://localhost:3000/api/auth/steam/callback",
  });
}

describe("steamOpenIdVerifier", () => {
  it("accepts a valid Steam check_authentication response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("ns:http://specs.openid.net/auth/2.0\nis_valid:true\n", {
        status: 200,
      }),
    );

    const verified = await verifySteamOpenIdCallback(buildValidParams(), fetcher);

    expect(verified.steamId).toBe("76561198000000000");
    expect(fetcher).toHaveBeenCalledWith(
      "https://steamcommunity.com/openid/login",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("rejects an invalid Steam response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("is_valid:false\n", {
        status: 200,
      }),
    );

    await expect(verifySteamOpenIdCallback(buildValidParams(), fetcher)).rejects.toMatchObject({
      status: 401,
    });
  });
});
