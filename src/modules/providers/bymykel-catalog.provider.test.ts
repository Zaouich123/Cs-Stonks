import { describe, expect, it, vi } from "vitest";

import { ByMykelCatalogProvider } from "@/modules/providers/bymykel-catalog.provider";

function createJsonResponse(data: unknown) {
  return {
    json: async () => data,
    ok: true,
    status: 200,
  } as Response;
}

describe("ByMykelCatalogProvider", () => {
  it("fetches and maps the supported catalog endpoints", async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.endsWith("/skins_not_grouped.json")) {
        return createJsonResponse([
          {
            category: { name: "Gloves" },
            collections: [{ name: "The Gloves Collection" }],
            id: "skin-1",
            image: "https://community.akamai.steamstatic.com/economy/image/glove",
            market_hash_name: "\u2605 Hand Wraps | Spruce DDPAT (Factory New)",
            name: "Spruce DDPAT",
            original: { image_inventory: "econ/default_generated/hand_wraps" },
            pattern: { name: "Spruce DDPAT" },
            rarity: { name: "Extraordinary" },
            stattrak: false,
            souvenir: false,
            wear: { name: "Factory New" },
            weapon: { name: "Hand Wraps" },
          },
        ]);
      }

      if (url.endsWith("/stickers.json")) {
        return createJsonResponse([
          {
            id: "sticker-1",
            image: "https://community.akamai.steamstatic.com/economy/image/sticker",
            market_hash_name: null,
            name: "Sticker | Test Sticker",
            original: { image_inventory: "econ/stickers/test" },
            rarity: { name: "High Grade" },
          },
        ]);
      }

      if (url.endsWith("/crates.json")) {
        return createJsonResponse([
          {
            id: "crate-1",
            image: "https://community.akamai.steamstatic.com/economy/image/capsule",
            market_hash_name: "DreamHack 2014 Legends Capsule",
            name: "DreamHack 2014 Legends Capsule",
            original: { image_inventory: "econ/cases/dreamhack" },
            rarity: { name: "Base Grade" },
          },
        ]);
      }

      if (url.endsWith("/agents.json")) {
        return createJsonResponse([
          {
            collections: [{ name: "Agents Collection" }],
            id: "agent-1",
            image: "https://community.akamai.steamstatic.com/economy/image/agent",
            market_hash_name: "Special Agent Ava",
            name: "Special Agent Ava",
            original: { image_inventory: "econ/agents/ava" },
            rarity: { name: "Superior" },
          },
        ]);
      }

      if (url.endsWith("/keychains.json")) {
        return createJsonResponse([
          {
            id: "keychain-1",
            image: "https://community.akamai.steamstatic.com/economy/image/charm",
            market_hash_name: "Charm | Lil' Ava",
            name: "Charm | Lil' Ava",
            original: { image_inventory: "econ/keychains/ava" },
            rarity: { name: "High Grade" },
          },
        ]);
      }

      if (url.endsWith("/tools.json")) {
        return createJsonResponse([
          {
            id: "tool-1",
            image: null,
            market_hash_name: "Name Tag",
            name: "Name Tag",
            original: { image_inventory: "econ/tools/tag" },
          },
        ]);
      }

      if (url.endsWith("/music_kits.json")) {
        return createJsonResponse([
          {
            id: "music-1",
            image: "https://cdn.steamstatic.com/apps/730/icons/econ/music_kits/test.png",
            market_hash_name: null,
            name: "Valve, Counter-Strike 2",
            original: { image_inventory: "econ/music_kits/test" },
            rarity: { name: "High Grade" },
          },
        ]);
      }

      if (url.endsWith("/graffiti.json")) {
        return createJsonResponse([
          {
            id: "graffiti-1",
            image: "https://community.akamai.steamstatic.com/economy/image/graffiti",
            market_hash_name: "Sealed Graffiti | Blood Boiler",
            name: "Sealed Graffiti | Blood Boiler",
            original: { image_inventory: "econ/graffiti/blood_boiler" },
            rarity: { name: "Exotic" },
          },
        ]);
      }

      if (url.endsWith("/patches.json")) {
        return createJsonResponse([
          {
            id: "patch-1",
            image: "https://community.akamai.steamstatic.com/economy/image/patch",
            market_hash_name: "Patch | Crazy Banana",
            name: "Patch | Crazy Banana",
            original: { image_inventory: "econ/patches/banana" },
            rarity: { name: "Remarkable" },
          },
        ]);
      }

      throw new Error(`Unexpected URL ${url}`);
    });

    const provider = new ByMykelCatalogProvider({
      baseUrl: "https://example.test/catalog",
      fetchImpl,
      locale: "en",
    });

    const items = await provider.fetchCatalog();

    expect(fetchImpl).toHaveBeenCalledTimes(9);
    expect(items).toHaveLength(9);
    expect(items.map((item) => item.itemType)).toEqual([
      "glove",
      "sticker",
      "capsule",
      "agent",
      "charm",
      "tool",
      "music_kit",
      "graffiti",
      "patch",
    ]);
    expect(items[0]).toMatchObject({
      baseItemName: "Hand Wraps | Spruce DDPAT",
      collection: "The Gloves Collection",
      exterior: "Factory New",
      hasVariants: true,
      itemType: "glove",
      marketHashName: "\u2605 Hand Wraps | Spruce DDPAT (Factory New)",
      source: "bymykel",
      sourceExternalId: "skin-1",
      steamAppId: 730,
    });
    expect(items[1]?.marketHashName).toBe("Sticker | Test Sticker");
    expect(items[5]?.steamImageUrl).toBe(
      "https://community.akamai.steamstatic.com/economy/image/econ%2Ftools%2Ftag",
    );
  });
});
