import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AnalyzeHeader } from "@/components/analyze/AnalyzeHeader";
import { AnalyzeChartPanel } from "@/components/analyze/AnalyzeChartPanel";
import { getSampleChartData, getSampleItemInfo } from "@/lib/charts/chartSampleMapper";
import { computeTrendStats } from "@/lib/charts/computeTrendStats";
import { GlassCard } from "@/components/ui/GlassCard";

export default function AnalyzePage() {
  const chartData = getSampleChartData();
  const itemInfo = getSampleItemInfo();
  const stats = computeTrendStats(chartData);

  return (
    <div className="relative min-h-screen bg-[color:var(--color-surface)] selection:bg-[#4da3ff]/30 text-white overflow-hidden pb-32">
      <Navbar />
      
      <main className="relative z-10 flex flex-col mx-auto w-full max-w-7xl px-6 pt-24 md:px-12 md:pt-32">
        <GlassCard className="p-6 md:p-10 w-full overflow-hidden">
          <AnalyzeHeader skinName={itemInfo.displayName} stats={stats} />
          
          <div className="relative w-full">
            <AnalyzeChartPanel data={chartData} isPositive={stats.isPositive} />
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
