import { ApplicationError } from "@/lib/errors";
import { getSteamOpenIdProviderUrl } from "@/modules/auth/steam/steamOpenId";

const STEAM_CLAIMED_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17,20})$/;

export interface VerifiedSteamOpenId {
  claimedId: string;
  steamId: string;
}

export function extractSteamIdFromClaimedId(claimedId: string) {
  const match = STEAM_CLAIMED_ID_PATTERN.exec(claimedId.trim());

  if (!match?.[1]) {
    throw new ApplicationError("Invalid Steam OpenID claimed id.", 400);
  }

  return match[1];
}

function buildVerificationBody(searchParams: URLSearchParams) {
  const body = new URLSearchParams();

  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("openid.")) {
      body.set(key, value);
    }
  }

  body.set("openid.mode", "check_authentication");

  return body;
}

export async function verifySteamOpenIdCallback(
  searchParams: URLSearchParams,
  fetchImpl: typeof fetch = fetch,
): Promise<VerifiedSteamOpenId> {
  const claimedId = searchParams.get("openid.claimed_id");

  if (!claimedId) {
    throw new ApplicationError("Steam callback is missing claimed_id.", 400);
  }

  const steamId = extractSteamIdFromClaimedId(claimedId);
  const response = await fetchImpl(getSteamOpenIdProviderUrl(), {
    body: buildVerificationBody(searchParams),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new ApplicationError("Steam OpenID verification failed.", 502);
  }

  const text = await response.text();

  if (!/(^|\n)is_valid\s*:\s*true(\n|$)/.test(text.trim())) {
    throw new ApplicationError("Steam OpenID response is not valid.", 401);
  }

  return {
    claimedId,
    steamId,
  };
}
