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
  const output: UserProfileUpdateInput = {};

  if ("phoneCountryCode" in parsed) {
    output.phoneCountryCode = normalizePhoneCountryCode(parsed.phoneCountryCode);
  }

  if ("phoneNumber" in parsed) {
    output.phoneNumber = normalizePhoneNumber(parsed.phoneNumber);
  }

  if ("tradeLink" in parsed) {
    output.tradeLink = normalizeTradeLink(parsed.tradeLink);
  }

  return output;
}
