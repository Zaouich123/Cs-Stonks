import { describe, expect, it, vi } from "vitest";

import { SteamProfileClient } from "@/modules/auth/steam/steamProfileClient";

describe("steamProfileClient", () => {
  it("maps Steam GetPlayerSummaries response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        response: {
          players: [
            {
              avatar: "https://cdn.steam/avatar.jpg",
              avatarfull: "https://cdn.steam/avatar_full.jpg",
              avatarmedium: "https://cdn.steam/avatar_medium.jpg",
              personaname: "PlayerName",
              profileurl: "https://steamcommunity.com/id/example/",
              steamid: "76561198000000000",
            },
          ],
        },
      }),
    );
    const client = new SteamProfileClient(
      {
        apiKey: "steam-key",
        baseUrl: "https://api.steampowered.com",
      },
      fetcher,
    );

    await expect(client.getPlayerSummary("76561198000000000")).resolves.toEqual({
      avatar: "https://cdn.steam/avatar.jpg",
      avatarFull: "https://cdn.steam/avatar_full.jpg",
      avatarMedium: "https://cdn.steam/avatar_medium.jpg",
      personaName: "PlayerName",
      profileUrl: "https://steamcommunity.com/id/example/",
      steamId: "76561198000000000",
    });
  });

  it("rejects an empty Steam profile response", async () => {
    const client = new SteamProfileClient(
      {
        apiKey: "steam-key",
        baseUrl: "https://api.steampowered.com",
      },
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json({
          response: {
            players: [],
          },
        }),
      ),
    );

    await expect(client.getPlayerSummary("missing")).rejects.toMatchObject({
      status: 404,
    });
  });
});
