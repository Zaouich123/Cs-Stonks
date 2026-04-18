import * as React from "react";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PricesFilters() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--color-muted)]" />
        <input 
          type="text" 
          placeholder="Search for an item..." 
          className="w-full bg-[#0d182a]/50 border border-[color:var(--color-border)] rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:border-[#4da3ff]/50 focus:ring-1 focus:ring-[#4da3ff]/50 transition-all text-sm placeholder:text-gray-500"
        />
      </div>
      <Button variant="secondary" className="gap-2 shrink-0 py-3">
        <Filter className="w-4 h-4" />
        Filters
      </Button>
    </div>
  );
}
