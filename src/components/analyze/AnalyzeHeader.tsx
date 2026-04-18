import * as React from "react";
import { TrendStats } from "@/lib/charts/computeTrendStats";
import { AnalyzePerformanceBadge } from "./AnalyzePerformanceBadge";
import { AnalyzeFilterSelect } from "./AnalyzeFilterSelect";
import { SkinSearchSelect } from "./SkinSearchSelect";

interface AnalyzeHeaderProps {
  skinName: string;
  stats: TrendStats;
  period: number;
  onPeriodChange: (days: number) => void;
  onSkinChange: (skinName: string) => void;
}

export function AnalyzeHeader({ skinName, stats, period, onPeriodChange, onSkinChange }: AnalyzeHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      <div className="space-y-2">
        <SkinSearchSelect value={skinName} onChange={onSkinChange} />
        <AnalyzePerformanceBadge stats={stats} />
      </div>
      <div className="flex items-center gap-3">
        <AnalyzeFilterSelect value={period} onChange={onPeriodChange} />
      </div>
    </div>
  );
}
