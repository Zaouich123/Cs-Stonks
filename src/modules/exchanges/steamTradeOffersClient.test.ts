import { describe, expect, it } from "vitest";

import {
  isSteamApiKey,
  mapTradeOfferState,
  toSteamId64,
} from "@/modules/exchanges/steamTradeOffersClient";

describe("steamTradeOffersClient helpers", () => {
  it("accepts only 32-character hexadecimal Steam API keys", () => {
    expect(isSteamApiKey("0123456789abcdef0123456789ABCDEF")).toBe(true);
    expect(isSteamApiKey("not-a-real-key")).toBe(false);
    expect(isSteamApiKey("0123456789abcdef0123456789ABCDEZ")).toBe(false);
  });

  it("converts account ids to SteamID64 without losing precision", () => {
    expect(toSteamId64("1")).toBe("76561197960265729");
    expect(toSteamId64("not-number")).toBeNull();
  });

  it("maps known Steam trade offer states", () => {
    expect(mapTradeOfferState(2)).toBe("Active");
    expect(mapTradeOfferState(9)).toBe("Needs confirmation");
    expect(mapTradeOfferState(999)).toBe("Unknown");
  });
});

