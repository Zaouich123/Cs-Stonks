"use client";

import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, Bell, Check, LineChart, X } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import type { ManagementTrackedSkin } from "@/modules/management/types/management.types";
import { WidgetShell } from "@/components/management/widgets/WidgetShell";

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
  };
  ok: boolean;
}

interface TrackedSkinChartWidgetProps {
  onTrackedSkinsChange: (trackedSkins: ManagementTrackedSkin[]) => void;
  trackedSkins: ManagementTrackedSkin[];
}

type ChartMode = "price" | "stock";
type ChartRange = "7d" | "90d" | "1y";

const chartRangeOptions: Array<{ days: number; value: ChartRange }> = [
  { days: 7, value: "7d" },
  { days: 90, value: "90d" },
  { days: 365, value: "1y" },
];

function getChartRangeLabel(range: ChartRange, language: "FR" | "EN") {
  if (range === "1y") {
    return language === "FR" ? "1an" : "1y";
  }

  if (range === "7d") {
    return language === "FR" ? "7j" : "7d";
  }

  return language === "FR" ? "90j" : "90d";
}

function getChartRangeDays(range: ChartRange) {
  return chartRangeOptions.find((option) => option.value === range)?.days ?? 7;
}

function filterChartDataByRange<TPoint extends { date: string }>(data: TPoint[], range: ChartRange) {
  if (data.length < 2) {
    return data;
  }

  const lastPoint = data[data.length - 1];
  const lastTimestamp = Date.parse(lastPoint.date);

  if (!Number.isFinite(lastTimestamp)) {
    return data.slice(-getChartRangeDays(range));
  }

  const minimumTimestamp = lastTimestamp - (getChartRangeDays(range) - 1) * 24 * 60 * 60 * 1000;

  return data.filter((point) => {
    const pointTimestamp = Date.parse(point.date);
    return Number.isFinite(pointTimestamp) && pointTimestamp >= minimumTimestamp;
  });
}

function computePriceTrend(data: Array<{ price?: number }>) {
  const points = data.filter((point): point is { price: number } => typeof point.price === "number");

  if (points.length < 2) {
    return {
      absoluteChange: 0,
      isNeutral: true,
      isPositive: false,
      percentageChange: 0,
    };
  }

  const first = points[0].price;
  const last = points[points.length - 1].price;
  const absoluteChange = last - first;
  const percentageChange = first === 0 ? 0 : (absoluteChange / first) * 100;

  return {
    absoluteChange,
    isNeutral: absoluteChange === 0,
    isPositive: absoluteChange > 0,
    percentageChange,
  };
}

