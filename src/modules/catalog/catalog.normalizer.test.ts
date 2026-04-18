import { ItemType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  buildItemSlug,
  buildItemVariantKey,
  normalizeCatalogItem,
} from "@/modules/catalog/catalog.normalizer";

describe("catalog.normalizer", () => {
  it("builds a stable variant key with phase when needed", () => {
    expect(buildItemVariantKey("Karambit | Doppler (Factory New)", "Phase 2")).toBe(
      "Karambit | Doppler (Factory New)::Phase 2",
    );
    expect(buildItemSlug("Karambit | Doppler (Factory New)", "Phase 2")).toBe(
      "karambit-doppler-factory-new-phase-2",
    );
  });

  it("normalizes a sellable item variant with inferred flags", () => {
    const normalized = normalizeCatalogItem({
      baseItemName: "AK-47 | Redline",
      hasVariants: true,
      itemType: "skin",
      lastCatalogSyncAt: "2026-04-18T17:00:00.000Z",
      marketHashName: "StatTrak AK-47 | Redline (Field-Tested)",
      skinName: "Redline",
      source: "bymykel",
      sourceExternalId: "skin-123",
      weapon: "AK-47",
    });

    expect(normalized.itemType).toBe(ItemType.SKIN);
    expect(normalized.baseItemName).toBe("AK-47 | Redline");
    expect(normalized.exterior).toBe("Field-Tested");
    expect(normalized.hasVariants).toBe(true);
    expect(normalized.lastCatalogSyncAt.toISOString()).toBe("2026-04-18T17:00:00.000Z");
    expect(normalized.searchText).toContain("ak 47");
    expect(normalized.slug).toBe("stattrak-ak-47-redline-field-tested");
    expect(normalized.source).toBe("bymykel");
    expect(normalized.sourceExternalId).toBe("skin-123");
    expect(normalized.stattrak).toBe(true);
    expect(normalized.steamAppId).toBe(730);
    expect(normalized.variantKey).toBe("StatTrak AK-47 | Redline (Field-Tested)");
  });

  it("maps extended catalog types and falls back to a derived base name", () => {
    const normalized = normalizeCatalogItem({
      itemType: "music_kit",
      marketHashName: "Music Kit | Test Artist, Test Album",
      source: "bymykel",
    });

    expect(normalized.itemType).toBe(ItemType.MUSIC_KIT);
    expect(normalized.baseItemName).toBeNull();
    expect(normalized.hasVariants).toBe(false);
  });
});
