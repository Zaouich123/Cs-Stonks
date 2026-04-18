import { resolveSteamImage } from "@/lib/images/resolveSteamImage";
import type {
  CatalogProvider,
  RawCatalogProviderItem,
} from "@/modules/providers/provider.types";

interface ByMykelCatalogProviderOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  locale?: string;
}

interface ByMykelAssetCollection {
  name?: string | null;
}

interface ByMykelAssetRarity {
  name?: string | null;
}

interface ByMykelSkinWeapon {
  name?: string | null;
}

interface ByMykelAssetOriginal {
  image_inventory?: string | null;
}

interface ByMykelSkinRecord {
  category?: {
    name?: string | null;
  } | null;
  id: string;
  image?: string | null;
  market_hash_name?: string | null;
  name?: string | null;
  original?: ByMykelAssetOriginal | null;
  pattern?: {
    name?: string | null;
  } | null;
  phase?: {
    name?: string | null;
  } | null;
  rarity?: ByMykelAssetRarity | null;
  souvenir?: boolean | null;
  stattrak?: boolean | null;
  collections?: ByMykelAssetCollection[] | null;
  wear?: {
    name?: string | null;
  } | null;
  weapon?: ByMykelSkinWeapon | null;
}

interface ByMykelGenericRecord {
  id: string;
  image?: string | null;
  market_hash_name?: string | null;
  name?: string | null;
  original?: ByMykelAssetOriginal | null;
  rarity?: ByMykelAssetRarity | null;
  collections?: ByMykelAssetCollection[] | null;
}

const DEFAULT_BASE_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api";
const DEFAULT_LOCALE = "en";
const STEAM_APP_ID = 730;

function firstCollectionName(collections?: ByMykelAssetCollection[] | null): string | null {
  return collections?.find((collection) => Boolean(collection.name?.trim()))?.name?.trim() ?? null;
}

function trimOrNull(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCrateItemType(name: string): string {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("capsule")) {
    return "capsule";
  }

  return "case";
}

function normalizeSkinItemType(name: string, categoryName?: string | null): string {
  const normalizedName = name.toLowerCase();
  const normalizedCategoryName = trimOrNull(categoryName)?.toLowerCase() ?? "";

  if (
    normalizedCategoryName.includes("glove") ||
    normalizedCategoryName.includes("hand wrap") ||
    normalizedName.includes("gloves") ||
    normalizedName.includes("hand wraps")
  ) {
    return "glove";
  }

  if (normalizedName.startsWith("\u2605")) {
    return "knife";
  }

  return "skin";
}

function createCatalogItem(
  source: string,
  itemType: string,
  item: {
    baseItemName?: string | null;
    collection?: string | null;
    displayName?: string | null;
    exterior?: string | null;
    hasVariants?: boolean;
    id: string;
    image?: string | null;
    imageInventoryPath?: string | null;
    marketHashName?: string | null;
    phase?: string | null;
    rarity?: string | null;
    skinName?: string | null;
    souvenir?: boolean | null;
    stattrak?: boolean | null;
    weapon?: string | null;
  },
): RawCatalogProviderItem | null {
  const marketHashName = trimOrNull(item.marketHashName) ?? trimOrNull(item.displayName);

  if (!marketHashName) {
    return null;
  }

  const resolvedImage = resolveSteamImage({
    fallbackImageUrl: item.image,
    imageInventoryPath: item.imageInventoryPath,
  });

  return {
    baseItemName: trimOrNull(item.baseItemName),
    collection: trimOrNull(item.collection),
    displayName: trimOrNull(item.displayName) ?? marketHashName,
    exterior: trimOrNull(item.exterior),
    hasVariants: item.hasVariants ?? false,
    imageUrl: resolvedImage.imageUrl,
    itemType,
    lastCatalogSyncAt: new Date().toISOString(),
    marketHashName,
    phase: trimOrNull(item.phase),
    rarity: trimOrNull(item.rarity),
    skinName: trimOrNull(item.skinName),
    source,
    sourceExternalId: item.id,
    souvenir: item.souvenir ?? false,
    stattrak: item.stattrak ?? false,
    steamAppId: STEAM_APP_ID,
    steamImageUrl: resolvedImage.steamImageUrl,
    weapon: trimOrNull(item.weapon),
  };
}

export class ByMykelCatalogProvider implements CatalogProvider {
  readonly provider = "bymykel_catalog_provider";

  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly locale: string;

  constructor(options: ByMykelCatalogProviderOptions = {}) {
    this.baseUrl = options.baseUrl ?? process.env.BYMYKEL_API_BASE_URL ?? DEFAULT_BASE_URL;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.locale = options.locale ?? process.env.BYMYKEL_API_LOCALE ?? DEFAULT_LOCALE;
  }

