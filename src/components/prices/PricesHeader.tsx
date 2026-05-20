"use client";

import * as React from "react";
import { usePreferences } from "@/components/preferences/PreferencesProvider";

export function PricesHeader() {
  const { language } = usePreferences();

  return (
    <div className="space-y-3 mb-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
        {language === "FR" ? "Vue d'ensemble du marché" : "Market Overview"}
      </h1>
      <p className="text-[color:var(--color-muted)] text-lg">
        {language === "FR"
          ? "Prix live, tendances et liquidité du marché pour les items CS2."
          : "Live prices, trends, and market liquidity for top CS2 items."}
      </p>
    </div>
  );
}
