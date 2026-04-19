-- AlterTable
ALTER TABLE "LatestPrice" ADD COLUMN     "maxPrice" DECIMAL(12,2),
ADD COLUMN     "meanPrice" DECIMAL(12,2),
ADD COLUMN     "medianPrice" DECIMAL(12,2),
ADD COLUMN     "minPrice" DECIMAL(12,2),
ADD COLUMN     "rawPayload" JSONB,
ADD COLUMN     "sourceItemUrl" TEXT,
ADD COLUMN     "sourceMarketUrl" TEXT,
ADD COLUMN     "suggestedPrice" DECIMAL(12,2);
