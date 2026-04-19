"use client";

import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { PricesHeader } from "@/components/prices/PricesHeader";
import { PricesFilters } from "@/components/prices/PricesFilters";
import { PricesTable } from "@/components/prices/PricesTable";

export default function PricesPage() {
  const [query, setQuery] = React.useState("");
  const [itemType, setItemType] = React.useState("");
  const [page, setPage] = React.useState(1);

  const handleQueryChange = React.useCallback((nextQuery: string) => {
    setQuery(nextQuery);
    setPage(1);
  }, []);

  const handleItemTypeChange = React.useCallback((nextItemType: string) => {
    setItemType(nextItemType);
    setPage(1);
  }, []);

  return (
    <div className="relative min-h-screen bg-[color:var(--color-surface)] selection:bg-[#4da3ff]/30 text-white overflow-hidden pb-32">
      <Navbar />
      
      <main className="relative z-10 mx-auto flex w-full max-w-[92rem] flex-col space-y-6 px-6 pt-24 md:px-12 md:pt-32">
        <PricesHeader />
        
        <GlassCard className="p-6 md:p-8 w-full overflow-hidden flex flex-col gap-6 mt-2">
          <PricesFilters
            query={query}
            onQueryChange={handleQueryChange}
            itemType={itemType}
            onItemTypeChange={handleItemTypeChange}
          />
          <PricesTable
            itemType={itemType}
            onPageChange={setPage}
            page={page}
            query={query}
          />
        </GlassCard>
      </main>
    </div>
  );
}
