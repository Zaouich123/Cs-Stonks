"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { Button, cn } from "@/components/ui/Button";
import type {
  ExchangeManualAnalysis,
  ExchangeOfferAnalysis,
  ExchangePricedItem,
  ExchangeSteamOffersAnalysis,
  ExchangeOfferVerdict,
} from "@/modules/exchanges/exchange.types";

interface ExchangeAnalyzerProps {
  hasServerSteamApiKey?: boolean;
  user?: {
    steamPersonaName: string;
  };
}

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
  };
  ok: boolean;
}

interface ExchangeSearchItem {
  displayName: string;
  id: string;
  imageUrl: string | null;
  lowestCurrentPrice: number | null;
  lowestCurrentPriceCurrency: string | null;
  marketHashName: string;
  steamImageUrl: string | null;
}

interface ItemSearchResponse {
  items: ExchangeSearchItem[];
}

interface ManualSelection {
  amount: number;
  clientId: string;
  item: ExchangeSearchItem;
}

const verdictStyles: Record<
  ExchangeOfferVerdict,
  {
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  balanced: {
    className: "border-sky-300/20 bg-sky-400/10 text-sky-100",
    icon: CheckCircle2,
  },
  incomplete: {
    className: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    icon: AlertTriangle,
  },
  profitable: {
    className: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
    icon: CheckCircle2,
  },
  risky: {
    className: "border-rose-300/20 bg-rose-400/10 text-rose-100",
    icon: XCircle,
  },
};

const verdictLabels: Record<"EN" | "FR", Record<ExchangeOfferVerdict, string>> = {
  EN: {
    balanced: "Balanced",
    incomplete: "Needs review",
    profitable: "Profitable",
    risky: "Risky",
  },
  FR: {
    balanced: "Equilibre",
    incomplete: "A verifier",
    profitable: "Rentable",
    risky: "Risque",
  },
};

function formatDate(value: string | null, locale: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function getNameClassName(name: string) {
  if (name.includes("StatTrak")) {
    return "text-orange-300";
  }

  if (name.includes("Souvenir")) {
    return "text-amber-300";
  }

  return "text-white";
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/38">{label}</p>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function OfferVerdictBadge({ verdict }: { verdict: ExchangeOfferVerdict }) {
  const { language } = usePreferences();
  const style = verdictStyles[verdict];
  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em]",
        style.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {verdictLabels[language][verdict]}
    </span>
  );
}

function TradeItemRow({ item }: { item: ExchangePricedItem }) {
  const { formatMoney, language } = usePreferences();
  const displayName = item.marketHashName ?? item.marketName ?? item.name;

  return (
    <div className="flex gap-3 rounded-2xl border border-white/8 bg-black/15 p-3">
      {item.iconUrl ? (
        <img
          alt={displayName}
          className="h-14 w-14 shrink-0 rounded-xl bg-white/[0.04] object-contain p-1.5"
          src={item.iconUrl}
        />
      ) : (
        <div className="h-14 w-14 shrink-0 rounded-xl border border-white/8 bg-white/[0.04]" />
      )}

      <div className="min-w-0 flex-1">
        <p className={cn("line-clamp-2 text-sm font-bold", getNameClassName(displayName))}>
          {displayName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/45">
          <span>x{item.amount}</span>
          {item.sourceMarketName ? <span>{item.sourceMarketName}</span> : null}
          {item.sourceUpdatedAt ? <span>{formatDate(item.sourceUpdatedAt, "fr-FR")}</span> : null}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-black text-white">
          {item.totalValue === null ? (language === "FR" ? "Non price" : "Unpriced") : formatMoney(item.totalValue, "EUR")}
        </p>
        {item.sourcePrice !== null && item.sourceCurrency ? (
          <p className="mt-1 text-[11px] font-semibold text-white/38">
            {formatMoney(item.sourcePrice, item.sourceCurrency)} / item
          </p>
        ) : null}
      </div>
    </div>
  );
}

function OfferColumn({
  items,
  title,
  total,
  tone,
}: {
  items: ExchangePricedItem[];
  title: string;
  total: number | null;
  tone: "give" | "receive";
}) {
  const { formatMoney, language } = usePreferences();

  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.028] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl border",
              tone === "receive"
                ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                : "border-rose-300/20 bg-rose-400/10 text-rose-200",
            )}
          >
            {tone === "receive" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
          </span>
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white/70">{title}</h3>
        </div>
        <p className="text-sm font-black text-white">
          {total === null ? (language === "FR" ? "Partiel" : "Partial") : formatMoney(total, "EUR")}
        </p>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-4 text-center text-sm font-semibold text-white/38">
            {language === "FR" ? "Aucun item" : "No item"}
          </div>
        ) : (
          items.map((item, index) => (
            <TradeItemRow key={`${item.assetId}-${item.classId}-${index}`} item={item} />
          ))
        )}
      </div>
    </section>
  );
}

