const DAY_MS = 24 * 60 * 60 * 1000;

export interface TradeCountdownInput {
  acceptedAt?: Date | string | null;
  effectiveAt?: Date | string | null;
  status?: string | null;
}

export interface TradeCountdownResult {
  effectiveAt: string | null;
  isEffective: boolean;
  label: string;
  remainingMs: number | null;
}

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function inferEffectiveAt(acceptedAt: Date | string | null | undefined, days = 7) {
  const acceptedDate = toDate(acceptedAt);

  if (!acceptedDate) {
    return null;
  }

  return new Date(acceptedDate.getTime() + days * DAY_MS);
}

export function computeTradeCountdown(
  trade: TradeCountdownInput,
  now = new Date(),
): TradeCountdownResult {
  const effectiveDate = toDate(trade.effectiveAt) ?? inferEffectiveAt(trade.acceptedAt);

  if (!effectiveDate) {
    return {
      effectiveAt: null,
      isEffective: false,
      label: "No effective date",
      remainingMs: null,
    };
  }

  const remainingMs = effectiveDate.getTime() - now.getTime();

  if (remainingMs <= 0 || trade.status === "EFFECTIVE") {
    return {
      effectiveAt: effectiveDate.toISOString(),
      isEffective: true,
      label: "Trade effective",
      remainingMs: 0,
    };
  }

  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
  const minutes = totalMinutes % 60;

  const label =
    days > 0
      ? `${days}d ${hours}h remaining`
      : hours > 0
        ? `${hours}h ${minutes}m remaining`
        : `${minutes}m remaining`;

  return {
    effectiveAt: effectiveDate.toISOString(),
    isEffective: false,
    label,
    remainingMs,
  };
}
