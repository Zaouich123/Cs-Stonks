"use client";

import { Activity, Bell, Handshake, Store, Wallet } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import type { ManagementDashboardData } from "@/modules/management/types/management.types";

interface ManagementSummaryCardsProps {
  summary: ManagementDashboardData["summary"];
}

export function ManagementSummaryCards({ summary }: ManagementSummaryCardsProps) {
  const { formatMoney, language } = usePreferences();
  const cards = [
    {
      color: "text-[#4da3ff]",
      icon: Wallet,
      label: language === "FR" ? "Valeur inventaire" : "Inventory value",
      value: formatMoney(summary.inventoryValue, summary.inventoryCurrency),
    },
    {
      color: "text-emerald-300",
      icon: Activity,
      label: language === "FR" ? "Skins suivis" : "Tracked skins",
      value: summary.trackedSkins.toString(),
    },
    {
      color: "text-cyan-300",
      icon: Store,
      label: language === "FR" ? "Listings actifs" : "Active listings",
      value: summary.activeListings.toString(),
    },
    {
      color: "text-amber-300",
      icon: Handshake,
      label: language === "FR" ? "Trades en attente" : "Pending trades",
      value: summary.pendingTrades.toString(),
    },
    {
      color: "text-rose-300",
      icon: Bell,
      label: language === "FR" ? "Notifications" : "Notifications",
      value: summary.unreadNotifications.toString(),
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-[1.25rem] border border-white/8 bg-white/[0.035] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.2)] backdrop-blur"
          >
            <Icon className={`h-5 w-5 ${card.color}`} />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
          </div>
        );
      })}
    </section>
  );
}
