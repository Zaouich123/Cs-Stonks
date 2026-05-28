"use client";

import * as React from "react";
import Link from "next/link";
import { usePreferences } from "@/components/preferences/PreferencesProvider";

interface ItemHistoryPoint {
  date?: string;
  hour?: string;
  price: number;
  snapshotDate?: string;
  snapshotHour?: string;
}

interface ItemRow {
  id: string;
  displayName: string;
  imageUrl: string | null;
  steamImageUrl: string | null;
  source: string;
  lowestCurrentPrice: number | null;
  lowestCurrentPriceCurrency: string | null;
  itemType: string;
  rarity: string | null;
}

interface PricesTableProps {
  query: string;
  itemType: string;
  page: number;
  onPageChange: (page: number) => void;
}

interface ItemTrendData {
  changePct: number | null;
  isPositive: boolean | null;
  points: number[];
}

const SPARKLINE_WIDTH = 92;
const SPARKLINE_HEIGHT = 32;

function renderDisplayName(value: string) {
  if (value.includes("StatTrak")) {
    return (
      <>
        <span className="text-orange-300">StatTrak</span>
        <span className="text-white"> {value.replace("StatTrak", "").trim()}</span>
      </>
    );
  }

  if (value.includes("Souvenir")) {
    return (
      <>
        <span className="text-amber-300">Souvenir</span>
        <span className="text-white"> {value.replace("Souvenir", "").trim()}</span>
      </>
    );
  }

  return <span className="text-white">{value}</span>;
}

function seedFromString(value: string) {
  return value.split("").reduce((seed, character) => seed + character.charCodeAt(0), 0);
}

function createMockTrend(item: ItemRow): ItemTrendData {
  const seed = seedFromString(item.id + item.displayName);
  const startPrice = item.lowestCurrentPrice ?? 100 + (seed % 80);
  const direction = seed % 2 === 0 ? 1 : -1;
  const volatility = 0.008 + ((seed % 7) * 0.003);
  const points = Array.from({ length: 7 }, (_, index) => {
    const wave = Math.sin((seed + index) * 0.85) * startPrice * 0.01;
    const drift = startPrice * volatility * index * direction;
    return Number((startPrice + drift + wave).toFixed(2));
  });
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const changePct = ((lastPoint - firstPoint) / firstPoint) * 100;

  return {
    changePct,
    isPositive: changePct >= 0,
    points,
  };
}

function buildSparklinePath(points: number[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    const y = SPARKLINE_HEIGHT / 2;
    return `M 0 ${y} L ${SPARKLINE_WIDTH} ${y}`;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * SPARKLINE_WIDTH;
      const y = SPARKLINE_HEIGHT - ((point - min) / range) * SPARKLINE_HEIGHT;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildSparklineAreaPath(points: number[]) {
  const linePath = buildSparklinePath(points);

  if (!linePath) {
    return "";
  }

  return `${linePath} L ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT} L 0 ${SPARKLINE_HEIGHT} Z`;
}

function getHistoryDate(row: ItemHistoryPoint) {
  return row.date ?? row.snapshotDate ?? "";
}

function compactDailyHistory(rows: ItemHistoryPoint[]) {
  const byDay = new Map<string, number>();

  // The prices table shows the current lowest market price, so the 7d trend uses
  // the lowest snapshot price per day across all markets too.
  rows.forEach((row) => {
    const day = getHistoryDate(row);

    if (!day || !Number.isFinite(row.price)) {
      return;
    }

    const existing = byDay.get(day);

    if (existing === undefined || row.price < existing) {
      byDay.set(day, row.price);
    }
  });

  return Array.from(byDay.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, price]) => price);
}

