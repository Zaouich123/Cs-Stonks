import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SteamTradeOffersClient,
  isSteamApiKey,
  mapTradeOfferState,
  toSteamId64,
} from "@/modules/exchanges/steamTradeOffersClient";

function jsonResponse(payload: unknown, status = 200) {
  return {
    json: vi.fn().mockResolvedValue(payload),
    ok: status >= 200 && status < 300,
    status,
  } as unknown as Response;
}

describe("steamTradeOffersClient helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts only 32-character hexadecimal Steam API keys", () => {
    expect(isSteamApiKey("0123456789abcdef0123456789ABCDEF")).toBe(true);
    expect(isSteamApiKey("not-a-real-key")).toBe(false);
    expect(isSteamApiKey("0123456789abcdef0123456789ABCDEZ")).toBe(false);
  });

  it("converts account ids to SteamID64 without losing precision", () => {
    expect(toSteamId64("1")).toBe("76561197960265729");
    expect(toSteamId64("not-number")).toBeNull();
  });

  it("maps known Steam trade offer states", () => {
    expect(mapTradeOfferState(2)).toBe("Active");
    expect(mapTradeOfferState(9)).toBe("Needs confirmation");
    expect(mapTradeOfferState(999)).toBe("Unknown");
  });

  it("fetches trade offer summary counts", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        response: {
          escrow_received_count: 1,
          escrow_sent_count: 2,
          historical_received_count: 3,
          historical_sent_count: 4,
          new_received_count: 5,
          pending_received_count: 6,
          pending_sent_count: 7,
          updated_received_count: 8,
          updated_sent_count: 9,
        },
      }),
    );
    vi.stubGlobal("fetch", fetch);

    const summary = await new SteamTradeOffersClient().fetchSummary("0123456789abcdef0123456789abcdef");

    expect(summary).toEqual({
      escrowReceived: 1,
      escrowSent: 2,
      historicalReceived: 3,
      historicalSent: 4,
      newReceived: 5,
      pendingReceived: 6,
      pendingSent: 7,
      rawAvailable: true,
      updatedReceived: 8,
      updatedSent: 9,
    });
    const url = new URL(fetch.mock.calls[0][0] as string);
    expect(url.pathname).toBe("/IEconService/GetTradeOffersSummary/v1/");
    expect(url.searchParams.get("key")).toBe("0123456789abcdef0123456789abcdef");
    expect(fetch.mock.calls[0][1]).toMatchObject({
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
  });

  it("rejects invalid API keys before fetching", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    await expect(new SteamTradeOffersClient().fetchSummary("bad-key")).rejects.toMatchObject({
      message: "Invalid Steam Web API key format.",
      status: 400,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches a single offer and normalizes assets and partner ids", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          response: {
            descriptions: [
              {
                appid: "730",
                classid: "class-1",
                icon_url: "icon-path",
                instanceid: "0",
                market_hash_name: "AK-47 | Redline (Field-Tested)",
                market_name: "AK-47 | Redline",
                name: "Redline",
              },
            ],
            offer: {
              accountid_other: "1",
              expiration_time: "1770001000",
              is_our_offer: false,
              items_to_give: [
                {
                  amount: "2.9",
                  appid: "730",
                  assetid: "asset-1",
                  classid: "class-1",
                  instanceid: "0",
                },
              ],
              items_to_receive: [
                {
                  amount: "bad",
                  appid: "730",
                  assetid: "asset-2",
                  classid: "missing",
                  instanceid: "0",
                },
              ],
              message: "  hello  ",
              time_created: "1770000000",
              time_updated: 1770000500,
              trade_offer_state: "2",
              tradeofferid: "123456",
            },
          },
        }),
      ),
    );

    const offer = await new SteamTradeOffersClient().fetchOfferById({
      steamApiKey: "0123456789abcdef0123456789abcdef",
      tradeOfferId: "123456",
    });

    expect(offer).toMatchObject({
      createdAt: "2026-02-02T02:40:00.000Z",
      direction: "received",
      expiresAt: "2026-02-02T02:56:40.000Z",
      id: "123456",
      message: "hello",
      partnerAccountId: "1",
      partnerSteamId64: "76561197960265729",
      state: 2,
      stateLabel: "Active",
      updatedAt: "2026-02-02T02:48:20.000Z",
    });
    expect(offer.itemsToGive[0]).toMatchObject({
      amount: 2,
      iconUrl: "https://community.cloudflare.steamstatic.com/economy/image/icon-path",
      marketHashName: "AK-47 | Redline (Field-Tested)",
      name: "AK-47 | Redline (Field-Tested)",
    });
    expect(offer.itemsToReceive[0]).toMatchObject({
      amount: 1,
      marketHashName: null,
      name: "Unknown item",
    });
  });

  it("rejects invalid trade offer ids and missing Steam offers", async () => {
    const client = new SteamTradeOffersClient();

    await expect(
      client.fetchOfferById({
        steamApiKey: "0123456789abcdef0123456789abcdef",
        tradeOfferId: "abc",
      }),
    ).rejects.toMatchObject({
      message: "Trade offer ID must be numeric.",
      status: 400,
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ response: {} })));

    await expect(
      client.fetchOfferById({
        steamApiKey: "0123456789abcdef0123456789abcdef",
        tradeOfferId: "123456",
      }),
    ).rejects.toMatchObject({
      message: "Steam did not return this trade offer for the current Web API key.",
      status: 404,
    });
  });

  it("fetches received and sent offers with request flags", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        response: {
          descriptions: [
            {
              appid: 730,
              classid: "class-1",
              icon_url: "https://cdn.test/icon.png",
              instanceid: "0",
              name: "P250",
            },
          ],
          trade_offers_received: [
            {
              accountid_other: 1,
              items_to_give: [],
              items_to_receive: [{ appid: 730, assetid: "asset-1", classid: "class-1", instanceid: "0" }],
              trade_offer_state: 9,
              tradeofferid: "received-1",
            },
          ],
          trade_offers_sent: [
            {
              accountid_other: 2,
              items_to_give: [{ appid: 730, assetid: "asset-2", classid: "class-1", instanceid: "0" }],
              items_to_receive: [],
              trade_offer_state: 3,
              tradeofferid: "",
            },
            {
              accountid_other: 3,
              items_to_give: [],
              items_to_receive: [],
              trade_offer_state: 2,
              tradeofferid: "sent-1",
            },
          ],
        },
      }),
    );
    vi.stubGlobal("fetch", fetch);

    const offers = await new SteamTradeOffersClient().fetchOffers({
      activeOnly: true,
      getReceivedOffers: true,
      getSentOffers: true,
      steamApiKey: "0123456789abcdef0123456789abcdef",
    });

    expect(offers.map((offer) => [offer.id, offer.direction, offer.stateLabel])).toEqual([
      ["received-1", "received", "Needs confirmation"],
      ["sent-1", "sent", "Active"],
    ]);
    expect(offers[0].itemsToReceive[0].iconUrl).toBe("https://cdn.test/icon.png");
    const url = new URL(fetch.mock.calls[0][0] as string);
    expect(url.searchParams.get("active_only")).toBe("1");
    expect(url.searchParams.get("get_received_offers")).toBe("1");
    expect(url.searchParams.get("get_sent_offers")).toBe("1");
  });

  it("requires at least one offer direction and maps Steam HTTP failures", async () => {
    const client = new SteamTradeOffersClient();

    await expect(
      client.fetchOffers({
        activeOnly: false,
        getReceivedOffers: false,
        getSentOffers: false,
        steamApiKey: "0123456789abcdef0123456789abcdef",
      }),
    ).rejects.toMatchObject({
      message: "At least one offer direction must be selected.",
      status: 400,
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 403)));

    await expect(
      client.fetchOffers({
        activeOnly: false,
        getReceivedOffers: true,
        getSentOffers: false,
        steamApiKey: "0123456789abcdef0123456789abcdef",
      }),
    ).rejects.toMatchObject({
      message: "Steam refused the trade offers request.",
      status: 403,
    });
  });

  it("wraps network failures in an application error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(new SteamTradeOffersClient().fetchSummary("0123456789abcdef0123456789abcdef")).rejects.toMatchObject({
      message: "Unable to reach Steam trade offers right now.",
      status: 502,
    });
  });
});

