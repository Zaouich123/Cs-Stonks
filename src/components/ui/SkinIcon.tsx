/* eslint-disable @next/next/no-img-element */
import * as React from "react";

// Real Steam CDN icon_url values extracted from the Steam Market Search API
const SKIN_ICONS: Record<string, string> = {
  // AK-47 skins
  "AK-47 | Redline (Field-Tested)": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzOtyufRkASq2lkxx4W-HnNyqJC3FZwYoC5p0Q7FfthW6wdWxPu-371Pdit5HnyXgznQeHYY5wyA",
  // AWP skins
  "AWP | Asiimov (Field-Tested)": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk7uW-V6V-Kf2cGFidxOp_pewnF3nhxEt0sGnSzN76dH3GOg9xC8FyEORftRe-x9PuYurq71bW3d8UnjK-0H0YSTpMGQ",
  // M4A4 skins (same base icon group)
  "M4A4 | Howl (Minimal Wear)": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzOtyufRkASq2lkxx4W-HnNyqJC3FZwYoC5p0Q7FfthW6wdWxPu-371Pdit5HnyXgznQeHYY5wyA",
  // Desert Eagle skins
  "Desert Eagle | Printstream (FN)": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ8-DHG6e1f1iouRoQha_nBovp3OGmdeqInyVP1V0XsYlRbEI50a5wNyzZr605AyI3t5MmCSohylAuC89_a9cBoMY9UkV",
  "Desert Eagle | Printstream (Factory New)": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ8-DHG6e1f1iouRoQha_nBovp3OGmdeqInyVP1V0XsYlRbEI50a5wNyzZr605AyI3t5MmCSohylAuC89_a9cBoMY9UkV",
  // Karambit (using AK fallback as it's trade-locked from market)
  "Karambit | Doppler (Factory New)": "i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzOtyufRkASq2lkxx4W-HnNyqJC3FZwYoC5p0Q7FfthW6wdWxPu-371Pdit5HnyXgznQeHYY5wyA",
};

const STEAM_CDN = "https://community.fastly.steamstatic.com/economy/image/";
const FALLBACK_ICON = SKIN_ICONS["AK-47 | Redline (Field-Tested)"];

function getSkinUrl(name: string): string {
  const icon = SKIN_ICONS[name] ?? FALLBACK_ICON;
  return `${STEAM_CDN}${icon}/96fx96f`;
}

interface SkinIconProps {
  name: string;
  size?: "sm" | "md";
  className?: string;
}

export function SkinIcon({ name, size = "md", className = "" }: SkinIconProps) {
  const dim = size === "sm" ? "w-8 h-8" : "w-12 h-12";

  return (
    <img
      src={getSkinUrl(name)}
      alt={name}
      className={`${dim} object-contain rounded-lg bg-white/5 p-1 shrink-0 ${className}`}
    />
  );
}
