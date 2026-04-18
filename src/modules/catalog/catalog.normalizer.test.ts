import { ItemType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  buildItemVariantKey,
  normalizeCatalogItem,
} from "@/modules/catalog/catalog.normalizer";

describe("catalog.normalizer", () => {
  it("builds a stable variant key with phase when needed", () => {
    expect(buildItemVariantKey("Karambit | Doppler (Factory New)", "Phase 2")).toBe(
      "Karambit | Doppler (Factory New)::Phase 2",
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
    expect(normalized.stattrak).toBe(true);
    expect(normalized.variantKey).toBe("StatTrak AK-47 | Redline (Field-Tested)");
  });
});
