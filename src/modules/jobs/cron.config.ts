import { DEFAULT_SNAPSHOT_HOUR, DEFAULT_SNAPSHOT_TIMEZONE } from "@/modules/snapshots/snapshot.service";

export const cronSchedules = {
  catalog: {
    description: "Catalog sync at low frequency.",
    expression: process.env.CATALOG_CRON ?? "0 3 * * *",
    recommendation: "Daily at 03:00 Europe/Paris or manual on MVP.",
    timezone: process.env.SNAPSHOT_TIMEZONE ?? DEFAULT_SNAPSHOT_TIMEZONE,
  },
  latestPrices: {
    description: "Latest prices sync on a medium cadence.",
    expression: process.env.LATEST_PRICES_CRON ?? "0 * * * *",
    recommendation: "Hourly for the sprint MVP.",
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

