"use client";

import * as React from "react";
import { Info, PackageOpen, RefreshCcw, Search, SlidersHorizontal } from "lucide-react";

import { Button, cn } from "@/components/ui/Button";
import { InventoryCard } from "@/components/inventory/InventoryCard";
import { MarketPriceSheet } from "@/components/inventory/MarketPriceSheet";
import { usePreferences } from "@/components/preferences/PreferencesProvider";
import type {
  InventoryCacheInfo,
  InventoryItem,
  InventoryResponse,
  InventorySummary,
} from "@/modules/inventory/inventory.types";

interface InventoryDashboardProps {
  initialUser: {
    steamAvatar: string | null;
    steamId: string;
    steamPersonaName: string;
  };
}

type InventorySort = "name_asc" | "price_asc" | "price_desc" | "wear_asc" | "wear_desc";

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
  };
  ok: boolean;
}

const sortLabels: Record<"EN" | "FR", Record<InventorySort, string>> = {
  EN: {
    name_asc: "Name",
    price_asc: "Low price",
    price_desc: "High price",
    wear_asc: "Low wear",
    wear_desc: "High wear",
  },
  FR: {
    name_asc: "Nom",
    price_asc: "Prix bas",
    price_desc: "Prix élevé",
    wear_asc: "Wear bas",
    wear_desc: "Wear élevé",
  },
};

const emptySummary: InventorySummary = {
  matchedItems: 0,
  totalEstimatedValue: null,
  totalInventoryItems: 0,
  valueCurrency: null,
  valuedItems: 0,
};

const emptyCache: InventoryCacheInfo = {
  fetchedAt: null,
  isStale: false,
  source: "steam",
  ttlSeconds: 900,
  warning: null,
};

function getClientInventoryCacheKey(steamId: string) {
  return `cs-stonks:inventory:${steamId}`;
}

function readClientInventoryCache(steamId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getClientInventoryCacheKey(steamId));
    if (!rawValue) {
      return null;
    }

    const cached = JSON.parse(rawValue) as InventoryResponse;
    const fetchedAt = cached.cache.fetchedAt ? new Date(cached.cache.fetchedAt).getTime() : 0;
    const ttlMs = cached.cache.ttlSeconds * 1000;

    if (!fetchedAt || Date.now() - fetchedAt > ttlMs) {
      return null;
    }

    return {
      ...cached,
      cache: {
        ...cached.cache,
        source: "cache" as const,
      },
    };
  } catch {
    return null;
  }
}

function writeClientInventoryCache(steamId: string, inventory: InventoryResponse) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getClientInventoryCacheKey(steamId), JSON.stringify(inventory));
  } catch {
    // Inventory cache is a convenience only; failures should never block the UI.
  }
}

function getComparablePrice(item: InventoryItem) {
  return item.referencePrice ?? -1;
}

function sortItems(items: InventoryItem[], sort: InventorySort) {
  return [...items].sort((left, right) => {
    if (sort === "price_desc") {
      return getComparablePrice(right) - getComparablePrice(left);
    }

    if (sort === "price_asc") {
      return getComparablePrice(left) - getComparablePrice(right);
    }

    if (sort === "wear_asc") {
      return (left.wear.value ?? 2) - (right.wear.value ?? 2);
    }

    if (sort === "wear_desc") {
      return (right.wear.value ?? -1) - (left.wear.value ?? -1);
    }

    return left.displayName.localeCompare(right.displayName);
  });
}

function filterItems(items: InventoryItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) =>
    [item.displayName, item.exterior, item.itemType, item.rarity, item.type, ...item.tags]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

