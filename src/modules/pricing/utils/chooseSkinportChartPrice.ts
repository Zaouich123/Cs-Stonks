import type { SkinportItemRecord, SkinportSalesHistoryItem, SkinportPriceWindow } from "@/modules/providers/skinport/skinport.types";

export interface ChosenSkinportPrice {
  price: number;
  source:
    | "items.median_price"
    | "items.mean_price"
    | "items.suggested_price"
    | "items.min_price"
    | "history.last_24_hours.median"
    | "history.last_24_hours.avg"
    | "history.last_7_days.median"
    | "history.last_7_days.avg"
    | "history.last_30_days.median"
    | "history.last_30_days.avg"
    | "history.last_90_days.median"
    | "history.last_90_days.avg";
}

function asPositiveNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function fromWindow(
  window: SkinportPriceWindow,
  medianSource: ChosenSkinportPrice["source"],
  averageSource: ChosenSkinportPrice["source"],
): ChosenSkinportPrice | null {
  if (window.volume <= 0) {
    return null;
  }

  const median = asPositiveNumber(window.median);

  if (median !== null) {
    return {
      price: median,
      source: medianSource,
    };
  }

  const average = asPositiveNumber(window.avg);

  if (average !== null) {
    return {
      price: average,
      source: averageSource,
    };
  }

  return null;
}

export function chooseSkinportChartPrice(
  item: SkinportItemRecord,
  history?: SkinportSalesHistoryItem | null,
): ChosenSkinportPrice | null {
  const itemCandidates: Array<[number | null, ChosenSkinportPrice["source"]]> = [
    [item.median_price, "items.median_price"],
    [item.mean_price, "items.mean_price"],
    [item.suggested_price, "items.suggested_price"],
    [item.min_price, "items.min_price"],
  ];

  for (const [value, source] of itemCandidates) {
    const numericValue = asPositiveNumber(value);

    if (numericValue !== null) {
      return {
        price: numericValue,
        source,
      };
    }
  }

  if (!history) {
    return null;
  }

  return (
    fromWindow(history.last_24_hours, "history.last_24_hours.median", "history.last_24_hours.avg") ??
    fromWindow(history.last_7_days, "history.last_7_days.median", "history.last_7_days.avg") ??
    fromWindow(history.last_30_days, "history.last_30_days.median", "history.last_30_days.avg") ??
    fromWindow(history.last_90_days, "history.last_90_days.median", "history.last_90_days.avg")
  );
}
