import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function PricesTable() {
  const dummyData = [
    { name: "AK-47 | Redline (Field-Tested)", market: "Skinport", price: 36.71, trend: 3.29, positive: true, img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5OZWFZA53K9FVpvvxN1hfx_LNbTk97deCkL-JlvD4DLfQhG5u5cB1g_zMu4n0jAO3_UtkYjj1Jde_dQA3YV6B8lK5xObu1pW16pXAyyBl7CBx7SiBz0PkjQeSLRppuqaHEPcXqWKN-P_Yl2sN/360fx360f" },
    { name: "AWP | Asiimov (Field-Tested)", market: "Buff", price: 104.50, trend: 1.2, positive: false, img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5OZWFZA53K9BVovbxN1hfx_LNbTk97deCkL-Jlvr4MLrchG5u5cB1g_zMu4n00QziqhJrMmz3ItKRcFc3YAzVqAK_wOjvg8K_vJqbzHE1vSkn4yqIyRbgiRpSLrs4HS3fxqQ/360fx360f" },
    { name: "M4A4 | Howl (Minimal Wear)", market: "CSFloat", price: 4200.00, trend: 5.4, positive: true, img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5OZWFZA53K9FVpvvxN1h3x_LNbW9W7dKJl4OOkuTxDLDQhGpd68hyt72R9I-h0Ve1_kFvZWGiI4aLJwRoZFHX-Vi-xb-6jJe86cnImCRkvygj5GGIHCnQiA/360fx360f" },
    { name: "Desert Eagle | Printstream (FN)", market: "Skinport", price: 85.20, trend: 0.8, positive: true, img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5dNOFKfzIBqtRlMPaOcyVAWZL2dC8P7iGx9HZYOP2MbmIk2kGscAj2r2T99Sn3QCx_0JrZmqiLdSQdwZqNQvR-FW_wOns15Dv6M6dm3tlvHIn5CuLm0eyyhFEaOZrh_afVxzAyKYJbHzJnQ/360fx360f" },
    { name: "Karambit | Doppler (Factory New)", market: "Skinport", price: 1250.00, trend: 0.4, positive: false, img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5MYZR-I2JRoJFV5On3e1lfwPb2fizjb3YzvKOlqD1avYJl2Aa54Zy3r2S94rBi1az_UVrNm_3J4eXdVRoZ12G81O9kuzqhxMPovs7KziB17ih25CuNmkSzn0xLOOM8mvCaVxzAUMxbhxrY/360fx360f" },
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
              <td className="py-4 px-4">
                <Link href="/analyze" className="flex items-center gap-3 font-medium text-white group-hover:text-[#4da3ff] transition-colors">
                  <Image
                    src={row.img}
                    alt={row.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain rounded-lg bg-white/5 p-1 shrink-0"
                    unoptimized
                  />
                  <span>{row.name}</span>
                </Link>
              </td>
              <td className="py-4 px-4 text-[color:var(--color-muted)] text-sm">
                <span className="bg-[#0d182a] border border-white/5 px-2.5 py-1 rounded-md">
                  {row.market}
                </span>
              </td>
              <td className="py-4 px-4 text-right font-mono text-white">
                ${row.price.toFixed(2)}
              </td>
              <td className="py-4 px-4 text-right">
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
