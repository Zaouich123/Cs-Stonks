import { ApplicationError } from "@/lib/errors";
import type { SteamTradeOffer, SteamTradeOfferAsset } from "@/modules/exchanges/exchange.types";

const STEAM_TRADE_OFFERS_URL = "https://api.steampowered.com/IEconService/GetTradeOffers/v1/";
const STEAM_ID64_ACCOUNT_OFFSET = BigInt("76561197960265728");

interface FetchSteamTradeOffersInput {
  activeOnly: boolean;
  getReceivedOffers: boolean;
  getSentOffers: boolean;
  steamApiKey: string;
  tradeOfferId?: string | null;
}

interface SteamAssetDescription {
  appid?: number | string;
  classid?: string;
  icon_url?: string;
  instanceid?: string;
  market_hash_name?: string;
  market_name?: string;
  name?: string;
}

interface SteamOfferAssetPayload {
  amount?: number | string;
  appid?: number | string;
  assetid?: string;
  classid?: string;
  instanceid?: string;
}

interface SteamTradeOfferPayload {
  accountid_other?: number | string;
  escrow_end_date?: number | string;
  expiration_time?: number | string;
  is_our_offer?: boolean;
  items_to_give?: SteamOfferAssetPayload[];
  items_to_receive?: SteamOfferAssetPayload[];
  message?: string;
  time_created?: number | string;
  time_updated?: number | string;
  trade_offer_state?: number | string;
  tradeofferid?: string;
}

interface SteamTradeOffersPayload {
  response?: {
    descriptions?: SteamAssetDescription[];
    offer?: SteamTradeOfferPayload;
    trade_offers_received?: SteamTradeOfferPayload[];
    trade_offers_sent?: SteamTradeOfferPayload[];
  };
}

export interface SteamTradeOffersSummary {
  escrowReceived: number;
  escrowSent: number;
  historicalReceived: number;
  historicalSent: number;
  newReceived: number;
  pendingReceived: number;
  pendingSent: number;
  rawAvailable: boolean;
  updatedReceived: number;
  updatedSent: number;
}

export function isSteamApiKey(value: string) {
  return /^[a-fA-F0-9]{32}$/.test(value.trim());
}

export function toSteamId64(accountId: string | null) {
  if (!accountId || !/^\d+$/.test(accountId)) {
    return null;
  }

  return (BigInt(accountId) + STEAM_ID64_ACCOUNT_OFFSET).toString();
}

export function mapTradeOfferState(state: number) {
  const states: Record<number, string> = {
    1: "Invalid",
    2: "Active",
    3: "Accepted",
    4: "Countered",
    5: "Expired",
    6: "Canceled",
    7: "Declined",
    8: "Invalid items",
    9: "Needs confirmation",
    10: "Canceled by 2FA",
    11: "In escrow",
  };

  return states[state] ?? "Unknown";
}

