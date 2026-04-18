import cron from "node-cron";

import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { runCatalogSyncJob } from "@/modules/catalog/jobs/runCatalogSyncJob";
import { cronSchedules } from "@/modules/jobs/cron.config";
import { runLatestPricesSyncJob } from "@/modules/pricing/jobs/runLatestPricesSyncJob";
import { runDailySnapshotJob } from "@/modules/snapshots/jobs/runDailySnapshotJob";

export function registerCronJobs() {
  const catalogTask = cron.schedule(
    cronSchedules.catalog.expression,
    () => {
      void runCatalogSyncJob("json");
    },
    {
      timezone: cronSchedules.catalog.timezone,
    },
  );

  const latestPricesTask = cron.schedule(
    cronSchedules.latestPrices.expression,
    () => {
      void runLatestPricesSyncJob("json");
    },
    {
      timezone: cronSchedules.latestPrices.timezone,
    },
  );

  const snapshotTask = cron.schedule(
    cronSchedules.snapshot.expression,
    () => {
      void runDailySnapshotJob();
    },
    {
      timezone: cronSchedules.snapshot.timezone,
    },
  );

  return {
    catalogTask,
    latestPricesTask,
    snapshotTask,
  };
}

if (isDirectExecution(import.meta.url)) {
  logger.info("Registering internal cron jobs.", {
    catalog: cronSchedules.catalog,
    latestPrices: cronSchedules.latestPrices,
    snapshot: cronSchedules.snapshot,
  });

  if (process.env.ENABLE_INTERNAL_CRON !== "true") {
    logger.warn("Internal cron is disabled. Set ENABLE_INTERNAL_CRON=true to keep the scheduler alive.");
    console.log(JSON.stringify(cronSchedules, null, 2));
  } else {
    registerCronJobs();
    logger.info("Internal cron scheduler started.");
  }
}

