import * as React from "react";
import { TrendStats } from "@/lib/charts/computeTrendStats";
import { AnalyzePerformanceBadge } from "./AnalyzePerformanceBadge";
import { AnalyzeFilterSelect } from "./AnalyzeFilterSelect";
import { MarketSearchSelect } from "./MarketSearchSelect";
import { SkinSearchSelect, type SkinItem } from "./SkinSearchSelect";

interface AnalyzeHeaderProps {
  skinName: string;
  marketName: string;
  stats: TrendStats;
  period: number;
  onPeriodChange: (days: number) => void;
  onSkinChange: (skinName: string, item?: SkinItem) => void;
  onMarketChange: (marketName: string) => void;
}

export function AnalyzeHeader({ skinName, marketName, stats, period, onPeriodChange, onSkinChange, onMarketChange }: AnalyzeHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <SkinSearchSelect value={skinName} onChange={onSkinChange} />
          <div className="h-8 w-px bg-white/10 hidden md:block" />
          <MarketSearchSelect value={marketName} onChange={onMarketChange} />
        </div>
        <AnalyzePerformanceBadge stats={stats} />
      </div>
      <div className="flex items-center gap-3">
        <AnalyzeFilterSelect value={period} onChange={onPeriodChange} />
      </div>
    </div>
  );
}
