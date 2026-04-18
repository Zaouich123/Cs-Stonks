"use client";

import * as React from "react";
import { 
  AreaChart, 
  Area, 
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

  // Custom tooltip for premium feel
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0d182a]/90 backdrop-blur-md border border-[color:var(--color-border)] p-3 rounded-lg shadow-xl">
          <p className="text-[color:var(--color-muted)] text-xs mb-1">{label}</p>
          <p className="text-white font-semibold">${payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px] md:h-[500px] mt-8 relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
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
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            tickMargin={10}
            minTickGap={30}
          />
          <YAxis 
            domain={['auto', 'auto']}
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
            tickMargin={10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
