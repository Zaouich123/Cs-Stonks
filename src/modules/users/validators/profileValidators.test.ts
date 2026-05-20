import { describe, expect, it } from "vitest";

import { parseUserProfileUpdate } from "@/modules/users/validators/profileValidators";

describe("profile validators", () => {
  it("accepts and normalizes a valid Steam trade link", () => {
    expect(
      parseUserProfileUpdate({
        tradeLink:
          "https://steamcommunity.com/tradeoffer/new/?token=abcdef&partner=123456789",
      }).tradeLink,
    ).toBe("https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=abcdef");
  });

  it("rejects suspicious trade link domains", () => {
    expect(() =>
      parseUserProfileUpdate({
        tradeLink: "https://fake-steam.com/tradeoffer/new/?partner=123&token=abc",
      }),
    ).toThrow("steamcommunity.com");
  });

  it("rejects trade links without token", () => {
    expect(() =>
      parseUserProfileUpdate({
        tradeLink: "https://steamcommunity.com/tradeoffer/new/?partner=123",
      }),
    ).toThrow("token");
  });

  it("accepts basic phone data and leaves phone unverified to the service layer", () => {
    expect(
      parseUserProfileUpdate({
        phoneCountryCode: "+33",
        phoneNumber: "6 12 34 56 78",
      }),
    ).toMatchObject({
      phoneCountryCode: "+33",
      phoneNumber: "6 12 34 56 78",
    });
  });

  it("rejects invalid phone formats", () => {
    expect(() =>
      parseUserProfileUpdate({
        phoneCountryCode: "33",
        phoneNumber: "abc",
      }),
    ).toThrow("Phone country code");
  });
});
