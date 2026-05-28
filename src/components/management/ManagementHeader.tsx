"use client";

import Link from "next/link";
import { Bell, LineChart, WalletCards } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { Button } from "@/components/ui/Button";
import type { ManagementDashboardData } from "@/modules/management/types/management.types";
import type { SessionUser } from "@/modules/auth/types/auth.types";

interface ManagementHeaderProps {
  summary: ManagementDashboardData["summary"];
  user: SessionUser;
}

export function ManagementHeader({ summary, user }: ManagementHeaderProps) {
  const { formatMoney, language } = usePreferences();
  const avatarUrl = user.steamAvatarFull ?? user.steamAvatarMedium ?? user.steamAvatar;

  return (
    <section className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#07101d]/78 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-8">
      <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#093066]/55 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-[#4da3ff]/70 to-transparent" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={user.steamPersonaName}
              className="h-20 w-20 rounded-2xl border border-white/12 object-cover shadow-2xl"
              src={avatarUrl}
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/12 bg-[#093066] text-3xl font-black uppercase">
              {user.steamPersonaName.slice(0, 1)}
            </span>
          )}

          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
              {language === "FR" ? "Management dashboard" : "Management dashboard"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58 md:text-base">
              {language === "FR"
                ? `Centre de controle personnel pour ${user.steamPersonaName}: skins suivis, inventaire, ventes, trades et alertes.`
                : `Personal control center for ${user.steamPersonaName}: tracked skins, inventory, sales, trades and alerts.`}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[440px]">
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
            <WalletCards className="h-5 w-5 text-[#4da3ff]" />
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/35">
              {language === "FR" ? "Inventaire" : "Inventory"}
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {formatMoney(summary.inventoryValue, summary.inventoryCurrency)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
            <LineChart className="h-5 w-5 text-emerald-300" />
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/35">
              {language === "FR" ? "Skins suivis" : "Tracked"}
            </p>
            <p className="mt-1 text-xl font-semibold text-white">{summary.trackedSkins}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
            <Bell className="h-5 w-5 text-amber-300" />
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/35">
              {language === "FR" ? "Non lues" : "Unread"}
            </p>
            <p className="mt-1 text-xl font-semibold text-white">{summary.unreadNotifications}</p>
          </div>
        </div>
      </div>

      <div className="relative mt-8 flex flex-wrap gap-3">
        <Link href="/prices">
          <Button variant="primary">{language === "FR" ? "Tracker un skin" : "Track a skin"}</Button>
        </Link>
        <Link href="/profile">
          <Button variant="secondary">{language === "FR" ? "Parametres profil" : "Profile settings"}</Button>
        </Link>
      </div>
    </section>
  );
}
