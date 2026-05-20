import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { runLatestPricesSyncJob } from "@/modules/pricing/jobs/runLatestPricesSyncJob";

export async function runWhiteMarketPriceSyncJob() {
  const result = await runLatestPricesSyncJob("white-market");

  logger.info("white.market price sync job completed.", {
    created: result.created,
    failed: result.failed,
    providerWarnings: result.providerWarnings.length,
    totalPersisted: result.totalPersisted,
    updated: result.updated,
  });

  return result;
}

if (isDirectExecution(import.meta.url)) {
  runWhiteMarketPriceSyncJob()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
