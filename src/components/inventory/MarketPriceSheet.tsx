"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { ExternalLink, X } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { Button } from "@/components/ui/Button";
import type { InventoryItem, InventoryMarketPrice } from "@/modules/inventory/inventory.types";

interface MarketPriceSheetProps {
  item: InventoryItem | null;
  onClose: () => void;
}

interface LatestPricesResponse {
  data?: {
    prices: Array<InventoryMarketPrice & { sourceUpdatedAt?: string | null }>;
  };
  ok: boolean;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function MarketPriceSheet({ item, onClose }: MarketPriceSheetProps) {
  const { formatMoney, language, locale, t } = usePreferences();
  const [livePrices, setLivePrices] = React.useState<InventoryMarketPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = React.useState(false);
  const [priceError, setPriceError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!item) {
      setLivePrices([]);
      setPriceError(null);
      return;
    }

    setLivePrices(item.prices);
    setPriceError(null);

    if (!item.itemId) {
      return;
    }

    const controller = new AbortController();
    const loadError = language === "FR" ? "Impossible de charger les derniers prix." : "Unable to load latest prices.";

    setLoadingPrices(true);

    fetch(`/api/items/${item.itemId}/latest-prices?sort=market_asc`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as LatestPricesResponse;

        if (!response.ok || !payload.ok || !payload.data) {
          throw new Error(loadError);
        }

        setLivePrices(payload.data.prices);
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setPriceError(error instanceof Error ? error.message : loadError);
      })
      .finally(() => {
        setLoadingPrices(false);
      });

    return () => {
      controller.abort();
    };
  }, [item, language]);

  if (!item) {
    return null;
  }

  const prices = livePrices;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-3 backdrop-blur-md md:items-center">
      <button className="absolute inset-0 cursor-default" onClick={onClose} type="button" />

      <section className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#10141e] shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/8 p-5 md:p-6">
          <div className="flex min-w-0 gap-4">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.displayName}
                className="h-16 w-16 shrink-0 rounded-2xl bg-white/[0.04] object-contain p-2"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#4da3ff]">
                {t("viewAllPrices")}
              </p>
              <h2 className="mt-2 truncate text-2xl font-bold text-white">{item.displayName}</h2>
              <p className="mt-1 text-sm text-white/45">
                {prices.length} {t("viewAllPricesSources")}
                {loadingPrices ? ` · ${language === "FR" ? "actualisation..." : "refreshing..."}` : ""}
              </p>
            </div>
          </div>

          <button
            className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/60 transition hover:bg-white/[0.08] hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 md:p-6">
          {priceError ? (
            <div className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
              {priceError}{" "}
              {language === "FR"
                ? "Les prix affichés peuvent provenir du cache inventaire."
                : "Displayed prices may come from the inventory cache."}
            </div>
          ) : null}

          {prices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-8 text-center">
              <p className="text-lg font-semibold text-white">{t("noPriceInDb")}</p>
              <p className="mt-2 text-sm text-white/48">{t("noPriceInDbDescription")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prices.map((price) => (
                <div
                  key={`${price.marketSlug}-${price.price}`}
                  className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.035] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-base font-bold text-white">{price.marketName}</p>
                    <p className="mt-1 text-xs text-white/42">
                      {language === "FR" ? "Mis à jour" : "Updated"} {formatDate(price.fetchedAt, locale)}
                      {price.quantity !== null ? ` · ${price.quantity} listings` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-right text-xl font-black text-white">
                      {formatMoney(price.price, price.currency)}
                    </p>
                    {price.sourceMarketUrl || price.sourceItemUrl ? (
                      <a
                        className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/65 transition hover:text-white"
                        href={price.sourceItemUrl ?? price.sourceMarketUrl ?? "#"}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-white/8 p-5">
          <Button className="rounded-xl" onClick={onClose} variant="secondary">
            {t("close")}
          </Button>
        </div>
      </section>
    </div>
  );
}
