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
      itemType: "skin",
      marketHashName: "StatTrak AK-47 | Redline (Field-Tested)",
      skinName: "Redline",
      weapon: "AK-47",
    });

    expect(normalized.itemType).toBe(ItemType.SKIN);
    expect(normalized.exterior).toBe("Field-Tested");
    expect(normalized.searchText).toContain("ak 47");
    expect(normalized.slug).toBe("stattrak-ak-47-redline-field-tested");
    expect(normalized.stattrak).toBe(true);
    expect(normalized.variantKey).toBe("StatTrak AK-47 | Redline (Field-Tested)");
  });
});
