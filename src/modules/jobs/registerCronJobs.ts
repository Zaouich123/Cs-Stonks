import cron from "node-cron";

import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { runCatalogSyncJob } from "@/modules/catalog/jobs/runCatalogSyncJob";
import { cronSchedules } from "@/modules/jobs/cron.config";
import { runSkinportDailyIngestionJob } from "@/modules/pricing/jobs/runSkinportDailyIngestionJob";
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

  const skinportDailyIngestionTask = cron.schedule(
    cronSchedules.skinportDailyIngestion.expression,
    () => {
      void runSkinportDailyIngestionJob();
    },
    {
      timezone: cronSchedules.skinportDailyIngestion.timezone,
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
    skinportDailyIngestionTask,
    snapshotTask,
  };
}

if (isDirectExecution(import.meta.url)) {
  logger.info("Registering internal cron jobs.", {
    catalog: cronSchedules.catalog,
    skinportDailyIngestion: cronSchedules.skinportDailyIngestion,
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

