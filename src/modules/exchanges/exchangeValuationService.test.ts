import { describe, expect, it, vi } from "vitest";

import { ExchangeValuationService } from "@/modules/exchanges/exchangeValuationService";
import type { SteamTradeOffer, SteamTradeOfferAsset } from "@/modules/exchanges/exchange.types";

function money(value: number) {
  return {
    toNumber: () => value,
  };
}

function manualRecord(id: string, displayName: string) {
  return {
    baseItemName: displayName,
    displayName,
    id,
    imageUrl: null,
    marketHashName: displayName,
    steamAppId: 730,
    steamImageUrl: "steam-image",
  };
}

function latestPrice(itemId: string, marketHashName: string, price: number, currency = "EUR") {
  return {
    displayName: marketHashName,
    id: itemId,
    latestPrices: [
      {
        currency,
        fetchedAt: new Date("2026-05-01T12:00:00.000Z"),
        market: {
          name: currency === "EUR" ? "Skinport" : "Steam",
          slug: currency === "EUR" ? "skinport" : "steam",
        },
        price: money(price),
      },
    ],
    marketHashName,
  };
}

function asset(marketHashName: string, amount = 1): SteamTradeOfferAsset {
  return {
    amount,
    appId: 730,
    assetId: `${marketHashName}-asset`,
    classId: "class",
    iconUrl: null,
    instanceId: "0",
    marketHashName,
    marketName: marketHashName,
    name: marketHashName,
  };
}

