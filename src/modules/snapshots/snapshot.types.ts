import type { SyncStatus } from "@prisma/client";

import type { LatestPriceRow, LatestPriceRepository } from "@/modules/pricing/pricing.types";

export interface DailySnapshotRowInput {
  currency: string;
  itemId: string;
  marketId: string;
  price: number;
  quantity: number | null;
  snapshotDate: Date;
  snapshotHour: string;
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

