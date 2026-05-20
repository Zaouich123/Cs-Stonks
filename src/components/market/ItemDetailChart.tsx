"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePreferences } from "@/components/preferences/PreferencesProvider";

export interface ItemDetailChartPoint {
  date: string;
  price: number;
  volume: number;
}

interface ItemDetailChartProps {
  data: ItemDetailChartPoint[];
  isPositive: boolean;
}

function getRangeBounds(data: ItemDetailChartPoint[], start: string, end: string) {
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

export function ItemDetailChart({ data, isPositive }: ItemDetailChartProps) {
  const { t } = usePreferences();
  const color = isPositive ? "#22c55e" : "#ef4444";
  const gradientId = React.useId();
  const [dragStart, setDragStart] = React.useState<string | null>(null);
  const [dragEnd, setDragEnd] = React.useState<string | null>(null);
  const [zoomRange, setZoomRange] = React.useState<{ start: string; end: string } | null>(null);

  React.useEffect(() => {
    setDragStart(null);
    setDragEnd(null);
    setZoomRange(null);
  }, [data]);

  const visibleData = React.useMemo(() => {
    if (!zoomRange) {
      return data;
    }

    const bounds = getRangeBounds(data, zoomRange.start, zoomRange.end);
    if (!bounds) {
      return data;
    }

    return data.slice(bounds.from, bounds.to + 1);
  }, [data, zoomRange]);

  const selectionBounds = React.useMemo(() => {
    if (!dragStart || !dragEnd || dragStart === dragEnd) {
      return null;
    }

    const bounds = getRangeBounds(data, dragStart, dragEnd);
    if (!bounds) {
      return null;
    }

    return {
      x1: data[bounds.from]?.date,
      x2: data[bounds.to]?.date,
    };
  }, [data, dragEnd, dragStart]);

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
    <div className="relative h-[320px] w-full md:h-[380px]">
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-white/8 bg-[#07101d]/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45 shadow-2xl backdrop-blur">
        <span className="hidden sm:inline">{t("dragToZoom")}</span>
        {zoomRange ? (
          <button
            className="rounded-full bg-white/10 px-2.5 py-1 text-white transition hover:bg-white/18"
            onClick={() => setZoomRange(null)}
            type="button"
          >
            {t("resetZoom")}
          </button>
        ) : null}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={visibleData}
          margin={{ top: 14, right: 10, left: 0, bottom: 0 }}
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
  );
}
