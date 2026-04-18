import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { createLatestPricingSyncService } from "@/modules/bootstrap";
import {
  resolvePriceProviderSource,
  type PriceProviderSource,
} from "@/modules/providers/provider.types";

export async function runLatestPricesSyncJob(
  source: PriceProviderSource = resolvePriceProviderSource(process.env.PRICE_PROVIDER, "json"),
) {
  const result = await createLatestPricingSyncService(source).syncLatestPrices();

  logger.info("Latest prices sync job completed.", {
    created: result.created,
    durationMs: result.durationMs,
    failed: result.failed,
    ignored: result.totalIgnored,
    providerWarnings: result.providerWarnings.length,
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
