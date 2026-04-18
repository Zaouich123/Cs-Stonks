import { ChartDataPoint } from "./chartSampleMapper";

export interface TrendStats {
  absoluteChange: number;
  percentageChange: number;
  isPositive: boolean;
  isNeutral: boolean;
}

export function computeTrendStats(data: ChartDataPoint[]): TrendStats {
  if (!data || data.length < 2) {
    return { absoluteChange: 0, percentageChange: 0, isPositive: true, isNeutral: true };
  }

  const startPrice = data[0].price;
  const endPrice = data[data.length - 1].price;

  const absoluteChange = endPrice - startPrice;
  const percentageChange = startPrice !== 0 ? (absoluteChange / startPrice) * 100 : 0;

  return {
    absoluteChange,
    percentageChange,
    isPositive: absoluteChange > 0,
    isNeutral: absoluteChange === 0,
  };
}
