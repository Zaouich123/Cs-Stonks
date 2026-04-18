import type {
  CatalogProvider,
  RawCatalogProviderItem,
} from "@/modules/providers/provider.types";
import { readLocalJsonFixture } from "@/modules/providers/provider.file-utils";

export class LocalFallbackCatalogProvider implements CatalogProvider {
  readonly provider = "local_fallback_catalog_provider";

  async fetchCatalog(): Promise<RawCatalogProviderItem[]> {
    return readLocalJsonFixture<RawCatalogProviderItem[]>(
      "src/modules/providers/local-data/catalog.fixture.json",
    );
  }
}
