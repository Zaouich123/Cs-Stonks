"use client";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { TradeCountdown } from "@/components/management/trades/TradeCountdown";
import { TradePartnerCard } from "@/components/management/trades/TradePartnerCard";
import { TradeStatusBadge } from "@/components/management/trades/TradeStatusBadge";
import { EmptyState } from "@/components/management/widgets/EmptyState";
import { WidgetShell } from "@/components/management/widgets/WidgetShell";
import type { ManagementTrade } from "@/modules/management/types/management.types";

export function TradeTrackerWidget({ trades }: { trades: ManagementTrade[] }) {
  const { formatMoney, language } = usePreferences();

  return (
    <WidgetShell
      eyebrow={language === "FR" ? "Trades" : "Trades"}
      title={language === "FR" ? "Suivi des echanges" : "Trade tracker"}
    >
      {trades.length === 0 ? (
        <EmptyState
          actionHref="/profile"
          actionLabel={language === "FR" ? "Ajouter un trade link" : "Add trade link"}
          description={
            language === "FR"
              ? "Le sprint pose la base: ajoute tes trades manuellement pour suivre le delai de 7 jours."
              : "This sprint lays the base: add trades manually to track the 7-day hold."
          }
          title={language === "FR" ? "Aucun trade suivi" : "No tracked trade"}
        />
      ) : (
        <div className="space-y-3">
          {trades.slice(0, 5).map((trade) => (
            <div key={trade.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <TradePartnerCard trade={trade} />
                <TradeStatusBadge status={trade.status} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <TradeCountdown countdown={trade.countdown} />
                <p className="text-sm font-semibold text-white">
                  {formatMoney(trade.estimatedValueReceived, trade.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
