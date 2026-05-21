"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { AnalyzeHeader } from "@/components/analyze/AnalyzeHeader";
import { AnalyzeChartPanel } from "@/components/analyze/AnalyzeChartPanel";
import { AnalyzeToolbar } from "@/components/analyze/AnalyzeToolbar";
import { ChartAnnotationLayer, Annotation, AnnotationType } from "@/components/analyze/ChartAnnotationLayer";
import { ChartDrawingLayer, type DrawingPath } from "@/components/analyze/ChartDrawingLayer";
import { computeTrendStats } from "@/lib/charts/computeTrendStats";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePreferences } from "@/components/preferences/PreferencesProvider";
import type { ChartDataPoint } from "@/lib/charts/chartSampleMapper";
import { ANALYZE_MARKETS, type MarketItem } from "@/components/analyze/MarketSearchSelect";

interface SkinItem {
  id: string;
  displayName: string;
  imageUrl: string | null;
  steamImageUrl: string | null;
}

function AnalyzePageContent() {
  const { formatMoney, language, t } = usePreferences();
  const searchParams = useSearchParams();
  const requestedItemId = searchParams.get("itemId") ?? searchParams.get("item");
  const [selectedSkin, setSelectedSkin] = React.useState<SkinItem | null>(null);
  const [selectedMarket, setSelectedMarket] = React.useState<MarketItem>(ANALYZE_MARKETS[0]);
  const [period, setPeriod] = React.useState<number>(90);
  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const [drawingColor, setDrawingColor] = React.useState("#4da3ff");
  const [drawingPaths, setDrawingPaths] = React.useState<DrawingPath[]>([]);
  const [isDrawingEnabled, setIsDrawingEnabled] = React.useState(false);
  const [redoDrawingPaths, setRedoDrawingPaths] = React.useState<DrawingPath[]>([]);
  const chartRef = React.useRef<HTMLDivElement>(null);

  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([]);
  const [marketStats, setMarketStats] = React.useState<{ currency: string | null; price: number; quantity: number } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (requestedItemId) {
      fetch(`/api/items/${requestedItemId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setSelectedSkin(data.data);
          }
        })
        .catch(() => {});

      return;
    }

    fetch("/api/items?limit=1&query=AK-47%20|%20Redline%20(Field-Tested)")
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.items?.[0]) {
          setSelectedSkin(data.data.items[0]);
        } else {
          fetch("/api/items?limit=1")
            .then((res) => res.json())
            .then((data2) => {
              if (data2.data?.items?.[0]) setSelectedSkin(data2.data.items[0]);
            });
        }
      })
      .catch(() => {});
  }, [requestedItemId]);

  React.useEffect(() => {
    if (!selectedSkin) return;
    setLoading(true);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - period);
    const toDate = new Date();

    const marketSlug = selectedMarket.slug === "general" ? undefined : selectedMarket.slug;

    const historyUrl = new URL(`/api/items/${selectedSkin.id}/history`, window.location.origin);
    historyUrl.searchParams.set("from", fromDate.toISOString());
    historyUrl.searchParams.set("to", toDate.toISOString());
    if (marketSlug) historyUrl.searchParams.set("market", marketSlug);

    const pricesUrl = new URL(`/api/items/${selectedSkin.id}/latest-prices`, window.location.origin);

    interface HistoryRow {
      date: string;
      price: number;
      quantity: number | null;
    }

    interface PriceRow {
      currency: string;
      marketSlug: string;
      price: number;
      quantity: number | null;
    }

    Promise.all([
      fetch(historyUrl.toString()).then((res) => res.json()),
      fetch(pricesUrl.toString()).then((res) => res.json()),
    ])
      .then(([historyRes, pricesRes]) => {
        if (historyRes.data?.series) {
          const dataMap = new Map<string, { price: number; volume: number; count: number }>();
          historyRes.data.series.forEach((row: HistoryRow) => {
            const dateStr = new Date(row.date).toISOString().split("T")[0];
            const existing = dataMap.get(dateStr) || { price: 0, volume: 0, count: 0 };
            existing.price += row.price;
            existing.volume += row.quantity || 0;
            existing.count += 1;
            dataMap.set(dateStr, existing);
          });

          const newChartData = Array.from(dataMap.entries())
            .map(([date, values]) => ({
              date,
              price: values.price / values.count,
              volume: values.volume,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          setChartData(newChartData);
        } else {
          setChartData([]);
        }

        if (pricesRes.data?.prices) {
          let currentPrice = 0;
          let currentQty = 0;
          let currentCurrency: string | null = null;
          if (marketSlug) {
            const marketData = pricesRes.data.prices.find((p: PriceRow) => p.marketSlug === marketSlug);
            if (marketData) {
              currentPrice = marketData.price;
              currentQty = marketData.quantity || 0;
              currentCurrency = marketData.currency;
            }
          } else {
            if (pricesRes.data.prices.length > 0) {
              const lowestPrices = pricesRes.data.prices.map((p: PriceRow) => p.price);
              currentPrice = lowestPrices.reduce((a: number, b: number) => a + b, 0) / lowestPrices.length;
              currentQty = pricesRes.data.prices.reduce((acc: number, p: PriceRow) => acc + (p.quantity || 0), 0);
              currentCurrency = pricesRes.data.prices[0]?.currency ?? null;
            }
          }
          setMarketStats({ currency: currentCurrency, price: currentPrice, quantity: currentQty });
        } else {
          setMarketStats(null);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedSkin, selectedMarket, period]);

  const stats = computeTrendStats(chartData.length > 0 ? chartData : [{ date: new Date().toISOString(), price: 0, volume: 0 }]);

  const handleSkinChange = (skinName: string, item?: SkinItem) => {
    if (item) setSelectedSkin(item);
  };

  const handleMarketChange = (marketName: string, market?: MarketItem) => {
    const nextMarket =
      market ??
      ANALYZE_MARKETS.find((item) => item.name === marketName || item.slug === marketName) ??
      ANALYZE_MARKETS[0];
    setSelectedMarket(nextMarket);
  };

  const handleAddAnnotation = (type: AnnotationType) => {
    setAnnotations((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        type,
        x: 100 + prev.length * 20,
        y: 100,
        width: 192,
        height: 128,
      },
    ]);
  };

  const handleRemoveAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleClearAnnotations = () => {
    setAnnotations([]);
  };

  const handleCommitDrawingPath = React.useCallback((path: DrawingPath) => {
    setDrawingPaths((prev) => [...prev, path]);
    setRedoDrawingPaths([]);
  }, []);

  const handleDrawingColorChange = React.useCallback((color: string) => {
    setDrawingColor((currentColor) => {
      const nextColor = color.toLowerCase();
      return currentColor.toLowerCase() === nextColor ? currentColor : nextColor;
    });
  }, []);

  const handleUndoDrawing = React.useCallback(() => {
    if (drawingPaths.length === 0) {
      return;
    }

    const lastPath = drawingPaths[drawingPaths.length - 1];
    setDrawingPaths(drawingPaths.slice(0, -1));
    setRedoDrawingPaths((redo) => [lastPath, ...redo]);
  }, [drawingPaths]);

  const handleRedoDrawing = React.useCallback(() => {
    if (redoDrawingPaths.length === 0) {
      return;
    }

    const [nextPath, ...rest] = redoDrawingPaths;
    setDrawingPaths((paths) => [...paths, nextPath]);
    setRedoDrawingPaths(rest);
  }, [redoDrawingPaths]);

  const handleFullClean = React.useCallback(() => {
    setAnnotations([]);
    setDrawingPaths([]);
    setRedoDrawingPaths([]);
  }, []);

  return (
    <div className="relative min-h-screen bg-[color:var(--color-surface)] selection:bg-[#4da3ff]/30 text-white overflow-hidden pb-32">
      <Navbar />

      <main className="relative z-10 flex flex-col mx-auto w-full max-w-7xl px-6 pt-24 md:px-12 md:pt-32">
        <GlassCard className="p-6 md:p-10 w-full overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a1628]/50 backdrop-blur-sm rounded-3xl">
              <div className="w-8 h-8 border-4 border-white/20 border-t-[#4da3ff] rounded-full animate-spin" />
            </div>
          )}

          <AnalyzeHeader
            selectedSkin={selectedSkin}
            skinName={selectedSkin?.displayName || "Loading..."}
            marketName={selectedMarket.name}
            stats={stats}
            period={period}
            onPeriodChange={setPeriod}
            onSkinChange={handleSkinChange}
            onMarketChange={handleMarketChange}
          />

          <div ref={chartRef} className="relative w-full bg-[#030816] rounded-xl overflow-hidden mt-6 p-4">
            <ChartAnnotationLayer
              annotations={annotations}
              onRemove={handleRemoveAnnotation}
              onUpdate={handleUpdateAnnotation}
            />
            {chartData.length > 0 ? (
              <AnalyzeChartPanel data={chartData} isPositive={stats.isPositive} />
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center text-white/30 text-sm">
                {!loading && "No chart data available for this selection."}
              </div>
            )}
            <ChartDrawingLayer
              color={drawingColor}
              enabled={isDrawingEnabled}
              onCommitPath={handleCommitDrawingPath}
              paths={drawingPaths}
            />
          </div>

          <AnalyzeToolbar
            canRedoDrawing={redoDrawingPaths.length > 0}
            canUndoDrawing={drawingPaths.length > 0}
            drawingColor={drawingColor}
            isDrawingEnabled={isDrawingEnabled}
            onAddAnnotation={handleAddAnnotation}
            onClearAnnotations={handleClearAnnotations}
            onDrawingColorChange={handleDrawingColorChange}
            onFullClean={handleFullClean}
            onRedoDrawing={handleRedoDrawing}
            onToggleDrawing={() => setIsDrawingEnabled((enabled) => !enabled)}
            onUndoDrawing={handleUndoDrawing}
            chartRef={chartRef}
          />
        </GlassCard>

        {/* Market Data Footer */}
        <div className="mt-6 w-full flex items-center justify-between p-4 bg-[#0d182a]/50 border border-white/5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)] ${loading ? "bg-yellow-500 animate-pulse shadow-yellow-500" : "bg-green-500"}`} />
            <span className="text-sm text-[color:var(--color-muted)] font-medium">
              {loading ? t("loadingMarketData") : t("marketActive")}
            </span>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-xs text-[color:var(--color-muted)] uppercase tracking-wider font-semibold">
                {selectedMarket.slug === "general"
                  ? language === "FR"
                    ? "Prix moyen le plus bas"
                    : "Avg Lowest Price"
                  : language === "FR"
                    ? "Prix le plus bas"
                    : "Lowest Price"}
              </p>
              <p className="text-xl font-bold text-white">
                {marketStats?.price ? formatMoney(marketStats.price, marketStats.currency) : "N/A"}
              </p>
            </div>
            <div className="w-px h-10 bg-white/10 hidden md:block" />
            <div className="text-right">
              <p className="text-xs text-[color:var(--color-muted)] uppercase tracking-wider font-semibold">
                {selectedMarket.slug === "general"
                  ? language === "FR"
                    ? "Offre totale"
                    : "Total Market Supply"
                  : language === "FR"
                    ? "Offre marché"
                    : "Market Supply"}
              </p>
              <p className="text-xl font-bold text-white">
                {marketStats?.quantity !== undefined && marketStats.quantity !== null
                  ? `${marketStats.quantity.toLocaleString()} ${t("items")}`
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[color:var(--color-surface)] text-white">
          <Navbar />
          <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/15 border-t-[#4da3ff]" />
          </main>
        </div>
      }
    >
      <AnalyzePageContent />
    </React.Suspense>
  );
}
