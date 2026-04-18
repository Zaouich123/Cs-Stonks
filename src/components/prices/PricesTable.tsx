"use client";

import * as React from "react";
import Link from "next/link";

interface ItemRow {
  id: string;
  displayName: string;
  imageUrl: string | null;
  steamImageUrl: string | null;
  source: string;
  lowestCurrentPrice: number | null;
  lowestCurrentPriceCurrency: string | null;
  itemType: string;
  rarity: string | null;
}

interface PricesTableProps {
  query: string;
  itemType: string;
}

export function PricesTable({ query, itemType }: PricesTableProps) {
  const [items, setItems] = React.useState<ItemRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [totalItems, setTotalItems] = React.useState(0);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "30");
      if (query.trim()) params.set("query", query.trim());
      if (itemType) params.set("itemType", itemType);

      fetch(`/api/items?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setItems(data.data.items ?? []);
            setTotalItems(data.data.totalItems ?? 0);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, query ? 300 : 0); // debounce only text queries

    return () => clearTimeout(debounceRef.current);
  }, [query, itemType]);

  const getImgSrc = (item: ItemRow) => item.imageUrl || item.steamImageUrl || null;

  return (
    <div className="overflow-x-auto w-full mt-2">
      {/* Results count */}
      {!loading && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-white/40">
            {totalItems} item{totalItems !== 1 ? "s" : ""} found
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-white/20 border-t-[#4da3ff] rounded-full animate-spin" />
          <span className="ml-3 text-white/40 text-sm">Loading market data...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">
          {query || itemType ? "No items match your search." : "No items found. Run a catalog sync to populate the database."}
        </div>
      ) : (
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-white/5 text-[color:var(--color-muted)] text-sm">
              <th className="pb-4 font-medium px-4 whitespace-nowrap">Item Name</th>
              <th className="pb-4 font-medium px-4 whitespace-nowrap">Type</th>
              <th className="pb-4 font-medium px-4 whitespace-nowrap">Source</th>
              <th className="pb-4 font-medium px-4 text-right whitespace-nowrap">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const imgSrc = getImgSrc(item);
              return (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                  <td className="py-4 px-4">
                    <Link href="/analyze" className="flex items-center gap-3 font-medium text-white group-hover:text-[#4da3ff] transition-colors">
                      {imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgSrc}
                          alt={item.displayName}
                          className="w-12 h-12 object-contain rounded-lg bg-white/5 p-1 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/5 shrink-0 flex items-center justify-center text-white/20 text-xs">N/A</div>
                      )}
                      <span>{item.displayName}</span>
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-[color:var(--color-muted)] text-sm">
                    <span className="bg-[#0d182a] border border-white/5 px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider">
                      {item.itemType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[color:var(--color-muted)] text-sm">
                    <span className="bg-[#0d182a] border border-white/5 px-2.5 py-1 rounded-md capitalize">
                      {item.source}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-white">
                    {item.lowestCurrentPrice !== null
                      ? `$${item.lowestCurrentPrice.toFixed(2)}`
                      : <span className="text-white/30">—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
