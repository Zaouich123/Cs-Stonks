import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { createCsfloatIngestionService, createDailySnapshotService } from "@/modules/bootstrap";

export async function runCsfloatIngestionAndSnapshot() {
  const latestPrices = await createCsfloatIngestionService().sync({
    mode: "price-list",
  });
  const snapshot = await createDailySnapshotService().createDailySnapshot({
    triggerSource: "csfloat_ingestion_job",
  });

  logger.info("CSFloat ingestion and snapshot job completed.", {
    latestPriceStatus: latestPrices.status,
    nextCursor: latestPrices.nextCursor,
    rowsWritten: snapshot.rowsWritten,
    snapshotDate: snapshot.snapshotDate,
    snapshotHour: snapshot.snapshotHour,
    upserted: latestPrices.itemsUpserted,
  });

  return {
    latestPrices,
    snapshot,
  };
}

if (isDirectExecution(import.meta.url)) {
  runCsfloatIngestionAndSnapshot()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
