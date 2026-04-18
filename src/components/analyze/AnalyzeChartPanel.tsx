"use client";

import * as React from "react";
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { ChartDataPoint } from "@/lib/charts/chartSampleMapper";

interface AnalyzeChartPanelProps {
  data: ChartDataPoint[];
  isPositive: boolean;
}

export function AnalyzeChartPanel({ data, isPositive }: AnalyzeChartPanelProps) {
  const color = isPositive ? "#22c55e" : "#ef4444"; // Tailwind green-500 or red-500
  const volumeColor = "#a855f7"; // Purple for volume like the image

  // Custom tooltip for premium feel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0d182a]/90 backdrop-blur-md border border-[color:var(--color-border)] p-3 rounded-lg shadow-xl">
          <p className="text-[color:var(--color-muted)] text-xs mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-white font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name === 'price' ? `$${entry.value.toFixed(2)}` : `${entry.value} units`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col mt-8 relative gap-1">
      {/* Price Chart */}
      <div className="flex items-center w-full h-[300px] md:h-[350px]">
        <span className="text-xs font-semibold text-white/40 -rotate-90 whitespace-nowrap shrink-0 -mr-3">Price in $</span>
        <div className="flex-1 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              syncId="marketChart"
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                hide
              />
              <YAxis 
                domain={['auto', 'auto']}
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
                tickMargin={5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="linear" 
                dataKey="price" 
                name="price"
                stroke={color} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volume Chart */}
      <div className="flex items-center w-full h-[100px] md:h-[120px]">
        <span className="text-xs font-semibold text-white/40 -rotate-90 whitespace-nowrap shrink-0 -mr-3">Sold units</span>
        <div className="flex-1 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              syncId="marketChart"
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.2)" 
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                tickMargin={10}
                minTickGap={30}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                tickMargin={5}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar 
                dataKey="volume" 
                name="volume"
                fill={volumeColor} 
                radius={[2, 2, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
