import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

export function PricesTable() {
  const dummyData = [
    { name: "AK-47 | Redline (Field-Tested)", market: "Skinport", price: 36.71, trend: 3.29, positive: true },
    { name: "AWP | Asiimov (Field-Tested)", market: "Buff", price: 104.50, trend: 1.2, positive: false },
    { name: "M4A4 | Howl (Minimal Wear)", market: "CSFloat", price: 4200.00, trend: 5.4, positive: true },
    { name: "Desert Eagle | Printstream (Factory New)", market: "Skinport", price: 85.20, trend: 0.8, positive: true },
    { name: "Karambit | Doppler (Factory New)", market: "Skinport", price: 1250.00, trend: 0.4, positive: false },
  ];

  return (
    <div className="overflow-x-auto w-full mt-2">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-white/5 text-[color:var(--color-muted)] text-sm">
            <th className="pb-4 font-medium px-4 whitespace-nowrap">Item Name</th>
            <th className="pb-4 font-medium px-4 whitespace-nowrap">Market</th>
            <th className="pb-4 font-medium px-4 text-right whitespace-nowrap">Price</th>
            <th className="pb-4 font-medium px-4 text-right whitespace-nowrap">24h Trend</th>
          </tr>
        </thead>
        <tbody>
          {dummyData.map((row, idx) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
              <td className="py-5 px-4">
                <Link href="/analyze" className="font-medium text-white group-hover:text-[#4da3ff] transition-colors">
                  {row.name}
                </Link>
              </td>
              <td className="py-5 px-4 text-[color:var(--color-muted)] text-sm">
                <span className="bg-[#0d182a] border border-white/5 px-2.5 py-1 rounded-md">
                  {row.market}
                </span>
              </td>
              <td className="py-5 px-4 text-right font-mono text-white">
                ${row.price.toFixed(2)}
              </td>
              <td className="py-5 px-4 text-right">
                <div className={`inline-flex items-center justify-end gap-1 text-sm font-medium ${row.positive ? "text-green-500" : "text-red-500"}`}>
                  {row.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {row.positive ? "+" : "-"}{row.trend}%
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
