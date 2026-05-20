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
  ReferenceArea,
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { ChartDataPoint } from "@/lib/charts/chartSampleMapper";
import { usePreferences } from "@/components/preferences/PreferencesProvider";

interface AnalyzeChartPanelProps {
  data: ChartDataPoint[];
  isPositive: boolean;
}

function getRangeBounds(data: ChartDataPoint[], start: string, end: string) {
  const startIndex = data.findIndex((point) => point.date === start);
  const endIndex = data.findIndex((point) => point.date === end);

  if (startIndex === -1 || endIndex === -1) {
    return null;
  }

  return {
    from: Math.min(startIndex, endIndex),
    to: Math.max(startIndex, endIndex),
  };
}

function getActiveLabel(event: unknown) {
  if (!event || typeof event !== "object" || !("activeLabel" in event)) {
    return null;
  }

  const activeLabel = (event as { activeLabel?: number | string }).activeLabel;
  return activeLabel == null ? null : String(activeLabel);
}

export function AnalyzeChartPanel({ data, isPositive }: AnalyzeChartPanelProps) {
  const { currency, formatMoney, language } = usePreferences();
  const color = isPositive ? "#22c55e" : "#ef4444"; // Tailwind green-500 or red-500
  const volumeColor = "#a855f7"; // Purple for volume like the image
  const [dragStart, setDragStart] = React.useState<string | null>(null);
  const [dragEnd, setDragEnd] = React.useState<string | null>(null);
  const [zoomRange, setZoomRange] = React.useState<{ start: string; end: string } | null>(null);

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
              {entry.name === 'price'
                ? formatMoney(entry.value, "USD")
                : `${entry.value} ${language === "FR" ? "unités" : "units"}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const displayData = React.useMemo(() => {
    if (data.length !== 1) {
      return data;
    }

    const single = data[0];
    // Create a point 1 day in the past to draw a flat line
    const pastDate = new Date(new Date(single.date).getTime() - 86400000).toISOString().split('T')[0];
    return [{ ...single, date: pastDate }, single];
  }, [data]);

  React.useEffect(() => {
    setDragStart(null);
    setDragEnd(null);
    setZoomRange(null);
  }, [displayData]);

  const visibleData = React.useMemo(() => {
    if (!zoomRange) {
      return displayData;
    }

    const bounds = getRangeBounds(displayData, zoomRange.start, zoomRange.end);
    if (!bounds) {
      return displayData;
    }

    return displayData.slice(bounds.from, bounds.to + 1);
  }, [displayData, zoomRange]);

  const selectionBounds = React.useMemo(() => {
    if (!dragStart || !dragEnd || dragStart === dragEnd) {
      return null;
    }

    const bounds = getRangeBounds(displayData, dragStart, dragEnd);
    if (!bounds) {
      return null;
    }

    return {
      x1: displayData[bounds.from]?.date,
      x2: displayData[bounds.to]?.date,
    };
  }, [displayData, dragEnd, dragStart]);

  const handleMouseDown = (event: unknown) => {
    const activeLabel = getActiveLabel(event);

    if (!activeLabel) {
      return;
    }

    setDragStart(activeLabel);
    setDragEnd(activeLabel);
  };

  const handleMouseMove = (event: unknown) => {
    const activeLabel = getActiveLabel(event);

    if (!dragStart || !activeLabel) {
      return;
    }

    setDragEnd(activeLabel);
  };

  const handleMouseUp = () => {
    if (!dragStart || !dragEnd || dragStart === dragEnd) {
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    setZoomRange({ start: dragStart, end: dragEnd });
    setDragStart(null);
    setDragEnd(null);
  };

  return (
    <div className="w-full flex flex-col mt-8 relative gap-1">
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-white/8 bg-[#07101d]/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45 shadow-2xl backdrop-blur">
        <span className="hidden sm:inline">
          {language === "FR" ? "Glisse pour zoomer" : "Drag to zoom"}
        </span>
        {zoomRange ? (
          <button
            className="rounded-full bg-white/10 px-2.5 py-1 text-white transition hover:bg-white/18"
            onClick={() => setZoomRange(null)}
            type="button"
          >
            {language === "FR" ? "Reset zoom" : "Reset zoom"}
          </button>
        ) : null}
      </div>

      {/* Price Chart */}
      <div className="flex items-center w-full h-[300px] md:h-[350px]">
        <span className="text-xs font-semibold text-white/40 -rotate-90 whitespace-nowrap shrink-0 -mr-3">
          {language === "FR" ? `Prix en ${currency}` : `Price in ${currency}`}
        </span>
        <div className="flex-1 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={visibleData}
              syncId="marketChart"
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onMouseDown={handleMouseDown}
              onMouseLeave={() => {
                setDragStart(null);
                setDragEnd(null);
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="cursor-crosshair select-none"
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
                tickFormatter={(value) => formatMoney(Number(value), "USD")}
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
              {selectionBounds ? (
                <ReferenceArea
                  x1={selectionBounds.x1}
                  x2={selectionBounds.x2}
                  fill="#4da3ff"
                  fillOpacity={0.14}
                  stroke="#4da3ff"
                  strokeOpacity={0.45}
                />
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volume Chart */}
      <div className="flex items-center w-full h-[100px] md:h-[120px]">
        <span className="text-xs font-semibold text-white/40 -rotate-90 whitespace-nowrap shrink-0 -mr-3">
          {language === "FR" ? "Ventes" : "Sold units"}
        </span>
        <div className="flex-1 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={visibleData}
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
