"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, Package2, ShieldCheck } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { ItemDetailChart, ItemDetailChartPoint } from "@/components/market/ItemDetailChart";
import { ItemOriginPanel } from "@/components/market/ItemOriginPanel";
import { ItemVariantSidebar } from "@/components/market/ItemVariantSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { computeTrendStats } from "@/lib/charts/computeTrendStats";

interface ItemDetail {
  baseItemName: string | null;
  collection: string | null;
  displayName: string;
  exterior: string | null;
  id: string;
  imageUrl: string | null;
  itemType: string;
  marketHashName: string;
  phase?: string | null;
  rarity: string | null;
  skinName: string | null;
  slug: string;
  source: string;
  souvenir: boolean;
  stattrak: boolean;
  steamImageUrl: string | null;
  weapon: string | null;
}

interface ItemListRow {
  baseItemName: string | null;
  displayName: string;
  exterior: string | null;
  id: string;
  imageUrl?: string | null;
  itemType: string;
  marketHashName: string;
  slug: string;
  source?: string;
  souvenir?: boolean;
  stattrak?: boolean;
  steamImageUrl?: string | null;
}

interface PhaseOption {
  active: boolean;
  disabled?: boolean;
  href?: string | null;
  imageUrl?: string | null;
  label: string;
  onClick: () => void;
  phasePreviewLabel?: string | null;
}

interface ItemLatestPrice {
  marketName: string;
  marketSlug: string;
  minPrice: number | null;
  price: number;
  quantity: number | null;
  sales7dVolume: number | null;
}

interface ItemOriginData {
  collection: string | null;
  dropCases: Array<{
    collection: string | null;
    displayName: string;
    id: string;
    imageUrl: string | null;
    steamImageUrl: string | null;
  }>;
  inferredFromFinish?: boolean;
}

interface ItemHistoryRow {
  date: string;
  price: number;
  quantity: number | null;
}

const wearOrder = [
  "Factory New",
  "Minimal Wear",
  "Field-Tested",
  "Well-Worn",
  "Battle-Scarred",
] as const;

function inferYearLabel(item: ItemDetail) {
  const sourceText = [item.collection, item.marketHashName, item.displayName].filter(Boolean).join(" ");
  const match = sourceText.match(/\b(19|20)\d{2}\b/);

  return match ? match[0] : "Legacy";
}

function getFamilyQuery(item: ItemDetail) {
  return item.baseItemName ?? item.weapon ?? item.skinName ?? item.displayName;
}

function filterFamilyVariants(item: ItemDetail, items: ItemListRow[]) {
  const baseKey = item.baseItemName?.trim().toLowerCase();

  return items.filter((candidate) => {
    if (candidate.itemType !== item.itemType) {
      return false;
    }

    if (baseKey) {
      return candidate.baseItemName?.trim().toLowerCase() === baseKey;
    }

    return candidate.displayName.trim().toLowerCase() === item.displayName.trim().toLowerCase();
  });
}

