import type {
  CatalogProvider,
  RawCatalogProviderItem,
} from "@/modules/providers/provider.types";
import { readLocalJsonFixture } from "@/modules/providers/provider.file-utils";

export class JsonCatalogProvider implements CatalogProvider {
  readonly provider = "json_catalog_provider";

  async fetchCatalog(): Promise<RawCatalogProviderItem[]> {
    return readLocalJsonFixture<RawCatalogProviderItem[]>(
      "src/modules/providers/local-data/catalog.fixture.json",
    );
  }
}

