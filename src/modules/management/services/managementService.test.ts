import {
  DashboardWidgetSize,
  DashboardWidgetType,
  MarketplaceListingStatus,
  UserNotificationSeverity,
  UserNotificationType,
  UserTradeStatus,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApplicationError } from "@/lib/errors";
import { ManagementService } from "@/modules/management/services/managementService";

vi.mock("@/modules/management/services/cs2NewsService", () => ({
  getLatestCs2News: vi.fn().mockResolvedValue([
    {
      date: "2026-05-01",
      details: [],
      feedLabel: "CS2",
      fullText: "Patch notes",
      href: "https://steam.test/news",
      summary: "Patch notes",
      title: "CS2 update",
    },
  ]),
}));

function money(value: number) {
  return {
    toNumber: () => value,
  };
}

function itemSummary(overrides = {}) {
  return {
    displayName: "AK-47 | Redline (Field-Tested)",
    id: "item-1",
    imageUrl: "image",
    marketHashName: "AK-47 | Redline (Field-Tested)",
    steamImageUrl: "steam-image",
    ...overrides,
  };
}

function createClient() {
  return {
    $transaction: vi.fn(async (operations) => Promise.all(operations)),
    item: {
      findFirst: vi.fn(),
    },
    userDashboardWidget: {
      findMany: vi.fn(),
      upsert: vi.fn((operation) => Promise.resolve(operation)),
    },
    userInventorySnapshot: {
      findMany: vi.fn(),
    },
    userMarketplaceListing: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    userNotification: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    userTrade: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    userTrackedSkin: {
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  };
}

describe("ManagementService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default widgets merged with saved widget settings", async () => {
    const client = createClient();
    client.userDashboardWidget.findMany.mockResolvedValue([
      {
        config: { compact: true },
        enabled: false,
        id: "widget-1",
        position: 0,
        size: DashboardWidgetSize.SMALL,
        widgetType: DashboardWidgetType.INVENTORY_VALUE,
      },
    ]);

    const widgets = await new ManagementService(client as never).getWidgets("user-1");

    expect(widgets[0]).toMatchObject({
      config: { compact: true },
      enabled: false,
      id: "widget-1",
      label: "Inventory value",
      position: 0,
      size: DashboardWidgetSize.SMALL,
      widgetType: DashboardWidgetType.INVENTORY_VALUE,
    });
    expect(widgets).toHaveLength(6);
  });

  it("upserts patched widgets through a transaction", async () => {
    const client = createClient();
    client.userDashboardWidget.findMany.mockResolvedValue([]);
    const service = new ManagementService(client as never);

    await service.updateWidgets("user-1", {
      widgets: [
        {
          config: { limit: 3 },
          enabled: true,
          position: 2,
          size: DashboardWidgetSize.WIDE,
          widgetType: DashboardWidgetType.CS2_UPDATE,
        },
      ],
    });

    expect(client.userDashboardWidget.upsert).toHaveBeenCalledWith({
      create: {
        config: { limit: 3 },
        enabled: true,
        position: 2,
        size: DashboardWidgetSize.WIDE,
        userId: "user-1",
        widgetType: DashboardWidgetType.CS2_UPDATE,
      },
      update: {
        config: { limit: 3 },
        enabled: true,
        position: 2,
        size: DashboardWidgetSize.WIDE,
      },
      where: {
        userId_widgetType: {
          userId: "user-1",
          widgetType: DashboardWidgetType.CS2_UPDATE,
        },
      },
    });
    expect(client.$transaction).toHaveBeenCalledTimes(1);
  });

  it("maps tracked skins with price, stock, and chart data", async () => {
    const client = createClient();
    client.userTrackedSkin.findMany.mockResolvedValue([
      {
        alertAbovePrice: money(50),
        alertBelowPrice: null,
        createdAt: new Date("2026-05-01T10:00:00.000Z"),
        id: "tracked-1",
        item: {
          ...itemSummary(),
          dailySnapshots: [
            {
              marketId: "steam",
              price: money(10),
              quantity: 2,
              snapshotDate: new Date("2026-04-30T00:00:00.000Z"),
            },
            {
              marketId: "skinport",
              price: money(14),
              quantity: 3,
              snapshotDate: new Date("2026-04-30T12:00:00.000Z"),
            },
            {
              marketId: "steam",
              price: money(16),
              quantity: null,
              snapshotDate: new Date("2026-05-01T00:00:00.000Z"),
            },
          ],
          latestPrices: [
            {
              currency: "EUR",
              fetchedAt: new Date("2026-05-01T09:00:00.000Z"),
              market: {
                name: "Skinport",
                slug: "skinport",
              },
              price: money(12),
              quantity: 5,
            },
            {
              currency: "EUR",
              fetchedAt: new Date("2026-05-01T09:05:00.000Z"),
              market: {
                name: "Steam",
                slug: "steam",
              },
              price: money(13),
              quantity: 7,
            },
          ],
        },
        label: "Main watch",
        targetPrice: money(30),
      },
    ]);

    const tracked = await new ManagementService(client as never).listTrackedSkins("user-1");

    expect(tracked[0]).toMatchObject({
      alertAbovePrice: 50,
      alertBelowPrice: null,
      currentStock: 12,
      id: "tracked-1",
      label: "Main watch",
      latestPrice: {
        marketSlug: "skinport",
        price: 12,
        quantity: 5,
      },
      targetPrice: 30,
    });
    expect(tracked[0].chartData).toEqual([
      { date: "2026-04-30", price: 12 },
      { date: "2026-05-01", price: 16 },
    ]);
    expect(tracked[0].stockChartData).toEqual([{ date: "2026-04-30", quantity: 5 }]);
  });

  it("creates and deletes tracked skins, with not-found errors", async () => {
    const client = createClient();
    client.item.findFirst.mockResolvedValueOnce({ id: "item-1" }).mockResolvedValueOnce(null);
    client.userTrackedSkin.findMany.mockResolvedValue([]);
    client.userTrackedSkin.deleteMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const service = new ManagementService(client as never);

    await expect(
      service.createTrackedSkin("user-1", {
        alertBelowPrice: 12,
        itemId: "item-1",
        label: "Watch",
      }),
    ).resolves.toEqual([]);
    expect(client.userTrackedSkin.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          alertBelowPrice: 12,
          itemId: "item-1",
          label: "Watch",
          userId: "user-1",
        }),
      }),
    );

    await expect(service.createTrackedSkin("user-1", { itemId: "missing" })).rejects.toBeInstanceOf(
      ApplicationError,
    );
    await expect(service.deleteTrackedSkin("user-1", "tracked-1")).resolves.toEqual({ deleted: true });
    await expect(service.deleteTrackedSkin("user-1", "missing")).rejects.toMatchObject({
      message: "Tracked skin not found.",
      status: 404,
    });
  });

  it("maps inventory value history with deltas", async () => {
    const client = createClient();
    client.userInventorySnapshot.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-04-30T10:00:00.000Z"),
        currency: "EUR",
        itemCount: 2,
        source: "steam_inventory",
        totalValue: money(100),
      },
      {
        createdAt: new Date("2026-05-01T10:00:00.000Z"),
        currency: "EUR",
        itemCount: 3,
        source: "steam_inventory",
        totalValue: money(125),
      },
    ]);

    const inventory = await new ManagementService(client as never).getInventoryValue("user-1");

    expect(inventory.latest).toMatchObject({
      currency: "EUR",
      itemCount: 3,
      totalValue: 125,
    });
    expect(inventory.delta.absoluteChange).toBe(25);
    expect(inventory.delta.percentageChange).toBe(25);
  });

  it("lists, creates, and updates marketplace listings", async () => {
    const client = createClient();
    client.item.findFirst.mockResolvedValue({ id: "item-1" });
    client.userMarketplaceListing.findFirst.mockResolvedValue({ id: "listing-1" });
    client.userMarketplaceListing.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-05-01T10:00:00.000Z"),
        currency: "EUR",
        externalListingId: "external-1",
        id: "listing-1",
        item: itemSummary(),
        lastCheckedAt: null,
        listedAt: new Date("2026-05-01T09:00:00.000Z"),
        listedPrice: money(25),
        listingUrl: "https://steam.test/listing",
        marketSlug: "steam",
        soldAt: null,
        status: MarketplaceListingStatus.ACTIVE,
      },
    ]);
    const service = new ManagementService(client as never);

    const listed = await service.listListings("user-1");
    expect(listed[0]).toMatchObject({
      id: "listing-1",
      listedPrice: 25,
      status: MarketplaceListingStatus.ACTIVE,
    });

    await service.createListing("user-1", {
      currency: "eur",
      itemId: "item-1",
      listedPrice: 20,
      marketSlug: "steam",
    });
    expect(client.userMarketplaceListing.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        currency: "EUR",
        itemId: "item-1",
        listedPrice: 20,
        marketSlug: "steam",
        userId: "user-1",
      }),
    });

    await service.updateListing("user-1", "listing-1", {
      currency: "usd",
      itemId: "item-1",
      status: MarketplaceListingStatus.SOLD,
    });
    expect(client.userMarketplaceListing.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        currency: "USD",
        itemId: "item-1",
        status: MarketplaceListingStatus.SOLD,
      }),
      where: {
        id: "listing-1",
      },
    });
  });

  it("throws when updating a missing listing or using a missing item", async () => {
    const client = createClient();
    client.userMarketplaceListing.findFirst.mockResolvedValue(null);
    client.item.findFirst.mockResolvedValue(null);
    const service = new ManagementService(client as never);

    await expect(service.updateListing("user-1", "missing", {})).rejects.toMatchObject({
      message: "Listing not found.",
      status: 404,
    });
    await expect(
      service.createListing("user-1", {
        itemId: "missing-item",
        listedPrice: 10,
        marketSlug: "steam",
      }),
    ).rejects.toMatchObject({
      message: "Item not found.",
      status: 404,
    });
  });

  it("lists, creates, and updates trades", async () => {
    const client = createClient();
    client.userTrade.findFirst.mockResolvedValue({ id: "trade-1" });
    client.userTrade.findMany.mockResolvedValue([
      {
        acceptedAt: new Date("2026-05-01T09:00:00.000Z"),
        createdAt: new Date("2026-05-01T08:00:00.000Z"),
        currency: "EUR",
        effectiveAt: new Date("2026-05-08T09:00:00.000Z"),
        estimatedValueGiven: money(10),
        estimatedValueReceived: money(14),
        id: "trade-1",
        itemsGiven: [{ name: "P250" }],
        itemsReceived: [{ name: "AK-47" }],
        lastCheckedAt: null,
        notes: "good trade",
        partnerAvatarUrl: null,
        partnerName: "Trader",
        partnerSteamId: "steam-1",
        status: UserTradeStatus.PENDING,
        tradeOfferId: "offer-1",
      },
    ]);
    const service = new ManagementService(client as never);

    const trades = await service.listTrades("user-1");
    expect(trades[0]).toMatchObject({
      estimatedValueGiven: 10,
      estimatedValueReceived: 14,
      partnerName: "Trader",
      status: UserTradeStatus.PENDING,
    });

    await service.createTrade("user-1", {
      acceptedAt: "2026-05-01T09:00:00.000Z",
      currency: "eur",
      partnerName: "Trader",
      status: UserTradeStatus.ACCEPTED,
    });
    expect(client.userTrade.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        acceptedAt: new Date("2026-05-01T09:00:00.000Z"),
        currency: "EUR",
        partnerName: "Trader",
        status: UserTradeStatus.ACCEPTED,
        userId: "user-1",
      }),
    });
    expect(client.userTrade.create.mock.calls[0][0].data.effectiveAt).toEqual(
      new Date("2026-05-08T09:00:00.000Z"),
    );

    await service.updateTrade("user-1", "trade-1", {
      acceptedAt: null,
      currency: "usd",
      partnerName: "Trader 2",
    });
    expect(client.userTrade.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        acceptedAt: null,
        currency: "USD",
        effectiveAt: null,
        lastCheckedAt: expect.any(Date),
        partnerName: "Trader 2",
      }),
      where: {
        id: "trade-1",
      },
    });
  });

  it("throws when updating a missing trade", async () => {
    const client = createClient();
    client.userTrade.findFirst.mockResolvedValue(null);

    await expect(new ManagementService(client as never).updateTrade("user-1", "missing", {})).rejects.toMatchObject({
      message: "Trade not found.",
      status: 404,
    });
  });

  it("lists and marks notifications as read", async () => {
    const client = createClient();
    client.userNotification.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-05-01T10:00:00.000Z"),
        id: "notification-1",
        message: "Price alert",
        metadata: { trackedSkinId: "tracked-1" },
        readAt: null,
        severity: UserNotificationSeverity.WARNING,
        title: "Seuil bas atteint",
        type: UserNotificationType.PRICE_ALERT,
      },
    ]);
    client.userNotification.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const service = new ManagementService(client as never);

    const notifications = await service.listNotifications("user-1");
    expect(client.userNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: {
            in: [UserNotificationType.PRICE_ALERT],
          },
        }),
      }),
    );
    expect(notifications[0]).toMatchObject({
      id: "notification-1",
      isRead: false,
      readAt: null,
    });

    await expect(service.markNotificationRead("user-1", "notification-1")).resolves.toHaveLength(1);
    await expect(service.markNotificationRead("user-1", "missing")).rejects.toMatchObject({
      message: "Notification not found.",
      status: 404,
    });
  });

  it("creates price alert notifications when tracked thresholds are reached", async () => {
    const client = createClient();
    client.userTrackedSkin.findMany.mockResolvedValue([
      {
        alertAbovePrice: money(20),
        alertBelowPrice: null,
        id: "tracked-1",
        item: {
          displayName: "AK-47 | Redline (Field-Tested)",
          latestPrices: [
            {
              currency: "EUR",
              market: {
                name: "Skinport",
                slug: "skinport",
              },
              price: money(24),
            },
          ],
        },
        itemId: "item-1",
        label: "Redline alert",
      },
    ]);
    client.userNotification.count.mockResolvedValue(0);

    await new ManagementService(client as never).evaluatePriceAlerts("user-1");

    expect(client.userNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        message: "Redline alert est a 24.00 EUR, au-dessus du seuil 20.00 EUR.",
        metadata: expect.objectContaining({
          alertKey: "tracked-skin:tracked-1:above:20.00",
          direction: "above",
          itemId: "item-1",
          price: 24,
          threshold: 20,
        }),
        severity: UserNotificationSeverity.SUCCESS,
        title: "Seuil haut atteint",
        type: UserNotificationType.PRICE_ALERT,
        userId: "user-1",
      }),
    });
  });

  it("does not duplicate recent price alert notifications", async () => {
    const client = createClient();
    client.userTrackedSkin.findMany.mockResolvedValue([
      {
        alertAbovePrice: null,
        alertBelowPrice: money(15),
        id: "tracked-1",
        item: {
          displayName: "AK-47 | Redline (Field-Tested)",
          latestPrices: [
            {
              currency: "EUR",
              market: {
                name: "Steam",
                slug: "steam",
              },
              price: money(12),
            },
          ],
        },
        itemId: "item-1",
        label: null,
      },
    ]);
    client.userNotification.count.mockResolvedValue(1);

    await new ManagementService(client as never).evaluatePriceAlerts("user-1");

    expect(client.userNotification.create).not.toHaveBeenCalled();
  });

  it("seeds the welcome notification only once", async () => {
    const client = createClient();
    client.userNotification.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    const service = new ManagementService(client as never);

    await service.seedWelcomeNotification("user-1");
    await service.seedWelcomeNotification("user-1");

    expect(client.userNotification.create).toHaveBeenCalledTimes(1);
    expect(client.userNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        severity: UserNotificationSeverity.SUCCESS,
        type: UserNotificationType.SYSTEM,
        userId: "user-1",
      }),
    });
  });

  it("builds dashboard summary from all dashboard sections", async () => {
    const client = createClient();
    client.userDashboardWidget.findMany.mockResolvedValue([]);
    client.userTrackedSkin.findMany.mockResolvedValue([]);
    client.userInventorySnapshot.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-05-01T10:00:00.000Z"),
        currency: "EUR",
        itemCount: 1,
        source: "steam_inventory",
        totalValue: money(10),
      },
    ]);
    client.userMarketplaceListing.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-05-01T10:00:00.000Z"),
        currency: "EUR",
        externalListingId: null,
        id: "listing-1",
        item: itemSummary(),
        lastCheckedAt: null,
        listedAt: new Date("2026-05-01T09:00:00.000Z"),
        listedPrice: money(10),
        listingUrl: null,
        marketSlug: "steam",
        soldAt: null,
        status: MarketplaceListingStatus.ACTIVE,
      },
    ]);
    client.userTrade.findMany.mockResolvedValue([
      {
        acceptedAt: null,
        createdAt: new Date("2026-05-01T08:00:00.000Z"),
        currency: "EUR",
        effectiveAt: null,
        estimatedValueGiven: null,
        estimatedValueReceived: null,
        id: "trade-1",
        itemsGiven: [],
        itemsReceived: [],
        lastCheckedAt: null,
        notes: null,
        partnerAvatarUrl: null,
        partnerName: "Trader",
        partnerSteamId: null,
        status: UserTradeStatus.ACCEPTED,
        tradeOfferId: null,
      },
    ]);
    client.userNotification.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-05-01T10:00:00.000Z"),
        id: "notification-1",
        message: "Unread",
        metadata: null,
        readAt: null,
        severity: UserNotificationSeverity.INFO,
        title: "Unread",
        type: UserNotificationType.PRICE_ALERT,
      },
    ]);

    const dashboard = await new ManagementService(client as never).getDashboardData("user-1");

    expect(dashboard.summary).toEqual({
      activeListings: 1,
      inventoryCurrency: "EUR",
      inventoryValue: 10,
      pendingTrades: 1,
      trackedSkins: 0,
      unreadNotifications: 1,
    });
    await expect(new ManagementService(client as never).getSummary("user-1")).resolves.toMatchObject({
      activeListings: 1,
      inventoryValue: 10,
    });
  });
});
