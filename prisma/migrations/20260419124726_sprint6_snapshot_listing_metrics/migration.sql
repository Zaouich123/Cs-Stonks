-- AlterTable
ALTER TABLE "DailySnapshot" ADD COLUMN     "maxPrice" DECIMAL(12,2),
ADD COLUMN     "meanPrice" DECIMAL(12,2),
ADD COLUMN     "medianPrice" DECIMAL(12,2),
ADD COLUMN     "minPrice" DECIMAL(12,2),
ADD COLUMN     "suggestedPrice" DECIMAL(12,2);
