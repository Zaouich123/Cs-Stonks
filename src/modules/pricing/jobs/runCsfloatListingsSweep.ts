import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { createCsfloatIngestionService } from "@/modules/bootstrap";

export async function runCsfloatListingsSweep() {
  const result = await createCsfloatIngestionService().sync({
    mode: "sweep",
  });

  logger.info("CSFloat listings sweep job completed.", {
    durationMs: result.durationMs,
    ignored: result.itemsIgnored,
    listingsReceived: result.listingsReceived,
    mapped: result.itemsMapped,
    nextCursor: result.nextCursor,
    pagesFetched: result.pagesFetched,
    status: result.status,
    upserted: result.itemsUpserted,
  });

  return result;
}

if (isDirectExecution(import.meta.url)) {
  runCsfloatListingsSweep()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

