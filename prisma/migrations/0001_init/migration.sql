-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('SKIN', 'STICKER', 'CASE', 'CAPSULE', 'KNIFE', 'GLOVE', 'CHARM', 'AGENT', 'OTHER');

-- CreateEnum
CREATE TYPE "SyncType" AS ENUM ('CATALOG', 'PRICES', 'SNAPSHOT');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "variantKey" TEXT NOT NULL,
    "marketHashName" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "weapon" TEXT,
    "skinName" TEXT,
    "displayName" TEXT NOT NULL,
    "exterior" TEXT,
    "rarity" TEXT,
    "stattrak" BOOLEAN NOT NULL DEFAULT false,
    "souvenir" BOOLEAN NOT NULL DEFAULT false,
    "phase" TEXT,
    "collection" TEXT,
    "imageUrl" TEXT,
    "steamImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LatestPrice" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "quantity" INTEGER,
    "volume" INTEGER,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "sourceUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LatestPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySnapshot" (
    "id" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "snapshotHour" VARCHAR(5) NOT NULL,
    "itemId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "quantity" INTEGER,
    "volume" INTEGER,
    "sourceFetchedAt" TIMESTAMP(3) NOT NULL,
    "sourceUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "syncType" "SyncType" NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsSucceeded" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "metadata" JSONB,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_variantKey_key" ON "Item"("variantKey");

-- CreateIndex
CREATE INDEX "Item_marketHashName_idx" ON "Item"("marketHashName");

-- CreateIndex
CREATE INDEX "Item_itemType_idx" ON "Item"("itemType");

-- CreateIndex
CREATE UNIQUE INDEX "item_market_hash_name_phase_unique" ON "Item"("marketHashName", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "Market_slug_key" ON "Market"("slug");

-- CreateIndex
CREATE INDEX "LatestPrice_itemId_idx" ON "LatestPrice"("itemId");

-- CreateIndex
CREATE INDEX "LatestPrice_marketId_idx" ON "LatestPrice"("marketId");

-- CreateIndex
CREATE INDEX "LatestPrice_marketId_fetchedAt_idx" ON "LatestPrice"("marketId", "fetchedAt");

-- CreateIndex
CREATE INDEX "LatestPrice_itemId_fetchedAt_idx" ON "LatestPrice"("itemId", "fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "latest_price_item_market_unique" ON "LatestPrice"("itemId", "marketId");

-- CreateIndex
CREATE INDEX "DailySnapshot_snapshotDate_idx" ON "DailySnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "DailySnapshot_itemId_snapshotDate_idx" ON "DailySnapshot"("itemId", "snapshotDate");

-- CreateIndex
CREATE INDEX "DailySnapshot_marketId_snapshotDate_idx" ON "DailySnapshot"("marketId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "snapshot_date_hour_item_market_unique" ON "DailySnapshot"("snapshotDate", "snapshotHour", "itemId", "marketId");

-- CreateIndex
CREATE INDEX "SyncRun_syncType_startedAt_idx" ON "SyncRun"("syncType", "startedAt");

-- CreateIndex
CREATE INDEX "SyncRun_status_startedAt_idx" ON "SyncRun"("status", "startedAt");

-- AddForeignKey
ALTER TABLE "LatestPrice" ADD CONSTRAINT "LatestPrice_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LatestPrice" ADD CONSTRAINT "LatestPrice_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySnapshot" ADD CONSTRAINT "DailySnapshot_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySnapshot" ADD CONSTRAINT "DailySnapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