function toNumber(value: number | string | undefined, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function toDateIso(value: number | string | undefined) {
  const timestamp = toNumber(value);

  if (!timestamp) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString();
}

function getDescriptionKey(input: { appid?: number | string; classid?: string; instanceid?: string }) {
  return `${toNumber(input.appid)}:${input.classid ?? ""}:${input.instanceid ?? ""}`;
}

function normalizeDescriptionMap(descriptions: SteamAssetDescription[] = []) {
  const map = new Map<string, SteamAssetDescription>();

  for (const description of descriptions) {
    map.set(getDescriptionKey(description), description);
  }

  return map;
}

function toImageUrl(iconUrl: string | undefined) {
  if (!iconUrl) {
    return null;
  }

  if (iconUrl.startsWith("http://") || iconUrl.startsWith("https://")) {
    return iconUrl;
  }

  return `https://community.cloudflare.steamstatic.com/economy/image/${iconUrl}`;
}

function normalizeAssets(
  assets: SteamOfferAssetPayload[] | undefined,
  descriptionMap: Map<string, SteamAssetDescription>,
): SteamTradeOfferAsset[] {
  return (assets ?? []).map((asset) => {
    const description = descriptionMap.get(getDescriptionKey(asset));
    const fallbackName = description?.market_hash_name ?? description?.market_name ?? description?.name ?? "Unknown item";

    return {
      amount: Math.max(1, Math.trunc(toNumber(asset.amount, 1))),
      appId: toNumber(asset.appid),
      assetId: asset.assetid ?? "",
      classId: asset.classid ?? "",
      iconUrl: toImageUrl(description?.icon_url),
      instanceId: asset.instanceid ?? "",
      marketHashName: description?.market_hash_name ?? null,
      marketName: description?.market_name ?? null,
      name: fallbackName,
    };
  });
}

function normalizeOffer(
  offer: SteamTradeOfferPayload,
  direction: "received" | "sent",
  descriptionMap: Map<string, SteamAssetDescription>,
): SteamTradeOffer {
  const state = Math.trunc(toNumber(offer.trade_offer_state));
  const partnerAccountId =
    offer.accountid_other === undefined || offer.accountid_other === null ? null : String(offer.accountid_other);

  return {
    createdAt: toDateIso(offer.time_created),
    direction,
    expiresAt: toDateIso(offer.expiration_time),
    id: offer.tradeofferid ?? "",
    itemsToGive: normalizeAssets(offer.items_to_give, descriptionMap),
    itemsToReceive: normalizeAssets(offer.items_to_receive, descriptionMap),
    message: offer.message?.trim() || null,
    partnerAccountId,
    partnerSteamId64: toSteamId64(partnerAccountId),
    state,
    stateLabel: mapTradeOfferState(state),
    updatedAt: toDateIso(offer.time_updated),
  };
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApplicationError("Steam refused the trade offers request.", response.status === 403 ? 403 : 502);
    }

    return (await response.json()) as SteamTradeOffersPayload;
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }

    throw new ApplicationError("Unable to reach Steam trade offers right now.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

function toSummary(payload: unknown): SteamTradeOffersSummary {
  const response =
    typeof payload === "object" && payload !== null && "response" in payload
      ? (payload as { response?: Record<string, unknown> }).response
      : null;
  const readNumber = (key: string) => {
    const value = response?.[key];

    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  };

  return {
    escrowReceived: readNumber("escrow_received_count"),
    escrowSent: readNumber("escrow_sent_count"),
    historicalReceived: readNumber("historical_received_count"),
    historicalSent: readNumber("historical_sent_count"),
    newReceived: readNumber("new_received_count"),
    pendingReceived: readNumber("pending_received_count"),
    pendingSent: readNumber("pending_sent_count"),
    rawAvailable: Boolean(response),
    updatedReceived: readNumber("updated_received_count"),
    updatedSent: readNumber("updated_sent_count"),
  };
}

export class SteamTradeOffersClient {
  async fetchSummary(steamApiKey: string): Promise<SteamTradeOffersSummary> {
    const key = steamApiKey.trim();

    if (!isSteamApiKey(key)) {
      throw new ApplicationError("Invalid Steam Web API key format.", 400);
    }

    const params = new URLSearchParams({
      key,
      time_last_visit: "0",
    });
    const payload = await fetchJsonWithTimeout(
      `https://api.steampowered.com/IEconService/GetTradeOffersSummary/v1/?${params.toString()}`,
      10_000,
    );

    return toSummary(payload);
  }

  async fetchOfferById(input: { steamApiKey: string; tradeOfferId: string }): Promise<SteamTradeOffer> {
    const steamApiKey = input.steamApiKey.trim();
    const tradeOfferId = input.tradeOfferId.trim();

    if (!isSteamApiKey(steamApiKey)) {
      throw new ApplicationError("Invalid Steam Web API key format.", 400);
    }

    if (!/^\d{6,32}$/.test(tradeOfferId)) {
      throw new ApplicationError("Trade offer ID must be numeric.", 400);
    }

    const params = new URLSearchParams({
      get_descriptions: "1",
      key: steamApiKey,
      language: "en",
      tradeofferid: tradeOfferId,
    });
    const payload = await fetchJsonWithTimeout(
      `https://api.steampowered.com/IEconService/GetTradeOffer/v1/?${params.toString()}`,
      10_000,
    );
    const descriptionMap = normalizeDescriptionMap(payload.response?.descriptions);
    const offer = payload.response?.offer;

    if (!offer) {
      throw new ApplicationError(
        "Steam did not return this trade offer for the current Web API key.",
        404,
        {
          tradeOfferId,
        },
      );
    }

    return normalizeOffer(offer, offer.is_our_offer ? "sent" : "received", descriptionMap);
  }

  async fetchOffers(input: FetchSteamTradeOffersInput): Promise<SteamTradeOffer[]> {
    const steamApiKey = input.steamApiKey.trim();

    if (!isSteamApiKey(steamApiKey)) {
      throw new ApplicationError("Invalid Steam Web API key format.", 400);
    }

    if (!input.getReceivedOffers && !input.getSentOffers) {
      throw new ApplicationError("At least one offer direction must be selected.", 400);
    }

    const params = new URLSearchParams({
      active_only: input.activeOnly ? "1" : "0",
      get_descriptions: "1",
      get_received_offers: input.getReceivedOffers ? "1" : "0",
      get_sent_offers: input.getSentOffers ? "1" : "0",
      historical_only: "0",
      key: steamApiKey,
      language: "en",
      time_historical_cutoff: String(Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60),
    });
    const payload = await fetchJsonWithTimeout(`${STEAM_TRADE_OFFERS_URL}?${params.toString()}`, 10_000);
    const descriptionMap = normalizeDescriptionMap(payload.response?.descriptions);
    const receivedOffers = (payload.response?.trade_offers_received ?? []).map((offer) =>
      normalizeOffer(offer, "received", descriptionMap),
    );
    const sentOffers = (payload.response?.trade_offers_sent ?? []).map((offer) =>
      normalizeOffer(offer, "sent", descriptionMap),
    );

    return [...receivedOffers, ...sentOffers].filter((offer) => offer.id);
  }
}
