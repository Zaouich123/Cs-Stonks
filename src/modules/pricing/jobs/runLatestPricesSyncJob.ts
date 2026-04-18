import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { createLatestPricingSyncService } from "@/modules/bootstrap";
import type { PriceProviderSource } from "@/modules/providers/provider.types";

export async function runLatestPricesSyncJob(source: PriceProviderSource = "json") {
  const result = await createLatestPricingSyncService(source).syncLatestPrices();

  logger.info("Latest prices sync job completed.", {
    created: result.created,
    failed: result.failed,
    source,
    updated: result.updated,
  });

  return result;
}

if (isDirectExecution(import.meta.url)) {
  runLatestPricesSyncJob()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

