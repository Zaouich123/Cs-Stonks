"use client";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import type { SessionUser } from "@/modules/auth/types/auth.types";

export function ProfileHeader({ user }: { user: SessionUser }) {
  const { locale, t } = usePreferences();

  return (
    <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#66c0f4]">
          {t("steamAccount")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          {user.steamPersonaName}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
          {t("profileLinkedSteam")} {user.steamId}.
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/65">
        {t("lastLogin")}:{" "}
        <span className="text-white">
          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString(locale) : t("unknown")}
        </span>
      </div>
    </section>
  );
}
