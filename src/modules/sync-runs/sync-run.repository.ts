import type { Prisma, PrismaClient } from "@prisma/client";
import { SyncStatus } from "@prisma/client";

import type {
  CompleteSyncRunInput,
  FailSyncRunInput,
  StartSyncRunInput,
  SyncRunRepository,
} from "@/modules/sync-runs/sync-run.types";

function toJson(metadata?: Record<string, unknown>): Prisma.InputJsonValue | undefined {
  if (!metadata) {
    return undefined;
  }

  return metadata as Prisma.InputJsonValue;
}

export class PrismaSyncRunRepository implements SyncRunRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async count(): Promise<number> {
    return this.prisma.syncRun.count();
  }

  async startRun(input: StartSyncRunInput): Promise<{ id: string }> {
    const run = await this.prisma.syncRun.create({
      data: {
        metadata: toJson(input.metadata),
        provider: input.provider,
        status: SyncStatus.RUNNING,
        syncType: input.syncType,
      },
      select: {
        id: true,
      },
    });

    return run;
  }

  async completeRun(input: CompleteSyncRunInput): Promise<void> {
    await this.prisma.syncRun.update({
      data: {
        errorSummary: input.errorSummary ?? null,
        finishedAt: new Date(),
        itemsFailed: input.itemsFailed,
        itemsProcessed: input.itemsProcessed,
        itemsSucceeded: input.itemsSucceeded,
        metadata: toJson(input.metadata),
        status: input.status,
      },
      where: {
        id: input.id,
      },
    });
  }

  async failRun(input: FailSyncRunInput): Promise<void> {
    await this.prisma.syncRun.update({
      data: {
        errorSummary: input.errorSummary,
        finishedAt: new Date(),
        itemsFailed: input.itemsFailed,
        itemsProcessed: input.itemsProcessed,
        itemsSucceeded: 0,
        metadata: toJson(input.metadata),
        status: SyncStatus.FAILED,
      },
      where: {
        id: input.id,
      },
    });
  }
}

