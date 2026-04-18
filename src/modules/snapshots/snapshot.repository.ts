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
          price: 0,
          quantity: null,
          snapshotDate: row.snapshotDate,
          snapshotHour: row.snapshotHour,
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
            price: row.price,
            quantity: row.quantity,
            snapshotDate: row.snapshotDate,
            snapshotHour: row.snapshotHour,
            sourceFetchedAt: row.sourceFetchedAt,
            sourceUpdatedAt: row.sourceUpdatedAt,
            volume: row.volume,
          },
          update: {
            currency: row.currency,
            price: row.price,
            quantity: row.quantity,
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

