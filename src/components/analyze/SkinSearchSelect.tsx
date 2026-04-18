"use client";

import * as React from "react";
import { Search, ChevronDown, X } from "lucide-react";
import Image from "next/image";

interface SkinEntry {
  name: string;
  img: string;
}

const AVAILABLE_SKINS: SkinEntry[] = [
  { name: "AK-47 | Redline (Field-Tested)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5OZWFZA53K9FVpvvxN1hfx_LNbTk97deCkL-JlvD4DLfQhG5u5cB1g_zMu4n0jAO3_UtkYjj1Jde_dQA3YV6B8lK5xObu1pW16pXAyyBl7CBx7SiBz0PkjQeSLRppuqaHEPcXqWKN-P_Yl2sN/360fx360f" },
  { name: "AK-47 | Vulcan (Minimal Wear)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5OZWFZA53K9FVpvvxN1hfx_LNbTk97deCkL-JlvD4DLfQhG5u5cB1g_zMu4n0jAO3_UtkYjj1Jde_dQA3YV6B8lK5xObu1pW16pXAyyBl7CBx7SiBz0PkjQeSLRppuqaHEPcXqWKN-P_Yl2sN/360fx360f" },
  { name: "AK-47 | Fire Serpent (Field-Tested)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5OZWFZA53K9FVpvvxN1hfx_LNbTk97deCkL-JlvD4DLfQhG5u5cB1g_zMu4n0jAO3_UtkYjj1Jde_dQA3YV6B8lK5xObu1pW16pXAyyBl7CBx7SiBz0PkjQeSLRppuqaHEPcXqWKN-P_Yl2sN/360fx360f" },
  { name: "AWP | Asiimov (Field-Tested)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5OZWFZA53K9BVovbxN1hfx_LNbTk97deCkL-Jlvr4MLrchG5u5cB1g_zMu4n00QziqhJrMmz3ItKRcFc3YAzVqAK_wOjvg8K_vJqbzHE1vSkn4yqIyRbgiRpSLrs4HS3fxqQ/360fx360f" },
  { name: "AWP | Dragon Lore (Factory New)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5OZWFZA53K9BVovbxN1hfx_LNbTk97deCkL-Jlvr4MLrchG5u5cB1g_zMu4n00QziqhJrMmz3ItKRcFc3YAzVqAK_wOjvg8K_vJqbzHE1vSkn4yqIyRbgiRpSLrs4HS3fxqQ/360fx360f" },
  { name: "AWP | Hyper Beast (Minimal Wear)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5OZWFZA53K9BVovbxN1hfx_LNbTk97deCkL-Jlvr4MLrchG5u5cB1g_zMu4n00QziqhJrMmz3ItKRcFc3YAzVqAK_wOjvg8K_vJqbzHE1vSkn4yqIyRbgiRpSLrs4HS3fxqQ/360fx360f" },
  { name: "M4A4 | Howl (Minimal Wear)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5OZWFZA53K9FVpvvxN1h3x_LNbW9W7dKJl4OOkuTxDLDQhGpd68hyt72R9I-h0Ve1_kFvZWGiI4aLJwRoZFHX-Vi-xb-6jJe86cnImCRkvygj5GGIHCnQiA/360fx360f" },
  { name: "M4A4 | Neo-Noir (Factory New)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5OZWFZA53K9FVpvvxN1h3x_LNbW9W7dKJl4OOkuTxDLDQhGpd68hyt72R9I-h0Ve1_kFvZWGiI4aLJwRoZFHX-Vi-xb-6jJe86cnImCRkvygj5GGIHCnQiA/360fx360f" },
  { name: "Desert Eagle | Printstream (FN)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5dNOFKfzIBqtRlMPaOcyVAWZL2dC8P7iGx9HZYOP2MbmIk2kGscAj2r2T99Sn3QCx_0JrZmqiLdSQdwZqNQvR-FW_wOns15Dv6M6dm3tlvHIn5CuLm0eyyhFEaOZrh_afVxzAyKYJbHzJnQ/360fx360f" },
  { name: "Desert Eagle | Blaze (Factory New)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5dNOFKfzIBqtRlMPaOcyVAWZL2dC8P7iGx9HZYOP2MbmIk2kGscAj2r2T99Sn3QCx_0JrZmqiLdSQdwZqNQvR-FW_wOns15Dv6M6dm3tlvHIn5CuLm0eyyhFEaOZrh_afVxzAyKYJbHzJnQ/360fx360f" },
  { name: "Karambit | Doppler (Factory New)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5MYZR-I2JRoJFV5On3e1lfwPb2fizjb3YzvKOlqD1avYJl2Aa54Zy3r2S94rBi1az_UVrNm_3J4eXdVRoZ12G81O9kuzqhxMPovs7KziB17ih25CuNmkSzn0xLOOM8mvCaVxzAUMxbhxrY/360fx360f" },
  { name: "Karambit | Fade (Factory New)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5MYZR-I2JRoJFV5On3e1lfwPb2fizjb3YzvKOlqD1avYJl2Aa54Zy3r2S94rBi1az_UVrNm_3J4eXdVRoZ12G81O9kuzqhxMPovs7KziB17ih25CuNmkSzn0xLOOM8mvCaVxzAUMxbhxrY/360fx360f" },
  { name: "Butterfly Knife | Marble Fade (FN)", img: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UXncP3Rlwb_BBocMKwLhgBpHufDJYcleP47GYtXbm_xTJBicxfDieryQj09HAMdPl_uXW_YEkuf5MYZR-I2JRoJFV5On3e1lfwPb2fizjb3YzvKOlqD1avYJl2Aa54Zy3r2S94rBi1az_UVrNm_3J4eXdVRoZ12G81O9kuzqhxMPovs7KziB17ih25CuNmkSzn0xLOOM8mvCaVxzAUMxbhxrY/360fx360f" },
];

function getSkinImg(name: string): string {
  const found = AVAILABLE_SKINS.find((s) => s.name === name);
  return found?.img ?? AVAILABLE_SKINS[0].img;
}

interface SkinSearchSelectProps {
  value: string;
  onChange: (skinName: string) => void;
}

export function SkinSearchSelect({ value, onChange }: SkinSearchSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return AVAILABLE_SKINS;
    const q = query.toLowerCase();
    return AVAILABLE_SKINS.filter((s) => s.name.toLowerCase().includes(q));
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

  const handleSelect = (skin: string) => {
    onChange(skin);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Clickable skin name with image */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-3 text-2xl md:text-3xl font-bold tracking-tight text-white hover:text-[#4da3ff] transition-colors group cursor-pointer"
      >
        <Image
          src={getSkinImg(value)}
          alt={value}
          width={48}
          height={48}
          className="w-12 h-12 object-contain rounded-lg bg-white/5 p-1 shrink-0"
          unoptimized
        />
        <span>{value}</span>
        <ChevronDown className="w-5 h-5 text-white/40 group-hover:text-[#4da3ff] transition-colors" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[440px] max-w-[90vw] bg-[#0a1628] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Search input */}
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
          </div>

          {/* Results list */}
          <div className="max-h-[320px] overflow-y-auto py-1 scrollbar-thin">
            {filtered.length === 0 && (
              <p className="text-center text-white/30 text-sm py-6">No skins found</p>
            )}
            {filtered.map((skin) => (
              <button
                key={skin.name}
                onClick={() => handleSelect(skin.name)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                  skin.name === value
                    ? "bg-[#093066]/40 text-[#4da3ff] font-medium"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Image
                  src={skin.img}
                  alt={skin.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain rounded-md bg-white/5 p-0.5 shrink-0"
                  unoptimized
                />
                {skin.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
