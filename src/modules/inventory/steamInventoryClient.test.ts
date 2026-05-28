import { describe, expect, it, vi } from "vitest";

import { ApplicationError } from "@/lib/errors";
import { SteamInventoryClient } from "@/modules/inventory/steamInventoryClient";

function jsonResponse(payload: unknown, status = 200) {
  return {
    json: vi.fn().mockResolvedValue(payload),
    ok: status >= 200 && status < 300,
    status,
  } as unknown as Response;
}

describe("SteamInventoryClient", () => {
  it("paginates Steam inventory responses and deduplicates descriptions", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          assets: [
            {
              amount: "1",
              appid: "730",
              assetid: "asset-1",
              classid: "class-1",
              contextid: "2",
              instanceid: "0",
            },
            {
              amount: "1",
              appid: 730,
              assetid: "asset-2",
              classid: "class-2",
              contextid: "2",
              instanceid: "0",
            },
          ],
          descriptions: [
            {
              appid: "730",
              classid: "class-1",
              instanceid: "0",
              market_hash_name: "AK-47 | Redline (Field-Tested)",
              name: "AK-47 | Redline",
            },
          ],
          success: 1,
          total_inventory_count: "3",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          assets: [
            {
              amount: "1",
              appid: 730,
              assetid: "asset-3",
              classid: "class-1",
              contextid: "2",
              instanceid: "0",
            },
          ],
          descriptions: [
            {
              appid: 730,
              classid: "class-1",
              instanceid: "0",
              market_hash_name: "AK-47 | Redline (Field-Tested)",
              name: "AK-47 | Redline updated",
            },
          ],
          success: true,
          total_inventory_count: 3,
        }),
      );

    const client = new SteamInventoryClient(
      {
        baseUrl: "https://steam.test",
        pageSize: 2,
      },
      fetcher,
    );

    const inventory = await client.getInventory("76561198000000000");

    expect(inventory.assets.map((asset) => asset.assetid)).toEqual(["asset-1", "asset-2", "asset-3"]);
    expect(inventory.descriptions).toHaveLength(1);
    expect(inventory.descriptions[0].name).toBe("AK-47 | Redline updated");
    expect(inventory.total_inventory_count).toBe(3);

    expect(fetcher).toHaveBeenCalledTimes(2);
    const firstUrl = fetcher.mock.calls[0][0] as URL;
    const secondUrl = fetcher.mock.calls[1][0] as URL;

    expect(firstUrl.toString()).toBe("https://steam.test/inventory/76561198000000000/730/2?count=2&l=english");
    expect(secondUrl.searchParams.get("start_assetid")).toBe("asset-2");
    expect(fetcher.mock.calls[0][1]).toEqual({
      headers: {
        Accept: "application/json",
      },
    });
  });

  it("stops when Steam returns an empty page", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        assets: [],
        descriptions: [],
        success: true,
      }),
    );
    const client = new SteamInventoryClient({ baseUrl: "https://steam.test", maxPages: 5 }, fetcher);

    const inventory = await client.getInventory("steam-id");

    expect(inventory.assets).toEqual([]);
    expect(inventory.descriptions).toEqual([]);
    expect(inventory.total_inventory_count).toBe(0);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("maps Steam private inventory responses to an application error", async () => {
    const client = new SteamInventoryClient({}, vi.fn().mockResolvedValue(jsonResponse({}, 403)));

    await expect(client.getInventory("steam-id")).rejects.toMatchObject({
      message: expect.stringContaining("private"),
      status: 403,
    } satisfies Partial<ApplicationError>);
  });

  it("maps Steam rate limits to an application error", async () => {
    const client = new SteamInventoryClient({}, vi.fn().mockResolvedValue(jsonResponse({}, 429)));

    await expect(client.getInventory("steam-id")).rejects.toMatchObject({
      message: expect.stringContaining("rate-limiting"),
      status: 429,
    } satisfies Partial<ApplicationError>);
  });

  it("rejects unsuccessful Steam payloads", async () => {
    const client = new SteamInventoryClient(
      {},
      vi.fn().mockResolvedValue(
        jsonResponse({
          assets: [],
          descriptions: [],
          success: false,
        }),
      ),
    );

    await expect(client.getInventory("steam-id")).rejects.toMatchObject({
      message: "Steam inventory request did not return a successful payload.",
      status: 502,
    } satisfies Partial<ApplicationError>);
  });
});
