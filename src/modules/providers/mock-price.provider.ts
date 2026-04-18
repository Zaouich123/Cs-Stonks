import { mockPriceFixture } from "@/modules/providers/mock-data";
import type {
  PriceProvider,
  RawPriceProviderItem,
} from "@/modules/providers/provider.types";

export class MockPriceProvider implements PriceProvider {
  readonly provider = "mock_price_provider";

  async fetchLatestPrices(): Promise<RawPriceProviderItem[]> {
    return structuredClone(mockPriceFixture);
  }
}

