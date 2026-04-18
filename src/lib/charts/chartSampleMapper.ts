import chartData from "@/modules/providers/local-data/chart-sample-ak47-redline-90d.json";

export interface ChartDataPoint {
  date: string;
  price: number;
  volume: number;
}

export function getSampleChartData(): ChartDataPoint[] {
  return chartData.series.map((point) => ({
    date: point.date,
    price: point.price,
    volume: point.volume,
  }));
}

export function getSampleItemInfo() {
  return chartData.item;
}
