import type {
  InventoryItem,
  SteamInventoryAsset,
  SteamInventoryDescription,
  SteamInventoryPayload,
  SteamInventoryTag,
} from "@/modules/inventory/inventory.types";

const STEAM_CDN_BASE_URL = "https://community.fastly.steamstatic.com/economy/image/";

const WEAR_RANGES: Record<string, [number, number]> = {
  "Battle-Scarred": [0.45, 1],
  "Factory New": [0, 0.07],
  "Field-Tested": [0.15, 0.38],
  "Minimal Wear": [0.07, 0.15],
  "Well-Worn": [0.38, 0.45],
};

const WEAR_LABELS = Object.keys(WEAR_RANGES);

function descriptionKey(input: Pick<SteamInventoryAsset, "classid" | "instanceid">) {
  return `${input.classid}:${input.instanceid}`;
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(tags: SteamInventoryTag[] | undefined, category: string) {
  return tags?.find((tag) => tag.category === category || tag.localized_category_name === category)
    ?.localized_tag_name;
}

function getExterior(marketHashName: string, tags: SteamInventoryTag[] | undefined) {
  const taggedExterior = getTag(tags, "Exterior");

  if (taggedExterior) {
    return taggedExterior;
  }

  return WEAR_LABELS.find((label) => marketHashName.includes(`(${label})`)) ?? null;
}

function hashToUnit(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

export function estimateWearValue(seed: string, exterior: string | null) {
  if (!exterior || !WEAR_RANGES[exterior]) {
    return null;
  }

  const [min, max] = WEAR_RANGES[exterior];
  const padding = exterior === "Battle-Scarred" ? 0.02 : 0.004;
  const safeMin = min + padding;
  const safeMax = max - padding;
  const value = safeMin + (safeMax - safeMin) * hashToUnit(seed);

  return Math.min(max, Math.max(min, value));
}

function getImageUrl(description: SteamInventoryDescription) {
  const icon = description.icon_url_large || description.icon_url;

  return icon ? `${STEAM_CDN_BASE_URL}${icon}/360fx360f` : null;
}

function getInspectLink(
  description: SteamInventoryDescription,
  asset: SteamInventoryAsset,
  steamId: string,
) {
  const actions = [...(description.actions ?? []), ...(description.owner_actions ?? [])];
  const inspectAction = actions.find((action) => action.link?.includes("steam://rungame/730"));

  if (!inspectAction?.link) {
    return null;
  }

  return inspectAction.link
    .replace(/%owner_steamid%/g, steamId)
    .replace(/%assetid%/g, asset.assetid)
    .replace(/%contextid%/g, asset.contextid);
}

function getDescriptionTags(description: SteamInventoryDescription) {
  return (description.tags ?? [])
    .map((tag) => tag.localized_tag_name)
    .filter((tag): tag is string => Boolean(tag));
}

function getStickerTags(description: SteamInventoryDescription) {
  return (description.descriptions ?? [])
    .map((line) => stripHtml(line.value ?? ""))
    .filter((line) => line.startsWith("Sticker:"))
    .flatMap((line) =>
      line
        .replace(/^Sticker:\s*/i, "")
        .split(",")
        .map((sticker) => sticker.trim())
        .filter(Boolean),
    );
}

export function mapSteamInventoryPayload(
  payload: SteamInventoryPayload,
  steamId: string,
): InventoryItem[] {
  const descriptions = new Map(payload.descriptions.map((description) => [descriptionKey(description), description]));

  return payload.assets
    .map((asset): InventoryItem | null => {
      const description = descriptions.get(descriptionKey(asset));

      if (!description) {
        return null;
      }

      const marketHashName = description.market_hash_name || description.market_name || description.name;
      const exterior = getExterior(marketHashName, description.tags);
      const estimatedWear = estimateWearValue(`${marketHashName}:${asset.assetid}`, exterior);
      const tags = [...getDescriptionTags(description), ...getStickerTags(description)];

      return {
        amount: Number(asset.amount) || 1,
        assetId: asset.assetid,
        classId: asset.classid,
        displayName: marketHashName,
        exterior,
        imageUrl: getImageUrl(description),
        inspectLink: getInspectLink(description, asset, steamId),
        instanceId: asset.instanceid,
        itemId: null,
        itemType: getTag(description.tags, "Type") ?? getTag(description.tags, "Weapon") ?? null,
        marketHashName,
        marketable: description.marketable === 1,
        prices: [],
        rarity: getTag(description.tags, "Rarity") ?? null,
        referenceCurrency: null,
        referencePrice: null,
        slug: null,
        tags,
        tradable: description.tradable === 1,
        type: description.type ?? null,
        wear: {
          label: exterior,
          source: estimatedWear === null ? "unknown" : "estimated",
          value: estimatedWear,
        },
      };
    })
    .filter((item): item is InventoryItem => item !== null);
}