function PremiumTrackedChart({
  color,
  data,
  dataKey,
  emptyLabel,
  formatValue,
  tooltipLabel,
}: {
  color: string;
  data: Array<{ date: string; price?: number; quantity?: number }>;
  dataKey: "price" | "quantity";
  emptyLabel: string;
  formatValue: (value: number) => string;
  tooltipLabel: string;
}) {
  const gradientId = React.useId();

  if (data.length < 2) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] text-sm text-white/40">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data} margin={{ bottom: 0, left: 0, right: 12, top: 14 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.32} />
              <stop offset="86%" stopColor={color} stopOpacity={0.04} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.055)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            minTickGap={34}
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: "rgba(255,255,255,0.48)", fontSize: 11 }}
            tickMargin={10}
          />
          <YAxis
            domain={["auto", "auto"]}
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: "rgba(255,255,255,0.48)", fontSize: 11 }}
            tickFormatter={(value) => formatValue(Number(value))}
            tickMargin={8}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(13, 24, 42, 0.94)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "14px",
              color: "#f8fafc",
            }}
            formatter={(value) => [formatValue(Number(value)), tooltipLabel]}
            labelStyle={{ color: "rgba(255,255,255,0.58)" }}
          />
          <Area
            dataKey={dataKey}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            stroke={color}
            strokeWidth={2.5}
            type="linear"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrackedSkinChartWidget({
  onTrackedSkinsChange,
  trackedSkins,
}: TrackedSkinChartWidgetProps) {
  const { formatMoney, language } = usePreferences();
  const [selectedSkinId, setSelectedSkinId] = React.useState(trackedSkins[0]?.id ?? "");
  const [notificationOpen, setNotificationOpen] = React.useState(false);
  const [chartMode, setChartMode] = React.useState<ChartMode>("price");
  const [chartRange, setChartRange] = React.useState<ChartRange>("7d");
  const [savingAlert, setSavingAlert] = React.useState(false);
  const [alertBelowThreshold, setAlertBelowThreshold] = React.useState("");
  const [alertAboveThreshold, setAlertAboveThreshold] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (trackedSkins.length === 0) {
      setSelectedSkinId("");
      return;
    }

    if (!trackedSkins.some((skin) => skin.id === selectedSkinId)) {
      setSelectedSkinId(trackedSkins[0]?.id ?? "");
    }
  }, [selectedSkinId, trackedSkins]);

  const selectedSkin = trackedSkins.find((skin) => skin.id === selectedSkinId) ?? trackedSkins[0] ?? null;
  const priceChartData = React.useMemo(
    () => filterChartDataByRange(selectedSkin?.chartData ?? [], chartRange),
    [chartRange, selectedSkin?.chartData],
  );
  const stockChartData = React.useMemo(
    () => filterChartDataByRange(selectedSkin?.stockChartData ?? [], chartRange),
    [chartRange, selectedSkin?.stockChartData],
  );
  const rangeTrend = React.useMemo(() => computePriceTrend(priceChartData), [priceChartData]);
  const color = chartMode === "stock" ? "#4da3ff" : rangeTrend.isPositive ? "#22c55e" : "#ef4444";
  const chartData = chartMode === "stock" ? stockChartData : priceChartData;

  const normalizedBelowThreshold = Number(alertBelowThreshold.replace(",", "."));
  const normalizedAboveThreshold = Number(alertAboveThreshold.replace(",", "."));
  const hasBelowThreshold = Number.isFinite(normalizedBelowThreshold) && normalizedBelowThreshold > 0;
  const hasAboveThreshold = Number.isFinite(normalizedAboveThreshold) && normalizedAboveThreshold > 0;
  const alertIsActive = Boolean(selectedSkin?.alertAbovePrice || selectedSkin?.alertBelowPrice);
  const canSaveAlert =
    Boolean(selectedSkin) &&
    ((alertBelowThreshold.trim() === "" || hasBelowThreshold) &&
      (alertAboveThreshold.trim() === "" || hasAboveThreshold));

  const openNotificationModal = () => {
    if (!selectedSkin) {
      return;
    }

    setAlertBelowThreshold(selectedSkin.alertBelowPrice?.toString().replace(".", ",") ?? "");
    setAlertAboveThreshold(selectedSkin.alertAbovePrice?.toString().replace(".", ",") ?? "");
    setError(null);
    setNotificationOpen(true);
  };

  const saveSelectedSkinAlert = async () => {
    if (!selectedSkin || !canSaveAlert) {
      setError(
        language === "FR"
          ? "Renseigne un seuil valide ou laisse le champ vide."
          : "Enter a valid threshold or leave the field empty.",
      );
      return;
    }

    setSavingAlert(true);
    setError(null);

    try {
      const response = await fetch("/api/management/tracked-skins", {
        body: JSON.stringify({
          alertAbovePrice: alertAboveThreshold.trim() === "" ? null : normalizedAboveThreshold,
          alertBelowPrice: alertBelowThreshold.trim() === "" ? null : normalizedBelowThreshold,
          itemId: selectedSkin.item.id,
          label: selectedSkin.label ?? selectedSkin.item.displayName,
          targetPrice:
            alertAboveThreshold.trim() !== ""
              ? normalizedAboveThreshold
              : alertBelowThreshold.trim() !== ""
                ? normalizedBelowThreshold
                : null,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as ApiResponse<{ trackedSkins: ManagementTrackedSkin[] }>;

      if (!payload.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to track skin.");
      }

      onTrackedSkinsChange(payload.data.trackedSkins);
      setSelectedSkinId(
        payload.data.trackedSkins.find((skin) => skin.item.id === selectedSkin.item.id)?.id ??
          payload.data.trackedSkins[0]?.id ??
          "",
      );
      setNotificationOpen(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to track skin.");
    } finally {
      setSavingAlert(false);
    }
  };

  return (
    <WidgetShell
      action={
        <div className="flex items-center gap-2">
          <button
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
              alertIsActive
                ? "border-emerald-400/35 bg-emerald-400/16 text-emerald-200 hover:bg-emerald-400/22"
                : "border-[#4da3ff]/30 bg-[#4da3ff]/10 text-[#9acbff] hover:bg-[#4da3ff]/15"
            }`}
            disabled={!selectedSkin}
            onClick={openNotificationModal}
            type="button"
          >
            <Bell className="h-3.5 w-3.5" />
            {language === "FR" ? "Notifier" : "Notify"}
          </button>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/62 transition hover:text-white"
            href={selectedSkin ? `/analyze?itemId=${encodeURIComponent(selectedSkin.item.id)}` : "/analyze"}
          >
            Analyze
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      }
      className="xl:col-span-2"
      eyebrow={language === "FR" ? "Tracking prix" : "Price tracking"}
      title={language === "FR" ? "Skins suivis" : "Tracked skins"}
    >
      {notificationOpen && selectedSkin ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/68 px-4 backdrop-blur-md">
          <div className="w-full max-w-xl overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#0b1422] shadow-[0_26px_80px_rgba(0,0,0,0.62)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/8 p-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9acbff]">
                  {language === "FR" ? "Notification" : "Notification"}
                </p>
                <h3 className="mt-1 text-xl font-black text-white">
                  {language === "FR" ? "Alerte de prix" : "Price alert"}
                </h3>
                <p className="mt-2 truncate text-sm font-semibold text-white/58">
                  {selectedSkin.label ?? selectedSkin.item.displayName}
                </p>
              </div>
              <button
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/55 transition hover:text-white"
                onClick={() => setNotificationOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <label className="block rounded-2xl border border-rose-400/16 bg-[#07101d]/85 p-4">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-rose-200/75">
                  {language === "FR" ? "Alerte en dessous de" : "Alert below"}
                </span>
                <input
                  className="mt-2 h-11 w-full bg-transparent text-lg font-semibold text-white outline-none placeholder:text-white/32"
                  inputMode="decimal"
                  onChange={(event) => setAlertBelowThreshold(event.target.value)}
                  placeholder={language === "FR" ? "Aucun seuil bas" : "No lower threshold"}
                  value={alertBelowThreshold}
                />
              </label>

              <label className="block rounded-2xl border border-emerald-400/16 bg-[#07101d]/85 p-4">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200/75">
                  {language === "FR" ? "Alerte au-dessus de" : "Alert above"}
                </span>
                <input
                  className="mt-2 h-11 w-full bg-transparent text-lg font-semibold text-white outline-none placeholder:text-white/32"
                  inputMode="decimal"
                  onChange={(event) => setAlertAboveThreshold(event.target.value)}
                  placeholder={language === "FR" ? "Aucun seuil haut" : "No upper threshold"}
                  value={alertAboveThreshold}
                />
              </label>

              {error ? <p className="text-sm font-semibold text-rose-200">{error}</p> : null}
            </div>

            <div className="flex justify-end gap-3 border-t border-white/8 p-5">
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/62 transition hover:text-white"
                onClick={() => setNotificationOpen(false)}
                type="button"
              >
                {language === "FR" ? "Annuler" : "Cancel"}
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-[#4da3ff]/35 bg-[#4da3ff]/14 px-4 py-2 text-sm font-bold text-[#b8dcff] transition hover:bg-[#4da3ff]/20 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!canSaveAlert || savingAlert}
                onClick={() => void saveSelectedSkinAlert()}
                type="button"
              >
                <Check className="h-4 w-4" />
                {savingAlert
                  ? language === "FR"
                    ? "Validation..."
                    : "Saving..."
                  : language === "FR"
                    ? "Valider"
                    : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!selectedSkin ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-6">
          <p className="text-base font-semibold text-white">
            {language === "FR" ? "Aucun skin suivi" : "No tracked skin yet"}
          </p>
            <p className="mt-2 text-sm leading-6 text-white/48">
              {language === "FR"
                ? "Ajoute d'abord un skin au tracking pour configurer une notification."
                : "Add a tracked skin first to configure a notification."}
            </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {selectedSkin.item.imageUrl ?? selectedSkin.item.steamImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={selectedSkin.item.displayName}
                  className="h-16 w-16 rounded-2xl object-contain"
                  src={selectedSkin.item.imageUrl ?? selectedSkin.item.steamImageUrl ?? ""}
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05]">
                  <LineChart className="h-6 w-6 text-white/35" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-white">
                  {selectedSkin.label ?? selectedSkin.item.displayName}
                </p>
                <p className="mt-1 text-sm text-white/42">
                  {selectedSkin.latestPrice?.marketName ?? "No market"} ·{" "}
                  {formatMoney(selectedSkin.latestPrice?.price, selectedSkin.latestPrice?.currency)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-white/10 bg-white/[0.035] p-1">
                {(["price", "stock"] as const).map((mode) => (
                  <button
                    className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] transition ${
                      chartMode === mode ? "bg-[#4da3ff] text-white" : "text-white/48 hover:text-white"
                    }`}
                    key={mode}
                    onClick={() => setChartMode(mode)}
                    type="button"
                  >
                    {mode === "price"
                      ? language === "FR"
                        ? "Prix"
                        : "Price"
                      : language === "FR"
                        ? "Stock"
                        : "Stock"}
                  </button>
                ))}
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.035] p-1">
                {chartRangeOptions.map((option) => (
                  <button
                    className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] transition ${
                      chartRange === option.value ? "bg-white/14 text-white" : "text-white/48 hover:text-white"
                    }`}
                    key={option.value}
                    onClick={() => setChartRange(option.value)}
                    type="button"
                  >
                    {getChartRangeLabel(option.value, language)}
                  </button>
                ))}
              </div>

              {trackedSkins.length > 1 ? (
                <select
                  className="h-11 rounded-2xl border border-white/10 bg-[#07101d] px-4 text-sm font-semibold text-white outline-none transition focus:border-[#4da3ff]/55"
                  onChange={(event) => setSelectedSkinId(event.target.value)}
                  value={selectedSkin.id}
                >
                  {trackedSkins.map((skin) => (
                    <option className="bg-[#07101d]" key={skin.id} value={skin.id}>
                      {skin.label ?? skin.item.displayName}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <PremiumTrackedChart
              color={color}
              data={chartData}
              dataKey={chartMode === "stock" ? "quantity" : "price"}
              emptyLabel={
                chartMode === "stock"
                  ? language === "FR"
                    ? "Pas encore de donnees de stock pour ce skin."
                    : "No stock data yet for this tracked skin."
                  : language === "FR"
                    ? "Pas encore de donnees de prix pour ce skin."
                    : "No price data yet for this tracked skin."
              }
              formatValue={(value) =>
                chartMode === "stock"
                  ? `${Math.round(value)} listings`
                  : formatMoney(value, selectedSkin.latestPrice?.currency ?? "USD")
              }
              tooltipLabel={chartMode === "stock" ? "Stock" : "Price"}
            />
            <aside className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                {language === "FR"
                  ? `Tendance ${getChartRangeLabel(chartRange, language)}`
                  : `${getChartRangeLabel(chartRange, language)} trend`}
              </p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  rangeTrend.isNeutral ? "text-white" : rangeTrend.isPositive ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {rangeTrend.percentageChange >= 0 ? "+" : ""}
                {rangeTrend.percentageChange.toFixed(2)}%
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/35">
                {language === "FR" ? "Alerte cible" : "Target alert"}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {formatMoney(selectedSkin.targetPrice, selectedSkin.latestPrice?.currency)}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/35">
                {language === "FR" ? "Stock actuel" : "Current stock"}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {selectedSkin.currentStock === null || selectedSkin.currentStock === undefined
                  ? "N/A"
                  : `${selectedSkin.currentStock} listings`}
              </p>
              <Link
                className="mt-5 inline-flex w-full justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/64 transition hover:text-white"
                href={`/market/${selectedSkin.item.id}`}
              >
                {language === "FR" ? "Ouvrir fiche" : "Open item"}
              </Link>
            </aside>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
