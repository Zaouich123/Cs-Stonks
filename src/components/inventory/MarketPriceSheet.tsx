"use client";

/* eslint-disable @next/next/no-img-element */
import { ExternalLink, X } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { Button } from "@/components/ui/Button";
import type { InventoryItem } from "@/modules/inventory/inventory.types";

interface MarketPriceSheetProps {
  item: InventoryItem | null;
  onClose: () => void;
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
  const { formatMoney, locale, t } = usePreferences();

  if (!item) {
    return null;
  }

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
                {item.prices.length} source{item.prices.length > 1 ? "s" : ""} disponible
                {item.prices.length > 1 ? "s" : ""}
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
          {item.prices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-8 text-center">
              <p className="text-lg font-semibold text-white">Aucun prix en base pour cet item.</p>
              <p className="mt-2 text-sm text-white/48">
                Il sera rempli quand le provider Skinport ou un autre marché aura une correspondance exacte.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {item.prices.map((price) => (
                <div
                  key={`${price.marketSlug}-${price.price}`}
                  className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.035] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-base font-bold text-white">{price.marketName}</p>
                    <p className="mt-1 text-xs text-white/42">
                      Mis à jour {formatDate(price.fetchedAt, locale)}
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
            Fermer
          </Button>
        </div>
      </section>
    </div>
  );
}
