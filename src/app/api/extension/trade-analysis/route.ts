import { NextResponse } from "next/server";
import { z } from "zod";

import { handleRouteError, readOptionalJson } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { ApplicationError } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const USD_EUR_RATE = Number(process.env.NEXT_PUBLIC_USD_EUR_RATE ?? "0.92");

const extensionItemSchema = z.object({
  amount: z.coerce.number().int().min(1).max(10000).default(1),
  imageUrl: z.string().trim().url().nullable().optional(),
  name: z.string().trim().min(1).max(220),
});

const requestSchema = z.object({
  itemsToGive: z.array(extensionItemSchema).max(80).default([]),
  itemsToReceive: z.array(extensionItemSchema).max(80).default([]),
  source: z.string().trim().max(80).optional(),
  tradeOfferId: z.string().trim().max(80).nullable().optional(),
});

type ExtensionItemInput = z.infer<typeof extensionItemSchema>;

interface LowestCandidate {
  currency: string;
  fetchedAt: Date;
  itemId: string;
  marketName: string;
  marketSlug: string;
  matchedName: string;
  price: number;
  priceEur: number;
}

interface PricedExtensionItem {
  amount: number;
  imageUrl: string | null;
  matchedItemId: string | null;
  matchedName: string | null;
  name: string;
  sourceCurrency: string | null;
  sourceMarketName: string | null;
  sourceMarketSlug: string | null;
  sourcePrice: number | null;
  sourceUpdatedAt: string | null;
  totalValueEur: number | null;
  unitPriceEur: number | null;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
    Pragma: "no-cache",
    "X-Robots-Tag": "noindex",
  };
}

function withCors(response: Response) {
  for (const [key, value] of Object.entries(corsHeaders())) {
    response.headers.set(key, value);
  }

  return response;
}

function successJson<T>(data: T, status = 200) {
  return withCors(
    NextResponse.json(
      {
        ok: true,
        data,
      },
      { status },
    ),
  );
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function toEur(value: number, currency: string) {
  const normalizedCurrency = currency.trim().toUpperCase();

  if (normalizedCurrency === "EUR") {
    return value;
  }

  if (normalizedCurrency === "USD") {
    return value * (USD_EUR_RATE > 0 ? USD_EUR_RATE : 0.92);
  }

  return value;
}

function sumPriced(items: PricedExtensionItem[]) {
  const values = items
    .map((item) => item.totalValueEur)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0);
}

function getVerdict(netValue: number | null, unpricedItems: number) {
  if (netValue === null || unpricedItems > 0) {
    return "incomplete";
  }

  if (netValue > 1) {
    return "profitable";
  }

  if (netValue < -1) {
    return "risky";
  }

  return "balanced";
}

function pickLowestCandidate(candidates: LowestCandidate[]) {
  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((left, right) => left.priceEur - right.priceEur)[0];
}

function normalizeInputItems(items: ExtensionItemInput[]) {
  const itemMap = new Map<string, ExtensionItemInput>();

  for (const item of items) {
    const normalizedName = item.name.trim().replace(/\s+/g, " ");
    const key = normalizeName(normalizedName);
    const current = itemMap.get(key);

    if (current) {
      itemMap.set(key, {
        ...current,
        amount: current.amount + item.amount,
        imageUrl: current.imageUrl ?? item.imageUrl ?? null,
      });
      continue;
    }

    itemMap.set(key, {
      amount: item.amount,
      imageUrl: item.imageUrl ?? null,
      name: normalizedName,
    });
  }

  return [...itemMap.values()];
}

