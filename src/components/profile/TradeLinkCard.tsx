"use client";

import { useState } from "react";
import { Check, ExternalLink, Link2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePreferences } from "@/components/preferences/PreferencesProvider";

async function updateTradeLink(tradeLink: string) {
  const response = await fetch("/api/me/profile", {
    body: JSON.stringify({
      tradeLink,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "Unable to save trade link.");
  }
}

export function TradeLinkCard({ initialTradeLink }: { initialTradeLink: string | null }) {
  const { language, t } = usePreferences();
  const [tradeLink, setTradeLink] = useState(initialTradeLink ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);

    try {
      await updateTradeLink(tradeLink);
      setStatus("success");
      setMessage(t("tradeLinkSaved"));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : language === "FR" ? "Impossible d'enregistrer le trade link." : "Unable to save trade link.");
    }
  }

  return (
    <GlassCard className="rounded-xl p-5">
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <div className="flex items-center gap-2 text-white">
            <Link2 className="size-5 text-[#66c0f4]" />
            <h2 className="text-xl font-semibold">{t("tradeLink")}</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/55">
            {t("tradeLinkLead")}
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm text-white/60">{t("tradeOfferUrl")}</span>
          <input
            className="w-full rounded-lg border border-white/10 bg-[#07111f]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#66c0f4]/60"
            onChange={(event) => setTradeLink(event.target.value)}
            placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."
            value={tradeLink}
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <a
            className="inline-flex items-center gap-2 text-xs text-[#66c0f4] transition hover:text-white"
            href="https://steamcommunity.com/my/tradeoffers/privacy"
            rel="noreferrer"
            target="_blank"
          >
            {t("findMyTradeLink")}
            <ExternalLink className="size-3.5" />
          </a>
          <Button className="rounded-lg" disabled={status === "saving"} type="submit">
            {status === "saving" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {t("save")}
          </Button>
        </div>

        {message ? (
          <p className={status === "error" ? "text-sm text-red-300" : "text-sm text-emerald-300"}>
            {status === "success" ? <Check className="mr-1 inline size-4" /> : null}
            {message}
          </p>
        ) : null}
      </form>
    </GlassCard>
  );
}
