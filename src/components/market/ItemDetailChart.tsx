"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ItemDetailChartPoint {
  date: string;
  price: number;
  volume: number;
}

interface ItemDetailChartProps {
  data: ItemDetailChartPoint[];
  isPositive: boolean;
}

export function ItemDetailChart({ data, isPositive }: ItemDetailChartProps) {
  const color = isPositive ? "#22c55e" : "#ef4444";
  const gradientId = React.useId();

  return (
    <div className="h-[320px] w-full md:h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="80%" stopColor={color} stopOpacity={0.06} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.22)"
            tick={{ fill: "rgba(255,255,255,0.48)", fontSize: 11 }}
            tickMargin={10}
            minTickGap={28}
          />
          <YAxis
            stroke="rgba(255,255,255,0.22)"
            tick={{ fill: "rgba(255,255,255,0.48)", fontSize: 11 }}
            tickFormatter={(value) => `$${value}`}
            tickMargin={8}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(13, 24, 42, 0.92)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              color: "#f0f4f8",
              backdropFilter: "blur(12px)",
            }}
            formatter={(value) => {
              const resolvedValue = typeof value === "number" ? value : Number(value ?? 0);
              return [`$${resolvedValue.toFixed(2)}`, "Price"];
            }}
            labelStyle={{ color: "rgba(255,255,255,0.6)" }}
          />
          <Area
            type="linear"
            dataKey="price"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
