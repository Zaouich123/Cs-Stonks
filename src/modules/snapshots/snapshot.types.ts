import type { SyncStatus } from "@prisma/client";

import type { LatestPriceRow, LatestPriceRepository } from "@/modules/pricing/pricing.types";

export interface DailySnapshotRowInput {
  currency: string;
  itemId: string;
  marketId: string;
  maxPrice: number | null;
  meanPrice: number | null;
  medianPrice: number | null;
  minPrice: number | null;
  price: number;
  quantity: number | null;
  sales24hMedian: number | null;
  sales24hMin: number | null;
  sales24hVolume: number | null;
  sales30dMedian: number | null;
  sales30dMin: number | null;
  sales30dVolume: number | null;
  sales7dMedian: number | null;
  sales7dMin: number | null;
  sales7dVolume: number | null;
  sales90dMedian: number | null;
  sales90dMin: number | null;
  sales90dVolume: number | null;
  snapshotDate: Date;
  snapshotHour: string;
  suggestedPrice: number | null;
  sourceFetchedAt: Date;
  sourceUpdatedAt: Date | null;
  volume: number | null;
}

export interface DailySnapshotPersistResult {
  created: number;
  replacedExisting: boolean;
  rowsWritten: number;
  snapshotDate: string;
  snapshotHour: string;
  updated: number;
}

export interface CreateDailySnapshotInput {
  snapshotDate?: Date;
  snapshotHour?: string;
  timeZone?: string;
  triggerSource?: string;
}

export interface DailySnapshotWriteResult {
  created: number;
  replacedExisting: boolean;
  rowsWritten: number;
  snapshotDate: string;
  snapshotHour: string;
  status: SyncStatus;
  syncRunId: string;
  updated: number;
}

export interface SnapshotRepository {
  count(): Promise<number>;
  upsertMany(rows: DailySnapshotRowInput[]): Promise<DailySnapshotPersistResult>;
}

export type LatestPriceSnapshotSource = Awaited<
  ReturnType<LatestPriceRepository["listLatestPrices"]>
>[number];

export type LatestPriceSnapshotRows = LatestPriceRow[];

