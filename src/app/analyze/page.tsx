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
  const chartData = getSampleChartData();
  const itemInfo = getSampleItemInfo();
  const stats = computeTrendStats(chartData);

  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const chartRef = React.useRef<HTMLDivElement>(null);

  const handleAddAnnotation = (type: AnnotationType) => {
    setAnnotations((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        type,
        x: 100 + prev.length * 20, // offset slightly
        y: 100,
      },
    ]);
  };

  const handleRemoveAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClearAnnotations = () => {
    setAnnotations([]);
  };

  return (
    <div className="relative min-h-screen bg-[color:var(--color-surface)] selection:bg-[#4da3ff]/30 text-white overflow-hidden pb-32">
      <Navbar />
      
      <main className="relative z-10 flex flex-col mx-auto w-full max-w-7xl px-6 pt-24 md:px-12 md:pt-32">
        <GlassCard className="p-6 md:p-10 w-full overflow-hidden">
          <AnalyzeHeader skinName={itemInfo.displayName} stats={stats} />
          
          <div ref={chartRef} className="relative w-full bg-[#030816] rounded-xl overflow-hidden mt-6 p-4">
            <ChartAnnotationLayer 
              annotations={annotations} 
              onRemove={handleRemoveAnnotation} 
            />
            <AnalyzeChartPanel data={chartData} isPositive={stats.isPositive} />
          </div>

          <AnalyzeToolbar 
            onAddAnnotation={handleAddAnnotation}
            onClearAnnotations={handleClearAnnotations}
            chartRef={chartRef}
          />
        </GlassCard>
      </main>
    </div>
  );
}
