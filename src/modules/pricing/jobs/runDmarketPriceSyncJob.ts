import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { runLatestPricesSyncJob } from "@/modules/pricing/jobs/runLatestPricesSyncJob";

export async function runDmarketPriceSyncJob() {
  const result = await runLatestPricesSyncJob("dmarket");

  logger.info("DMarket price sync job completed.", {
    created: result.created,
    failed: result.failed,
    providerWarnings: result.providerWarnings.length,
    totalPersisted: result.totalPersisted,
    updated: result.updated,
  });

  return result;
}

if (isDirectExecution(import.meta.url)) {
  runDmarketPriceSyncJob()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
