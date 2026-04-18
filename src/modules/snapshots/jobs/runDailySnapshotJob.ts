import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { createDailySnapshotService } from "@/modules/bootstrap";

export async function runDailySnapshotJob() {
  const result = await createDailySnapshotService().createDailySnapshot({
    triggerSource: "daily_snapshot_job",
  });

  logger.info("Daily snapshot job completed.", {
    replacedExisting: result.replacedExisting,
    rowsWritten: result.rowsWritten,
    snapshotDate: result.snapshotDate,
    snapshotHour: result.snapshotHour,
  });

  return result;
}

if (isDirectExecution(import.meta.url)) {
  runDailySnapshotJob()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

