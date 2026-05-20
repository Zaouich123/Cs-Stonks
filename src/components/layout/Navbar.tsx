"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "../ui/Logo";
import { Button } from "../ui/Button";
import { PreferenceMenus } from "./PreferenceMenus";
import { usePreferences } from "@/components/preferences/PreferencesProvider";

interface SessionUser {
  steamAvatar: string | null;
  steamAvatarMedium: string | null;
  steamPersonaName: string;
}

interface MeResponse {
  data?: SessionUser;
  ok: boolean;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const { t } = usePreferences();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/me", {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as MeResponse;

        return payload.ok ? payload.data ?? null : null;
      })
      .then((nextUser) => {
        if (!controller.signal.aborted) {
          setUser(nextUser);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSessionChecked(true);
        }
      });

    return () => controller.abort();
  }, []);

  const avatarUrl = user?.steamAvatarMedium ?? user?.steamAvatar ?? null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-6 py-4 md:px-12 ${
        scrolled
          ? "bg-[#030816]/80 backdrop-blur-lg border-b border-white/5 py-3 shadow-lg"
          : "bg-transparent py-6"
      }`}
    >
      <div className="mx-auto flex max-w-[92rem] items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/api-docs"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            {t("apiDocs")}
          </Link>
          <Link
            href="/prices"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            {t("markets")}
          </Link>
          <Link
            href="/inventory"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            {t("inventory")}
          </Link>
          <Link
            href="/analyze"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            {t("analytics")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <PreferenceMenus />

          {!sessionChecked ? (
            <div className="h-11 w-36 animate-pulse rounded-full border border-white/8 bg-white/[0.04]" />
          ) : user ? (
            <Link
              href="/profile"
              className="flex max-w-[220px] items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] py-1.5 pl-1.5 pr-4 text-sm font-semibold text-white/86 shadow-[0_8px_26px_rgba(0,0,0,0.2)] backdrop-blur transition hover:border-[#4da3ff]/45 hover:bg-white/[0.08] hover:text-white"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={user.steamPersonaName}
                  className="h-8 w-8 rounded-full border border-white/12 object-cover"
                  src={avatarUrl}
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-[#093066] text-xs font-black uppercase">
                  {user.steamPersonaName.slice(0, 1)}
                </span>
              )}
              <span className="truncate">{user.steamPersonaName}</span>
            </Link>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="ghost" className="hidden md:inline-flex">
                  {t("login")}
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="primary">{t("getStarted")}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