function OfferCard({ offer }: { offer: ExchangeOfferAnalysis }) {
  const { formatMoney, language, locale } = usePreferences();
  const directionLabel = offer.id.startsWith("manual-")
    ? language === "FR" ? "Analyse manuelle" : "Manual analysis"
    : offer.direction === "received"
    ? language === "FR" ? "Offre recue" : "Received offer"
    : language === "FR" ? "Offre envoyee" : "Sent offer";
  const steamProfileUrl = offer.partnerSteamId64
    ? `https://steamcommunity.com/profiles/${offer.partnerSteamId64}`
    : null;

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#101722]/86 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="flex flex-col gap-4 border-b border-white/8 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <OfferVerdictBadge verdict={offer.verdict} />
            <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/65">
              {offer.stateLabel}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-black text-white">{directionLabel} #{offer.id}</h2>
          <p className="mt-1 text-sm text-white/45">
            {language === "FR" ? "Creee" : "Created"} {formatDate(offer.createdAt, locale)}{" - "}
            {language === "FR" ? "Maj" : "Updated"} {formatDate(offer.updatedAt, locale)}
          </p>
          {offer.message ? (
            <p className="mt-3 text-sm font-semibold text-white/60">
              <span aria-hidden="true">&quot;</span>
              {offer.message}
              <span aria-hidden="true">&quot;</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <p
            className={cn(
              "text-2xl font-black",
              offer.netValue === null
                ? "text-white/65"
                : offer.netValue >= 0
                  ? "text-emerald-300"
                  : "text-rose-300",
            )}
          >
            {offer.netValue === null ? "N/A" : formatMoney(offer.netValue, "EUR")}
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
            {language === "FR" ? "Gain net estime" : "Estimated net"}
          </p>
          {steamProfileUrl ? (
            <a
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/65 transition hover:border-[#4da3ff]/35 hover:text-white"
              href={steamProfileUrl}
              rel="noreferrer"
              target="_blank"
            >
              Steam <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 p-5 xl:grid-cols-2">
        <OfferColumn
          items={offer.itemsToGive}
          title={language === "FR" ? "Tu donnes" : "You give"}
          total={offer.totalGiven}
          tone="give"
        />
        <OfferColumn
          items={offer.itemsToReceive}
          title={language === "FR" ? "Tu recois" : "You receive"}
          total={offer.totalReceived}
          tone="receive"
        />
      </div>

      {offer.unpricedItems > 0 ? (
        <div className="border-t border-amber-300/15 bg-amber-300/8 px-5 py-3 text-sm font-semibold text-amber-100/85">
          {language === "FR"
            ? `${offer.unpricedItems} item(s) sans prix en BDD: verdict volontairement prudent.`
            : `${offer.unpricedItems} unpriced item(s): verdict kept conservative.`}
        </div>
      ) : null}
    </article>
  );
}

function ManualSideBuilder({
  items,
  onAdd,
  onAmountChange,
  onRemove,
  title,
  tone,
}: {
  items: ManualSelection[];
  onAdd: (item: ExchangeSearchItem) => void;
  onAmountChange: (clientId: string, amount: number) => void;
  onRemove: (clientId: string) => void;
  title: string;
  tone: "give" | "receive";
}) {
  const { language } = usePreferences();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<ExchangeSearchItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectorOpen, setSelectorOpen] = React.useState(false);

  React.useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/items?query=${encodeURIComponent(trimmedQuery)}&limit=8&sort=displayName_asc`, {
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            return [];
          }

          const payload = (await response.json()) as ApiResponse<ItemSearchResponse>;

          return payload.ok ? payload.data?.items ?? [] : [];
        })
        .then((nextResults) => {
          if (!controller.signal.aborted) {
            setResults(nextResults);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResults([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const slots = Array.from({ length: Math.max(3, items.length + 1) }, (_, index) => items[index] ?? null);

  return (
    <section className="rounded-[1.15rem] border border-white/8 bg-white/[0.028] p-4">
      <div className="mb-4 flex items-center gap-2">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl border",
            tone === "receive"
              ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
              : "border-rose-300/20 bg-rose-400/10 text-rose-200",
          )}
        >
          {tone === "receive" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        </span>
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white/70">{title}</h3>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {slots.map((selection, index) => {
          if (!selection) {
            return (
              <button
                className="flex min-h-[126px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.025] text-white/35 transition hover:border-[#4da3ff]/35 hover:bg-[#4da3ff]/8 hover:text-white"
                key={`empty-${index}`}
                onClick={() => {
                  setSelectorOpen(true);
                  setQuery("");
                  setResults([]);
                }}
                type="button"
              >
                <Plus className="h-6 w-6" />
                <span className="mt-2 text-xs font-black uppercase tracking-[0.16em]">
                  {language === "FR" ? "Ajouter" : "Add"}
                </span>
              </button>
            );
          }

          const imageUrl = selection.item.imageUrl ?? selection.item.steamImageUrl;

          return (
            <div
              className={cn(
                "group relative min-h-[126px] overflow-hidden rounded-2xl border bg-black/18 p-3",
                tone === "receive" ? "border-emerald-300/16" : "border-rose-300/16",
              )}
              key={selection.clientId}
            >
              <button
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/45 opacity-0 transition hover:border-rose-300/30 hover:text-rose-200 group-hover:opacity-100"
                onClick={() => onRemove(selection.clientId)}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              <div className="flex h-16 items-center justify-center">
                {imageUrl ? (
                  <img alt="" className="h-16 w-full object-contain" src={imageUrl} />
                ) : (
                  <div className="h-14 w-14 rounded-xl border border-white/8 bg-white/[0.04]" />
                )}
              </div>

              <p className={cn("mt-2 line-clamp-2 text-xs font-black leading-4", getNameClassName(selection.item.displayName))}>
                {selection.item.displayName}
              </p>

              <div className="mt-2 flex items-center justify-between gap-2">
                <input
                  aria-label={language === "FR" ? "Quantite" : "Quantity"}
                  className="h-8 w-14 rounded-lg border border-white/10 bg-white/[0.045] px-2 text-center text-xs font-black text-white outline-none focus:border-[#4da3ff]/55"
                  min={1}
                  onChange={(event) => onAmountChange(selection.clientId, Math.max(1, Number(event.target.value) || 1))}
                  type="number"
                  value={selection.amount}
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/28">slot {index + 1}</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectorOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#0b1422] shadow-[0_26px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/8 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9dccff]">
                  {title}
                </p>
                <h4 className="mt-1 text-xl font-black text-white">
                  {language === "FR" ? "Selectionner un skin" : "Select a skin"}
                </h4>
              </div>
              <button
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/55 transition hover:border-white/20 hover:text-white"
                onClick={() => {
                  setSelectorOpen(false);
                  setQuery("");
                  setResults([]);
                }}
                type="button"
              >
                {language === "FR" ? "Fermer" : "Close"}
              </button>
            </div>

            <div className="p-5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  autoFocus
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-[#4da3ff]/55 focus:bg-white/[0.07]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={language === "FR" ? "Rechercher un skin..." : "Search a skin..."}
                  value={query}
                />
              </div>

              <div className="mt-4 max-h-[420px] overflow-y-auto rounded-2xl border border-white/8 bg-black/12">
                {query.trim().length < 2 ? (
                  <div className="p-8 text-center text-sm font-semibold text-white/38">
                    {language === "FR" ? "Tape au moins 2 caracteres pour chercher." : "Type at least 2 characters to search."}
                  </div>
                ) : loading ? (
                  <div className="flex items-center gap-2 p-5 text-sm font-semibold text-white/45">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {language === "FR" ? "Recherche..." : "Searching..."}
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-8 text-center text-sm font-semibold text-white/38">
                    {language === "FR" ? "Aucun item trouve" : "No item found"}
                  </div>
                ) : (
                  <div className="grid gap-2 p-2 sm:grid-cols-2">
                    {results.map((item) => {
                      const imageUrl = item.imageUrl ?? item.steamImageUrl;

                      return (
                        <button
                          className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] p-3 text-left transition hover:border-[#4da3ff]/30 hover:bg-[#4da3ff]/8"
                          key={item.id}
                          onClick={() => {
                            onAdd(item);
                            setSelectorOpen(false);
                            setQuery("");
                            setResults([]);
                          }}
                          type="button"
                        >
                          {imageUrl ? (
                            <img alt="" className="h-12 w-12 rounded-lg object-contain" src={imageUrl} />
                          ) : (
                            <div className="h-12 w-12 rounded-lg border border-white/8 bg-white/[0.04]" />
                          )}
                          <span className={cn("min-w-0 flex-1 truncate text-sm font-bold", getNameClassName(item.displayName))}>
                            {item.displayName}
                          </span>
                          <Plus className="h-4 w-4 text-white/35" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ManualAnalysisResultPanel({ analysis }: { analysis: ExchangeManualAnalysis }) {
  const { formatMoney, language } = usePreferences();
  const netValueClassName =
    analysis.summary.netValue === null
      ? "text-white/65"
      : analysis.summary.netValue >= 0
        ? "text-emerald-300"
        : "text-rose-300";

  return (
    <section className="rounded-[1.15rem] border border-white/10 bg-[#08111f]/86 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.24)] md:p-6">
      <div className="border-b border-white/8 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9dccff]">
            {language === "FR" ? "Verdict" : "Verdict"}
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            {language === "FR" ? "Resultat de l'echange" : "Trade result"}
          </h2>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard
            label={language === "FR" ? "Total donne" : "Given total"}
            value={analysis.summary.totalGiven === null ? "N/A" : formatMoney(analysis.summary.totalGiven, "EUR")}
          />
          <StatCard
            label={language === "FR" ? "Total recu" : "Received total"}
            value={analysis.summary.totalReceived === null ? "N/A" : formatMoney(analysis.summary.totalReceived, "EUR")}
          />
          <StatCard
            label={language === "FR" ? "Gain net" : "Net gain"}
            value={
              <span className={netValueClassName}>
                {analysis.summary.netValue === null ? "N/A" : formatMoney(analysis.summary.netValue, "EUR")}
              </span>
            }
          />
        </div>
        <OfferCard offer={analysis.offer} />
      </div>
    </section>
  );
}

function ManualExchangePanel() {
  const { language } = usePreferences();
  const [itemsToGive, setItemsToGive] = React.useState<ManualSelection[]>([]);
  const [itemsToReceive, setItemsToReceive] = React.useState<ManualSelection[]>([]);
  const [analysis, setAnalysis] = React.useState<ExchangeManualAnalysis | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function addSelection(side: "give" | "receive", item: ExchangeSearchItem) {
    const setItems = side === "give" ? setItemsToGive : setItemsToReceive;

    setItems((currentItems) => {
      const existing = currentItems.find((selection) => selection.item.id === item.id);

      if (existing) {
        return currentItems.map((selection) =>
          selection.clientId === existing.clientId
            ? {
                ...selection,
                amount: selection.amount + 1,
              }
            : selection,
        );
      }

      return [
        ...currentItems,
        {
          amount: 1,
          clientId: `${side}-${item.id}-${crypto.randomUUID()}`,
          item,
        },
      ];
    });
  }

  function updateAmount(side: "give" | "receive", clientId: string, amount: number) {
    const setItems = side === "give" ? setItemsToGive : setItemsToReceive;

    setItems((currentItems) =>
      currentItems.map((selection) =>
        selection.clientId === clientId
          ? {
              ...selection,
              amount,
            }
          : selection,
      ),
    );
  }

  function removeSelection(side: "give" | "receive", clientId: string) {
    const setItems = side === "give" ? setItemsToGive : setItemsToReceive;

    setItems((currentItems) => currentItems.filter((selection) => selection.clientId !== clientId));
  }

  async function handleManualSubmit() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/exchanges/manual", {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          itemsToGive: itemsToGive.map((selection) => ({
            amount: selection.amount,
            itemId: selection.item.id,
          })),
          itemsToReceive: itemsToReceive.map((selection) => ({
            amount: selection.amount,
            itemId: selection.item.id,
          })),
        }),
      });
      const payload = (await response.json()) as ApiResponse<ExchangeManualAnalysis>;

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to analyze this manual exchange.");
      }

      setAnalysis(payload.data);
    } catch (nextError) {
      setAnalysis(null);
      setError(nextError instanceof Error ? nextError.message : "Unable to analyze this manual exchange.");
    } finally {
      setLoading(false);
    }
  }

  const canAnalyze = itemsToGive.length > 0 || itemsToReceive.length > 0;

  return (
    <>
      <section className="overflow-visible rounded-[1.15rem] border border-[#4da3ff]/15 bg-[#08111f]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-7">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-black tracking-tight text-white">
            {language === "FR" ? "Analyser un echange manuellement" : "Analyze a trade manually"}
          </h1>

          <Button
            className="h-12 rounded-2xl"
            disabled={!canAnalyze || loading}
            onClick={handleManualSubmit}
            type="button"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {language === "FR" ? "Analyser l'echange" : "Analyze trade"}
          </Button>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <ManualSideBuilder
            items={itemsToGive}
            onAdd={(item) => addSelection("give", item)}
            onAmountChange={(clientId, amount) => updateAmount("give", clientId, amount)}
            onRemove={(clientId) => removeSelection("give", clientId)}
            title={language === "FR" ? "Tu donnes" : "You give"}
            tone="give"
          />
          <ManualSideBuilder
            items={itemsToReceive}
            onAdd={(item) => addSelection("receive", item)}
            onAmountChange={(clientId, amount) => updateAmount("receive", clientId, amount)}
            onRemove={(clientId) => removeSelection("receive", clientId)}
            title={language === "FR" ? "Tu recois" : "You receive"}
            tone="receive"
          />
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm font-semibold text-rose-100">
            {error}
          </div>
        ) : null}
      </section>

      {analysis ? <ManualAnalysisResultPanel analysis={analysis} /> : null}
    </>
  );
}

export function ExchangeAnalyzer({ hasServerSteamApiKey = false, user }: ExchangeAnalyzerProps = {}) {
  const { formatMoney, language } = usePreferences();
  const steamAnalysisEnabled = false;
  const [steamApiKey, setSteamApiKey] = React.useState("");
  const [useServerSteamApiKey, setUseServerSteamApiKey] = React.useState(hasServerSteamApiKey);
  const [getReceivedOffers, setGetReceivedOffers] = React.useState(true);
  const [getSentOffers, setGetSentOffers] = React.useState(false);
  const [activeOnly, setActiveOnly] = React.useState(true);
  const [tradeOfferId, setTradeOfferId] = React.useState("");
  const [analysis, setAnalysis] = React.useState<ExchangeSteamOffersAnalysis | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submitDisabled =
    loading ||
    (!useServerSteamApiKey && !/^[a-fA-F0-9]{32}$/.test(steamApiKey.trim())) ||
    (!tradeOfferId.trim() && !getReceivedOffers && !getSentOffers);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/exchanges/steam-offers", {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          activeOnly,
          getReceivedOffers,
          getSentOffers,
          steamApiKey: useServerSteamApiKey ? undefined : steamApiKey,
          tradeOfferId: tradeOfferId.trim() || undefined,
        }),
      });
      const payload = (await response.json()) as ApiResponse<ExchangeSteamOffersAnalysis>;

      if (!response.ok || !payload.ok || !payload.data) {
        const message = payload.error?.message ?? "Unable to analyze Steam trade offers.";

        if (message.includes("did not return this trade offer")) {
          throw new Error(
            language === "FR"
              ? "Steam ne renvoie pas cette offre pour la clé Web API actuelle. Vérifie que l'ID vient bien de l'URL /tradeoffer/... et que la clé appartient au compte concerné."
              : "Steam did not return this offer for the current Web API key. Check that the ID comes from the /tradeoffer/... URL and that the key belongs to the involved account.",
          );
        }

        throw new Error(message);
      }

      setAnalysis(payload.data);
    } catch (nextError) {
      setAnalysis(null);
      setError(nextError instanceof Error ? nextError.message : "Unable to analyze Steam trade offers.");
    } finally {
      setSteamApiKey("");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <ManualExchangePanel />

      {steamAnalysisEnabled ? (
      <>
      <section className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#08111f]/86 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-white/8 p-6 md:p-8 lg:border-b-0 lg:border-r">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4da3ff]/18 bg-[#4da3ff]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#9dccff]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {language === "FR" ? "Analyse securisee" : "Secure analysis"}
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-5xl">
              {language === "FR" ? "Echanges Steam" : "Steam Exchanges"}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/58">
              {language === "FR"
                ? "Colle ta Steam Web API key uniquement pour lire tes offres actives. Cs-Stonks calcule la valeur avec les prix planchers en BDD, puis oublie la cle juste apres la requete."
                : "Paste your Steam Web API key only to read active offers. Cs-Stonks values them against database floors, then forgets the key immediately after the request."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                  {language === "FR" ? "Stockage" : "Storage"}
                </p>
                <p className="mt-2 text-sm font-bold text-emerald-200">
                  {language === "FR" ? "Aucun" : "None"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                  {language === "FR" ? "Logs" : "Logs"}
                </p>
                <p className="mt-2 text-sm font-bold text-emerald-200">
                  {language === "FR" ? "Cle masquee" : "Key omitted"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                  {language === "FR" ? "Comparaison" : "Valuation"}
                </p>
                <p className="mt-2 text-sm font-bold text-white">Lowest BDD</p>
              </div>
            </div>
          </div>

          <form className="space-y-5 p-6 md:p-8" onSubmit={handleSubmit}>
            {hasServerSteamApiKey ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-300/16 bg-emerald-300/8 p-4 text-sm text-emerald-50">
                <input
                  checked={useServerSteamApiKey}
                  className="mt-1 h-4 w-4 accent-emerald-300"
                  onChange={(event) => setUseServerSteamApiKey(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <span className="block font-black">
                    {language === "FR" ? "Utiliser la cle Steam du .env local" : "Use local .env Steam key"}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-emerald-50/65">
                    {language === "FR"
                      ? "Disponible uniquement en developpement, la cle ne part jamais au navigateur."
                      : "Available only in development; the key is never sent to the browser."}
                  </span>
                </span>
              </label>
            ) : null}

            <label className={cn("block", useServerSteamApiKey && "opacity-45")}>
              <span className="flex items-center gap-2 text-sm font-black text-white">
                <KeyRound className="h-4 w-4 text-[#4da3ff]" />
                Steam Web API key
              </span>
              <input
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className="mt-3 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 font-mono text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#4da3ff]/55 focus:bg-white/[0.07]"
                data-1p-ignore="true"
                data-lpignore="true"
                inputMode="text"
                disabled={useServerSteamApiKey}
                onChange={(event) => setSteamApiKey(event.target.value)}
                placeholder={
                  useServerSteamApiKey
                    ? language === "FR"
                      ? "Cle .env utilisee cote serveur"
                      : "Server-side .env key in use"
                    : "32 caracteres hexadecimaux"
                }
                spellCheck={false}
                type="password"
                value={useServerSteamApiKey ? "" : steamApiKey}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-sm font-bold text-white/75">
                {language === "FR" ? "Offres recues" : "Received"}
                <input
                  checked={getReceivedOffers}
                  className="h-4 w-4 accent-[#4da3ff]"
                  onChange={(event) => setGetReceivedOffers(event.target.checked)}
                  type="checkbox"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-sm font-bold text-white/75">
                {language === "FR" ? "Offres envoyees" : "Sent"}
                <input
                  checked={getSentOffers}
                  className="h-4 w-4 accent-[#4da3ff]"
                  onChange={(event) => setGetSentOffers(event.target.checked)}
                  type="checkbox"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-sm font-bold text-white/75">
                {language === "FR" ? "Actives seulement" : "Active only"}
                <input
                  checked={activeOnly}
                  className="h-4 w-4 accent-[#4da3ff]"
                  onChange={(event) => setActiveOnly(event.target.checked)}
                  type="checkbox"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-black text-white">
                {language === "FR" ? "ID d'offre precise" : "Specific offer ID"}
              </span>
              <input
                className="mt-3 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 font-mono text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#4da3ff]/55 focus:bg-white/[0.07]"
                inputMode="numeric"
                onChange={(event) => setTradeOfferId(event.target.value.replace(/\D/g, ""))}
                placeholder={
                  language === "FR"
                    ? "Optionnel - colle l'ID si la liste Steam ne renvoie rien"
                    : "Optional - paste the ID if Steam list returns nothing"
                }
                value={tradeOfferId}
              />
              <span className="mt-2 block text-xs font-semibold leading-5 text-white/38">
                {language === "FR"
                  ? "Steam affiche parfois le compteur d'offres mais ne renvoie pas les details via GetTradeOffers. Avec l'ID, on tente GetTradeOffer directement."
                  : "Steam can show offer counters but return no details through GetTradeOffers. With an ID, we call GetTradeOffer directly."}
              </span>
            </label>

            <Button className="h-12 w-full rounded-2xl" disabled={submitDisabled} type="submit">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {language === "FR" ? "Analyser mes offres" : "Analyze my offers"}
            </Button>

            <p className="text-xs leading-5 text-white/38">
              {language === "FR"
                ? `Connecte avec ${user?.steamPersonaName ?? "Steam"}. La cle reste en memoire serveur uniquement pendant cette requete. Si tu as un doute, regenere-la sur Steam apres test.`
                : `Connected as ${user?.steamPersonaName ?? "Steam"}. The key lives in server memory only during this request. If unsure, regenerate it on Steam after testing.`}
            </p>
          </form>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-5 text-sm font-semibold text-rose-100">
          {error}
        </div>
      ) : null}

      {analysis ? (
        <>
          {analysis.offers.length === 0 &&
          (analysis.steamSummary.pendingReceived > 0 || analysis.steamSummary.pendingSent > 0) ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm font-semibold leading-6 text-amber-100">
              {language === "FR"
                ? `Steam confirme ${analysis.steamSummary.pendingReceived} offre(s) recue(s) et ${analysis.steamSummary.pendingSent} offre(s) envoyee(s) en attente, mais l'endpoint de liste ne renvoie pas les details. Ouvre l'offre Steam, copie son ID depuis l'URL, puis relance l'analyse avec le champ ID d'offre precise.`
                : `Steam confirms ${analysis.steamSummary.pendingReceived} pending received and ${analysis.steamSummary.pendingSent} pending sent offer(s), but the list endpoint returns no details. Open the Steam offer, copy its ID from the URL, then retry with the specific offer ID field.`}
            </div>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label={language === "FR" ? "Offres" : "Offers"} value={analysis.summary.totalOffers} />
            <StatCard label={language === "FR" ? "Recues" : "Received"} value={analysis.summary.received} />
            <StatCard label={language === "FR" ? "Envoyees" : "Sent"} value={analysis.summary.sent} />
            <StatCard label={language === "FR" ? "Rentables" : "Profitable"} value={analysis.summary.profitable} />
            <StatCard
              label={language === "FR" ? "Dernier run" : "Last run"}
              value={<span className="text-lg">{formatDate(analysis.generatedAt, "fr-FR")}</span>}
            />
          </section>

          {analysis.offers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/12 bg-white/[0.03] p-10 text-center">
              <p className="text-xl font-black text-white">
                {language === "FR" ? "Aucune offre Steam trouvee" : "No Steam offer found"}
              </p>
              <p className="mt-2 text-sm text-white/45">
                {language === "FR"
                  ? "Essaie d'inclure les offres envoyees ou de desactiver le filtre actif uniquement."
                  : "Try including sent offers or disabling active-only filtering."}
              </p>
            </div>
          ) : (
            <section className="space-y-5">
              {analysis.offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </section>
          )}

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-xs leading-5 text-white/38">
            {language === "FR"
              ? `Valeurs normalisees en EUR pour comparer les offres. Les prix viennent du lowest price actuellement stocke en BDD; si un item est absent, l'offre passe en mode prudent. Exemple de net: ${formatMoney(0, "EUR")}.`
              : `Values are normalized to EUR for offer comparison. Prices come from the lowest database floor; if an item is missing, the offer is marked conservative. Example net: ${formatMoney(0, "EUR")}.`}
          </div>
        </>
      ) : null}
      </>
      ) : null}
    </div>
  );
}
