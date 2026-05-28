import { ItemType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getItemById: vi.fn(),
  getItemHistory: vi.fn(),
  getLatestPricesByItem: vi.fn(),
  listItems: vi.fn(),
}));

vi.mock("@/modules/bootstrap", () => ({
  createItemQueryService: vi.fn(() => mocks),
}));

import {
  handleGetItemHistoryRoute,
  handleGetItemLatestPricesRoute,
  handleGetItemRoute,
  handleListItemsRoute,
} from "@/modules/api/item-handlers";

async function json(response: Response) {
  return response.json();
}

function params(itemId: string) {
  return {
    params: Promise.resolve({ itemId }),
  };
}

describe("item API handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists items with parsed query params", async () => {
    mocks.listItems.mockResolvedValue({ items: [], pagination: { total: 0 } });

    const response = await handleListItemsRoute(
      new Request("https://app.test/api/items?query=redline&limit=10&page=2&sort=createdAt_desc&itemType=SKIN"),
    );

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toEqual({
      data: { items: [], pagination: { total: 0 } },
      ok: true,
    });
    expect(mocks.listItems).toHaveBeenCalledWith({
      itemType: ItemType.SKIN,
      limit: 10,
      page: 2,
      query: "redline",
      sort: "createdAt_desc",
    });
  });

  it("returns validation errors for invalid list item params", async () => {
    const response = await handleListItemsRoute(new Request("https://app.test/api/items?limit=1000"));

    expect(response.status).toBe(400);
    await expect(json(response)).resolves.toMatchObject({
      error: {
        message: "Request payload validation failed.",
      },
      ok: false,
    });
    expect(mocks.listItems).not.toHaveBeenCalled();
  });

  it("gets a single item by route param", async () => {
    mocks.getItemById.mockResolvedValue({ id: "item-1" });

    const response = await handleGetItemRoute(new Request("https://app.test/api/items/item-1"), params(" item-1 "));

    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toEqual({
      data: { id: "item-1" },
      ok: true,
    });
    expect(mocks.getItemById).toHaveBeenCalledWith("item-1");
  });

  it("gets latest item prices with a parsed sort", async () => {
    mocks.getLatestPricesByItem.mockResolvedValue([{ marketSlug: "steam" }]);

    const response = await handleGetItemLatestPricesRoute(
      new Request("https://app.test/api/items/item-1/prices?sort=price_asc"),
      params("item-1"),
    );

    expect(response.status).toBe(200);
    expect(mocks.getLatestPricesByItem).toHaveBeenCalledWith({
      itemId: "item-1",
      sort: "price_asc",
    });
  });

  it("gets item history with date and market filters", async () => {
    mocks.getItemHistory.mockResolvedValue([{ price: 1 }]);

    const response = await handleGetItemHistoryRoute(
      new Request(
        "https://app.test/api/items/item-1/history?from=2026-05-01T00%3A00%3A00.000Z&to=2026-05-02T00%3A00%3A00.000Z&market=steam&sort=desc",
      ),
      params("item-1"),
    );

    expect(response.status).toBe(200);
    expect(mocks.getItemHistory).toHaveBeenCalledWith({
      from: new Date("2026-05-01T00:00:00.000Z"),
      itemId: "item-1",
      market: "steam",
      sort: "desc",
      to: new Date("2026-05-02T00:00:00.000Z"),
    });
  });
});
