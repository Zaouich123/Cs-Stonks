import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { SkinportDailyIngestionService } from "@/modules/pricing/skinport-daily-ingestion.service";

export async function runSkinportDailyIngestionJob() {
  const result = await new SkinportDailyIngestionService().syncLatestPrices();

  logger.info("Skinport daily ingestion job completed.", {
    created: result.created,
    durationMs: result.durationMs,
    failed: result.failed,
    ignored: result.totalIgnored,
    providerWarnings: result.providerWarnings.length,
    providerWarningCodeCounts: result.providerWarningCodeCounts,
    receivedProviderTargets: result.totalAttemptedTargets,
    requestedTargets: result.requestedTargets,
    totalReceived: result.totalReceived,
    updated: result.updated,
  });

  return result;
}

if (isDirectExecution(import.meta.url)) {
  runSkinportDailyIngestionJob()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
