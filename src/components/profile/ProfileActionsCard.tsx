"use client";

import { useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import type { SessionUser } from "@/modules/auth/types/auth.types";

export function ProfileActionsCard({ user }: { user: SessionUser }) {
  const { language, t } = usePreferences();
  const [message, setMessage] = useState<string | null>(null);
  const [resyncing, setResyncing] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    window.location.href = "/auth";
  }

  async function resync() {
    setResyncing(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/steam/resync", {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message ?? (language === "FR" ? "Impossible de resynchroniser le profil Steam." : "Unable to resync Steam profile."));
      }

      setMessage(t("steamProfileSynced"));
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : language === "FR" ? "Impossible de resynchroniser le profil Steam." : "Unable to resync Steam profile.");
    } finally {
      setResyncing(false);
    }
  }

  return (
    <GlassCard className="rounded-xl p-5">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{t("actions")}</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">
            {language === "FR" ? "Connecté en tant que" : "Connected as"} {user.steamPersonaName}.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Button
            className="rounded-lg"
            disabled={resyncing}
            onClick={resync}
            type="button"
            variant="secondary"
          >
            <RefreshCw className={resyncing ? "mr-2 size-4 animate-spin" : "mr-2 size-4"} />
            {t("resyncSteam")}
          </Button>
          <Button className="rounded-lg" onClick={logout} type="button" variant="ghost">
            <LogOut className="mr-2 size-4" />
            {t("logout")}
          </Button>
        </div>

        {message ? <p className="text-sm text-white/55">{message}</p> : null}
      </div>
    </GlassCard>
  );
}
