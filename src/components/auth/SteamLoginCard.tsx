import { ExternalLink, LockKeyhole, ShieldCheck } from "lucide-react";

import { AuthCard } from "@/components/auth/AuthCard";
import { SteamLoginButton } from "@/components/auth/SteamLoginButton";

export function SteamLoginCard({ error }: { error?: string }) {
  return (
    <AuthCard>
      <div className="space-y-7">
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl border border-[#66c0f4]/25 bg-[#66c0f4]/10">
            <ShieldCheck className="size-7 text-[#66c0f4]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Steam login</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[color:var(--color-muted)]">
            Connect your Steam identity to manage your trading settings and future portfolio.
          </p>
        </div>

        <SteamLoginButton />

        {error ? (
          <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-sm leading-6 text-red-100">
            Steam login failed. Check `STEAM_WEB_API_KEY` in `.env`, then try again.
          </div>
        ) : null}

        <div className="grid gap-3 text-sm text-white/65">
          <div className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/[0.03] p-4">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-emerald-300" />
            <p>Cs-Stonks never asks for your Steam password.</p>
          </div>
          <a
            className="flex items-center justify-center gap-2 text-xs text-[#66c0f4] transition hover:text-white"
            href="https://steamcommunity.com/dev/apikey"
            rel="noreferrer"
            target="_blank"
          >
            Steam Web API profile sync
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </AuthCard>
  );
}
