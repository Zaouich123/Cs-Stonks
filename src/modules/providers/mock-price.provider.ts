import { mockPriceFixture } from "@/modules/providers/mock-data";
import type {
  PriceProviderFetchInput,
  PriceProviderFetchResult,
  PriceProvider,
} from "@/modules/providers/provider.types";

export class MockPriceProvider implements PriceProvider {
  readonly provider = "mock_price_provider";

  async fetchLatestPrices(input: PriceProviderFetchInput): Promise<PriceProviderFetchResult> {
    const items = structuredClone(mockPriceFixture);

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
