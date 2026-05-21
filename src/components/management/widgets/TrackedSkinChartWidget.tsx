"use client";

import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, LineChart, Plus, Search, X } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import type { ManagementTrackedSkin } from "@/modules/management/types/management.types";
import { WidgetShell } from "@/components/management/widgets/WidgetShell";

interface ItemSearchRow {
  displayName: string;
  id: string;
  imageUrl: string | null;
  lowestCurrentPrice: number | null;
  lowestCurrentPriceCurrency: string | null;
  marketHashName: string;
  steamImageUrl: string | null;
}

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
  };
  ok: boolean;
}

interface TrackedSkinChartWidgetProps {
  onTrackedSkinsChange: (trackedSkins: ManagementTrackedSkin[]) => void;
  trackedSkins: ManagementTrackedSkin[];
}

type ChartMode = "price" | "stock";
type ChartRange = "7d" | "90d" | "1y";

const chartRangeOptions: Array<{ days: number; value: ChartRange }> = [
  { days: 7, value: "7d" },
  { days: 90, value: "90d" },
  { days: 365, value: "1y" },
];

function getChartRangeLabel(range: ChartRange, language: "FR" | "EN") {
  if (range === "1y") {
    return language === "FR" ? "1an" : "1y";
  }

  if (range === "7d") {
    return language === "FR" ? "7j" : "7d";
  }

  return language === "FR" ? "90j" : "90d";
}

function getChartRangeDays(range: ChartRange) {
  return chartRangeOptions.find((option) => option.value === range)?.days ?? 7;
}

function filterChartDataByRange<TPoint extends { date: string }>(data: TPoint[], range: ChartRange) {
  if (data.length < 2) {
    return data;
  }

  const lastPoint = data[data.length - 1];
  const lastTimestamp = Date.parse(lastPoint.date);

  if (!Number.isFinite(lastTimestamp)) {
    return data.slice(-getChartRangeDays(range));
  }

  const minimumTimestamp = lastTimestamp - (getChartRangeDays(range) - 1) * 24 * 60 * 60 * 1000;

  return data.filter((point) => {
    const pointTimestamp = Date.parse(point.date);
    return Number.isFinite(pointTimestamp) && pointTimestamp >= minimumTimestamp;
  });
}

function computePriceTrend(data: Array<{ price?: number }>) {
  const points = data.filter((point): point is { price: number } => typeof point.price === "number");

  if (points.length < 2) {
    return {
      absoluteChange: 0,
      isNeutral: true,
      isPositive: false,
      percentageChange: 0,
    };
  }

  const first = points[0].price;
  const last = points[points.length - 1].price;
  const absoluteChange = last - first;
  const percentageChange = first === 0 ? 0 : (absoluteChange / first) * 100;

  return {
    absoluteChange,
    isNeutral: absoluteChange === 0,
    isPositive: absoluteChange > 0,
    percentageChange,
  };
}

function useDebouncedValue(value: string, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(timer);
  }, [delayMs, value]);

  return debouncedValue;
}

