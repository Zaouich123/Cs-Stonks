import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { createCsfloatIngestionService } from "@/modules/bootstrap";

export async function runCsfloatPriceListSync() {
  const result = await createCsfloatIngestionService().sync({
    mode: "price-list",
  });

  logger.info("CSFloat price-list sync job completed.", {
    durationMs: result.durationMs,
    ignored: result.itemsIgnored,
    mapped: result.itemsMapped,
    recordsReceived: result.listingsReceived,
    status: result.status,
    upserted: result.itemsUpserted,
  });

  return result;
}

if (isDirectExecution(import.meta.url)) {
  runCsfloatPriceListSync()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

