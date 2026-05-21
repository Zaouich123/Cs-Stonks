-- CreateEnum
CREATE TYPE "DashboardWidgetType" AS ENUM ('TRACKED_SKIN_CHART', 'INVENTORY_VALUE', 'CS2_UPDATE', 'MARKETPLACE_SALES', 'TRADE_TRACKER', 'NOTIFICATIONS');

-- CreateEnum
CREATE TYPE "DashboardWidgetSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'WIDE');

-- CreateEnum
CREATE TYPE "MarketplaceListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED', 'EXPIRED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "UserTradeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED', 'EFFECTIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "UserNotificationType" AS ENUM ('PRICE_ALERT', 'LISTING_SOLD', 'TRADE_PENDING', 'TRADE_EFFECTIVE', 'INVENTORY_SYNC_FAILED', 'CS2_UPDATE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "UserNotificationSeverity" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- CreateTable
CREATE TABLE "UserTrackedSkin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "label" TEXT,
    "targetPrice" DECIMAL(12,2),
    "alertAbovePrice" DECIMAL(12,2),
    "alertBelowPrice" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTrackedSkin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDashboardWidget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "widgetType" "DashboardWidgetType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "size" "DashboardWidgetSize" NOT NULL DEFAULT 'MEDIUM',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDashboardWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInventorySnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalValue" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'steam_inventory',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInventorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMarketplaceListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "marketSlug" TEXT NOT NULL,
    "externalListingId" TEXT,
    "listingUrl" TEXT,
    "listedPrice" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "MarketplaceListingStatus" NOT NULL DEFAULT 'UNKNOWN',
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerSteamId" TEXT,
    "partnerName" TEXT NOT NULL,
    "partnerAvatarUrl" TEXT,
    "tradeOfferId" TEXT,
    "status" "UserTradeStatus" NOT NULL DEFAULT 'PENDING',
    "itemsGiven" JSONB,
    "itemsReceived" JSONB,
    "estimatedValueGiven" DECIMAL(12,2),
    "estimatedValueReceived" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "effectiveAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "UserNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "UserNotificationSeverity" NOT NULL DEFAULT 'INFO',
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserTrackedSkin_userId_isActive_idx" ON "UserTrackedSkin"("userId", "isActive");

-- CreateIndex
CREATE INDEX "UserTrackedSkin_itemId_idx" ON "UserTrackedSkin"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "user_tracked_skin_user_item_unique" ON "UserTrackedSkin"("userId", "itemId");

-- CreateIndex
CREATE INDEX "UserDashboardWidget_userId_enabled_idx" ON "UserDashboardWidget"("userId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_widget_user_type_unique" ON "UserDashboardWidget"("userId", "widgetType");

-- CreateIndex
CREATE INDEX "UserInventorySnapshot_userId_createdAt_idx" ON "UserInventorySnapshot"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserMarketplaceListing_userId_status_idx" ON "UserMarketplaceListing"("userId", "status");

-- CreateIndex
CREATE INDEX "UserMarketplaceListing_itemId_idx" ON "UserMarketplaceListing"("itemId");

-- CreateIndex
CREATE INDEX "UserMarketplaceListing_marketSlug_idx" ON "UserMarketplaceListing"("marketSlug");

-- CreateIndex
CREATE INDEX "UserTrade_userId_status_idx" ON "UserTrade"("userId", "status");

-- CreateIndex
CREATE INDEX "UserTrade_effectiveAt_idx" ON "UserTrade"("effectiveAt");

-- CreateIndex
CREATE INDEX "UserNotification_userId_readAt_idx" ON "UserNotification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "UserNotification_userId_createdAt_idx" ON "UserNotification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserNotification_type_createdAt_idx" ON "UserNotification"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "UserTrackedSkin" ADD CONSTRAINT "UserTrackedSkin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrackedSkin" ADD CONSTRAINT "UserTrackedSkin_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDashboardWidget" ADD CONSTRAINT "UserDashboardWidget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInventorySnapshot" ADD CONSTRAINT "UserInventorySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMarketplaceListing" ADD CONSTRAINT "UserMarketplaceListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMarketplaceListing" ADD CONSTRAINT "UserMarketplaceListing_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrade" ADD CONSTRAINT "UserTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
