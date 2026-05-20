"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";

export function SteamLoginButton() {
  const { t } = usePreferences();

  return (
    <Link
      href="/api/auth/steam/login"
      className="inline-flex h-13 w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#171a21] px-5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition hover:bg-[#1f2633] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4]"
    >
      <ShieldCheck className="size-5 text-[#66c0f4]" />
      {t("signInSteam")}
    </Link>
  );
}
