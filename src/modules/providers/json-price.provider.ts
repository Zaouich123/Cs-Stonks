import type {
  PriceProviderFetchInput,
  PriceProviderFetchResult,
  PriceProvider,
} from "@/modules/providers/provider.types";
import { readLocalJsonFixture } from "@/modules/providers/provider.file-utils";

export class JsonPriceProvider implements PriceProvider {
  readonly provider = "json_price_provider";

  async fetchLatestPrices(input: PriceProviderFetchInput): Promise<PriceProviderFetchResult> {
    const items = await readLocalJsonFixture<PriceProviderFetchResult["items"]>(
      "src/modules/providers/local-data/latest-prices.fixture.json",
    );

    return {
      items,
      summary: {
        attemptedTargets: input.items.length,
        requestedTargets: input.items.length,
        returnedRecords: items.length,
        skippedTargets: 0,
        truncatedTargets: 0,
        warnings: [],
      },
    };
  }
}
