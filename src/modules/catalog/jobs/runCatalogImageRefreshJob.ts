import { logger } from "@/lib/logger";
import { isDirectExecution } from "@/lib/runtime";
import { createCatalogSyncService } from "@/modules/bootstrap";
import {
  resolveCatalogProviderSource,
  type CatalogProviderSource,
} from "@/modules/providers/provider.types";

export async function runCatalogImageRefreshJob(
  source: CatalogProviderSource = resolveCatalogProviderSource(process.env.CATALOG_PROVIDER, "bymykel"),
) {
  const result = await createCatalogSyncService(source).syncCatalog();

  logger.info("Catalog image refresh job completed.", {
    failed: result.failed,
    imagesMissing: result.imagesMissing,
    imagesResolved: result.imagesResolved,
    source,
  });

  return result;
}

if (isDirectExecution(import.meta.url)) {
  runCatalogImageRefreshJob()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
