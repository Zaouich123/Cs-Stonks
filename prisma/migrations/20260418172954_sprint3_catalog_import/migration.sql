-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ItemType" ADD VALUE 'TOOL';
ALTER TYPE "ItemType" ADD VALUE 'MUSIC_KIT';
ALTER TYPE "ItemType" ADD VALUE 'GRAFFITI';
ALTER TYPE "ItemType" ADD VALUE 'PATCH';

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "baseItemName" TEXT,
ADD COLUMN     "hasVariants" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastCatalogSyncAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "sourceExternalId" TEXT,
ADD COLUMN     "steamAppId" INTEGER NOT NULL DEFAULT 730;

-- CreateIndex
CREATE INDEX "Item_source_isActive_idx" ON "Item"("source", "isActive");

-- CreateIndex
CREATE INDEX "Item_baseItemName_idx" ON "Item"("baseItemName");
