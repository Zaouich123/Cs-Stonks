import {
  DashboardWidgetSize,
  DashboardWidgetType,
  MarketplaceListingStatus,
  Prisma,
  UserNotificationSeverity,
  UserNotificationType,
  UserTradeStatus,
  type PrismaClient,
} from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { ApplicationError } from "@/lib/errors";
import { computeInventoryDelta } from "@/lib/management/computeInventoryValue";
import { computeTrackedSkinStats } from "@/lib/management/computeTrackedSkinStats";
import { computeTradeCountdown, inferEffectiveAt } from "@/lib/management/computeTradeCountdown";
import { DEFAULT_DASHBOARD_WIDGETS, getWidgetLabel } from "@/lib/management/dashboardWidgetConfig";
import { getLatestCs2News } from "@/modules/management/services/cs2NewsService";
import type {
  ManagementDashboardData,
  ManagementInventorySnapshot,
  ManagementMarketplaceListing,
  ManagementNotification,
  ManagementTrackedSkin,
  ManagementTrade,
  ManagementWidget,
} from "@/modules/management/types/management.types";

const trackedSkinCreateSchema = z.object({
  alertAbovePrice: z.coerce.number().positive().nullable().optional(),
  alertBelowPrice: z.coerce.number().positive().nullable().optional(),
  itemId: z.string().min(1),
  label: z.string().trim().max(80).nullable().optional(),
  targetPrice: z.coerce.number().positive().nullable().optional(),
});

const widgetsPatchSchema = z.object({
  widgets: z
    .array(
      z.object({
        config: z.record(z.string(), z.unknown()).nullable().optional(),
        enabled: z.boolean(),
        position: z.number().int().min(0),
        size: z.enum(DashboardWidgetSize),
        widgetType: z.enum(DashboardWidgetType),
      }),
    )
    .min(1),
});

const listingCreateSchema = z.object({
  currency: z.string().trim().length(3).default("EUR"),
  externalListingId: z.string().trim().max(160).nullable().optional(),
  itemId: z.string().min(1),
  listedAt: z.coerce.date().optional(),
  listedPrice: z.coerce.number().positive(),
  listingUrl: z.string().url().nullable().optional(),
  marketSlug: z.string().trim().min(2).max(60),
  status: z.enum(MarketplaceListingStatus).default(MarketplaceListingStatus.ACTIVE),
});

const listingPatchSchema = listingCreateSchema.partial().extend({
  lastCheckedAt: z.coerce.date().nullable().optional(),
  soldAt: z.coerce.date().nullable().optional(),
});

const tradeCreateSchema = z.object({
  acceptedAt: z.coerce.date().nullable().optional(),
  currency: z.string().trim().length(3).default("EUR"),
  effectiveAt: z.coerce.date().nullable().optional(),
  estimatedValueGiven: z.coerce.number().nonnegative().nullable().optional(),
  estimatedValueReceived: z.coerce.number().nonnegative().nullable().optional(),
  itemsGiven: z.unknown().optional(),
  itemsReceived: z.unknown().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  partnerAvatarUrl: z.string().url().nullable().optional(),
  partnerName: z.string().trim().min(1).max(120),
  partnerSteamId: z.string().trim().max(40).nullable().optional(),
  status: z.enum(UserTradeStatus).default(UserTradeStatus.PENDING),
  tradeOfferId: z.string().trim().max(160).nullable().optional(),
});

const tradePatchSchema = tradeCreateSchema.partial();

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value ? value.toNumber() : null;
}

function toItemSummary(item: {
  displayName: string;
  id: string;
  imageUrl: string | null;
  marketHashName: string;
  steamImageUrl: string | null;
}) {
  return {
    displayName: item.displayName,
    id: item.id,
    imageUrl: item.imageUrl,
    marketHashName: item.marketHashName,
    steamImageUrl: item.steamImageUrl,
  };
}

