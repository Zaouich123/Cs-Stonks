import type {
  DashboardWidgetSize,
  DashboardWidgetType,
  MarketplaceListingStatus,
  UserNotificationSeverity,
  UserNotificationType,
  UserTradeStatus,
} from "@prisma/client";

export interface ManagementItemSummary {
  displayName: string;
  id: string;
  imageUrl: string | null;
  marketHashName: string;
  steamImageUrl: string | null;
}

export interface ManagementPriceSummary {
  currency: string;
  fetchedAt: string;
  marketName: string;
  marketSlug: string;
  price: number;
  quantity: number | null;
}

export interface ManagementChartPoint {
  date: string;
  price: number;
}

export interface ManagementStockChartPoint {
  date: string;
  quantity: number;
}

export interface ManagementTrackedSkin {
  alertAbovePrice: number | null;
  alertBelowPrice: number | null;
  chartData: ManagementChartPoint[];
  createdAt: string;
  currentStock: number | null;
  id: string;
  item: ManagementItemSummary;
  label: string | null;
  latestPrice: ManagementPriceSummary | null;
  stockChartData: ManagementStockChartPoint[];
  targetPrice: number | null;
  trend7d: {
    absoluteChange: number;
    isPositive: boolean;
    percentageChange: number;
  };
}

export interface ManagementWidget {
  config: unknown;
  enabled: boolean;
  id: string | null;
  label: string;
  position: number;
  size: DashboardWidgetSize;
  widgetType: DashboardWidgetType;
}

export interface ManagementInventorySnapshot {
  createdAt: string;
  currency: string;
  itemCount: number;
  source: string;
  totalValue: number;
}

export interface ManagementMarketplaceListing {
  createdAt: string;
  currency: string;
  externalListingId: string | null;
  id: string;
  item: ManagementItemSummary;
  lastCheckedAt: string | null;
  listedAt: string;
  listedPrice: number;
  listingUrl: string | null;
  marketSlug: string;
  soldAt: string | null;
  status: MarketplaceListingStatus;
}

export interface ManagementTrade {
  acceptedAt: string | null;
  countdown: {
    effectiveAt: string | null;
    isEffective: boolean;
    label: string;
    remainingMs: number | null;
  };
  createdAt: string;
  currency: string;
  effectiveAt: string | null;
  estimatedValueGiven: number | null;
  estimatedValueReceived: number | null;
  id: string;
  itemsGiven: unknown;
  itemsReceived: unknown;
  lastCheckedAt: string | null;
  notes: string | null;
  partnerAvatarUrl: string | null;
  partnerName: string;
  partnerSteamId: string | null;
  status: UserTradeStatus;
  tradeOfferId: string | null;
}

export interface ManagementNotification {
  createdAt: string;
  id: string;
  isRead: boolean;
  message: string;
  metadata: unknown;
  readAt: string | null;
  severity: UserNotificationSeverity;
  title: string;
  type: UserNotificationType;
}

export interface ManagementCs2NewsItem {
  date: string;
  details: string[];
  feedLabel: string | null;
  fullText: string;
  href: string;
  summary: string;
  title: string;
}

export interface ManagementDashboardData {
  cs2Updates: ManagementCs2NewsItem[];
  inventory: {
    delta: {
      absoluteChange: number;
      percentageChange: number;
    };
    history: ManagementInventorySnapshot[];
    latest: ManagementInventorySnapshot | null;
  };
  listings: ManagementMarketplaceListing[];
  notifications: ManagementNotification[];
  summary: {
    activeListings: number;
    inventoryCurrency: string | null;
    inventoryValue: number | null;
    pendingTrades: number;
    trackedSkins: number;
    unreadNotifications: number;
  };
  trackedSkins: ManagementTrackedSkin[];
  trades: ManagementTrade[];
  widgets: ManagementWidget[];
}
