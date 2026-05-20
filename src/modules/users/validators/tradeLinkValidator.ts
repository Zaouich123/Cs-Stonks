import { ApplicationError } from "@/lib/errors";

const STEAM_TRADE_PATH = "/tradeoffer/new/";
const ALLOWED_STEAM_HOSTS = new Set(["steamcommunity.com", "www.steamcommunity.com"]);

export function normalizeTradeLink(value: string | null | undefined) {
  const input = value?.trim();

  if (!input) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new ApplicationError("Trade link must be a valid Steam URL.", 400);
  }

  if (url.protocol !== "https:" || !ALLOWED_STEAM_HOSTS.has(url.hostname.toLowerCase())) {
    throw new ApplicationError("Trade link must use steamcommunity.com.", 400);
  }

  if (url.pathname !== STEAM_TRADE_PATH) {
    throw new ApplicationError("Trade link must target Steam trade offers.", 400);
  }

  const partner = url.searchParams.get("partner");
  const token = url.searchParams.get("token");

  if (!partner || !/^\d+$/.test(partner)) {
    throw new ApplicationError("Trade link must include a numeric partner parameter.", 400);
  }

  if (!token || !/^[a-zA-Z0-9_-]+$/.test(token)) {
    throw new ApplicationError("Trade link must include a valid token parameter.", 400);
  }

  return `https://steamcommunity.com${STEAM_TRADE_PATH}?partner=${partner}&token=${token}`;
}
