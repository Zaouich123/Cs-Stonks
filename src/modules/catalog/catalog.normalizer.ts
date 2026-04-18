import { ItemType } from "@prisma/client";
import { z } from "zod";

import type { NormalizedCatalogItem } from "@/modules/catalog/catalog.types";
import type { RawCatalogProviderItem } from "@/modules/providers/provider.types";

const catalogItemSchema = z.object({
  collection: z.string().trim().min(1).nullable().optional(),
  displayName: z.string().trim().min(1).nullable().optional(),
  exterior: z.string().trim().min(1).nullable().optional(),
  imageUrl: z.string().trim().url().nullable().optional(),
  itemType: z.string().trim().min(1),
  marketHashName: z.string().trim().min(1),
  phase: z.string().trim().min(1).nullable().optional(),
  rarity: z.string().trim().min(1).nullable().optional(),
  skinName: z.string().trim().min(1).nullable().optional(),
  souvenir: z.boolean().nullable().optional(),
  stattrak: z.boolean().nullable().optional(),
  steamImageUrl: z.string().trim().url().nullable().optional(),
  weapon: z.string().trim().min(1).nullable().optional(),
});

const itemTypeMap: Record<string, ItemType> = {
  agent: ItemType.AGENT,
  capsule: ItemType.CAPSULE,
  case: ItemType.CASE,
  charm: ItemType.CHARM,
  glove: ItemType.GLOVE,
  knife: ItemType.KNIFE,
  other: ItemType.OTHER,
  skin: ItemType.SKIN,
  sticker: ItemType.STICKER,
};

const exteriorPattern = /\(([^)]+)\)\s*$/;

function asNullableString(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function inferExterior(marketHashName: string, exterior?: string | null): string | null {
  const normalizedExterior = asNullableString(exterior);

  if (normalizedExterior) {
    return normalizedExterior;
  }

  const match = marketHashName.match(exteriorPattern);

  return match?.[1] ?? null;
}

function resolveItemType(itemType: string): ItemType {
  const normalizedType = itemType.trim().toLowerCase();
  const resolvedType = itemTypeMap[normalizedType];

  if (!resolvedType) {
    throw new Error(`Unsupported item type "${itemType}".`);
  }

  return resolvedType;
}

export function buildItemVariantKey(marketHashName: string, phase?: string | null): string {
  const normalizedPhase = asNullableString(phase);

  return normalizedPhase ? `${marketHashName.trim()}::${normalizedPhase}` : marketHashName.trim();
}

export function normalizeCatalogItem(rawItem: RawCatalogProviderItem): NormalizedCatalogItem {
  const item = catalogItemSchema.parse(rawItem);
  const marketHashName = item.marketHashName.trim();
  const phase = asNullableString(item.phase);

  return {
    collection: asNullableString(item.collection),
    displayName: asNullableString(item.displayName) ?? marketHashName,
    exterior: inferExterior(marketHashName, item.exterior),
    imageUrl: asNullableString(item.imageUrl),
    isActive: true,
    itemType: resolveItemType(item.itemType),
    marketHashName,
    phase,
    rarity: asNullableString(item.rarity),
    skinName: asNullableString(item.skinName),
    souvenir: item.souvenir ?? marketHashName.includes("Souvenir"),
    stattrak: item.stattrak ?? marketHashName.includes("StatTrak"),
    steamImageUrl: asNullableString(item.steamImageUrl),
    variantKey: buildItemVariantKey(marketHashName, phase),
    weapon: asNullableString(item.weapon),
  };
}

