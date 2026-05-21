import { describe, expect, it, vi } from "vitest";

import { CsfloatClient, CsfloatClientError } from "@/modules/providers/csfloat/csfloat.client";

function createResponse(body: unknown, init: Partial<Response> = {}) {
  return {
    headers: new Headers(init.headers),
    json: async () => body,
    ok: init.ok ?? true,
    status: init.status ?? 200,
  } as Response;
}

describe("csfloat.client", () => {
  it("builds the /listings URL with cursor, limit, market hash name, and Authorization", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      createResponse({
        cursor: "next-cursor",
        listings: [],
      }),
    );
    const client = new CsfloatClient(
      {
        apiKey: "test-key",
        backoffMs: 1,
        baseUrl: "https://csfloat.test/api/v1",
        currency: "USD",
        limit: 50,
        maxRetries: 0,
        requestTimeoutMs: 5000,
      },
      fetchImpl,
    );

    await client.getListings({
      cursor: "cursor-1",
      limit: 500,
      marketHashName: "AK-47 | Redline (Field-Tested)",
      sortBy: "lowest_price",
      type: "buy_now",
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [input, init] = fetchImpl.mock.calls[0] ?? [];
    const url = new URL(String(input));

    expect(`${url.origin}${url.pathname}`).toBe("https://csfloat.test/api/v1/listings");
    expect(url.searchParams.get("cursor")).toBe("cursor-1");
    expect(url.searchParams.get("limit")).toBe("50");
    expect(url.searchParams.get("market_hash_name")).toBe("AK-47 | Redline (Field-Tested)");
    expect(url.searchParams.get("sort_by")).toBe("lowest_price");
    expect(url.searchParams.get("type")).toBe("buy_now");
    expect((init?.headers as Record<string, string>).Authorization).toBe("test-key");
  });

  it("backs off once on 429 then returns the next response", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createResponse(
          {},
          {
            headers: new Headers({ "Retry-After": "0" }),
            ok: false,
            status: 429,
          },
        ),
      )
      .mockResolvedValueOnce(
        createResponse({
          data: [],
          next_cursor: null,
        }),
      );
    const client = new CsfloatClient(
      {
        apiKey: "test-key",
        backoffMs: 1,
        baseUrl: "https://csfloat.test/api/v1",
        currency: "USD",
        limit: 50,
        maxRetries: 1,
        requestTimeoutMs: 5000,
      },
      fetchImpl,
    );

    await expect(client.getListings()).resolves.toEqual({
      cursor: null,
      listings: [],
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fetches the aggregated price-list endpoint", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      createResponse([
        {
          market_hash_name: "AK-47 | Redline (Field-Tested)",
          min_price: 1250,
          quantity: 12,
        },
      ]),
    );
    const client = new CsfloatClient(
      {
        apiKey: "test-key",
        backoffMs: 1,
        baseUrl: "https://csfloat.test/api/v1",
        currency: "USD",
        limit: 50,
        maxRetries: 0,
        requestTimeoutMs: 5000,
      },
      fetchImpl,
    );

    await expect(client.getPriceList()).resolves.toEqual([
      {
        market_hash_name: "AK-47 | Redline (Field-Tested)",
        min_price: 1250,
        quantity: 12,
      },
    ]);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      "https://csfloat.test/api/v1/listings/price-list",
    );
  });

  it("fails fast when the API key is missing", async () => {
    const client = new CsfloatClient({
      apiKey: "",
      backoffMs: 1,
      baseUrl: "https://csfloat.test/api/v1",
      currency: "USD",
      limit: 50,
      maxRetries: 0,
      requestTimeoutMs: 5000,
    });

    await expect(client.getListings()).rejects.toThrow(CsfloatClientError);
    await expect(client.getListings()).rejects.toThrow("CSFLOAT_API_KEY is required");
  });
});
