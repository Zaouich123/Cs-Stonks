import type { PrismaClient } from "@prisma/client";

import type {
  DailySnapshotPersistResult,
  DailySnapshotRowInput,
  SnapshotRepository,
} from "@/modules/snapshots/snapshot.types";

function buildRowKey(row: DailySnapshotRowInput) {
  return `${row.snapshotDate.toISOString()}::${row.snapshotHour}::${row.itemId}::${row.marketId}`;
}

export class PrismaSnapshotRepository implements SnapshotRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async count(): Promise<number> {
    return this.prisma.dailySnapshot.count();
  }

  async upsertMany(rows: DailySnapshotRowInput[]): Promise<DailySnapshotPersistResult> {
    if (rows.length === 0) {
      return {
        created: 0,
        replacedExisting: false,
        rowsWritten: 0,
        snapshotDate: "",
        snapshotHour: "",
        updated: 0,
      };
    }

    const snapshotDate = rows[0].snapshotDate;
    const snapshotHour = rows[0].snapshotHour;

    const existingRows = await this.prisma.dailySnapshot.findMany({
      select: {
        itemId: true,
        marketId: true,
        snapshotDate: true,
        snapshotHour: true,
      },
      where: {
        snapshotDate,
        snapshotHour,
      },
    });
    const existingKeys = new Set(
      existingRows.map((row) =>
        buildRowKey({
          currency: "USD",
          itemId: row.itemId,
          marketId: row.marketId,
          maxPrice: null,
          meanPrice: null,
          medianPrice: null,
          minPrice: null,
          price: 0,
          quantity: null,
          sales24hMedian: null,
          sales24hMin: null,
          sales24hVolume: null,
          sales30dMedian: null,
          sales30dMin: null,
          sales30dVolume: null,
          sales7dMedian: null,
          sales7dMin: null,
          sales7dVolume: null,
          sales90dMedian: null,
          sales90dMin: null,
          sales90dVolume: null,
          snapshotDate: row.snapshotDate,
          snapshotHour: row.snapshotHour,
          suggestedPrice: null,
          sourceFetchedAt: new Date(),
          sourceUpdatedAt: null,
          volume: null,
        }),
      ),
    );

    await this.prisma.$transaction(
      rows.map((row) =>
        this.prisma.dailySnapshot.upsert({
          create: {
            currency: row.currency,
            itemId: row.itemId,
            marketId: row.marketId,
            maxPrice: row.maxPrice,
            meanPrice: row.meanPrice,
            medianPrice: row.medianPrice,
            minPrice: row.minPrice,
            price: row.price,
            quantity: row.quantity,
            sales24hMedian: row.sales24hMedian,
            sales24hMin: row.sales24hMin,
            sales24hVolume: row.sales24hVolume,
            sales30dMedian: row.sales30dMedian,
            sales30dMin: row.sales30dMin,
            sales30dVolume: row.sales30dVolume,
            sales7dMedian: row.sales7dMedian,
            sales7dMin: row.sales7dMin,
            sales7dVolume: row.sales7dVolume,
            sales90dMedian: row.sales90dMedian,
            sales90dMin: row.sales90dMin,
            sales90dVolume: row.sales90dVolume,
            snapshotDate: row.snapshotDate,
            snapshotHour: row.snapshotHour,
            suggestedPrice: row.suggestedPrice,
            sourceFetchedAt: row.sourceFetchedAt,
            sourceUpdatedAt: row.sourceUpdatedAt,
            volume: row.volume,
          },
          update: {
            currency: row.currency,
            maxPrice: row.maxPrice,
            meanPrice: row.meanPrice,
            medianPrice: row.medianPrice,
            minPrice: row.minPrice,
            price: row.price,
            quantity: row.quantity,
            sales24hMedian: row.sales24hMedian,
            sales24hMin: row.sales24hMin,
            sales24hVolume: row.sales24hVolume,
            sales30dMedian: row.sales30dMedian,
            sales30dMin: row.sales30dMin,
            sales30dVolume: row.sales30dVolume,
            sales7dMedian: row.sales7dMedian,
            sales7dMin: row.sales7dMin,
            sales7dVolume: row.sales7dVolume,
            sales90dMedian: row.sales90dMedian,
            sales90dMin: row.sales90dMin,
            sales90dVolume: row.sales90dVolume,
            suggestedPrice: row.suggestedPrice,
            sourceFetchedAt: row.sourceFetchedAt,
            sourceUpdatedAt: row.sourceUpdatedAt,
            volume: row.volume,
          },
          where: {
            snapshotDate_snapshotHour_itemId_marketId: {
              itemId: row.itemId,
              marketId: row.marketId,
              snapshotDate: row.snapshotDate,
              snapshotHour: row.snapshotHour,
            },
          },
        }),
      ),
    );

    const created = rows.filter((row) => !existingKeys.has(buildRowKey(row))).length;

    return {
      created,
      replacedExisting: existingRows.length > 0,
      rowsWritten: rows.length,
      snapshotDate: snapshotDate.toISOString().slice(0, 10),
      snapshotHour,
      updated: rows.length - created,
    };
  }
}

