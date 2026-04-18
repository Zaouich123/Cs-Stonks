import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { PricesHeader } from "@/components/prices/PricesHeader";
import { PricesFilters } from "@/components/prices/PricesFilters";
import { PricesTable } from "@/components/prices/PricesTable";

export default function PricesPage() {
  return (
    <div className="relative min-h-screen bg-[color:var(--color-surface)] selection:bg-[#4da3ff]/30 text-white overflow-hidden pb-32">
      <Navbar />
      
      <main className="relative z-10 flex flex-col mx-auto w-full max-w-7xl px-6 pt-24 md:px-12 md:pt-32 space-y-6">
        <PricesHeader />
        
        <GlassCard className="p-6 md:p-8 w-full overflow-hidden flex flex-col gap-6 mt-2">
          <PricesFilters />
          <PricesTable />
        </GlassCard>
      </main>
    </div>
  );
}
