import { DEFAULT_SNAPSHOT_HOUR, DEFAULT_SNAPSHOT_TIMEZONE } from "@/modules/snapshots/snapshot.service";

export const cronSchedules = {
  catalog: {
    description: "Catalog sync at low frequency.",
    expression: process.env.CATALOG_CRON ?? "0 3 * * *",
    recommendation: "Daily at 03:00 Europe/Paris or manual on MVP.",
    timezone: process.env.SNAPSHOT_TIMEZONE ?? DEFAULT_SNAPSHOT_TIMEZONE,
  },
  skinportDailyIngestion: {
    description: "Complete Skinport ingestion used as the product source of truth.",
    expression: process.env.SKINPORT_DAILY_INGESTION_CRON ?? "30 1 * * *",
    recommendation: "Daily at 01:30 Europe/Paris.",
    timezone: process.env.SNAPSHOT_TIMEZONE ?? DEFAULT_SNAPSHOT_TIMEZONE,
  },
  csfloatListingsSweep: {
    description: "CSFloat aggregated price-list sync for broad market coverage.",
    enabled: process.env.CSFLOAT_SYNC_ENABLED === "true",
    expression: process.env.CSFLOAT_LISTINGS_SWEEP_CRON ?? "20 * * * *",
    recommendation: "Hourly at minute 20 Europe/Paris when a CSFloat API key is configured.",
    timezone: process.env.SNAPSHOT_TIMEZONE ?? DEFAULT_SNAPSHOT_TIMEZONE,
  },
  snapshot: {
    description: "Daily snapshot at a fixed logical hour without fetching providers.",
    expression: process.env.DAILY_SNAPSHOT_CRON ?? "5 2 * * *",
    recommendation: "Daily at 02:05 Europe/Paris.",
    snapshotHour: process.env.SNAPSHOT_HOUR ?? DEFAULT_SNAPSHOT_HOUR,
    timezone: process.env.SNAPSHOT_TIMEZONE ?? DEFAULT_SNAPSHOT_TIMEZONE,
  },
} as const;

