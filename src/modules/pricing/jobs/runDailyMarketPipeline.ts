import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { runLatestPricesSyncJob } from "@/modules/pricing/jobs/runLatestPricesSyncJob";
import { runCsfloatPriceListSync } from "@/modules/pricing/jobs/runCsfloatPriceListSync";
import { runDailySnapshotJob } from "@/modules/snapshots/jobs/runDailySnapshotJob";
import type { PriceProviderSource } from "@/modules/providers/provider.types";

interface PipelineStepResult {
  created?: number;
  failed?: number;
  ignored?: number;
  name: string;
  persisted?: number;
  reason?: string;
  status: "FAILED" | "SKIPPED" | "SUCCESS";
  updated?: number;
  upserted?: number;
}

const marketSources: PriceProviderSource[] = ["dmarket", "skinport", "waxpeer", "white-market"];

function isCsfloatConfigured() {
  return Boolean(process.env.CSFLOAT_API_KEY?.trim());
}

function isCsfloatEnabled() {
  return process.env.CSFLOAT_SYNC_ENABLED !== "false";
}

async function runStep<T>(name: string, runner: () => Promise<T>, summarize: (result: T) => Omit<PipelineStepResult, "name" | "status">) {
  const startedAt = Date.now();

  try {
    logger.info(`Daily market pipeline step started: ${name}`);
    const result = await runner();
    const summary = {
      ...summarize(result),
      name,
      status: "SUCCESS" as const,
    };

    logger.info(`Daily market pipeline step completed: ${name}`, {
      durationMs: Date.now() - startedAt,
      ...summary,
    });

    return summary;
  } catch (error) {
    logger.error(`Daily market pipeline step failed: ${name}`, {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

export async function runDailyMarketPipeline() {
  const startedAt = new Date().toISOString();
  const summaries: PipelineStepResult[] = [];

  if (isCsfloatEnabled() && isCsfloatConfigured()) {
    const csfloatSummary = await runStep("csfloat", runCsfloatPriceListSync, (result) => ({
      ignored: result.itemsIgnored,
      persisted: result.itemsUpserted,
      upserted: result.itemsUpserted,
    }));
    summaries.push(csfloatSummary);
  } else {
    const reason = isCsfloatEnabled()
      ? "CSFLOAT_API_KEY is not configured."
      : "CSFLOAT_SYNC_ENABLED=false.";

    logger.warn("Daily market pipeline step skipped: csfloat", { reason });
    summaries.push({
      name: "csfloat",
      reason,
      status: "SKIPPED",
    });
  }

  for (const source of marketSources) {
    const summary = await runStep(source, () => runLatestPricesSyncJob(source), (result) => ({
      created: result.created,
      failed: result.failed,
      ignored: result.totalIgnored,
      persisted: result.totalPersisted,
      updated: result.updated,
    }));

    summaries.push(summary);
  }

  const snapshot = await runStep("daily-snapshot", runDailySnapshotJob, (result) => ({
    created: result.created,
    persisted: result.rowsWritten,
    updated: result.updated,
  }));
  summaries.push(snapshot);

  const totals = await prisma.$transaction([
    prisma.item.count(),
    prisma.market.count(),
    prisma.latestPrice.count(),
    prisma.dailySnapshot.count(),
    prisma.syncRun.count(),
  ]);

  return {
    database: {
      dailySnapshots: totals[3],
      items: totals[0],
      latestPrices: totals[2],
      markets: totals[1],
      syncRuns: totals[4],
    },
    finishedAt: new Date().toISOString(),
    startedAt,
    steps: summaries,
  };
}

if (isDirectExecution(import.meta.url)) {
  runDailyMarketPipeline()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
