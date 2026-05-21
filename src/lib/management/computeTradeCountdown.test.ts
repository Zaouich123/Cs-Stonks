import { describe, expect, it } from "vitest";

import { computeTradeCountdown, inferEffectiveAt } from "@/lib/management/computeTradeCountdown";

describe("computeTradeCountdown", () => {
  it("infers an effective date seven days after acceptedAt", () => {
    const effectiveAt = inferEffectiveAt("2026-05-20T10:00:00.000Z");

    expect(effectiveAt?.toISOString()).toBe("2026-05-27T10:00:00.000Z");
  });

  it("returns a remaining countdown before the trade is effective", () => {
    const result = computeTradeCountdown(
      {
        acceptedAt: "2026-05-20T10:00:00.000Z",
      },
      new Date("2026-05-26T08:00:00.000Z"),
    );

    expect(result.isEffective).toBe(false);
    expect(result.label).toBe("1d 2h remaining");
    expect(result.effectiveAt).toBe("2026-05-27T10:00:00.000Z");
  });

  it("marks the trade as effective after effectiveAt", () => {
    const result = computeTradeCountdown(
      {
        effectiveAt: "2026-05-27T10:00:00.000Z",
      },
      new Date("2026-05-28T10:00:00.000Z"),
    );

    expect(result.isEffective).toBe(true);
    expect(result.remainingMs).toBe(0);
    expect(result.label).toBe("Trade effective");
  });
});
