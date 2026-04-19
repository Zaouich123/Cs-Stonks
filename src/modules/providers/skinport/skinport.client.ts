import type { SkinportItemRecord, SkinportPriceProviderConfig, SkinportSalesHistoryItem } from "@/modules/providers/skinport/skinport.types";

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

export class SkinportClient {
  constructor(
    private readonly config: SkinportPriceProviderConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async fetchItems(): Promise<SkinportItemRecord[]> {
    const searchParams = new URLSearchParams({
      app_id: String(this.config.appId),
      currency: this.config.currency,
      tradable: this.config.tradableOnly ? "1" : "0",
    });

    return this.requestJson<SkinportItemRecord[]>(`/items?${searchParams.toString()}`);
  }

  async fetchSalesHistory(): Promise<SkinportSalesHistoryItem[]> {
    const searchParams = new URLSearchParams({
      app_id: String(this.config.appId),
      currency: this.config.currency,
    });

    return this.requestJson<SkinportSalesHistoryItem[]>(`/sales/history?${searchParams.toString()}`);
  }

  async fetchSalesHistoryForTargets(targets: string[]): Promise<SkinportSalesHistoryItem[]> {
    const results: SkinportSalesHistoryItem[] = [];

    for (const chunk of chunkArray(targets, this.config.chunkSize)) {
      const searchParams = new URLSearchParams({
        app_id: String(this.config.appId),
        currency: this.config.currency,
        market_hash_name: chunk.join(","),
      });

      results.push(
        ...(await this.requestJson<SkinportSalesHistoryItem[]>(
          `/sales/history?${searchParams.toString()}`,
        )),
      );
    }

    return results;
  }

  private async requestJson<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.config.requestTimeoutMs);

    try {
      const response = await this.fetchImpl(`${this.config.baseUrl}${path}`, {
        headers: {
          "Accept-Encoding": "br",
        },
        method: "GET",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Skinport request failed with status ${response.status} for ${path}.`);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Skinport request timed out after ${this.config.requestTimeoutMs}ms for ${path}.`);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
