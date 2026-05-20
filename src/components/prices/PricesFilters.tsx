"use client";

import * as React from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { usePreferences } from "@/components/preferences/PreferencesProvider";

const ITEM_TYPES = [
  { value: "", label: { EN: "All Types", FR: "Tous les types" } },
  { value: "SKIN", label: { EN: "Skins", FR: "Skins" } },
  { value: "KNIFE", label: { EN: "Knives", FR: "Couteaux" } },
  { value: "GLOVE", label: { EN: "Gloves", FR: "Gants" } },
  { value: "STICKER", label: { EN: "Stickers", FR: "Stickers" } },
  { value: "CASE", label: { EN: "Cases", FR: "Caisses" } },
  { value: "AGENT", label: { EN: "Agents", FR: "Agents" } },
  { value: "CHARM", label: { EN: "Charms", FR: "Charms" } },
  { value: "MUSIC_KIT", label: { EN: "Music Kits", FR: "Musiques" } },
  { value: "PATCH", label: { EN: "Patches", FR: "Patchs" } },
  { value: "TOOL", label: { EN: "Tools", FR: "Outils" } },
  { value: "OTHER", label: { EN: "Other", FR: "Autre" } },
];

interface PricesFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  itemType: string;
  onItemTypeChange: (t: string) => void;
}

export function PricesFilters({ query, onQueryChange, itemType, onItemTypeChange }: PricesFiltersProps) {
  const { language, t } = usePreferences();
  const [showFilters, setShowFilters] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeFilter = ITEM_TYPES.find((type) => type.value === itemType);

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--color-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t("searchItemPlaceholder")}
          className="w-full bg-[#0d182a]/50 border border-[color:var(--color-border)] rounded-xl pl-11 pr-10 py-3 text-white outline-none focus:border-[#4da3ff]/50 focus:ring-1 focus:ring-[#4da3ff]/50 transition-all text-sm placeholder:text-gray-500"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter dropdown */}
      <div ref={filterRef} className="relative shrink-0">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
            itemType
              ? "bg-[#093066]/40 border-[#4da3ff]/30 text-[#4da3ff]"
              : "bg-[#0d182a]/50 border-[color:var(--color-border)] text-white/70 hover:text-white hover:border-white/10"
          }`}
        >
          <Filter className="w-4 h-4" />
          {activeFilter?.label[language] || (language === "FR" ? "Filtres" : "Filters")}
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>

        {showFilters && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a1628] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
            {ITEM_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  onItemTypeChange(type.value);
                  setShowFilters(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  itemType === type.value
                    ? "bg-[#093066]/40 text-[#4da3ff] font-medium"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {type.label[language]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