async function getLowestCandidatesByName(names: string[]) {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];

  if (uniqueNames.length === 0) {
    return new Map<string, LowestCandidate[]>();
  }

  const items = await prisma.item.findMany({
    include: {
      latestPrices: {
        include: {
          market: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        where: {
          market: {
            enabled: true,
          },
          price: {
            gt: 0,
          },
        },
      },
    },
    where: {
      OR: uniqueNames.flatMap((name) => [
        {
          marketHashName: {
            equals: name,
            mode: "insensitive" as const,
          },
        },
        {
          displayName: {
            equals: name,
            mode: "insensitive" as const,
          },
        },
      ]),
      isActive: true,
    },
  });
  const candidateMap = new Map<string, LowestCandidate[]>();

  for (const item of items) {
    const keys = [item.marketHashName, item.displayName].map(normalizeName);

    for (const latestPrice of item.latestPrices) {
      const price = latestPrice.price.toNumber();
      const candidate: LowestCandidate = {
        currency: latestPrice.currency,
        fetchedAt: latestPrice.fetchedAt,
        itemId: item.id,
        marketName: latestPrice.market.name,
        marketSlug: latestPrice.market.slug,
        matchedName: item.marketHashName,
        price,
        priceEur: toEur(price, latestPrice.currency),
      };

      for (const key of keys) {
        const candidates = candidateMap.get(key) ?? [];

        candidates.push(candidate);
        candidateMap.set(key, candidates);
      }
    }
  }

  return candidateMap;
}

function priceItems(items: ExtensionItemInput[], candidateMap: Map<string, LowestCandidate[]>) {
  return items.map<PricedExtensionItem>((item) => {
    const candidate = pickLowestCandidate(candidateMap.get(normalizeName(item.name)) ?? []);

    if (!candidate) {
      return {
        amount: item.amount,
        imageUrl: item.imageUrl ?? null,
        matchedItemId: null,
        matchedName: null,
        name: item.name,
        sourceCurrency: null,
        sourceMarketName: null,
        sourceMarketSlug: null,
        sourcePrice: null,
        sourceUpdatedAt: null,
        totalValueEur: null,
        unitPriceEur: null,
      };
    }

    return {
      amount: item.amount,
      imageUrl: item.imageUrl ?? null,
      matchedItemId: candidate.itemId,
      matchedName: candidate.matchedName,
      name: item.name,
      sourceCurrency: candidate.currency,
      sourceMarketName: candidate.marketName,
      sourceMarketSlug: candidate.marketSlug,
      sourcePrice: candidate.price,
      sourceUpdatedAt: candidate.fetchedAt.toISOString(),
      totalValueEur: candidate.priceEur * item.amount,
      unitPriceEur: candidate.priceEur,
    };
  });
}

export async function OPTIONS() {
  return withCors(new Response(null, { status: 204 }));
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await readOptionalJson(request));
    const itemsToGiveInput = normalizeInputItems(body.itemsToGive);
    const itemsToReceiveInput = normalizeInputItems(body.itemsToReceive);

    if (itemsToGiveInput.length === 0 && itemsToReceiveInput.length === 0) {
      throw new ApplicationError("At least one item is required to analyze an exchange.", 400);
    }

    const candidateMap = await getLowestCandidatesByName(
      [...itemsToGiveInput, ...itemsToReceiveInput].map((item) => item.name),
    );
    const itemsToGive = priceItems(itemsToGiveInput, candidateMap);
    const itemsToReceive = priceItems(itemsToReceiveInput, candidateMap);
    const totalGiven = sumPriced(itemsToGive);
    const totalReceived = sumPriced(itemsToReceive);
    const netValue = totalGiven === null || totalReceived === null ? null : totalReceived - totalGiven;
    const unpricedItems = [...itemsToGive, ...itemsToReceive].filter((item) => item.totalValueEur === null).length;

    return successJson({
      generatedAt: new Date().toISOString(),
      offer: {
        itemsToGive,
        itemsToReceive,
        tradeOfferId: body.tradeOfferId ?? null,
      },
      source: body.source ?? "steam-extension",
      summary: {
        netValue,
        totalGiven,
        totalReceived,
        unpricedItems,
        verdict: getVerdict(netValue, unpricedItems),
      },
    });
  } catch (error) {
    return withCors(handleRouteError(error));
  }
}
