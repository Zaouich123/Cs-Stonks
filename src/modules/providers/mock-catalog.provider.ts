import { mockCatalogFixture } from "@/modules/providers/mock-data";
import type {
  CatalogProvider,
  RawCatalogProviderItem,
} from "@/modules/providers/provider.types";

export class MockCatalogProvider implements CatalogProvider {
  readonly provider = "mock_catalog_provider";

  async fetchCatalog(): Promise<RawCatalogProviderItem[]> {
    return structuredClone(mockCatalogFixture);
  }
}

