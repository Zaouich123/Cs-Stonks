import * as React from "react";
import { TrendStats } from "@/lib/charts/computeTrendStats";
import { AnalyzePerformanceBadge } from "./AnalyzePerformanceBadge";
import { AnalyzeFilterSelect } from "./AnalyzeFilterSelect";

interface AnalyzeHeaderProps {
  skinName: string;
  stats: TrendStats;
}

export function AnalyzeHeader({ skinName, stats }: AnalyzeHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[color:var(--color-ink)]">
          {skinName}
        </h1>
        <AnalyzePerformanceBadge stats={stats} />
      </div>
      <div className="flex items-center gap-3">
        <AnalyzeFilterSelect />
      </div>
    </div>
  );
}
