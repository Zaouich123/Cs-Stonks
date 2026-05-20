import cron from "node-cron";

import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { runCatalogSyncJob } from "@/modules/catalog/jobs/runCatalogSyncJob";
import { cronSchedules } from "@/modules/jobs/cron.config";
import { runCsfloatPriceListSync } from "@/modules/pricing/jobs/runCsfloatPriceListSync";
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

  const csfloatListingsSweepTask = cronSchedules.csfloatListingsSweep.enabled
    ? cron.schedule(
        cronSchedules.csfloatListingsSweep.expression,
        () => {
          void runCsfloatPriceListSync();
        },
        {
          timezone: cronSchedules.csfloatListingsSweep.timezone,
        },
      )
    : null;

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
    csfloatListingsSweepTask,
    skinportDailyIngestionTask,
    snapshotTask,
  };
}

if (isDirectExecution(import.meta.url)) {
  logger.info("Registering internal cron jobs.", {
    catalog: cronSchedules.catalog,
    csfloatListingsSweep: cronSchedules.csfloatListingsSweep,
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

