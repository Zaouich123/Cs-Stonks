import type { SyncStatus, SyncType } from "@prisma/client";

export interface StartSyncRunInput {
  metadata?: Record<string, unknown>;
  provider: string;
  syncType: SyncType;
}

export interface CompleteSyncRunInput {
  errorSummary?: string;
  id: string;
  itemsFailed: number;
  itemsProcessed: number;
  itemsSucceeded: number;
  metadata?: Record<string, unknown>;
  status: SyncStatus;
}

export interface FailSyncRunInput {
  errorSummary: string;
  id: string;
  itemsFailed: number;
  itemsProcessed: number;
  metadata?: Record<string, unknown>;
}

export interface SyncRunRepository {
  completeRun(input: CompleteSyncRunInput): Promise<void>;
  count(): Promise<number>;
  failRun(input: FailSyncRunInput): Promise<void>;
  startRun(input: StartSyncRunInput): Promise<{ id: string }>;
}

