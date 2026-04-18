import type {
  PriceProvider,
  RawPriceProviderItem,
} from "@/modules/providers/provider.types";
import { readLocalJsonFixture } from "@/modules/providers/provider.file-utils";

export class JsonPriceProvider implements PriceProvider {
  readonly provider = "json_price_provider";

  async fetchLatestPrices(): Promise<RawPriceProviderItem[]> {
    return readLocalJsonFixture<RawPriceProviderItem[]>(
      "src/modules/providers/local-data/latest-prices.fixture.json",
    );
  }
}

