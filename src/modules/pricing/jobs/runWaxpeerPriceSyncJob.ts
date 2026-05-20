import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { runLatestPricesSyncJob } from "@/modules/pricing/jobs/runLatestPricesSyncJob";

export async function runWaxpeerPriceSyncJob() {
  const result = await runLatestPricesSyncJob("waxpeer");

  logger.info("WAXPEER price sync job completed.", {
    created: result.created,
    failed: result.failed,
    providerWarnings: result.providerWarnings.length,
    totalPersisted: result.totalPersisted,
    updated: result.updated,
  });

  return result;
}

if (isDirectExecution(import.meta.url)) {
  runWaxpeerPriceSyncJob()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
