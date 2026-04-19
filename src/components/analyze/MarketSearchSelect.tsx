"use client";

import * as React from "react";
import { Search, ChevronDown, X, Globe } from "lucide-react";

export interface MarketItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

const MOCK_MARKETS: MarketItem[] = [
  { id: "general", name: "General (All)", slug: "general" },
  { id: "skinport", name: "Skinport", slug: "skinport", logoUrl: "https://skinport.com/static/favicon.ico" },
  { id: "csfloat", name: "CSFloat", slug: "csfloat", logoUrl: "https://csfloat.com/favicon.ico" },
];

interface MarketSearchSelectProps {
  value: string;
  onChange: (marketName: string, market: MarketItem) => void;
}

export function MarketSearchSelect({ value, onChange }: MarketSearchSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return MOCK_MARKETS;
    const q = query.toLowerCase();
    return MOCK_MARKETS.filter((m) => m.name.toLowerCase().includes(q));
  }, [query]);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (market: MarketItem) => {
    onChange(market.name, market);
    setIsOpen(false);
    setQuery("");
  };

  const currentMarket = MOCK_MARKETS.find((m) => m.name === value) || MOCK_MARKETS[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className="flex items-center gap-3 text-xl md:text-2xl font-semibold tracking-tight text-white/80 hover:text-white transition-colors group cursor-pointer bg-white/5 border border-white/10 px-4 py-2 rounded-xl"
      >
        {currentMarket.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentMarket.logoUrl} alt={currentMarket.name} className="w-6 h-6 object-contain rounded-md" />
        ) : (
          <Globe className="w-6 h-6 text-[#4da3ff]" />
        )}
        <span>{value}</span>
        <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[300px] max-w-[90vw] bg-[#0a1628] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-white/5">
            <Search className="w-4 h-4 text-white/30 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search markets..."
              className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/30"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-white/30 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="max-h-[280px] overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="text-center text-white/30 text-sm py-6">No markets found</p>
            )}
            {filtered.map((market) => (
              <button
                key={market.id}
                onClick={() => handleSelect(market)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                  market.name === value
                    ? "bg-[#093066]/40 text-[#4da3ff] font-medium"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                {market.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={market.logoUrl} alt={market.name} className="w-5 h-5 object-contain rounded-sm" />
                ) : (
                  <Globe className="w-5 h-5 text-[#4da3ff]" />
                )}
                {market.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
