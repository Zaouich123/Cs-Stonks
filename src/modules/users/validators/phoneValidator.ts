import { ApplicationError } from "@/lib/errors";

const PHONE_NUMBER_PATTERN = /^[+\d][\d\s().-]{5,24}$/;
const COUNTRY_CODE_PATTERN = /^\+\d{1,4}$/;

export function normalizePhoneCountryCode(value: string | null | undefined) {
  const input = value?.trim();

  if (!input) {
    return null;
  }

  if (!COUNTRY_CODE_PATTERN.test(input)) {
    throw new ApplicationError("Phone country code must look like +33.", 400);
  }

  return input;
}

export function normalizePhoneNumber(value: string | null | undefined) {
  const input = value?.trim();

  if (!input) {
    return null;
  }

  if (!PHONE_NUMBER_PATTERN.test(input)) {
    throw new ApplicationError("Phone number format is invalid.", 400);
  }

  return input.replace(/\s+/g, " ");
}
