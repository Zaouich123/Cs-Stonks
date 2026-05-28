import { describe, expect, it } from "vitest";

import {
  normalizePhoneCountryCode,
  normalizePhoneNumber,
} from "@/modules/users/validators/phoneValidator";

describe("phoneValidator", () => {
  it("normalizes blank phone inputs to null", () => {
    expect(normalizePhoneCountryCode(null)).toBeNull();
    expect(normalizePhoneCountryCode("   ")).toBeNull();
    expect(normalizePhoneNumber(undefined)).toBeNull();
    expect(normalizePhoneNumber("   ")).toBeNull();
  });

  it("accepts valid country codes and phone numbers", () => {
    expect(normalizePhoneCountryCode(" +33 ")).toBe("+33");
    expect(normalizePhoneNumber("  +33   6 12 34 56 78 ")).toBe("+33 6 12 34 56 78");
    expect(normalizePhoneNumber("555 123-4567")).toBe("555 123-4567");
  });

  it("rejects malformed values", () => {
    expect(() => normalizePhoneCountryCode("33")).toThrow("Phone country code");
    expect(() => normalizePhoneCountryCode("+12345")).toThrow("Phone country code");
    expect(() => normalizePhoneNumber("abc")).toThrow("Phone number format");
    expect(() => normalizePhoneNumber("+1")).toThrow("Phone number format");
  });
});
