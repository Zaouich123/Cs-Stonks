export interface InventoryValuePoint {
  createdAt: string;
  totalValue: number;
}

export function computeInventoryDelta(points: InventoryValuePoint[]) {
  if (points.length < 2) {
    return {
      absoluteChange: 0,
      percentageChange: 0,
    };
  }

  const first = points[0]?.totalValue ?? 0;
  const last = points[points.length - 1]?.totalValue ?? 0;
  const absoluteChange = last - first;
  const percentageChange = first === 0 ? 0 : (absoluteChange / first) * 100;

  return {
    absoluteChange,
    percentageChange,
  };
}
