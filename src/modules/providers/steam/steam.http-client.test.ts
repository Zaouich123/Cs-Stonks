import { describe, expect, it, vi } from "vitest";

import {
  SteamHttpClient,
  SteamHttpClientError,
} from "@/modules/providers/steam/steam.http-client";

describe("steam.http-client", () => {
  it("retries once on retryable HTTP errors before succeeding", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("server error", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            lowest_price: "$46.93 USD",
            success: true,
            volume: "123",
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 200,
          },
        ),
      );
    const client = new SteamHttpClient(
      {
        appId: 730,
        baseUrl: "https://steamcommunity.com/market/",
        country: "US",
        currencyCode: 1,
        retryCount: 1,
        timeoutMs: 100,
      },
      fetcher,
    );

    const overview = await client.getPriceOverview("AK-47 | Redline (Field-Tested)");

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(overview.lowest_price).toBe("$46.93 USD");
  });

  it("throws a typed invalid-json error on malformed payloads", async () => {
    const client = new SteamHttpClient(
      {
        appId: 730,
        baseUrl: "https://steamcommunity.com/market/",
        country: "US",
        currencyCode: 1,
        retryCount: 0,
        timeoutMs: 100,
      },
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response("not-json", {
          headers: {
            "Content-Type": "application/json",
          },
          status: 200,
        }),
      ),
    );

    await expect(client.getPriceOverview("AK-47 | Redline (Field-Tested)")).rejects.toMatchObject({
      code: "INVALID_JSON",
    } satisfies Partial<SteamHttpClientError>);
  });

  it("turns aborted network requests into timeout errors", async () => {
    const fetcher = vi.fn<typeof fetch>((_input, init) => {
      const signal = init?.signal;

      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener("abort", () => {
          const error = new Error("Aborted");
          error.name = "AbortError";
          reject(error);
        });
      });
    });
    const client = new SteamHttpClient(
      {
        appId: 730,
        baseUrl: "https://steamcommunity.com/market/",
        country: "US",
        currencyCode: 1,
        retryCount: 0,
        timeoutMs: 10,
      },
      fetcher,
    );

    await expect(client.getPriceOverview("AK-47 | Redline (Field-Tested)")).rejects.toMatchObject({
      code: "TIMEOUT",
    } satisfies Partial<SteamHttpClientError>);
  });
});
