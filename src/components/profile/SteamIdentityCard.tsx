import { ExternalLink } from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import type { SessionUser } from "@/modules/auth/types/auth.types";

export function SteamIdentityCard({ user }: { user: SessionUser }) {
  const avatar = user.steamAvatarFull ?? user.steamAvatarMedium ?? user.steamAvatar;

  return (
    <GlassCard className="rounded-xl p-5">
      <div className="flex items-center gap-4">
        <div className="size-20 overflow-hidden rounded-xl border border-white/10 bg-white/5">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={user.steamPersonaName}
              className="size-full object-cover"
              src={avatar}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-2xl font-semibold text-white/35">
              {user.steamPersonaName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-white">{user.steamPersonaName}</p>
          <p className="mt-1 font-mono text-xs text-white/45">{user.steamId}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm">
        <div className="flex items-center justify-between gap-3 text-white/55">
          <span>Steam profile</span>
          {user.steamProfileUrl ? (
            <a
              className="inline-flex items-center gap-2 text-[#66c0f4] transition hover:text-white"
              href={user.steamProfileUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open
              <ExternalLink className="size-4" />
            </a>
          ) : (
            <span className="text-white/35">Missing</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 text-white/55">
          <span>Phone status</span>
          <span className={user.phoneVerified ? "text-emerald-300" : "text-amber-300"}>
            {user.phoneVerified ? "Verified" : "Not verified"}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
