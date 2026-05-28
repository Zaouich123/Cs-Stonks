"use client";

import * as React from "react";
import { RotateCcw, Wand2 } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  Line,
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

interface ProjectionChartDataPoint extends ChartDataPoint {
  isProjection?: boolean;
  projectionPrice?: number | null;
}

const PROJECTION_DAYS = 30;
const PRICE_CHART_MARGIN = { top: 10, right: 10, left: 0, bottom: 0 };

function getRangeBounds(data: { date: string }[], start: string, end: string) {
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

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getExpandedPriceDomain(data: ProjectionChartDataPoint[], projectionMode: boolean): [number, number] | ["auto", "auto"] {
  if (!projectionMode) {
    return ["auto", "auto"];
  }

  const prices = data
    .flatMap((point) => [point.price, point.projectionPrice ?? null])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (prices.length === 0) {
    return [0, 1];
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(max - min, max * 0.2, 1);

  return [Math.max(0, min - range * 0.8), max + range * 0.8];
}

function getPriceFromChartY(event: unknown, chartHeight: number, domain: [number, number] | ["auto", "auto"]) {
  if (!event || typeof event !== "object" || !("chartY" in event) || domain[0] === "auto") {
    return null;
  }

  const chartY = Number((event as { chartY?: number }).chartY);
  if (!Number.isFinite(chartY) || chartHeight <= PRICE_CHART_MARGIN.top + PRICE_CHART_MARGIN.bottom) {
    return null;
  }

  const plotHeight = chartHeight - PRICE_CHART_MARGIN.top - PRICE_CHART_MARGIN.bottom;
  const clampedY = Math.min(Math.max(chartY, PRICE_CHART_MARGIN.top), chartHeight - PRICE_CHART_MARGIN.bottom);
  const ratio = (clampedY - PRICE_CHART_MARGIN.top) / plotHeight;
  const [min, max] = domain;

  return Number((max - ratio * (max - min)).toFixed(2));
}

export function AnalyzeChartPanel({ data, isPositive }: AnalyzeChartPanelProps) {
  const { currency, formatMoney, language } = usePreferences();
  const color = isPositive ? "#22c55e" : "#ef4444"; // Tailwind green-500 or red-500
  const volumeColor = "#a855f7"; // Purple for volume like the image
  const priceChartRef = React.useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = React.useState<string | null>(null);
  const [dragEnd, setDragEnd] = React.useState<string | null>(null);
  const [zoomRange, setZoomRange] = React.useState<{ start: string; end: string } | null>(null);
  const [projectionMode, setProjectionMode] = React.useState(false);
  const [projectionPrices, setProjectionPrices] = React.useState<Record<string, number>>({});
  const [isDrawingProjection, setIsDrawingProjection] = React.useState(false);
  const [lastProjectionDrawPoint, setLastProjectionDrawPoint] = React.useState<{ date: string; price: number } | null>(null);

  // Custom tooltip for premium feel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0d182a]/90 backdrop-blur-md border border-[color:var(--color-border)] p-3 rounded-lg shadow-xl">
          <p className="text-[color:var(--color-muted)] text-xs mb-1">{label}</p>
          {payload.filter((entry) => entry.value !== null && entry.value !== undefined).map((entry, index) => (
            <p key={index} className="text-white font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name === "price" || entry.name === "projection"
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
    setProjectionPrices({});
    setIsDrawingProjection(false);
    setLastProjectionDrawPoint(null);
  }, [displayData]);

  const projectionDates = React.useMemo(() => {
    const lastPoint = displayData[displayData.length - 1];

    if (!lastPoint) {
      return [];
    }

    const lastDate = new Date(lastPoint.date);
    return Array.from({ length: PROJECTION_DAYS }, (_, index) => toDateKey(addDays(lastDate, index + 1)));
  }, [displayData]);

  const projectionDateSet = React.useMemo(() => new Set(projectionDates), [projectionDates]);

  const chartDataWithProjection = React.useMemo<ProjectionChartDataPoint[]>(() => {
    if (!projectionMode || displayData.length === 0) {
      return displayData;
    }

    const lastPoint = displayData[displayData.length - 1];
    const historicalData = displayData.map((point, index) => ({
      ...point,
      projectionPrice: index === displayData.length - 1 ? point.price : null,
    }));
    const futureData = projectionDates.map((date) => ({
      date,
      isProjection: true,
      price: null as unknown as number,
      projectionPrice: projectionPrices[date] ?? lastPoint.price,
      volume: 0,
    }));

    return [...historicalData, ...futureData];
  }, [displayData, projectionDates, projectionMode, projectionPrices]);

  const visibleData = React.useMemo(() => {
    if (!zoomRange) {
      return chartDataWithProjection;
    }

    const bounds = getRangeBounds(chartDataWithProjection, zoomRange.start, zoomRange.end);
    if (!bounds) {
      return chartDataWithProjection;
    }

    return chartDataWithProjection.slice(bounds.from, bounds.to + 1);
  }, [chartDataWithProjection, zoomRange]);

  const priceDomain = React.useMemo(() => getExpandedPriceDomain(visibleData, projectionMode), [projectionMode, visibleData]);

  const projectionAreaBounds = React.useMemo(() => {
    if (!projectionMode || projectionDates.length === 0) {
      return null;
    }

    return {
      x1: projectionDates[0],
      x2: projectionDates[projectionDates.length - 1],
    };
  }, [projectionDates, projectionMode]);

  const selectionBounds = React.useMemo(() => {
    if (!dragStart || !dragEnd || dragStart === dragEnd) {
      return null;
    }

    const bounds = getRangeBounds(chartDataWithProjection, dragStart, dragEnd);
    if (!bounds) {
      return null;
    }

    return {
      x1: chartDataWithProjection[bounds.from]?.date,
      x2: chartDataWithProjection[bounds.to]?.date,
    };
  }, [chartDataWithProjection, dragEnd, dragStart]);

  const setProjectionPoint = React.useCallback((date: string, price: number) => {
    setProjectionPrices((current) => ({
      ...current,
      [date]: price,
    }));
  }, []);

  const drawProjectionPoint = React.useCallback((event: unknown) => {
    const activeLabel = getActiveLabel(event);

    if (!activeLabel || !projectionDateSet.has(activeLabel)) {
      return;
    }

    const price = getPriceFromChartY(event, priceChartRef.current?.clientHeight ?? 0, priceDomain);

    if (price === null) {
      return;
    }

    if (!lastProjectionDrawPoint || lastProjectionDrawPoint.date === activeLabel) {
      setProjectionPoint(activeLabel, price);
      setLastProjectionDrawPoint({ date: activeLabel, price });
      return;
    }

    const fromIndex = projectionDates.indexOf(lastProjectionDrawPoint.date);
    const toIndex = projectionDates.indexOf(activeLabel);

    if (fromIndex === -1 || toIndex === -1) {
      setProjectionPoint(activeLabel, price);
      setLastProjectionDrawPoint({ date: activeLabel, price });
      return;
    }

    const startIndex = Math.min(fromIndex, toIndex);
    const endIndex = Math.max(fromIndex, toIndex);
    const steps = Math.max(endIndex - startIndex, 1);
    const startPrice = fromIndex <= toIndex ? lastProjectionDrawPoint.price : price;
    const endPrice = fromIndex <= toIndex ? price : lastProjectionDrawPoint.price;

    setProjectionPrices((current) => {
      const next = { ...current };

      for (let index = startIndex; index <= endIndex; index += 1) {
        const ratio = (index - startIndex) / steps;
        next[projectionDates[index]] = Number((startPrice + (endPrice - startPrice) * ratio).toFixed(2));
      }

      return next;
    });
    setLastProjectionDrawPoint({ date: activeLabel, price });
  }, [lastProjectionDrawPoint, priceDomain, projectionDateSet, projectionDates, setProjectionPoint]);

  const handleMouseDown = (event: unknown) => {
    const activeLabel = getActiveLabel(event);

    if (!activeLabel) {
      return;
    }

    if (projectionMode && projectionDateSet.has(activeLabel)) {
      setIsDrawingProjection(true);
      drawProjectionPoint(event);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    setDragStart(activeLabel);
    setDragEnd(activeLabel);
  };

  const handleMouseMove = (event: unknown) => {
    const activeLabel = getActiveLabel(event);

    if (projectionMode && isDrawingProjection) {
      drawProjectionPoint(event);
      return;
    }

    if (!dragStart || !activeLabel) {
      return;
    }

    setDragEnd(activeLabel);
  };

  const handleMouseUp = () => {
    if (isDrawingProjection) {
      setIsDrawingProjection(false);
      setLastProjectionDrawPoint(null);
      return;
    }

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
      <div className="absolute right-3 top-3 z-10 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-white/8 bg-[#07101d]/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45 shadow-2xl backdrop-blur">
        <span className="hidden sm:inline">
          {projectionMode
            ? language === "FR"
              ? "Dessine sur les 30 prochains jours"
              : "Draw over the next 30 days"
            : language === "FR"
              ? "Glisse pour zoomer"
              : "Drag to zoom"}
        </span>
        <button
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition ${
            projectionMode ? "bg-[#4da3ff]/18 text-[#8fc8ff]" : "bg-white/10 text-white hover:bg-white/18"
          }`}
          onClick={() => setProjectionMode((enabled) => !enabled)}
          type="button"
        >
          <Wand2 className="h-3.5 w-3.5" />
          {language === "FR" ? "Projection" : "Projection"}
        </button>
        {projectionMode ? (
          <button
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-white transition hover:bg-white/18"
            onClick={() => setProjectionPrices({})}
            type="button"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {language === "FR" ? "Reset" : "Reset"}
          </button>
        ) : null}
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
        <div ref={priceChartRef} className="flex-1 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={visibleData}
              syncId="marketChart"
              margin={PRICE_CHART_MARGIN}
              onMouseDown={handleMouseDown}
              onMouseLeave={() => {
                setDragStart(null);
                setDragEnd(null);
                setIsDrawingProjection(false);
                setLastProjectionDrawPoint(null);
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
                domain={priceDomain}
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                tickFormatter={(value) => formatMoney(Number(value), "USD")}
                tickMargin={5}
              />
              <Tooltip content={<CustomTooltip />} />
              {projectionAreaBounds ? (
                <ReferenceArea
                  x1={projectionAreaBounds.x1}
                  x2={projectionAreaBounds.x2}
                  fill="#4da3ff"
                  fillOpacity={0.08}
                  stroke="#4da3ff"
                  strokeDasharray="4 4"
                  strokeOpacity={0.28}
                />
              ) : null}
              <Area 
                type="linear" 
                dataKey="price" 
                name="price"
                stroke={color} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
              />
              {projectionMode ? (
                <Line
                  connectNulls
                  dataKey="projectionPrice"
                  dot={false}
                  isAnimationActive={false}
                  name="projection"
                  stroke="#4da3ff"
                  strokeDasharray="6 5"
                  strokeWidth={2}
                  type="linear"
                />
              ) : null}
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