  async fetchCatalog(): Promise<RawCatalogProviderItem[]> {
    const [
      skins,
      stickers,
      crates,
      agents,
      keychains,
      tools,
      musicKits,
      graffiti,
      patches,
    ] = await Promise.all([
      this.fetchJson<ByMykelSkinRecord[]>("skins_not_grouped.json"),
      this.fetchJson<ByMykelGenericRecord[]>("stickers.json"),
      this.fetchJson<ByMykelGenericRecord[]>("crates.json"),
      this.fetchJson<ByMykelGenericRecord[]>("agents.json"),
      this.fetchJson<ByMykelGenericRecord[]>("keychains.json"),
      this.fetchJson<ByMykelGenericRecord[]>("tools.json"),
      this.fetchJson<ByMykelGenericRecord[]>("music_kits.json"),
      this.fetchJson<ByMykelGenericRecord[]>("graffiti.json"),
      this.fetchJson<ByMykelGenericRecord[]>("patches.json"),
    ]);

    return [
      ...skins
        .map((item) =>
          createCatalogItem(
            "bymykel",
            normalizeSkinItemType(item.name ?? item.market_hash_name ?? "", item.category?.name),
            {
            baseItemName:
              trimOrNull(item.weapon?.name) && trimOrNull(item.pattern?.name)
                ? `${trimOrNull(item.weapon?.name)} | ${trimOrNull(item.pattern?.name)}`
                : trimOrNull(item.pattern?.name) ?? trimOrNull(item.name),
            collection: firstCollectionName(item.collections),
            displayName: item.market_hash_name ?? item.name,
            exterior: item.wear?.name ?? null,
            hasVariants: true,
            id: item.id,
            image: item.image,
            imageInventoryPath: item.original?.image_inventory ?? null,
            marketHashName: item.market_hash_name,
            phase: item.phase?.name ?? null,
            rarity: item.rarity?.name ?? null,
            skinName: item.pattern?.name ?? item.name ?? null,
            souvenir: item.souvenir,
            stattrak: item.stattrak,
            weapon: item.weapon?.name ?? null,
            },
          ),
        )
        .filter((item): item is RawCatalogProviderItem => item !== null),
      ...stickers
        .map((item) =>
          createCatalogItem("bymykel", "sticker", {
            collection: firstCollectionName(item.collections),
            displayName: item.name,
            id: item.id,
            image: item.image,
            imageInventoryPath: item.original?.image_inventory ?? null,
            marketHashName: item.market_hash_name ?? item.name,
            rarity: item.rarity?.name ?? null,
          }),
        )
        .filter((item): item is RawCatalogProviderItem => item !== null),
      ...crates
        .map((item) =>
          createCatalogItem("bymykel", normalizeCrateItemType(item.name ?? item.market_hash_name ?? ""), {
            displayName: item.name,
            id: item.id,
            image: item.image,
            imageInventoryPath: item.original?.image_inventory ?? null,
            marketHashName: item.market_hash_name ?? item.name,
            rarity: item.rarity?.name ?? null,
          }),
        )
        .filter((item): item is RawCatalogProviderItem => item !== null),
      ...agents
        .map((item) =>
          createCatalogItem("bymykel", "agent", {
            collection: firstCollectionName(item.collections),
            displayName: item.name,
            id: item.id,
            image: item.image,
            imageInventoryPath: item.original?.image_inventory ?? null,
            marketHashName: item.market_hash_name ?? item.name,
            rarity: item.rarity?.name ?? null,
          }),
        )
        .filter((item): item is RawCatalogProviderItem => item !== null),
      ...keychains
        .map((item) =>
          createCatalogItem("bymykel", "charm", {
            collection: firstCollectionName(item.collections),
            displayName: item.name,
            id: item.id,
            image: item.image,
            imageInventoryPath: item.original?.image_inventory ?? null,
            marketHashName: item.market_hash_name ?? item.name,
            rarity: item.rarity?.name ?? null,
          }),
        )
        .filter((item): item is RawCatalogProviderItem => item !== null),
      ...tools
        .map((item) =>
          createCatalogItem("bymykel", "tool", {
            displayName: item.name,
            id: item.id,
            image: item.image,
            imageInventoryPath: item.original?.image_inventory ?? null,
            marketHashName: item.market_hash_name ?? item.name,
            rarity: item.rarity?.name ?? null,
          }),
        )
        .filter((item): item is RawCatalogProviderItem => item !== null),
      ...musicKits
        .map((item) =>
          createCatalogItem("bymykel", "music_kit", {
            displayName: item.name,
            id: item.id,
            image: item.image,
            imageInventoryPath: item.original?.image_inventory ?? null,
            marketHashName: item.market_hash_name ?? item.name,
            rarity: item.rarity?.name ?? null,
          }),
        )
        .filter((item): item is RawCatalogProviderItem => item !== null),
      ...graffiti
        .map((item) =>
          createCatalogItem("bymykel", "graffiti", {
            displayName: item.name,
            id: item.id,
            image: item.image,
            imageInventoryPath: item.original?.image_inventory ?? null,
            marketHashName: item.market_hash_name ?? item.name,
            rarity: item.rarity?.name ?? null,
          }),
        )
        .filter((item): item is RawCatalogProviderItem => item !== null),
      ...patches
        .map((item) =>
          createCatalogItem("bymykel", "patch", {
            displayName: item.name,
            id: item.id,
            image: item.image,
            imageInventoryPath: item.original?.image_inventory ?? null,
            marketHashName: item.market_hash_name ?? item.name,
            rarity: item.rarity?.name ?? null,
          }),
        )
        .filter((item): item is RawCatalogProviderItem => item !== null),
    ];
  }

  private async fetchJson<T>(endpoint: string): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}/${this.locale}/${endpoint}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`ByMykel catalog request failed for ${endpoint} with status ${response.status}.`);
    }

    return (await response.json()) as T;
  }
}
