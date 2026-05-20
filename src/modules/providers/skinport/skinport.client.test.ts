import { describe, expect, it, vi } from "vitest";

import { SkinportClient } from "@/modules/providers/skinport/skinport.client";

function createResponse(body: unknown, init: Partial<Response> = {}) {
  return {
    headers: new Headers(init.headers),
    json: async () => body,
    ok: init.ok ?? true,
    status: init.status ?? 200,
  } as Response;
}

describe("skinport.client", () => {
  it("builds the /v1/items request with tradable and currency params", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => createResponse([]));
    const client = new SkinportClient(
      {
        appId: 730,
        baseUrl: "https://api.skinport.test/v1",
        chunkSize: 100,
        currency: "USD",
        fetchAllSalesHistory: true,
        fetchSalesHistory: true,
        requestTimeoutMs: 5000,
        tradableOnly: true,
      },
      fetchImpl,
    );

    await client.fetchItems();

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      "https://api.skinport.test/v1/items?app_id=730&currency=USD&tradable=1",
    );
  });

  it("turns an abort into a readable timeout error", async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
    );
    const client = new SkinportClient(
      {
        appId: 730,
        baseUrl: "https://api.skinport.test/v1",
        chunkSize: 100,
        currency: "USD",
        fetchAllSalesHistory: true,
        fetchSalesHistory: true,
        requestTimeoutMs: 5,
        tradableOnly: false,
      },
      fetchImpl,
    );

    await expect(client.fetchItems()).rejects.toThrow(
      "Skinport request timed out after 5ms for /items?app_id=730&currency=USD&tradable=0.",
    );
  });
});
