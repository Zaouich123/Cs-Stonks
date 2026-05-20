"use client";

import { usePreferences } from "@/components/preferences/PreferencesProvider";

export function PricesHeader() {
  const { t } = usePreferences();

  return (
    <div className="mb-6 space-y-3">
      <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
        {t("marketOverview")}
      </h1>
      <p className="text-lg text-[color:var(--color-muted)]">
        {t("marketOverviewLead")}
      </p>
    </div>
  );
}
