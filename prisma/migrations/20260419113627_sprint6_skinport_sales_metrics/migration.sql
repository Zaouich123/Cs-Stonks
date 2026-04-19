-- AlterTable
ALTER TABLE "DailySnapshot" ADD COLUMN     "sales24hMedian" DECIMAL(12,2),
ADD COLUMN     "sales24hMin" DECIMAL(12,2),
ADD COLUMN     "sales24hVolume" INTEGER,
ADD COLUMN     "sales30dMedian" DECIMAL(12,2),
ADD COLUMN     "sales30dMin" DECIMAL(12,2),
ADD COLUMN     "sales30dVolume" INTEGER,
ADD COLUMN     "sales7dMedian" DECIMAL(12,2),
ADD COLUMN     "sales7dMin" DECIMAL(12,2),
ADD COLUMN     "sales7dVolume" INTEGER,
ADD COLUMN     "sales90dMedian" DECIMAL(12,2),
ADD COLUMN     "sales90dMin" DECIMAL(12,2),
ADD COLUMN     "sales90dVolume" INTEGER;

-- AlterTable
ALTER TABLE "LatestPrice" ADD COLUMN     "sales24hMedian" DECIMAL(12,2),
ADD COLUMN     "sales24hMin" DECIMAL(12,2),
ADD COLUMN     "sales24hVolume" INTEGER,
ADD COLUMN     "sales30dMedian" DECIMAL(12,2),
ADD COLUMN     "sales30dMin" DECIMAL(12,2),
ADD COLUMN     "sales30dVolume" INTEGER,
ADD COLUMN     "sales7dMedian" DECIMAL(12,2),
ADD COLUMN     "sales7dMin" DECIMAL(12,2),
ADD COLUMN     "sales7dVolume" INTEGER,
ADD COLUMN     "sales90dMedian" DECIMAL(12,2),
ADD COLUMN     "sales90dMin" DECIMAL(12,2),
ADD COLUMN     "sales90dVolume" INTEGER;
