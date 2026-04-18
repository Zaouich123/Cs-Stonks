"use client";

import * as React from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface SkinItem {
  id: string;
  displayName: string;
  imageUrl: string | null;
  steamImageUrl: string | null;
}

interface SkinSearchSelectProps {
  value: string;
  onChange: (skinName: string, item: SkinItem) => void;
}

export function SkinSearchSelect({ value, onChange }: SkinSearchSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [allItems, setAllItems] = React.useState<SkinItem[]>([]);
  const [searchResults, setSearchResults] = React.useState<SkinItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load initial items on mount
  React.useEffect(() => {
    fetch("/api/items?limit=50")
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.items) {
          setAllItems(data.data.items);
          setSearchResults(data.data.items);
        }
      })
      .catch(() => {});
  }, []);

  // Search with debounce
  React.useEffect(() => {
    if (!query.trim()) {
      setSearchResults(allItems);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/items?limit=20&query=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.items) {
            setSearchResults(data.data.items);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, allItems]);

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

  const handleSelect = (item: SkinItem) => {
    onChange(item.displayName, item);
    setIsOpen(false);
    setQuery("");
  };

  const getImgSrc = (item: SkinItem) => item.imageUrl || item.steamImageUrl || null;

  // Find current selected item image
  const currentItem = allItems.find((i) => i.displayName === value);
  const currentImg = currentItem ? getImgSrc(currentItem) : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className="flex items-center gap-3 text-2xl md:text-3xl font-bold tracking-tight text-white hover:text-[#4da3ff] transition-colors group cursor-pointer"
      >
        {currentImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentImg} alt={value} className="w-12 h-12 object-contain rounded-lg bg-white/5 p-1 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-white/5 shrink-0" />
        )}
        <span>{value}</span>
        <ChevronDown className="w-5 h-5 text-white/40 group-hover:text-[#4da3ff] transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[440px] max-w-[90vw] bg-[#0a1628] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-white/5">
            <Search className="w-4 h-4 text-white/30 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skins..."
              className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/30"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-white/30 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
            {loading && <div className="w-4 h-4 border-2 border-white/10 border-t-[#4da3ff] rounded-full animate-spin shrink-0" />}
          </div>

          <div className="max-h-[320px] overflow-y-auto py-1">
            {searchResults.length === 0 && !loading && (
              <p className="text-center text-white/30 text-sm py-6">No skins found</p>
            )}
            {searchResults.map((item) => {
              const imgSrc = getImgSrc(item);
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                    item.displayName === value
                      ? "bg-[#093066]/40 text-[#4da3ff] font-medium"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {imgSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgSrc} alt={item.displayName} className="w-8 h-8 object-contain rounded-md bg-white/5 p-0.5 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-white/5 shrink-0" />
                  )}
                  {item.displayName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
