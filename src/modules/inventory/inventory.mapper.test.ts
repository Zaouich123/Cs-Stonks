import { describe, expect, it } from "vitest";

import {
  estimateWearValue,
  mapSteamInventoryPayload,
} from "@/modules/inventory/inventory.mapper";
import type { SteamInventoryPayload } from "@/modules/inventory/inventory.types";

describe("inventory.mapper", () => {
  it("estimates deterministic wear values inside the exterior range", () => {
    const first = estimateWearValue("AK-47 | Redline (Field-Tested):asset-1", "Field-Tested");
    const second = estimateWearValue("AK-47 | Redline (Field-Tested):asset-1", "Field-Tested");

    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(0.15);
    expect(first).toBeLessThanOrEqual(0.38);
    expect(estimateWearValue("unknown", null)).toBeNull();
    expect(estimateWearValue("unknown", "Collector New")).toBeNull();
  });

  it("maps Steam inventory assets into normalized inventory items", () => {
    const payload: SteamInventoryPayload = {
      assets: [
        {
          amount: "2",
          appid: 730,
          assetid: "asset-1",
          classid: "class-1",
          contextid: "2",
          instanceid: "instance-1",
        },
        {
          amount: "0",
          appid: 730,
          assetid: "asset-2",
          classid: "missing-class",
          contextid: "2",
          instanceid: "missing-instance",
        },
      ],
      descriptions: [
        {
          actions: [
            {
              link:
                "steam://rungame/730/%owner_steamid%/+csgo_econ_action_preview%20S%owner_steamid%A%assetid%D%contextid%",
            },
          ],
          appid: 730,
          classid: "class-1",
          descriptions: [
            {
              value: "Sticker: Crown &amp; Foil, &quot;Lucky&quot;<br>Other line",
            },
          ],
          icon_url: "small-icon",
          icon_url_large: "large-icon",
          instanceid: "instance-1",
          market_hash_name: "AK-47 | Redline (Field-Tested)",
          marketable: 1,
          name: "AK-47 | Redline",
          tags: [
            {
              category: "Exterior",
              localized_tag_name: "Minimal Wear",
            },
            {
              category: "Type",
              localized_tag_name: "Rifle",
            },
            {
              category: "Rarity",
              localized_tag_name: "Classified",
            },
          ],
          tradable: 1,
          type: "Rifle",
        },
      ],
      success: true,
    };

    const items = mapSteamInventoryPayload(payload, "76561198000000000");

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      amount: 2,
      assetId: "asset-1",
      classId: "class-1",
      displayName: "AK-47 | Redline (Field-Tested)",
      exterior: "Minimal Wear",
      imageUrl: "https://community.fastly.steamstatic.com/economy/image/large-icon/360fx360f",
      instanceId: "instance-1",
      itemType: "Rifle",
      marketHashName: "AK-47 | Redline (Field-Tested)",
      marketable: true,
      rarity: "Classified",
      tags: ["Minimal Wear", "Rifle", "Classified", "Crown & Foil", '"Lucky" Other line'],
      tradable: true,
      type: "Rifle",
    });
    expect(items[0].inspectLink).toContain("S76561198000000000Aasset-1D2");
    expect(items[0].wear.source).toBe("estimated");
    expect(items[0].wear.value).toBeGreaterThanOrEqual(0.07);
    expect(items[0].wear.value).toBeLessThanOrEqual(0.15);
  });

  it("falls back to market name/name and unknown metadata when optional fields are absent", () => {
    const payload: SteamInventoryPayload = {
      assets: [
        {
          amount: "not-a-number",
          appid: 730,
          assetid: "asset-1",
          classid: "class-1",
          contextid: "2",
          instanceid: "instance-1",
        },
      ],
      descriptions: [
        {
          appid: 730,
          classid: "class-1",
          icon_url: "icon",
          instanceid: "instance-1",
          market_name: "Sticker | Example",
          name: "Sticker | Example",
          tradable: 0,
        },
      ],
      success: 1,
    };

    const [item] = mapSteamInventoryPayload(payload, "steam-id");

    expect(item).toMatchObject({
      amount: 1,
      exterior: null,
      inspectLink: null,
      itemType: null,
      marketHashName: "Sticker | Example",
      marketable: false,
      rarity: null,
      tags: [],
      tradable: false,
      wear: {
        label: null,
        source: "unknown",
        value: null,
      },
    });
  });
});
