"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import type { ManagementDashboardData } from "@/modules/management/types/management.types";
import { EmptyState } from "@/components/management/widgets/EmptyState";
import { WidgetShell } from "@/components/management/widgets/WidgetShell";

export function InventoryValueWidget({ inventory: initialInventory }: { inventory: ManagementDashboardData["inventory"] }) {
  const { formatMoney, language } = usePreferences();
  const [inventory, setInventory] = React.useState(initialInventory);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const syncInventory = async () => {
    setSyncing(true);
    setError(null);

    try {
      const response = await fetch("/api/management/inventory-value?refresh=1", {
        headers: {
          Accept: "application/json",
        },
      });
      const payload = await response.json();

      if (!payload.ok) {
        throw new Error(payload.error?.message ?? "Unable to sync inventory.");
      }

      setInventory(payload.data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sync inventory.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <WidgetShell
      action={
        <button
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/62 transition hover:text-white disabled:opacity-45"
          disabled={syncing}
          onClick={syncInventory}
          type="button"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          {language === "FR" ? "Sync" : "Sync"}
        </button>
      }
      eyebrow={language === "FR" ? "Portfolio" : "Portfolio"}
      title={language === "FR" ? "Valeur inventaire" : "Inventory value"}
    >
      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error.includes("429")
            ? language === "FR"
              ? "Steam limite temporairement les requetes. Reessaie dans quelques minutes."
              : "Steam is temporarily rate-limiting requests. Try again in a few minutes."
            : error}
        </div>
      ) : null}

      {!inventory.latest ? (
        <EmptyState
          actionHref="/inventory"
          actionLabel={language === "FR" ? "Voir l'inventaire" : "Open inventory"}
          description={
            language === "FR"
              ? "Aucun snapshot d'inventaire n'est encore stocke. Synchronise ton inventaire Steam pour suivre sa valeur."
              : "No inventory snapshot has been stored yet. Sync your Steam inventory to track its value."
          }
          title={language === "FR" ? "Inventaire non synchronise" : "Inventory not synced"}
        />
      ) : (
        <div>
          <p className="text-4xl font-semibold text-white">
            {formatMoney(inventory.latest.totalValue, inventory.latest.currency)}
          </p>
          <p
            className={`mt-3 text-sm font-semibold ${
              inventory.delta.absoluteChange >= 0 ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {inventory.delta.absoluteChange >= 0 ? "+" : ""}
            {formatMoney(inventory.delta.absoluteChange, inventory.latest.currency)} ·{" "}
            {inventory.delta.percentageChange.toFixed(2)}%
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Items</p>
              <p className="mt-2 text-xl font-semibold text-white">{inventory.latest.itemCount}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                {language === "FR" ? "Source" : "Source"}
              </p>
              <p className="mt-2 truncate text-sm font-semibold text-white">{inventory.latest.source}</p>
            </div>
          </div>
          <Link
            className="mt-5 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/68 transition hover:text-white"
            href="/inventory"
          >
            {language === "FR" ? "Ouvrir inventaire" : "Open inventory"}
          </Link>
        </div>
      )}
    </WidgetShell>
  );
}
