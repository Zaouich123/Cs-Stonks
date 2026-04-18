import type {
  RawCatalogProviderItem,
  RawPriceProviderItem,
} from "@/modules/providers/provider.types";

export const mockCatalogFixture: RawCatalogProviderItem[] = [
  {
    collection: "Operation Phoenix Weapon Case",
    displayName: "AK-47 | Redline (Field-Tested)",
    exterior: "Field-Tested",
    imageUrl: "https://example.com/items/ak-redline.png",
    itemType: "skin",
    marketHashName: "AK-47 | Redline (Field-Tested)",
    rarity: "Classified",
    skinName: "Redline",
    steamImageUrl: "https://steamcdn.example.com/ak-redline.png",
    weapon: "AK-47",
  },
  {
    collection: "Katowice 2014",
    displayName: "Sticker | Titan (Holo) | Katowice 2014",
    imageUrl: "https://example.com/items/titan-holo.png",
    itemType: "sticker",
    marketHashName: "Sticker | Titan (Holo) | Katowice 2014",
    rarity: "Exotic",
    steamImageUrl: "https://steamcdn.example.com/titan-holo.png",
  },
  {
    displayName: "Operation Phoenix Weapon Case",
    imageUrl: "https://example.com/items/phoenix-case.png",
    itemType: "case",
    marketHashName: "Operation Phoenix Weapon Case",
    rarity: "Base Grade",
    steamImageUrl: "https://steamcdn.example.com/phoenix-case.png",
  },
];

export const mockPriceFixture: RawPriceProviderItem[] = [
  {
    currency: "USD",
    fetchedAt: "2026-04-18T10:00:00.000Z",
    market: {
      name: "Steam Community Market",
      priority: 100,
      slug: "steam",
    },
    marketHashName: "AK-47 | Redline (Field-Tested)",
    price: 25.4,
    quantity: 132,
    sourceUpdatedAt: "2026-04-18T09:58:00.000Z",
    volume: 91,
  },
  {
    currency: "USD",
    fetchedAt: "2026-04-18T10:01:00.000Z",
    market: {
      name: "Skinport",
      priority: 80,
      slug: "skinport",
    },
    marketHashName: "AK-47 | Redline (Field-Tested)",
    price: 24.95,
    quantity: 11,
    sourceUpdatedAt: "2026-04-18T09:57:00.000Z",
    volume: 8,
  },
  {
    currency: "USD",
    fetchedAt: "2026-04-18T10:02:00.000Z",
    market: {
      name: "Steam Community Market",
      priority: 100,
      slug: "steam",
    },
    marketHashName: "Sticker | Titan (Holo) | Katowice 2014",
    price: 78500,
    quantity: 2,
    sourceUpdatedAt: "2026-04-18T09:30:00.000Z",
    volume: null,
  },
];

