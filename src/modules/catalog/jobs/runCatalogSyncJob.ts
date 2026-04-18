import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { createCatalogSyncService } from "@/modules/bootstrap";
import {
  resolveCatalogProviderSource,
  type CatalogProviderSource,
} from "@/modules/providers/provider.types";

export async function runCatalogSyncJob(
  source: CatalogProviderSource = resolveCatalogProviderSource(process.env.CATALOG_PROVIDER, "bymykel"),
) {
  const result = await createCatalogSyncService(source).syncCatalog();

  logger.info("Catalog sync job completed.", {
    created: result.created,
    failed: result.failed,
    imagesMissing: result.imagesMissing,
    imagesResolved: result.imagesResolved,
    source,
    updated: result.updated,
  });

  return result;
}

if (isDirectExecution(import.meta.url)) {
  runCatalogSyncJob()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