export function InventoryDashboard({ initialUser }: InventoryDashboardProps) {
  const { formatMoney, language, locale, t } = usePreferences();
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [summary, setSummary] = React.useState<InventorySummary>(emptySummary);
  const [cache, setCache] = React.useState<InventoryCacheInfo>(emptyCache);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<InventorySort>("price_desc");
  const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadInventory = React.useCallback(async (options: { refresh?: boolean } = {}) => {
    setLoading(true);
    setError(null);

    try {
      if (!options.refresh) {
        const cachedInventory = readClientInventoryCache(initialUser.steamId);

        if (cachedInventory) {
          setItems(cachedInventory.items);
          setSummary(cachedInventory.summary);
          setCache(cachedInventory.cache);
          setLoading(false);
          return;
        }
      }

      const response = await fetch(options.refresh ? "/api/inventory?refresh=1" : "/api/inventory", {
        headers: {
          Accept: "application/json",
        },
      });
      const payload = (await response.json()) as ApiResponse<InventoryResponse>;

      if (!payload.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to load Steam inventory.");
      }

      setItems(payload.data.items);
      setSummary(payload.data.summary);
      setCache(payload.data.cache);
      writeClientInventoryCache(initialUser.steamId, payload.data);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Unable to load Steam inventory.";

      setError(
        message.includes("rate-limiting") || message.includes("429")
          ? t("inventoryRateLimit")
          : message,
      );
    } finally {
      setLoading(false);
    }
  }, [initialUser.steamId, t]);

  React.useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const visibleItems = React.useMemo(
    () => sortItems(filterItems(items, query), sort),
    [items, query, sort],
  );

  return (
    <>
      <section className="space-y-5">
        <div className="flex flex-col gap-5 border-b border-white/8 pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                {t("inventory")} Steam
              </h1>
              <Info className="h-5 w-5 text-white/55" />
              <span className="text-sm font-bold text-[#2f8cff] md:text-base">
                {summary.totalInventoryItems || items.length} {t("items")}
                {summary.totalEstimatedValue !== null
                  ? ` (~${formatMoney(summary.totalEstimatedValue, summary.valueCurrency)})`
                  : ""}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/48">
              {t("connectedWith")} {initialUser.steamPersonaName}. {t("inventoryLead")}
            </p>
            {cache.fetchedAt ? (
              <p className="mt-1 text-xs font-semibold text-white/34">
                {t("dataSource")}: {cache.source === "cache" ? t("localCache") : "Steam"} · {t("updatedAt")}{" "}
                {new Intl.DateTimeFormat(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(cache.fetchedAt))}
                {cache.isStale ? ` · ${t("inventoryStaleCache")}` : ""}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative block md:w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
              <input
                className="h-11 w-full rounded-xl border border-white/8 bg-white/[0.045] pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/38 focus:border-[#4da3ff]/55 focus:bg-white/[0.065]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("inventorySearchPlaceholder")}
                value={query}
              />
            </label>

            <label className="relative block md:w-[190px]">
              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <select
                className="h-11 w-full appearance-none rounded-xl border border-white/8 bg-white/[0.045] pl-11 pr-4 text-sm font-bold text-white outline-none transition focus:border-[#4da3ff]/55"
                onChange={(event) => setSort(event.target.value as InventorySort)}
                value={sort}
              >
                {(Object.keys(sortLabels[language]) as InventorySort[]).map((value) => (
                  <option key={value} className="bg-[#10141e] text-white" value={value}>
                    {sortLabels[language][value]}
                  </option>
                ))}
              </select>
            </label>

            <Button
              className="h-11 rounded-xl px-4"
              disabled={loading}
              onClick={() => void loadInventory({ refresh: true })}
              type="button"
              variant="secondary"
            >
              <RefreshCcw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              {t("sync")}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/38">{t("matchedDb")}</p>
            <p className="mt-2 text-2xl font-black text-white">{summary.matchedItems}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/38">{t("withPrices")}</p>
            <p className="mt-2 text-2xl font-black text-white">{summary.valuedItems}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/38">{t("displayed")}</p>
            <p className="mt-2 text-2xl font-black text-white">{visibleItems.length}</p>
          </div>
        </div>

        {cache.warning ? (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
            {cache.warning} {t("syncInventoryFallback")}
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="mt-8 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          <p className="font-bold">{t("inventoryLoadError")}</p>
          <p className="mt-2 text-sm text-rose-100/75">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="h-[430px] animate-pulse rounded-2xl border border-white/8 bg-white/[0.035]"
            />
          ))}
        </div>
      ) : null}

      {!loading && !error && visibleItems.length === 0 ? (
        <div className="mt-8 flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/12 bg-white/[0.03] p-8 text-center">
          <PackageOpen className="h-10 w-10 text-white/35" />
          <p className="mt-4 text-xl font-bold text-white">{t("inventoryNoItemsTitle")}</p>
          <p className="mt-2 max-w-xl text-sm text-white/45">
            {t("inventoryNoItems")}
          </p>
        </div>
      ) : null}

      {!loading && !error && visibleItems.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 min-[1800px]:grid-cols-6">
          {visibleItems.map((item) => (
            <InventoryCard key={item.assetId} item={item} onShowPrices={setSelectedItem} />
          ))}
        </div>
      ) : null}

      <MarketPriceSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}