function PremiumTrackedChart({
  color,
  data,
  dataKey,
  emptyLabel,
  formatValue,
  tooltipLabel,
}: {
  color: string;
  data: Array<{ date: string; price?: number; quantity?: number }>;
  dataKey: "price" | "quantity";
  emptyLabel: string;
  formatValue: (value: number) => string;
  tooltipLabel: string;
}) {
  const gradientId = React.useId();

  if (data.length < 2) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] text-sm text-white/40">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data} margin={{ bottom: 0, left: 0, right: 12, top: 14 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.32} />
              <stop offset="86%" stopColor={color} stopOpacity={0.04} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.055)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            minTickGap={34}
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: "rgba(255,255,255,0.48)", fontSize: 11 }}
            tickMargin={10}
          />
          <YAxis
            domain={["auto", "auto"]}
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: "rgba(255,255,255,0.48)", fontSize: 11 }}
            tickFormatter={(value) => formatValue(Number(value))}
            tickMargin={8}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(13, 24, 42, 0.94)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "14px",
              color: "#f8fafc",
            }}
            formatter={(value) => [formatValue(Number(value)), tooltipLabel]}
            labelStyle={{ color: "rgba(255,255,255,0.58)" }}
          />
          <Area
            dataKey={dataKey}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            stroke={color}
            strokeWidth={2.5}
            type="linear"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrackedSkinChartWidget({
  onTrackedSkinsChange,
  trackedSkins,
}: TrackedSkinChartWidgetProps) {
  const { formatMoney, language } = usePreferences();
  const [selectedSkinId, setSelectedSkinId] = React.useState(trackedSkins[0]?.id ?? "");
  const [searchOpen, setSearchOpen] = React.useState(trackedSkins.length === 0);
  const [chartMode, setChartMode] = React.useState<ChartMode>("price");
  const [chartRange, setChartRange] = React.useState<ChartRange>("7d");
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<ItemSearchRow[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [addingItemId, setAddingItemId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, 250);

  React.useEffect(() => {
    if (trackedSkins.length === 0) {
      setSelectedSkinId("");
      return;
    }

    if (!trackedSkins.some((skin) => skin.id === selectedSkinId)) {
      setSelectedSkinId(trackedSkins[0]?.id ?? "");
    }
  }, [selectedSkinId, trackedSkins]);

  React.useEffect(() => {
    const normalizedQuery = debouncedQuery.trim();

    if (normalizedQuery.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setSearching(true);

    fetch(`/api/items?limit=10&query=${encodeURIComponent(normalizedQuery)}`, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload: ApiResponse<{ items: ItemSearchRow[] }>) => {
        if (!controller.signal.aborted) {
          setResults(payload.ok ? payload.data?.items ?? [] : []);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const selectedSkin = trackedSkins.find((skin) => skin.id === selectedSkinId) ?? trackedSkins[0] ?? null;
  const priceChartData = React.useMemo(
    () => filterChartDataByRange(selectedSkin?.chartData ?? [], chartRange),
    [chartRange, selectedSkin?.chartData],
  );
  const stockChartData = React.useMemo(
    () => filterChartDataByRange(selectedSkin?.stockChartData ?? [], chartRange),
    [chartRange, selectedSkin?.stockChartData],
  );
  const rangeTrend = React.useMemo(() => computePriceTrend(priceChartData), [priceChartData]);
  const color = chartMode === "stock" ? "#4da3ff" : rangeTrend.isPositive ? "#22c55e" : "#ef4444";
  const chartData = chartMode === "stock" ? stockChartData : priceChartData;

  const addTrackedSkin = async (item: ItemSearchRow) => {
    setAddingItemId(item.id);
    setError(null);

    try {
      const response = await fetch("/api/management/tracked-skins", {
        body: JSON.stringify({
          itemId: item.id,
          label: item.displayName,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as ApiResponse<{ trackedSkins: ManagementTrackedSkin[] }>;

      if (!payload.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to track skin.");
      }

      onTrackedSkinsChange(payload.data.trackedSkins);
      setSelectedSkinId(
        payload.data.trackedSkins.find((skin) => skin.item.id === item.id)?.id ??
          payload.data.trackedSkins[0]?.id ??
          "",
      );
      setSearchOpen(false);
      setQuery("");
      setResults([]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to track skin.");
    } finally {
      setAddingItemId(null);
    }
  };

  return (
    <WidgetShell
      action={
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[#4da3ff]/30 bg-[#4da3ff]/10 px-3 py-1.5 text-xs font-semibold text-[#9acbff] transition hover:bg-[#4da3ff]/15"
            onClick={() => setSearchOpen((current) => !current)}
            type="button"
          >
            {searchOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {language === "FR" ? "Ajouter" : "Add"}
          </button>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/62 transition hover:text-white"
            href={selectedSkin ? `/analyze?itemId=${encodeURIComponent(selectedSkin.item.id)}` : "/analyze"}
          >
            Analyze
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      }
      className="xl:col-span-2"
      eyebrow={language === "FR" ? "Tracking prix" : "Price tracking"}
      title={language === "FR" ? "Skins suivis" : "Tracked skins"}
    >
      {searchOpen ? (
        <div className="mb-5 rounded-2xl border border-[#4da3ff]/18 bg-[#4da3ff]/[0.07] p-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/42" />
            <input
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#07101d]/85 pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/35 focus:border-[#4da3ff]/50"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={language === "FR" ? "Rechercher un skin a tracker..." : "Search a skin to track..."}
              value={query}
            />
          </label>

          {error ? <p className="mt-3 text-sm font-semibold text-rose-200">{error}</p> : null}

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {searching ? (
              <p className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-sm text-white/42">
                {language === "FR" ? "Recherche..." : "Searching..."}
              </p>
            ) : null}
            {!searching && query.trim().length >= 2 && results.length === 0 ? (
              <p className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-sm text-white/42">
                {language === "FR" ? "Aucun item trouve." : "No item found."}
              </p>
            ) : null}
            {results.map((item) => (
              <button
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.035] p-3 text-left transition hover:border-[#4da3ff]/35 hover:bg-white/[0.06] disabled:opacity-55"
                disabled={addingItemId === item.id}
                key={item.id}
                onClick={() => void addTrackedSkin(item)}
                type="button"
              >
                {item.imageUrl ?? item.steamImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={item.displayName}
                    className="h-12 w-12 rounded-xl object-contain"
                    src={item.imageUrl ?? item.steamImageUrl ?? ""}
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05]">
                    <LineChart className="h-4 w-4 text-white/35" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{item.displayName}</span>
                  <span className="text-xs text-white/40">
                    {formatMoney(item.lowestCurrentPrice, item.lowestCurrentPriceCurrency)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!selectedSkin ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-6">
          <p className="text-base font-semibold text-white">
            {language === "FR" ? "Aucun skin suivi" : "No tracked skin yet"}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/48">
            {language === "FR"
              ? "Ouvre le menu Ajouter, cherche un skin, puis selectionne-le pour afficher son graphique ici."
              : "Open the Add menu, search a skin, then select it to display its chart here."}
          </p>
          <button
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#4da3ff]/30 bg-[#4da3ff]/10 px-4 py-2 text-sm font-semibold text-[#9acbff] transition hover:bg-[#4da3ff]/15"
            onClick={() => setSearchOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            {language === "FR" ? "Ajouter un skin" : "Add a skin"}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {selectedSkin.item.imageUrl ?? selectedSkin.item.steamImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={selectedSkin.item.displayName}
                  className="h-16 w-16 rounded-2xl object-contain"
                  src={selectedSkin.item.imageUrl ?? selectedSkin.item.steamImageUrl ?? ""}
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05]">
                  <LineChart className="h-6 w-6 text-white/35" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-white">
                  {selectedSkin.label ?? selectedSkin.item.displayName}
                </p>
                <p className="mt-1 text-sm text-white/42">
                  {selectedSkin.latestPrice?.marketName ?? "No market"} ·{" "}
                  {formatMoney(selectedSkin.latestPrice?.price, selectedSkin.latestPrice?.currency)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-white/10 bg-white/[0.035] p-1">
                {(["price", "stock"] as const).map((mode) => (
                  <button
                    className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] transition ${
                      chartMode === mode ? "bg-[#4da3ff] text-white" : "text-white/48 hover:text-white"
                    }`}
                    key={mode}
                    onClick={() => setChartMode(mode)}
                    type="button"
                  >
                    {mode === "price"
                      ? language === "FR"
                        ? "Prix"
                        : "Price"
                      : language === "FR"
                        ? "Stock"
                        : "Stock"}
                  </button>
                ))}
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.035] p-1">
                {chartRangeOptions.map((option) => (
                  <button
                    className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] transition ${
                      chartRange === option.value ? "bg-white/14 text-white" : "text-white/48 hover:text-white"
                    }`}
                    key={option.value}
                    onClick={() => setChartRange(option.value)}
                    type="button"
                  >
                    {getChartRangeLabel(option.value, language)}
                  </button>
                ))}
              </div>

              {trackedSkins.length > 1 ? (
                <select
                  className="h-11 rounded-2xl border border-white/10 bg-[#07101d] px-4 text-sm font-semibold text-white outline-none transition focus:border-[#4da3ff]/55"
                  onChange={(event) => setSelectedSkinId(event.target.value)}
                  value={selectedSkin.id}
                >
                  {trackedSkins.map((skin) => (
                    <option className="bg-[#07101d]" key={skin.id} value={skin.id}>
                      {skin.label ?? skin.item.displayName}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <PremiumTrackedChart
              color={color}
              data={chartData}
              dataKey={chartMode === "stock" ? "quantity" : "price"}
              emptyLabel={
                chartMode === "stock"
                  ? language === "FR"
                    ? "Pas encore de donnees de stock pour ce skin."
                    : "No stock data yet for this tracked skin."
                  : language === "FR"
                    ? "Pas encore de donnees de prix pour ce skin."
                    : "No price data yet for this tracked skin."
              }
              formatValue={(value) =>
                chartMode === "stock"
                  ? `${Math.round(value)} listings`
                  : formatMoney(value, selectedSkin.latestPrice?.currency ?? "USD")
              }
              tooltipLabel={chartMode === "stock" ? "Stock" : "Price"}
            />
            <aside className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                {language === "FR"
                  ? `Tendance ${getChartRangeLabel(chartRange, language)}`
                  : `${getChartRangeLabel(chartRange, language)} trend`}
              </p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  rangeTrend.isNeutral ? "text-white" : rangeTrend.isPositive ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {rangeTrend.percentageChange >= 0 ? "+" : ""}
                {rangeTrend.percentageChange.toFixed(2)}%
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/35">
                {language === "FR" ? "Alerte cible" : "Target alert"}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {formatMoney(selectedSkin.targetPrice, selectedSkin.latestPrice?.currency)}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/35">
                {language === "FR" ? "Stock actuel" : "Current stock"}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {selectedSkin.currentStock === null || selectedSkin.currentStock === undefined
                  ? "N/A"
                  : `${selectedSkin.currentStock} listings`}
              </p>
              <Link
                className="mt-5 inline-flex w-full justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/64 transition hover:text-white"
                href={`/market/${selectedSkin.item.id}`}
              >
                {language === "FR" ? "Ouvrir fiche" : "Open item"}
              </Link>
            </aside>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
