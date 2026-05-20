import { z } from "zod";

import { ApplicationError } from "@/lib/errors";
import type { SteamProfile } from "@/modules/auth/types/auth.types";

const DEFAULT_STEAM_WEB_API_BASE_URL = "https://api.steampowered.com";

const steamPlayerSchema = z.object({
  avatar: z.string().url().nullable().optional(),
  avatarfull: z.string().url().nullable().optional(),
  avatarmedium: z.string().url().nullable().optional(),
  personaname: z.string().min(1),
  profileurl: z.string().url().nullable().optional(),
  steamid: z.string().min(1),
});

const steamPlayerSummariesSchema = z.object({
  response: z.object({
    players: z.array(steamPlayerSchema),
  }),
});

export interface SteamProfileClientConfig {
  apiKey: string;
  baseUrl: string;
}

export function getSteamProfileClientConfig(): SteamProfileClientConfig {
  return {
    apiKey: process.env.STEAM_WEB_API_KEY?.trim() || "",
    baseUrl: process.env.STEAM_WEB_API_BASE_URL?.trim() || DEFAULT_STEAM_WEB_API_BASE_URL,
  };
}

export class SteamProfileClient {
  constructor(
    private readonly config: SteamProfileClientConfig = getSteamProfileClientConfig(),
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async getPlayerSummary(steamId: string): Promise<SteamProfile> {
    if (!this.config.apiKey) {
      throw new ApplicationError("STEAM_WEB_API_KEY is missing.", 500);
    }

    const url = new URL("/ISteamUser/GetPlayerSummaries/v0002/", this.config.baseUrl);
    url.searchParams.set("key", this.config.apiKey);
    url.searchParams.set("steamids", steamId);
    url.searchParams.set("format", "json");

    const response = await this.fetchImpl(url);

    if (!response.ok) {
      throw new ApplicationError("Steam profile API request failed.", 502, {
        status: response.status,
      });
    }

    const payload = steamPlayerSummariesSchema.parse(await response.json());
    const player = payload.response.players[0];

    if (!player) {
      throw new ApplicationError("Steam profile was not found.", 404, { steamId });
    }

    return {
      avatar: player.avatar ?? null,
      avatarFull: player.avatarfull ?? null,
      avatarMedium: player.avatarmedium ?? null,
      personaName: player.personaname,
      profileUrl: player.profileurl ?? null,
      steamId: player.steamid,
    };
  }
}