function aggregateSnapshotChart(
  snapshots: Array<{
    price: Prisma.Decimal;
    snapshotDate: Date;
  }>,
) {
  const byDate = new Map<string, { count: number; price: number }>();

  for (const snapshot of snapshots) {
    const date = snapshot.snapshotDate.toISOString().slice(0, 10);
    const existing = byDate.get(date) ?? { count: 0, price: 0 };

    existing.count += 1;
    existing.price += snapshot.price.toNumber();
    byDate.set(date, existing);
  }

  return Array.from(byDate.entries())
    .map(([date, value]) => ({
      date,
      price: value.price / value.count,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function aggregateStockChart(
  snapshots: Array<{
    quantity: number | null;
    snapshotDate: Date;
  }>,
) {
  const byDate = new Map<string, { count: number; quantity: number }>();

  for (const snapshot of snapshots) {
    if (snapshot.quantity === null) {
      continue;
    }

    const date = snapshot.snapshotDate.toISOString().slice(0, 10);
    const existing = byDate.get(date) ?? { count: 0, quantity: 0 };

    existing.count += 1;
    existing.quantity += snapshot.quantity;
    byDate.set(date, existing);
  }

  return Array.from(byDate.entries())
    .map(([date, value]) => ({
      date,
      quantity: Math.round(value.quantity / value.count),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function toWidget(row: {
  config: Prisma.JsonValue | null;
  enabled: boolean;
  id: string | null;
  position: number;
  size: DashboardWidgetSize;
  widgetType: DashboardWidgetType;
}): ManagementWidget {
  return {
    config: row.config,
    enabled: row.enabled,
    id: row.id,
    label: getWidgetLabel(row.widgetType),
    position: row.position,
    size: row.size,
    widgetType: row.widgetType,
  };
}

export class ManagementService {
  constructor(private readonly client: PrismaClient = prisma) {}

  async getDashboardData(userId: string): Promise<ManagementDashboardData> {
    const [widgets, trackedSkins, inventory, listings, trades, notifications, cs2Updates] = await Promise.all([
      this.getWidgets(userId),
      this.listTrackedSkins(userId),
      this.getInventoryValue(userId),
      this.listListings(userId),
      this.listTrades(userId),
      this.listNotifications(userId),
      getLatestCs2News(1),
    ]);

    return {
      cs2Updates,
      inventory,
      listings,
      notifications,
      summary: {
        activeListings: listings.filter((listing) => listing.status === MarketplaceListingStatus.ACTIVE).length,
        inventoryCurrency: inventory.latest?.currency ?? null,
        inventoryValue: inventory.latest?.totalValue ?? null,
        pendingTrades: trades.filter(
          (trade) =>
            trade.status === UserTradeStatus.PENDING || trade.status === UserTradeStatus.ACCEPTED,
        ).length,
        trackedSkins: trackedSkins.length,
        unreadNotifications: notifications.filter((notification) => !notification.isRead).length,
      },
      trackedSkins,
      trades,
      widgets,
    };
  }

  async getSummary(userId: string) {
    const data = await this.getDashboardData(userId);

    return data.summary;
  }

  async getWidgets(userId: string): Promise<ManagementWidget[]> {
    const rows = await this.client.userDashboardWidget.findMany({
      orderBy: [{ position: "asc" }, { widgetType: "asc" }],
      where: {
        userId,
      },
    });

    const byType = new Map(rows.map((row) => [row.widgetType, row]));

    return DEFAULT_DASHBOARD_WIDGETS.map((defaultWidget) => {
      const row = byType.get(defaultWidget.widgetType);

      return toWidget({
        config: row?.config ?? null,
        enabled: row?.enabled ?? defaultWidget.enabled,
        id: row?.id ?? null,
        position: row?.position ?? defaultWidget.position,
        size: row?.size ?? defaultWidget.size,
        widgetType: defaultWidget.widgetType,
      });
    }).sort((left, right) => left.position - right.position);
  }

  async updateWidgets(userId: string, payload: unknown) {
    const input = widgetsPatchSchema.parse(payload);

    await this.client.$transaction(
      input.widgets.map((widget) =>
        this.client.userDashboardWidget.upsert({
          create: {
            config: (widget.config as Prisma.InputJsonValue | null) ?? undefined,
            enabled: widget.enabled,
            position: widget.position,
            size: widget.size,
            userId,
            widgetType: widget.widgetType,
          },
          update: {
            config: (widget.config as Prisma.InputJsonValue | null) ?? undefined,
            enabled: widget.enabled,
            position: widget.position,
            size: widget.size,
          },
          where: {
            userId_widgetType: {
              userId,
              widgetType: widget.widgetType,
            },
          },
        }),
      ),
    );

    return this.getWidgets(userId);
  }

  async listTrackedSkins(userId: string): Promise<ManagementTrackedSkin[]> {
    const from = new Date();
    from.setDate(from.getDate() - 90);

    const trackedSkins = await this.client.userTrackedSkin.findMany({
      include: {
        item: {
          include: {
            dailySnapshots: {
              orderBy: [{ snapshotDate: "asc" }, { snapshotHour: "asc" }],
              take: 1500,
              where: {
                snapshotDate: {
                  gte: from,
                },
              },
            },
            latestPrices: {
              include: {
                market: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
              },
              orderBy: {
                price: "asc",
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      where: {
        isActive: true,
        userId,
      },
    });

    return trackedSkins.map((trackedSkin) => {
      const chartData = aggregateSnapshotChart(trackedSkin.item.dailySnapshots);
      const stockChartData = aggregateStockChart(trackedSkin.item.dailySnapshots);
      const latestPrice = trackedSkin.item.latestPrices[0] ?? null;

      return {
        alertAbovePrice: decimalToNumber(trackedSkin.alertAbovePrice),
        alertBelowPrice: decimalToNumber(trackedSkin.alertBelowPrice),
        chartData,
        createdAt: trackedSkin.createdAt.toISOString(),
        id: trackedSkin.id,
        item: toItemSummary(trackedSkin.item),
        label: trackedSkin.label,
        latestPrice: latestPrice
          ? {
              currency: latestPrice.currency,
              fetchedAt: latestPrice.fetchedAt.toISOString(),
              marketName: latestPrice.market.name,
              marketSlug: latestPrice.market.slug,
              price: latestPrice.price.toNumber(),
              quantity: latestPrice.quantity,
            }
          : null,
        stockChartData,
        targetPrice: decimalToNumber(trackedSkin.targetPrice),
        trend7d: computeTrackedSkinStats(chartData.slice(-7)),
      };
    });
  }

  async createTrackedSkin(userId: string, payload: unknown) {
    const input = trackedSkinCreateSchema.parse(payload);
    const item = await this.client.item.findFirst({
      select: {
        id: true,
      },
      where: {
        id: input.itemId,
        isActive: true,
      },
    });

    if (!item) {
      throw new ApplicationError("Item not found.", 404);
    }

    await this.client.userTrackedSkin.upsert({
      create: {
        alertAbovePrice: input.alertAbovePrice ?? null,
        alertBelowPrice: input.alertBelowPrice ?? null,
        itemId: input.itemId,
        label: input.label ?? null,
        targetPrice: input.targetPrice ?? null,
        userId,
      },
      update: {
        alertAbovePrice: input.alertAbovePrice ?? null,
        alertBelowPrice: input.alertBelowPrice ?? null,
        isActive: true,
        label: input.label ?? null,
        targetPrice: input.targetPrice ?? null,
      },
      where: {
        userId_itemId: {
          itemId: input.itemId,
          userId,
        },
      },
    });

    return this.listTrackedSkins(userId);
  }

  async deleteTrackedSkin(userId: string, trackedSkinId: string) {
    const result = await this.client.userTrackedSkin.deleteMany({
      where: {
        id: trackedSkinId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new ApplicationError("Tracked skin not found.", 404);
    }

    return {
      deleted: true,
    };
  }

  async getInventoryValue(userId: string) {
    const rows = await this.client.userInventorySnapshot.findMany({
      orderBy: {
        createdAt: "asc",
      },
      take: 90,
      where: {
        userId,
      },
    });

    const history: ManagementInventorySnapshot[] = rows.map((row) => ({
      createdAt: row.createdAt.toISOString(),
      currency: row.currency,
      itemCount: row.itemCount,
      source: row.source,
      totalValue: row.totalValue.toNumber(),
    }));

    return {
      delta: computeInventoryDelta(history),
      history,
      latest: history[history.length - 1] ?? null,
    };
  }

  async listListings(userId: string): Promise<ManagementMarketplaceListing[]> {
    const listings = await this.client.userMarketplaceListing.findMany({
      include: {
        item: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      where: {
        userId,
      },
    });

    return listings.map((listing) => ({
      createdAt: listing.createdAt.toISOString(),
      currency: listing.currency,
      externalListingId: listing.externalListingId,
      id: listing.id,
      item: toItemSummary(listing.item),
      lastCheckedAt: toIso(listing.lastCheckedAt),
      listedAt: listing.listedAt.toISOString(),
      listedPrice: listing.listedPrice.toNumber(),
      listingUrl: listing.listingUrl,
      marketSlug: listing.marketSlug,
      soldAt: toIso(listing.soldAt),
      status: listing.status,
    }));
  }

  async createListing(userId: string, payload: unknown) {
    const input = listingCreateSchema.parse(payload);
    await this.assertItemExists(input.itemId);

    await this.client.userMarketplaceListing.create({
      data: {
        currency: input.currency.toUpperCase(),
        externalListingId: input.externalListingId ?? null,
        itemId: input.itemId,
        listedAt: input.listedAt ?? new Date(),
        listedPrice: input.listedPrice,
        listingUrl: input.listingUrl ?? null,
        marketSlug: input.marketSlug,
        status: input.status,
        userId,
      },
    });

    return this.listListings(userId);
  }

  async updateListing(userId: string, listingId: string, payload: unknown) {
    const input = listingPatchSchema.parse(payload);
    const listing = await this.client.userMarketplaceListing.findFirst({
      select: {
        id: true,
      },
      where: {
        id: listingId,
        userId,
      },
    });

    if (!listing) {
      throw new ApplicationError("Listing not found.", 404);
    }

    if (input.itemId) {
      await this.assertItemExists(input.itemId);
    }

    await this.client.userMarketplaceListing.update({
      data: {
        currency: input.currency?.toUpperCase(),
        externalListingId: input.externalListingId,
        itemId: input.itemId,
        lastCheckedAt: input.lastCheckedAt,
        listedAt: input.listedAt,
        listedPrice: input.listedPrice,
        listingUrl: input.listingUrl,
        marketSlug: input.marketSlug,
        soldAt: input.soldAt,
        status: input.status,
      },
      where: {
        id: listingId,
      },
    });

    return this.listListings(userId);
  }

  async listTrades(userId: string): Promise<ManagementTrade[]> {
    const trades = await this.client.userTrade.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      where: {
        userId,
      },
    });

    return trades.map((trade) => ({
      acceptedAt: toIso(trade.acceptedAt),
      countdown: computeTradeCountdown(trade),
      createdAt: trade.createdAt.toISOString(),
      currency: trade.currency,
      effectiveAt: toIso(trade.effectiveAt),
      estimatedValueGiven: decimalToNumber(trade.estimatedValueGiven),
      estimatedValueReceived: decimalToNumber(trade.estimatedValueReceived),
      id: trade.id,
      itemsGiven: trade.itemsGiven,
      itemsReceived: trade.itemsReceived,
      lastCheckedAt: toIso(trade.lastCheckedAt),
      notes: trade.notes,
      partnerAvatarUrl: trade.partnerAvatarUrl,
      partnerName: trade.partnerName,
      partnerSteamId: trade.partnerSteamId,
      status: trade.status,
      tradeOfferId: trade.tradeOfferId,
    }));
  }

  async createTrade(userId: string, payload: unknown) {
    const input = tradeCreateSchema.parse(payload);
    const effectiveAt = input.effectiveAt ?? inferEffectiveAt(input.acceptedAt) ?? null;

    await this.client.userTrade.create({
      data: {
        acceptedAt: input.acceptedAt ?? null,
        currency: input.currency.toUpperCase(),
        effectiveAt,
        estimatedValueGiven: input.estimatedValueGiven ?? null,
        estimatedValueReceived: input.estimatedValueReceived ?? null,
        itemsGiven: (input.itemsGiven as Prisma.InputJsonValue | undefined) ?? undefined,
        itemsReceived: (input.itemsReceived as Prisma.InputJsonValue | undefined) ?? undefined,
        notes: input.notes ?? null,
        partnerAvatarUrl: input.partnerAvatarUrl ?? null,
        partnerName: input.partnerName,
        partnerSteamId: input.partnerSteamId ?? null,
        status: input.status,
        tradeOfferId: input.tradeOfferId ?? null,
        userId,
      },
    });

    return this.listTrades(userId);
  }

  async updateTrade(userId: string, tradeId: string, payload: unknown) {
    const input = tradePatchSchema.parse(payload);
    const trade = await this.client.userTrade.findFirst({
      select: {
        id: true,
      },
      where: {
        id: tradeId,
        userId,
      },
    });

    if (!trade) {
      throw new ApplicationError("Trade not found.", 404);
    }

    const effectiveAt =
      input.effectiveAt !== undefined
        ? input.effectiveAt
        : input.acceptedAt !== undefined
          ? inferEffectiveAt(input.acceptedAt)
          : undefined;

    await this.client.userTrade.update({
      data: {
        acceptedAt: input.acceptedAt,
        currency: input.currency?.toUpperCase(),
        effectiveAt,
        estimatedValueGiven: input.estimatedValueGiven,
        estimatedValueReceived: input.estimatedValueReceived,
        itemsGiven:
          input.itemsGiven === undefined ? undefined : (input.itemsGiven as Prisma.InputJsonValue),
        itemsReceived:
          input.itemsReceived === undefined ? undefined : (input.itemsReceived as Prisma.InputJsonValue),
        lastCheckedAt: new Date(),
        notes: input.notes,
        partnerAvatarUrl: input.partnerAvatarUrl,
        partnerName: input.partnerName,
        partnerSteamId: input.partnerSteamId,
        status: input.status,
        tradeOfferId: input.tradeOfferId,
      },
      where: {
        id: tradeId,
      },
    });

    return this.listTrades(userId);
  }

  async listNotifications(userId: string): Promise<ManagementNotification[]> {
    const rows = await this.client.userNotification.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
      where: {
        userId,
      },
    });

    return rows.map((row) => ({
      createdAt: row.createdAt.toISOString(),
      id: row.id,
      isRead: Boolean(row.readAt),
      message: row.message,
      metadata: row.metadata,
      readAt: toIso(row.readAt),
      severity: row.severity,
      title: row.title,
      type: row.type,
    }));
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const result = await this.client.userNotification.updateMany({
      data: {
        readAt: new Date(),
      },
      where: {
        id: notificationId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new ApplicationError("Notification not found.", 404);
    }

    return this.listNotifications(userId);
  }

  async seedWelcomeNotification(userId: string) {
    const existing = await this.client.userNotification.count({
      where: {
        type: UserNotificationType.SYSTEM,
        userId,
      },
    });

    if (existing > 0) {
      return;
    }

    await this.client.userNotification.create({
      data: {
        message:
          "Your management dashboard is ready. Track skins, listings and trades from one place.",
        severity: UserNotificationSeverity.SUCCESS,
        title: "Management unlocked",
        type: UserNotificationType.SYSTEM,
        userId,
      },
    });
  }

  private async assertItemExists(itemId: string) {
    const item = await this.client.item.findFirst({
      select: {
        id: true,
      },
      where: {
        id: itemId,
        isActive: true,
      },
    });

    if (!item) {
      throw new ApplicationError("Item not found.", 404);
    }
  }
}
