import { z } from "zod";

import { ApplicationError } from "@/lib/errors";
import type { SteamInventoryPayload } from "@/modules/inventory/inventory.types";

const DEFAULT_STEAM_COMMUNITY_BASE_URL = "https://steamcommunity.com";
const DEFAULT_PAGE_SIZE = 2000;
const DEFAULT_MAX_PAGES = 12;

const steamInventoryAssetSchema = z
  .object({
    amount: z.string().default("1"),
    appid: z.coerce.number(),
    assetid: z.string(),
    classid: z.string(),
    contextid: z.string().default("2"),
    instanceid: z.string().default("0"),
  })
  .passthrough();

const steamInventoryDescriptionLineSchema = z
  .object({
    color: z.string().optional(),
    type: z.string().optional(),
    value: z.string().optional(),
  })
  .passthrough();

const steamInventoryActionSchema = z
  .object({
    link: z.string().optional(),
    name: z.string().optional(),
  })
  .passthrough();

const steamInventoryTagSchema = z
  .object({
    category: z.string().optional(),
    color: z.string().optional(),
    internal_name: z.string().optional(),
    localized_category_name: z.string().optional(),
    localized_tag_name: z.string().optional(),
  })
  .passthrough();

const steamInventoryDescriptionSchema = z
  .object({
    actions: z.array(steamInventoryActionSchema).optional(),
    appid: z.coerce.number(),
    background_color: z.string().optional(),
    classid: z.string(),
    commodity: z.coerce.number().optional(),
    descriptions: z.array(steamInventoryDescriptionLineSchema).optional(),
    icon_url: z.string().optional(),
    icon_url_large: z.string().optional(),
    instanceid: z.string().default("0"),
    market_hash_name: z.string().optional(),
    market_name: z.string().optional(),
    marketable: z.coerce.number().optional(),
    name: z.string(),
    name_color: z.string().optional(),
    owner_actions: z.array(steamInventoryActionSchema).optional(),
    tags: z.array(steamInventoryTagSchema).optional(),
    tradable: z.coerce.number().optional(),
    type: z.string().optional(),
  })
  .passthrough();

const steamInventoryPayloadSchema = z
  .object({
    assets: z.array(steamInventoryAssetSchema).default([]),
    descriptions: z.array(steamInventoryDescriptionSchema).default([]),
    last_assetid: z.string().optional(),
    success: z.union([z.boolean(), z.number()]),
    total_inventory_count: z.coerce.number().optional(),
  })
  .passthrough();

export interface SteamInventoryClientConfig {
  baseUrl?: string;
  maxPages?: number;
  pageSize?: number;
}

type FetchLike = typeof fetch;

function isSuccessfulPayload(success: boolean | number) {
  return success === true || success === 1;
}

function buildInventoryUrl(baseUrl: string, steamId: string, count: number, startAssetId?: string) {
  const url = new URL(`/inventory/${steamId}/730/2`, baseUrl);
  url.searchParams.set("count", String(count));
  url.searchParams.set("l", "english");

  if (startAssetId) {
    url.searchParams.set("start_assetid", startAssetId);
  }

  return url;
}

export class SteamInventoryClient {
  private readonly baseUrl: string;

  private readonly maxPages: number;

  private readonly pageSize: number;

  constructor(
    config: SteamInventoryClientConfig = {},
    private readonly fetcher: FetchLike = fetch,
  ) {
    this.baseUrl = config.baseUrl ?? DEFAULT_STEAM_COMMUNITY_BASE_URL;
    this.maxPages = config.maxPages ?? DEFAULT_MAX_PAGES;
    this.pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE;
  }

  async getInventory(steamId: string): Promise<SteamInventoryPayload> {
    const assets = [];
    const descriptionsByKey = new Map<string, SteamInventoryPayload["descriptions"][number]>();
    let totalInventoryCount: number | undefined;
    let startAssetId: string | undefined;

    for (let page = 0; page < this.maxPages; page += 1) {
      const payload = await this.getInventoryPage(steamId, startAssetId);

      totalInventoryCount = payload.total_inventory_count ?? totalInventoryCount;
      assets.push(...payload.assets);

      for (const description of payload.descriptions) {
        descriptionsByKey.set(`${description.classid}:${description.instanceid}`, description);
      }

      if (payload.assets.length === 0) {
        break;
      }

      if (totalInventoryCount !== undefined && assets.length >= totalInventoryCount) {
        break;
      }

      const lastAsset = payload.assets.at(-1);
      if (!lastAsset || lastAsset.assetid === startAssetId) {
        break;
      }

      startAssetId = lastAsset.assetid;
    }

    return {
      assets,
      descriptions: [...descriptionsByKey.values()],
      success: true,
      total_inventory_count: totalInventoryCount ?? assets.length,
    };
  }

  private async getInventoryPage(steamId: string, startAssetId?: string) {
    const response = await this.fetcher(
      buildInventoryUrl(this.baseUrl, steamId, this.pageSize, startAssetId),
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (response.status === 403) {
      throw new ApplicationError(
        "Steam inventory is private or unavailable. Make the CS2 inventory public to display it here.",
        403,
      );
    }

    if (response.status === 429) {
      throw new ApplicationError(
        "Steam is rate-limiting inventory requests. Wait a few minutes before forcing a new sync.",
        429,
      );
    }

    if (!response.ok) {
      throw new ApplicationError(`Steam inventory request failed with status ${response.status}.`, 502);
    }

    const parsed = steamInventoryPayloadSchema.parse(await response.json());

    if (!isSuccessfulPayload(parsed.success)) {
      throw new ApplicationError("Steam inventory request did not return a successful payload.", 502);
    }

    return parsed;
  }
}
