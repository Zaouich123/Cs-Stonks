import { z } from "zod";

import { normalizePhoneCountryCode, normalizePhoneNumber } from "@/modules/users/validators/phoneValidator";
import { normalizeTradeLink } from "@/modules/users/validators/tradeLinkValidator";
import type { UserProfileUpdateInput } from "@/modules/users/types/user.types";

const nullableStringSchema = z.union([z.string(), z.null()]).optional();

export const profileUpdateRequestSchema = z
  .object({
    phoneCountryCode: nullableStringSchema,
    phoneNumber: nullableStringSchema,
    tradeLink: nullableStringSchema,
  })
  .strict();

export function parseUserProfileUpdate(input: unknown): UserProfileUpdateInput {
  const parsed = profileUpdateRequestSchema.parse(input);

  return {
    phoneCountryCode: normalizePhoneCountryCode(parsed.phoneCountryCode),
    phoneNumber: normalizePhoneNumber(parsed.phoneNumber),
    tradeLink: normalizeTradeLink(parsed.tradeLink),
  };
}