function computeTrendFromHistory(rows: ItemHistoryPoint[]): ItemTrendData | null {
  const points = compactDailyHistory(rows).slice(-7);

  if (points.length === 0) {
    return null;
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  if (!Number.isFinite(firstPoint) || !Number.isFinite(lastPoint)) {
    return null;
  }

  const changePct =
    firstPoint > 0 ? ((lastPoint - firstPoint) / firstPoint) * 100 : null;

  return {
    changePct,
    isPositive: changePct === null ? null : changePct >= 0,
    points,
  };
}

function Sparkline({
  points,
  isPositive,
}: {
  isPositive: boolean | null;
  points: number[];
}) {
  const path = buildSparklinePath(points);
  const areaPath = buildSparklineAreaPath(points);
  const gradientId = React.useId();
  const strokeColor =
    isPositive === null ? "rgba(255,255,255,0.45)" : isPositive ? "#34d399" : "#f87171";
  const glowColor =
    isPositive === null
      ? "rgba(255,255,255,0.08)"
      : isPositive
        ? "rgba(52, 211, 153, 0.18)"
        : "rgba(248, 113, 113, 0.18)";
  const topFadeColor =
    isPositive === null
      ? "rgba(255,255,255,0.24)"
      : isPositive
        ? "rgba(52, 211, 153, 0.28)"
        : "rgba(248, 113, 113, 0.28)";

  return (
    <svg
      aria-hidden="true"
      className="overflow-visible drop-shadow-[0_0_18px_rgba(9,48,102,0.18)]"
      height={SPARKLINE_HEIGHT}
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      width={SPARKLINE_WIDTH}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={topFadeColor} stopOpacity="1" />
          <stop offset="80%" stopColor={topFadeColor} stopOpacity="0.08" />
          <stop offset="100%" stopColor={topFadeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} opacity="0.95" />
      <path
        d={path}
        fill="none"
        opacity="0.42"
        stroke={glowColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
      />
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

export function PricesTable({ query, itemType, page, onPageChange }: PricesTableProps) {
  const { formatMoney, language, t } = usePreferences();
  const [items, setItems] = React.useState<ItemRow[]>([]);
  const [itemTrends, setItemTrends] = React.useState<Record<string, ItemTrendData>>({});
  const [loading, setLoading] = React.useState(true);
  const [totalItems, setTotalItems] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "30");
      params.set("page", String(page));
      if (query.trim()) params.set("query", query.trim());
      if (itemType) params.set("itemType", itemType);

      fetch(`/api/items?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setItems(data.data.items ?? []);
            setTotalItems(data.data.pagination?.totalItems ?? 0);
            setTotalPages(Math.max(data.data.pagination?.totalPages ?? 1, 1));
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, query ? 300 : 0);

    return () => clearTimeout(debounceRef.current);
  }, [page, query, itemType]);

  React.useEffect(() => {
    if (items.length === 0) {
      setItemTrends({});
      return;
    }

    const controller = new AbortController();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
    const from = fromDate.toISOString();

    Promise.all(
      items.map(async (item) => {
        try {
          const params = new URLSearchParams({
            from,
            sort: "asc",
          });
          const response = await fetch(`/api/items/${item.id}/history?${params.toString()}`, {
            signal: controller.signal,
          });

          if (!response.ok) {
            return [item.id, null] as const;
          }

          const payload = await response.json();
          const rows = (payload.data?.series ?? []) as ItemHistoryPoint[];
          return [item.id, computeTrendFromHistory(rows)] as const;
        } catch {
          return [item.id, null] as const;
        }
      }),
    )
      .then((entries) => {
        if (controller.signal.aborted) {
          return;
        }

        const nextTrends = Object.fromEntries(
          entries.filter((entry): entry is readonly [string, ItemTrendData] => entry[1] !== null),
        );

        setItemTrends(nextTrends);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [items]);

  const getImgSrc = (item: ItemRow) => item.imageUrl || item.steamImageUrl || null;
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <div className="overflow-x-auto w-full mt-2">
      {!loading && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-white/40">
            {totalItems} {language === "FR" ? "objets trouvés" : `item${totalItems !== 1 ? "s" : ""} found`}
          </p>
          <p className="text-sm text-white/30">
            {t("page")} {page} / {totalPages}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#4da3ff]" />
          <span className="ml-3 text-sm text-white/40">{t("loadingMarketData")}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-sm text-white/30">
          {query || itemType ? t("noItemsMatch") : t("noItemsFound")}
        </div>
      ) : (
        <table className="min-w-[760px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 text-sm text-[color:var(--color-muted)]">
              <th className="whitespace-nowrap px-4 pb-4 font-medium">{t("itemName")}</th>
              <th className="whitespace-nowrap px-4 pb-4 text-center font-medium">{t("type")}</th>
              <th className="whitespace-nowrap px-4 pb-4 text-center font-medium">Source</th>
              <th className="whitespace-nowrap px-4 pb-4 text-center font-medium">{language === "FR" ? "Prix" : "Price"}</th>
              <th className="whitespace-nowrap px-4 pb-4 text-center font-medium">7d {t("trend")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const imgSrc = getImgSrc(item);
              const trend = itemTrends[item.id] ?? createMockTrend(item);
              const trendLabel =
                trend?.changePct === null || trend?.changePct === undefined
                  ? null
                  : `${trend.changePct >= 0 ? "+" : ""}${trend.changePct.toFixed(1)}%`;
              const trendTextClass =
                trend?.isPositive === null || trend?.isPositive === undefined
                  ? "text-white/35"
                  : trend.isPositive
                    ? "text-emerald-300"
                    : "text-rose-300";

              return (
                <tr
                  key={item.id}
                  className="group border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-4">
                    <Link
                      href={`/market/${item.id}`}
                      className="flex items-center gap-3 font-medium text-white transition-colors group-hover:text-[#4da3ff]"
                    >
                      {imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgSrc}
                          alt={item.displayName}
                          className="h-12 w-12 shrink-0 rounded-lg bg-white/5 object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs text-white/20">
                          N/A
                        </div>
                      )}
                      <span>{renderDisplayName(item.displayName)}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-[color:var(--color-muted)]">
                    <span className="mx-auto block w-fit rounded-md border border-white/5 bg-[#0d182a] px-2.5 py-1 text-xs font-medium uppercase tracking-wider">
                      {item.itemType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[color:var(--color-muted)]">
                    <span className="mx-auto block w-fit rounded-md border border-white/5 bg-[#0d182a] px-2.5 py-1 capitalize">
                      {item.source}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-white">
                    {item.lowestCurrentPrice !== null ? (
                      formatMoney(item.lowestCurrentPrice, item.lowestCurrentPriceCurrency)
                    ) : (
                      <span className="text-white/30">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex min-w-[168px] items-center justify-center gap-3">
                      <Sparkline isPositive={trend.isPositive} points={trend.points} />
                      <div className={`min-w-[58px] text-right text-sm font-semibold ${trendTextClass}`}>
                        {trendLabel}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!loading && totalItems > 0 && (
        <div className="mt-6 flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/35">
            {language === "FR"
              ? `Page ${page} sur ${totalPages} pour ${totalItems} objets.`
              : `Showing page ${page} of ${totalPages} across ${totalItems} items.`}
          </p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={!hasPreviousPage}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {t("previous")}
            </button>
            <div className="min-w-[92px] text-center text-sm text-white/55">
              {page} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={!hasNextPage}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {t("next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