function aggregateHistory(rows: ItemHistoryRow[]): ItemDetailChartPoint[] {
  const byDate = new Map<string, { count: number; price: number; volume: number }>();

  rows.forEach((row) => {
    const existing = byDate.get(row.date) ?? { count: 0, price: 0, volume: 0 };
    existing.count += 1;
    existing.price += row.price;
    existing.volume += row.quantity ?? 0;
    byDate.set(row.date, existing);
  });

  return Array.from(byDate.entries())
    .map(([date, values]) => ({
      date,
      price: values.price / values.count,
      volume: values.volume,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function getFlavor(item: Pick<ItemDetail, "souvenir" | "stattrak">) {
  if (item.souvenir) return "souvenir";
  if (item.stattrak) return "stattrak";
  return "standard";
}

function getKnownPhaseLabels(baseItemName: string | null) {
  if (!baseItemName) {
    return [];
  }

  if (baseItemName.includes("Gamma Doppler")) {
    return ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Emerald"];
  }

  if (baseItemName.includes("Doppler")) {
    return ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Ruby", "Sapphire", "Black Pearl"];
  }

  return [];
}

function getRowFlavor(item: Pick<ItemListRow, "displayName" | "souvenir" | "stattrak">) {
  if (item.souvenir || item.displayName.includes("Souvenir")) return "souvenir";
  if (item.stattrak || item.displayName.includes("StatTrak")) return "stattrak";
  return "standard";
}

function getPhaseLabel(item: Pick<ItemListRow, "displayName" | "marketHashName">) {
  const source = `${item.displayName} ${item.marketHashName}`;
  const patterns = [
    /Black Pearl/i,
    /Sapphire/i,
    /Ruby/i,
    /Emerald/i,
    /Phase 4/i,
    /Phase 3/i,
    /Phase 2/i,
    /Phase 1/i,
  ];

  const match = patterns.find((pattern) => pattern.test(source));
  return match ? source.match(match)?.[0] ?? null : null;
}

function formatUsd(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `$${value.toFixed(2)}`;
}

function renderVariantSummary(item: Pick<ItemDetail, "stattrak" | "souvenir"> | null) {
  if (item?.stattrak) {
    return <span className="text-orange-300">StatTrak enabled</span>;
  }

  if (item?.souvenir) {
    return <span className="text-amber-300">Souvenir edition</span>;
  }

  return <span className="text-white/75">Standard edition</span>;
}

export default function MarketItemDetailPage() {
  const router = useRouter();
  const params = useParams<{ itemId: string }>();
  const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;

  const [item, setItem] = React.useState<ItemDetail | null>(null);
  const [familyVariants, setFamilyVariants] = React.useState<ItemListRow[]>([]);
  const [latestPrices, setLatestPrices] = React.useState<ItemLatestPrice[]>([]);
  const [originData, setOriginData] = React.useState<ItemOriginData | null>(null);
  const [chartData, setChartData] = React.useState<ItemDetailChartPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fallbackPhasePreview, setFallbackPhasePreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!itemId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 90);

    Promise.all([
      fetch(`/api/items/${itemId}`, { signal: controller.signal }).then((res) => res.json()),
      fetch(`/api/items/${itemId}/origin`, { signal: controller.signal }).then((res) => res.json()),
      fetch(`/api/items/${itemId}/latest-prices?sort=price_asc`, { signal: controller.signal }).then((res) =>
        res.json(),
      ),
      fetch(`/api/items/${itemId}/history?from=${fromDate.toISOString()}&sort=asc`, {
        signal: controller.signal,
      }).then((res) => res.json()),
    ])
      .then(async ([itemRes, originRes, latestPricesRes, historyRes]) => {
        if (controller.signal.aborted || !itemRes.data) {
          return;
        }

        const nextItem = itemRes.data as ItemDetail;
        setItem(nextItem);
        setFallbackPhasePreview(nextItem.phase ?? null);
        setOriginData((originRes.data ?? null) as ItemOriginData | null);
        setLatestPrices((latestPricesRes.data?.prices ?? []) as ItemLatestPrice[]);
        setChartData(aggregateHistory((historyRes.data?.series ?? []) as ItemHistoryRow[]));

        const familyQuery = new URLSearchParams({
          limit: "50",
          query: getFamilyQuery(nextItem),
        });

        const familyRes = await fetch(`/api/items?${familyQuery.toString()}`, {
          signal: controller.signal,
        }).then((res) => res.json());

        if (controller.signal.aborted) {
          return;
        }

        const familyItems = ((familyRes.data?.items ?? []) as ItemListRow[]).filter(Boolean);
        setFamilyVariants(filterFamilyVariants(nextItem, familyItems));
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [itemId]);

  const stats = React.useMemo(
    () =>
      computeTrendStats(
        chartData.length > 0
          ? chartData
          : [{ date: new Date().toISOString().slice(0, 10), price: 0, volume: 0 }],
      ),
    [chartData],
  );

  const heroImage = item?.imageUrl ?? item?.steamImageUrl ?? null;
  const currentFlavor = item ? getFlavor(item) : "standard";
  const currentExterior = item?.exterior ?? "Base";
  const sortedWearOptions = React.useMemo(() => {
    const variants = familyVariants.length > 0 ? familyVariants : item ? [item] : [];
    const wears = Array.from(new Set(variants.map((variant) => variant.exterior ?? "Base")));

    return wears.sort((left, right) => {
      const leftIndex = wearOrder.indexOf(left as (typeof wearOrder)[number]);
      const rightIndex = wearOrder.indexOf(right as (typeof wearOrder)[number]);

      if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });
  }, [familyVariants, item]);

  const goToVariant = React.useCallback(
    (criteria: { exterior?: string; flavor?: string }) => {
      if (!item) {
        return;
      }

      const variants = familyVariants.length > 0 ? familyVariants : [item];
      const target = variants.find((candidate) => {
        const candidateFlavor = getRowFlavor(candidate);

        const flavorMatches = criteria.flavor ? candidateFlavor === criteria.flavor : true;
        const wearMatches = criteria.exterior ? (candidate.exterior ?? "Base") === criteria.exterior : true;
        return flavorMatches && wearMatches;
      });

      if (target && target.id !== item.id) {
        router.push(`/market/${target.id}`);
      }
    },
    [familyVariants, item, router],
  );

  const flavorAvailability = React.useMemo(() => {
    const variants = familyVariants.length > 0 ? familyVariants : item ? [item] : [];
    return {
      standard: variants.some(
        (candidate) =>
          !candidate.displayName.includes("StatTrak") && !candidate.displayName.includes("Souvenir"),
      ),
      stattrak: variants.some((candidate) => candidate.displayName.includes("StatTrak")),
      souvenir: variants.some((candidate) => candidate.displayName.includes("Souvenir")),
    };
  }, [familyVariants, item]);

  const currentMarketFloor = latestPrices.length > 0 ? latestPrices[0].price : null;
  const marketSupply = latestPrices.reduce((acc, row) => acc + (row.quantity ?? 0), 0);
  const weeklySold = latestPrices.reduce((acc, row) => acc + (row.sales7dVolume ?? 0), 0);
  const phaseOptions = React.useMemo<PhaseOption[]>(() => {
    if (!item) {
      return [];
    }

    const variants = familyVariants.length > 0 ? familyVariants : [item];
    const exactPhaseOptions = variants
      .filter((candidate) => {
        const candidateFlavor = getRowFlavor(candidate);
        const candidateWear = candidate.exterior ?? "Base";

        return candidateFlavor === currentFlavor && candidateWear === currentExterior;
      })
      .map((candidate) => {
        const phaseLabel = getPhaseLabel(candidate);

        if (!phaseLabel) {
          return null;
        }

        return {
          active: candidate.id === item.id,
          href: candidate.id !== item.id ? `/market/${candidate.id}` : null,
          imageUrl: candidate.imageUrl ?? candidate.steamImageUrl ?? heroImage,
          label: phaseLabel,
          phasePreviewLabel: phaseLabel,
          onClick: () => {
            if (candidate.id !== item.id) {
              router.push(`/market/${candidate.id}`);
            }
          },
        };
      })
      .filter((option): option is NonNullable<typeof option> => Boolean(option))
      .filter(
        (option, index, options) => options.findIndex((candidate) => candidate.label === option.label) === index,
      );

    if (exactPhaseOptions.length > 0) {
      return exactPhaseOptions;
    }

    const fallbackPhases = getKnownPhaseLabels(item.baseItemName);

    if (fallbackPhases.length === 0) {
      return [];
    }

    return fallbackPhases.map((label) => ({
      active: (fallbackPhasePreview ?? item.phase ?? "").toLowerCase() === label.toLowerCase(),
      imageUrl: heroImage,
      label,
      onClick: () => setFallbackPhasePreview(label),
      phasePreviewLabel: label,
    }));
  }, [currentExterior, currentFlavor, fallbackPhasePreview, familyVariants, heroImage, item, router]);

  if (!item && !loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-surface)] text-white">
        <Navbar />
        <main className="mx-auto flex max-w-[92rem] flex-col px-6 pb-24 pt-28 md:px-12 md:pt-36">
          <GlassCard className="p-10">
            <p className="text-sm uppercase tracking-[0.24em] text-white/35">Market item</p>
            <h1 className="mt-4 text-3xl font-semibold">Item not found</h1>
            <p className="mt-3 max-w-2xl text-white/55">
              This item could not be loaded from the current catalog.
            </p>
            <Link
              href="/prices"
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to market
            </Link>
          </GlassCard>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-surface)] text-white selection:bg-[#4da3ff]/30">
      <Navbar />

      <main className="relative z-10 mx-auto flex max-w-[92rem] flex-col px-6 pb-24 pt-24 md:px-12 md:pt-32">
        <div className="mb-6 flex items-center gap-3 text-sm text-white/45">
          <Link href="/prices" className="inline-flex items-center gap-2 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to market
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div>
            {item ? (
              <ItemVariantSidebar
                collection={item.collection}
                displayName={item.displayName}
                imageUrl={heroImage}
                imagePhasePreviewLabel={fallbackPhasePreview}
                priceLabel={formatUsd(currentMarketFloor)}
                rarity={item.rarity}
                source={item.source}
                yearLabel={inferYearLabel(item)}
                phaseOptions={phaseOptions}
                stattrakOptions={[
                  {
                    active: currentFlavor === "standard",
                    disabled: !flavorAvailability.standard,
                    label: "Standard",
                    onClick: () => goToVariant({ exterior: currentExterior, flavor: "standard" }),
                  },
                  {
                    active: currentFlavor === "stattrak",
                    disabled: !flavorAvailability.stattrak,
                    label: "StatTrak",
                    onClick: () => goToVariant({ exterior: currentExterior, flavor: "stattrak" }),
                  },
                  {
                    active: currentFlavor === "souvenir",
                    disabled: !flavorAvailability.souvenir,
                    label: "Souvenir",
                    onClick: () => goToVariant({ exterior: currentExterior, flavor: "souvenir" }),
                  },
                ]}
                wearOptions={sortedWearOptions.map((wear) => ({
                  active: wear === currentExterior,
                  label: wear,
                  onClick: () => goToVariant({ exterior: wear, flavor: currentFlavor }),
                }))}
              />
            ) : null}
          </div>

          <div className="space-y-6">
            <GlassCard className="relative overflow-hidden p-6 md:p-8">
              {loading ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[2rem] bg-[#030816]/55 backdrop-blur-sm">
                  <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/15 border-t-[#4da3ff]" />
                </div>
              ) : null}

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4da3ff]">
                      Price action
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">90 day market curve</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                      Historical market movement for the selected item variant, powered by your daily
                      snapshots.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Floor</p>
                      <p className="mt-2 text-xl font-semibold text-white">{formatUsd(currentMarketFloor)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Trend</p>
                      <p
                        className={`mt-2 text-xl font-semibold ${
                          stats.isNeutral ? "text-white" : stats.isPositive ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {stats.percentageChange >= 0 ? "+" : ""}
                        {stats.percentageChange.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Supply</p>
                      <p className="mt-2 text-xl font-semibold text-white">{marketSupply.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {chartData.length > 0 ? (
                  <ItemDetailChart data={chartData} isPositive={stats.isPositive} />
                ) : (
                  <div className="flex h-[320px] items-center justify-center rounded-[1.6rem] border border-white/8 bg-[#07101d] text-sm text-white/35 md:h-[380px]">
                    No historical data available for this variant yet.
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-white/45">
                      <BarChart3 className="h-4 w-4" />
                      <p className="text-[11px] uppercase tracking-[0.22em]">Weekly sales</p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-white">{weeklySold.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-white/45">
                      <Package2 className="h-4 w-4" />
                      <p className="text-[11px] uppercase tracking-[0.22em]">Collection</p>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-white">{item?.collection ?? "Unknown"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-white/45">
                      <ShieldCheck className="h-4 w-4" />
                      <p className="text-[11px] uppercase tracking-[0.22em]">Variant key</p>
                    </div>
                    <p className="mt-3 text-sm font-medium">{renderVariantSummary(item)}</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {item && !["CASE", "case", "CAPSULE", "capsule"].includes(item.itemType) ? (
              <ItemOriginPanel
                collection={originData?.collection ?? item?.collection ?? null}
                dropCases={originData?.dropCases ?? []}
                inferredFromFinish={originData?.inferredFromFinish ?? false}
              />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
