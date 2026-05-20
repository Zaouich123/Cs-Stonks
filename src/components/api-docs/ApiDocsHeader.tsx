"use client";

import { ApiStatusBadge } from "@/components/api-docs/ApiStatusBadge";
import { usePreferences } from "@/components/preferences/PreferencesProvider";

export function ApiDocsHeader() {
  const { language, t } = usePreferences();

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(77,163,255,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(11,99,214,0.18),transparent_38%),rgba(7,17,35,0.88)] p-7 shadow-[0_32px_90px_rgba(0,0,0,0.4)] md:p-10">
      <div className="absolute inset-0 bg-[linear-gradient(130deg,transparent_0%,rgba(255,255,255,0.03)_35%,transparent_70%)]" />
      <div className="relative z-10">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#7eb7ff]">{t("apiDocsTitle")}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
          {language === "FR"
            ? "Documentation premium des routes qui alimentent déjà le market, les analytics et le pipeline d'ingestion."
            : "Premium docs for the routes already powering your market, analytics, and ingestion pipeline."}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-white/66 md:text-lg">
          {language === "FR"
            ? "Explore les endpoints publics, les opérations internes, les enveloppes de réponse et des exemples JSON proches de la production."
            : "Explore public item endpoints, internal sync operations, response envelopes, and production-shaped JSON examples from the current application architecture."}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <ApiStatusBadge code={200} label="Live JSON" />
          <ApiStatusBadge code={400} label="Validation" />
          <ApiStatusBadge code={500} label={t("runtimeErrors")} />
        </div>
      </div>
    </section>
  );
}
