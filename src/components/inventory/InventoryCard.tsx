"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BarChart3, ExternalLink } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { Button, cn } from "@/components/ui/Button";
import { WearFloatBar } from "@/components/inventory/WearFloatBar";
import type { InventoryItem } from "@/modules/inventory/inventory.types";

interface InventoryCardProps {
  item: InventoryItem;
  onShowPrices: (item: InventoryItem) => void;
}

const rarityAccent: Record<string, string> = {
  "Covert": "from-red-500/45 via-rose-500/20 to-[#171923]",
  "Contraband": "from-amber-400/45 via-yellow-600/20 to-[#171923]",
  "Extraordinary": "from-violet-500/45 via-fuchsia-500/20 to-[#171923]",
  "Classified": "from-pink-500/45 via-purple-500/20 to-[#171923]",
  "Restricted": "from-purple-500/45 via-indigo-500/20 to-[#171923]",
};

function getNameClassName(name: string) {
  if (name.includes("StatTrak")) {
    return "text-orange-300";
  }

  if (name.includes("Souvenir")) {
    return "text-amber-300";
  }

  return "text-white";
}

export function InventoryCard({ item, onShowPrices }: InventoryCardProps) {
  const { formatMoney, t } = usePreferences();
  const accent = rarityAccent[item.rarity ?? ""] ?? "from-[#1f315a]/65 via-[#36182f]/40 to-[#171923]";
  const itemHref = item.itemId ? `/market/${item.itemId}` : null;

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/8 bg-[#151820] shadow-[0_16px_50px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-white/16 hover:bg-[#191d27]">
      <div className={cn("relative min-h-[230px] overflow-hidden bg-gradient-to-b", accent)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(255,255,255,0.15),transparent_30%),linear-gradient(180deg,transparent_50%,rgba(239,68,68,0.18))]" />
        <div className="absolute left-3 right-3 top-3 z-10">
          {itemHref ? (
            <Link href={itemHref} className={cn("line-clamp-2 text-sm font-bold", getNameClassName(item.displayName))}>
              {item.displayName}
            </Link>
          ) : (
            <h3 className={cn("line-clamp-2 text-sm font-bold", getNameClassName(item.displayName))}>
              {item.displayName}
            </h3>
          )}
          <p className="mt-1 text-xs font-semibold text-white/58">{item.exterior ?? item.type ?? "CS2 item"}</p>
        </div>

        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.displayName}
            className="absolute inset-x-4 bottom-7 top-14 m-auto max-h-[150px] w-[86%] object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.55)] transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-x-6 bottom-10 top-16 flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-white/35">
            No image
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-pink-500 to-blue-500" />
        {item.itemId ? (
          <Link
            href={`/market/${item.itemId}`}
            className="absolute bottom-3 right-3 z-10 rounded-full border border-white/15 bg-[#202431]/80 p-2 text-white/70 backdrop-blur transition hover:text-white"
            aria-label={`Ouvrir ${item.displayName}`}
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <WearFloatBar value={item.wear.value} />
          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-mono font-semibold text-white">
              {item.wear.value === null ? "Float N/A" : item.wear.value.toFixed(11)}
            </span>
            <span className="text-xs font-semibold text-white/65">
              {item.prices.length > 0 ? `${item.prices.length} ${t("markets").toLowerCase()}` : t("noPrice")}
            </span>
          </div>
        </div>

        {item.tags.length > 0 ? (
          <div className="flex min-h-6 flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-white/55">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div>
          <p className="text-xs font-semibold text-white/40">{t("priceReference")}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-white">
            {formatMoney(item.referencePrice, item.referenceCurrency)}
          </p>
        </div>

        <Button
          className="h-10 w-full rounded-lg text-sm font-bold"
          onClick={() => onShowPrices(item)}
          type="button"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          {t("viewAllPrices")}
        </Button>
      </div>
    </article>
  );
}
