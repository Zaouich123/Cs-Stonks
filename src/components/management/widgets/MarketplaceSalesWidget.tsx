"use client";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { MarketplaceListingRow } from "@/components/management/sales/MarketplaceListingRow";
import { EmptyState } from "@/components/management/widgets/EmptyState";
import { WidgetShell } from "@/components/management/widgets/WidgetShell";
import type { ManagementMarketplaceListing } from "@/modules/management/types/management.types";

export function MarketplaceSalesWidget({ listings }: { listings: ManagementMarketplaceListing[] }) {
  const { language } = usePreferences();

  return (
    <WidgetShell
      eyebrow={language === "FR" ? "Ventes" : "Sales"}
      title={language === "FR" ? "Listings marketplace" : "Marketplace listings"}
    >
      {listings.length === 0 ? (
        <EmptyState
          actionHref="/prices"
          actionLabel={language === "FR" ? "Explorer le market" : "Explore market"}
          description={
            language === "FR"
              ? "Ajoute manuellement tes listings pour suivre leur statut et garder un historique propre."
              : "Manually add listings to track their status and keep a clean history."
          }
          title={language === "FR" ? "Aucun listing suivi" : "No tracked listing"}
        />
      ) : (
        <div className="space-y-3">
          {listings.slice(0, 5).map((listing) => (
            <MarketplaceListingRow key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
