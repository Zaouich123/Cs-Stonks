export type ExchangeOfferDirection = "received" | "sent";

export type ExchangeOfferVerdict = "profitable" | "balanced" | "risky" | "incomplete";

export interface SteamTradeOfferAsset {
  amount: number;
  appId: number;
  assetId: string;
  classId: string;
  iconUrl: string | null;
  instanceId: string;
  marketHashName: string | null;
  marketName: string | null;
  name: string;
}

export interface SteamTradeOffer {
  createdAt: string | null;
  direction: ExchangeOfferDirection;
  expiresAt: string | null;
  id: string;
  itemsToGive: SteamTradeOfferAsset[];
  itemsToReceive: SteamTradeOfferAsset[];
  message: string | null;
  partnerAccountId: string | null;
  partnerSteamId64: string | null;
  state: number;
  stateLabel: string;
  updatedAt: string | null;
}

export interface ExchangePricedItem extends SteamTradeOfferAsset {
  itemId: string | null;
  matchedDisplayName: string | null;
  sourceCurrency: string | null;
  sourceMarketName: string | null;
  sourceMarketSlug: string | null;
  sourcePrice: number | null;
  sourceUpdatedAt: string | null;
  totalValue: number | null;
  unitPrice: number | null;
  valuationCurrency: "EUR";
}

export interface ExchangeOfferAnalysis {
  createdAt: string | null;
  direction: ExchangeOfferDirection;
  expiresAt: string | null;
  id: string;
  itemsToGive: ExchangePricedItem[];
  itemsToReceive: ExchangePricedItem[];
  message: string | null;
  netValue: number | null;
  partnerAccountId: string | null;
  partnerSteamId64: string | null;
  pricedItems: number;
  state: number;
  stateLabel: string;
  totalGiven: number | null;
  totalReceived: number | null;
  unpricedItems: number;
  updatedAt: string | null;
  verdict: ExchangeOfferVerdict;
}

export interface ExchangeSteamOffersAnalysis {
  generatedAt: string;
  offers: ExchangeOfferAnalysis[];
  security: {
    apiKeyStored: false;
    notes: string[];
  };
  steamSummary: {
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
  };
  summary: {
    balanced: number;
    incomplete: number;
    profitable: number;
    received: number;
    risky: number;
    sent: number;
    totalOffers: number;
  };
}

export interface ExchangeManualItemInput {
  amount: number;
  itemId: string;
}

export interface ExchangeManualAnalysis {
  generatedAt: string;
  offer: ExchangeOfferAnalysis;
  summary: {
    netValue: number | null;
    totalGiven: number | null;
    totalReceived: number | null;
    unpricedItems: number;
    verdict: ExchangeOfferVerdict;
  };
}
