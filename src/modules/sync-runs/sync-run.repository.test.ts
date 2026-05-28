import { SyncStatus, SyncType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { PrismaSyncRunRepository } from "@/modules/sync-runs/sync-run.repository";

describe("PrismaSyncRunRepository", () => {
  it("counts and starts sync runs", async () => {
    const prisma = {
      syncRun: {
        count: vi.fn().mockResolvedValue(3),
        create: vi.fn().mockResolvedValue({ id: "run-1" }),
      },
    };
    const repository = new PrismaSyncRunRepository(prisma as never);

    await expect(repository.count()).resolves.toBe(3);
    await expect(
      repository.startRun({
        metadata: { reason: "test" },
        provider: "mock",
        syncType: SyncType.PRICES,
      }),
    ).resolves.toEqual({ id: "run-1" });
    expect(prisma.syncRun.create).toHaveBeenCalledWith({
      data: {
        metadata: { reason: "test" },
        provider: "mock",
        status: SyncStatus.RUNNING,
        syncType: SyncType.PRICES,
      },
      select: {
        id: true,
      },
    });
  });

  it("completes and fails sync runs", async () => {
    const prisma = {
      syncRun: {
        update: vi.fn(),
      },
    };
    const repository = new PrismaSyncRunRepository(prisma as never);

    await repository.completeRun({
      id: "run-1",
      itemsFailed: 1,
      itemsProcessed: 10,
      itemsSucceeded: 9,
      status: SyncStatus.PARTIAL,
    });
    await repository.failRun({
      errorSummary: "boom",
      id: "run-2",
      itemsFailed: 10,
      itemsProcessed: 10,
      metadata: { step: "fetch" },
    });

    expect(prisma.syncRun.update).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        errorSummary: null,
        itemsFailed: 1,
        itemsProcessed: 10,
        itemsSucceeded: 9,
        metadata: undefined,
        status: SyncStatus.PARTIAL,
      }),
      where: { id: "run-1" },
    });
    expect(prisma.syncRun.update).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        errorSummary: "boom",
        itemsFailed: 10,
        itemsProcessed: 10,
        itemsSucceeded: 0,
        metadata: { step: "fetch" },
        status: SyncStatus.FAILED,
      }),
      where: { id: "run-2" },
    });
  });
});
