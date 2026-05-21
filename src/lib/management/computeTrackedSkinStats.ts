export interface TrackedSkinHistoryPoint {
  date: string;
  price: number;
}

export function computeTrackedSkinStats(points: TrackedSkinHistoryPoint[]) {
  if (points.length < 2) {
    return {
      absoluteChange: 0,
      isPositive: false,
      percentageChange: 0,
    };
  }

  const first = points[0]?.price ?? 0;
  const last = points[points.length - 1]?.price ?? 0;
  const absoluteChange = last - first;
  const percentageChange = first === 0 ? 0 : (absoluteChange / first) * 100;

  return {
    absoluteChange,
    isPositive: absoluteChange >= 0,
    percentageChange,
  };
}
