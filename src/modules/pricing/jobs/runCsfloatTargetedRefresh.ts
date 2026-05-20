import { ApplicationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { createCsfloatIngestionService } from "@/modules/bootstrap";

function parseMarketHashNames(args: string[]) {
  return args.flatMap((arg) => arg.split(",")).map((name) => name.trim()).filter(Boolean);
}

export async function runCsfloatTargetedRefresh(marketHashNames: string[]) {
  if (marketHashNames.length === 0) {
    throw new ApplicationError(
      "CSFloat targeted refresh requires at least one market hash name argument.",
      400,
    );
  }

  const result = await createCsfloatIngestionService().sync({
    marketHashNames,
    mode: "targeted",
  });

  logger.info("CSFloat targeted refresh job completed.", {
    durationMs: result.durationMs,
    ignored: result.itemsIgnored,
    listingsReceived: result.listingsReceived,
    mapped: result.itemsMapped,
    requested: marketHashNames.length,
    status: result.status,
    upserted: result.itemsUpserted,
  });

  return result;
}

if (isDirectExecution(import.meta.url)) {
  runCsfloatTargetedRefresh(parseMarketHashNames(process.argv.slice(2)))
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