describe("ExchangeValuationService", () => {
  it("values manual offers and marks profitable exchanges", async () => {
    const database = {
      item: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([manualRecord("give-1", "P250 | Constructivist (Field-Tested)")])
          .mockResolvedValueOnce([manualRecord("receive-1", "AK-47 | Redline (Field-Tested)")])
          .mockResolvedValueOnce([
            latestPrice("give-1", "P250 | Constructivist (Field-Tested)", 5),
            latestPrice("receive-1", "AK-47 | Redline (Field-Tested)", 4, "USD"),
          ]),
      },
    };

    const result = await new ExchangeValuationService(database as never).analyzeManualOffer({
      itemsToGive: [{ amount: 1, itemId: "give-1" }],
      itemsToReceive: [{ amount: 2, itemId: "receive-1" }],
    });

    expect(database.item.findMany).toHaveBeenCalledTimes(3);
    expect(result.summary).toMatchObject({
      totalGiven: 5,
      totalReceived: 7.36,
      unpricedItems: 0,
      verdict: "profitable",
    });
    expect(result.summary.netValue).toBeCloseTo(2.36);
    expect(result.offer.itemsToReceive[0]).toMatchObject({
      amount: 2,
      sourceCurrency: "USD",
      unitPrice: 3.68,
    });
  });

  it("marks manual offers incomplete when a selected item has no active price", async () => {
    const database = {
      item: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([manualRecord("give-1", "P250 | Constructivist (Field-Tested)")])
          .mockResolvedValueOnce([manualRecord("receive-1", "AK-47 | Redline (Field-Tested)")])
          .mockResolvedValueOnce([latestPrice("give-1", "P250 | Constructivist (Field-Tested)", 5)]),
      },
    };

    const result = await new ExchangeValuationService(database as never).analyzeManualOffer({
      itemsToGive: [{ amount: 1, itemId: "give-1" }],
      itemsToReceive: [{ amount: 1, itemId: "receive-1" }],
    });

    expect(result.summary).toEqual({
      netValue: null,
      totalGiven: 5,
      totalReceived: null,
      unpricedItems: 1,
      verdict: "incomplete",
    });
    expect(result.offer.itemsToReceive[0]).toMatchObject({
      itemId: "receive-1",
      sourcePrice: null,
      totalValue: null,
    });
  });

  it("fetches and summarizes active Steam offers when no offer id is provided", async () => {
    const receivedOffer: SteamTradeOffer = {
      createdAt: "2026-05-01T10:00:00.000Z",
      direction: "received",
      expiresAt: null,
      id: "offer-1",
      itemsToGive: [asset("P250 | Constructivist (Field-Tested)")],
      itemsToReceive: [asset("AK-47 | Redline (Field-Tested)")],
      message: null,
      partnerAccountId: "123",
      partnerSteamId64: "76561198000000000",
      state: 2,
      stateLabel: "Active",
      updatedAt: null,
    };
    const sentOffer: SteamTradeOffer = {
      ...receivedOffer,
      direction: "sent",
      id: "offer-2",
      itemsToGive: [asset("AK-47 | Redline (Field-Tested)")],
      itemsToReceive: [asset("P250 | Constructivist (Field-Tested)")],
    };
    const steamSummary = {
      escrowReceived: 0,
      escrowSent: 0,
      historicalReceived: 0,
      historicalSent: 0,
      newReceived: 1,
      pendingReceived: 1,
      pendingSent: 1,
      rawAvailable: true,
      updatedReceived: 0,
      updatedSent: 0,
    };
    const steamClient = {
      fetchOfferById: vi.fn(),
      fetchOffers: vi.fn().mockResolvedValue([receivedOffer, sentOffer]),
      fetchSummary: vi.fn().mockResolvedValue(steamSummary),
    };
    const database = {
      item: {
        findMany: vi.fn().mockResolvedValue([
          latestPrice("give-1", "P250 | Constructivist (Field-Tested)", 2),
          latestPrice("receive-1", "AK-47 | Redline (Field-Tested)", 5),
        ]),
      },
    };

    const result = await new ExchangeValuationService(database as never, steamClient as never).analyzeSteamOffers({
      activeOnly: true,
      getReceivedOffers: true,
      getSentOffers: true,
      steamApiKey: "0123456789abcdef0123456789abcdef",
    });

    expect(steamClient.fetchSummary).toHaveBeenCalledWith("0123456789abcdef0123456789abcdef");
    expect(steamClient.fetchOfferById).not.toHaveBeenCalled();
    expect(steamClient.fetchOffers).toHaveBeenCalledWith({
      activeOnly: true,
      getReceivedOffers: true,
      getSentOffers: true,
      steamApiKey: "0123456789abcdef0123456789abcdef",
    });
    expect(result.steamSummary).toEqual(steamSummary);
    expect(result.summary).toMatchObject({
      profitable: 1,
      received: 1,
      risky: 1,
      sent: 1,
      totalOffers: 2,
    });
    expect(result.offers[0]).toMatchObject({
      netValue: 3,
      pricedItems: 2,
      totalGiven: 2,
      totalReceived: 5,
      verdict: "profitable",
    });
    expect(result.security.apiKeyStored).toBe(false);
  });

  it("fetches a single Steam offer by id and reports incomplete empty offers", async () => {
    const singleOffer: SteamTradeOffer = {
      createdAt: null,
      direction: "received",
      expiresAt: null,
      id: "123456",
      itemsToGive: [],
      itemsToReceive: [],
      message: "single",
      partnerAccountId: null,
      partnerSteamId64: null,
      state: 2,
      stateLabel: "Active",
      updatedAt: null,
    };
    const steamClient = {
      fetchOfferById: vi.fn().mockResolvedValue(singleOffer),
      fetchOffers: vi.fn(),
      fetchSummary: vi.fn().mockResolvedValue({
        escrowReceived: 0,
        escrowSent: 0,
        historicalReceived: 0,
        historicalSent: 0,
        newReceived: 0,
        pendingReceived: 0,
        pendingSent: 0,
        rawAvailable: false,
        updatedReceived: 0,
        updatedSent: 0,
      }),
    };
    const database = {
      item: {
        findMany: vi.fn(),
      },
    };

    const result = await new ExchangeValuationService(database as never, steamClient as never).analyzeSteamOffers({
      activeOnly: false,
      getReceivedOffers: true,
      getSentOffers: false,
      steamApiKey: "0123456789abcdef0123456789abcdef",
      tradeOfferId: "123456",
    });

    expect(steamClient.fetchOfferById).toHaveBeenCalledWith({
      steamApiKey: "0123456789abcdef0123456789abcdef",
      tradeOfferId: "123456",
    });
    expect(steamClient.fetchOffers).not.toHaveBeenCalled();
    expect(database.item.findMany).not.toHaveBeenCalled();
    expect(result.offers[0]).toMatchObject({
      netValue: null,
      pricedItems: 0,
      totalGiven: null,
      totalReceived: null,
      unpricedItems: 0,
      verdict: "incomplete",
    });
    expect(result.summary.incomplete).toBe(1);
  });
});
