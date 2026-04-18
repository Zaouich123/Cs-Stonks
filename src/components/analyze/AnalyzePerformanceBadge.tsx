import * as React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { TrendStats } from "@/lib/charts/computeTrendStats";

interface AnalyzePerformanceBadgeProps {
  stats: TrendStats;
}

export function AnalyzePerformanceBadge({ stats }: AnalyzePerformanceBadgeProps) {
  const { absoluteChange, percentageChange, isPositive, isNeutral } = stats;
  
  const bgColor = isPositive ? "bg-green-500/10" : isNeutral ? "bg-gray-500/10" : "bg-red-500/10";
  const textColor = isPositive ? "text-green-500" : isNeutral ? "text-gray-400" : "text-red-500";
  const borderColor = isPositive ? "border-green-500/20" : isNeutral ? "border-gray-500/20" : "border-red-500/20";
  
  const Icon = isPositive ? ArrowUpRight : isNeutral ? Minus : ArrowDownRight;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${bgColor} ${textColor} ${borderColor}`}>
      <Icon className="w-4 h-4" strokeWidth={2.5} />
      <span className="font-semibold text-sm">
        {absoluteChange > 0 ? "+" : ""}{absoluteChange.toFixed(2)} ({percentageChange > 0 ? "+" : ""}{percentageChange.toFixed(2)}%)
      </span>
    </div>
  );
}
