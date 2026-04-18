"use client";

import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AnalyzeHeader } from "@/components/analyze/AnalyzeHeader";
import { AnalyzeChartPanel } from "@/components/analyze/AnalyzeChartPanel";
import { AnalyzeToolbar } from "@/components/analyze/AnalyzeToolbar";
import { ChartAnnotationLayer, Annotation, AnnotationType } from "@/components/analyze/ChartAnnotationLayer";
import { getSampleChartData, getSampleItemInfo } from "@/lib/charts/chartSampleMapper";
import { computeTrendStats } from "@/lib/charts/computeTrendStats";
import { GlassCard } from "@/components/ui/GlassCard";

export default function AnalyzePage() {
  const allChartData = getSampleChartData();
  const itemInfo = getSampleItemInfo();
  
  const [selectedSkin, setSelectedSkin] = React.useState(itemInfo.displayName);
  const [period, setPeriod] = React.useState<number>(90);
  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const chartRef = React.useRef<HTMLDivElement>(null);

  // Filter data based on period
  const chartData = React.useMemo(() => {
    if (period === 30) return allChartData.slice(-30);
    // Since mock data only has 90 days, 90 and 365 will both return the full 90 days for now
    return allChartData;
  }, [allChartData, period]);

  const stats = computeTrendStats(chartData);

  const handleSkinChange = (skinName: string) => {
    setSelectedSkin(skinName);
    // In the future, this will fetch data for the selected skin from the API
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

  return (
    <div className="relative min-h-screen bg-[color:var(--color-surface)] selection:bg-[#4da3ff]/30 text-white overflow-hidden pb-32">
      <Navbar />
      
      <main className="relative z-10 flex flex-col mx-auto w-full max-w-7xl px-6 pt-24 md:px-12 md:pt-32">
        <GlassCard className="p-6 md:p-10 w-full overflow-hidden">
          <AnalyzeHeader 
            skinName={selectedSkin} 
            stats={stats} 
            period={period}
            onPeriodChange={setPeriod}
            onSkinChange={handleSkinChange}
          />
          
          <div ref={chartRef} className="relative w-full bg-[#030816] rounded-xl overflow-hidden mt-6 p-4">
            <ChartAnnotationLayer 
              annotations={annotations} 
              onRemove={handleRemoveAnnotation} 
              onUpdate={handleUpdateAnnotation}
            />
            <AnalyzeChartPanel data={chartData} isPositive={stats.isPositive} />
          </div>

          <AnalyzeToolbar 
            onAddAnnotation={handleAddAnnotation}
            onClearAnnotations={handleClearAnnotations}
            chartRef={chartRef}
          />
        </GlassCard>

        {/* Market Data Footer */}
        <div className="mt-6 w-full flex items-center justify-between p-4 bg-[#0d182a]/50 border border-white/5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
            <span className="text-sm text-[color:var(--color-muted)] font-medium">Market Active</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-[color:var(--color-muted)] uppercase tracking-wider font-semibold">Total Market Supply</p>
              <p className="text-xl font-bold text-white">{itemInfo.stock !== undefined ? itemInfo.stock.toLocaleString() : "N/A"} Items</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
