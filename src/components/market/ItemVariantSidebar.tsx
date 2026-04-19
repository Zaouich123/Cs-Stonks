"use client";

import * as React from "react";
import Link from "next/link";

interface Option {
  active: boolean;
  disabled?: boolean;
  href?: string | null;
  imageUrl?: string | null;
  label: string;
  onClick: () => void;
  phasePreviewLabel?: string | null;
}

interface ItemVariantSidebarProps {
  collection: string | null;
  displayName: string;
  imageUrl: string | null;
  imagePhasePreviewLabel?: string | null;
  priceLabel: string;
  phaseOptions?: Option[];
  rarity: string | null;
  source: string;
  stattrakOptions: Option[];
  wearOptions: Option[];
  yearLabel: string;
}

function getPhasePreviewVisual(phaseLabel?: string | null) {
  const normalized = phaseLabel?.toLowerCase() ?? "";

  if (normalized.includes("ruby")) {
    return {
      filter: "hue-rotate(-22deg) saturate(1.5) brightness(1.02) contrast(1.08)",
      glow: "rgba(244,63,94,0.35)",
      overlay:
        "radial-gradient(circle at 24% 20%,rgba(251,113,133,0.28),transparent 34%), radial-gradient(circle at 78% 68%,rgba(190,24,93,0.22),transparent 38%)",
    };
  }

  if (normalized.includes("sapphire")) {
    return {
      filter: "hue-rotate(26deg) saturate(1.45) brightness(1.02) contrast(1.08)",
      glow: "rgba(59,130,246,0.35)",
      overlay:
        "radial-gradient(circle at 22% 18%,rgba(96,165,250,0.28),transparent 34%), radial-gradient(circle at 76% 70%,rgba(37,99,235,0.22),transparent 38%)",
    };
  }

  if (normalized.includes("black pearl")) {
    return {
      filter: "hue-rotate(42deg) saturate(0.95) brightness(0.86) contrast(1.18)",
      glow: "rgba(168,85,247,0.26)",
      overlay:
        "radial-gradient(circle at 18% 24%,rgba(196,181,253,0.18),transparent 32%), radial-gradient(circle at 80% 72%,rgba(76,29,149,0.28),transparent 40%)",
    };
  }

  if (normalized.includes("emerald")) {
    return {
      filter: "hue-rotate(88deg) saturate(1.3) brightness(1.02) contrast(1.08)",
      glow: "rgba(16,185,129,0.34)",
      overlay:
        "radial-gradient(circle at 24% 18%,rgba(52,211,153,0.24),transparent 34%), radial-gradient(circle at 76% 72%,rgba(5,150,105,0.2),transparent 38%)",
    };
  }

  if (normalized.includes("phase 1")) {
    return {
      filter: "hue-rotate(-8deg) saturate(1.18) brightness(0.98) contrast(1.04)",
      glow: "rgba(249,115,22,0.28)",
      overlay:
        "radial-gradient(circle at 22% 20%,rgba(251,146,60,0.22),transparent 34%), radial-gradient(circle at 74% 68%,rgba(244,63,94,0.16),transparent 38%)",
    };
  }

  if (normalized.includes("phase 2")) {
    return {
      filter: "hue-rotate(8deg) saturate(1.22) brightness(1) contrast(1.06)",
      glow: "rgba(236,72,153,0.28)",
      overlay:
        "radial-gradient(circle at 24% 20%,rgba(244,114,182,0.22),transparent 34%), radial-gradient(circle at 76% 72%,rgba(59,130,246,0.16),transparent 38%)",
    };
  }

  if (normalized.includes("phase 3")) {
    return {
      filter: "hue-rotate(24deg) saturate(1.2) brightness(0.98) contrast(1.05)",
      glow: "rgba(96,165,250,0.28)",
      overlay:
        "radial-gradient(circle at 24% 18%,rgba(59,130,246,0.22),transparent 34%), radial-gradient(circle at 76% 72%,rgba(168,85,247,0.16),transparent 38%)",
    };
  }

  if (normalized.includes("phase 4")) {
    return {
      filter: "hue-rotate(46deg) saturate(1.22) brightness(1.02) contrast(1.06)",
      glow: "rgba(34,197,94,0.28)",
      overlay:
        "radial-gradient(circle at 24% 18%,rgba(74,222,128,0.22),transparent 34%), radial-gradient(circle at 76% 72%,rgba(6,182,212,0.16),transparent 38%)",
    };
  }

  return {
    filter: "none",
    glow: "rgba(77,163,255,0.18)",
    overlay: "transparent",
  };
}

function getAccentClasses(label: string) {
  if (label.toLowerCase() === "stattrak") {
    return {
      active: "border-orange-400/45 bg-orange-500/18 text-orange-200 shadow-[0_12px_30px_rgba(249,115,22,0.22)]",
      idle: "text-orange-300 hover:text-orange-200",
    };
  }

  if (label.toLowerCase() === "souvenir") {
    return {
      active: "border-amber-400/45 bg-amber-500/18 text-amber-100 shadow-[0_12px_30px_rgba(245,158,11,0.22)]",
      idle: "text-amber-300 hover:text-amber-200",
    };
  }

  return {
    active: "border-[#4da3ff]/45 bg-[#093066]/45 text-white shadow-[0_12px_30px_rgba(9,48,102,0.24)]",
    idle: "text-white/65 hover:text-white",
  };
}

function renderVariantText(value: string) {
  if (value.includes("StatTrak")) {
    return (
      <>
        <span className="text-orange-300">StatTrak</span>
        <span className="text-white"> {value.replace("StatTrak", "").trim()}</span>
      </>
    );
  }

  if (value.includes("Souvenir")) {
    return (
      <>
        <span className="text-amber-300">Souvenir</span>
        <span className="text-white"> {value.replace("Souvenir", "").trim()}</span>
      </>
    );
  }

  return <span className="text-white">{value}</span>;
}

function OptionButton({ active, disabled, label, onClick }: Option) {
  const accent = getAccentClasses(label);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm font-medium transition-all ${
        active
          ? accent.active
          : `border-white/10 bg-white/[0.03] ${accent.idle} hover:border-white/20 hover:bg-white/[0.05]`
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  );
}

function PhaseCard({ active, disabled, href, imageUrl, label, onClick, phasePreviewLabel }: Option) {
  const visual = getPhasePreviewVisual(phasePreviewLabel ?? label);

  const classes = `group flex min-w-0 flex-col items-center rounded-[1.2rem] border p-2.5 text-center transition-all ${
    active
      ? "border-[#4da3ff]/45 bg-[#093066]/35 shadow-[0_12px_30px_rgba(9,48,102,0.24)]"
      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
  } ${disabled ? "cursor-not-allowed opacity-40" : ""}`;

  const content = (
    <>
      <div
        className="relative flex h-20 w-full items-center justify-center overflow-hidden rounded-[0.95rem] border border-white/8 bg-[linear-gradient(180deg,#0d182a_0%,#07101e_100%)] p-2"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.02), 0 0 22px ${visual.glow}`,
        }}
      >
        <div className="absolute inset-0" style={{ background: visual.overlay }} />
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={label}
            className="max-h-full w-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.38)] transition-transform duration-300 group-hover:scale-[1.03]"
            style={{ filter: visual.filter }}
          />
        ) : (
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/25">No image</div>
        )}
      </div>
      <span className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-white/72">{label}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={classes}
    >
      {content}
    </button>
  );
}

function Sparkles() {
  const sparkles = [
    "left-[14%] top-[18%]",
    "left-[76%] top-[24%]",
    "left-[28%] top-[68%]",
    "left-[82%] top-[72%]",
    "left-[56%] top-[14%]",
  ];

  return (
    <>
      {sparkles.map((position) => (
        <span
          key={position}
          className={`absolute ${position} h-2.5 w-2.5 rounded-full bg-white/90 opacity-0 blur-[0.5px] transition-all duration-500 group-hover:opacity-100`}
          style={{
            boxShadow: "0 0 14px rgba(255,255,255,0.75), 0 0 22px rgba(77,163,255,0.35)",
            clipPath:
              "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)",
          }}
        />
      ))}
    </>
  );
}

export function ItemVariantSidebar({
  collection,
  displayName,
  imageUrl,
  imagePhasePreviewLabel,
  priceLabel,
  phaseOptions = [],
  rarity,
  source,
  stattrakOptions,
  wearOptions,
  yearLabel,
}: ItemVariantSidebarProps) {
  const heroVisual = getPhasePreviewVisual(imagePhasePreviewLabel);

  return (
    <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,#0d182a_0%,#07101e_100%)]">
      <div className="relative overflow-hidden px-6 pb-6 pt-6">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(77,163,255,0.22),transparent_66%)]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4da3ff]">Item Overview</p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight">{renderVariantText(displayName)}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {rarity ? (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-white/65">
                {rarity}
              </span>
            ) : null}
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-white/65">
              {source}
            </span>
          </div>
        </div>

        <div className="group relative mt-6 flex min-h-[260px] items-center justify-center overflow-hidden rounded-[1.4rem] border border-white/6 bg-white/[0.025] p-6">
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(77,163,255,0.22),transparent_66%)]" />
          <div className="absolute inset-0" style={{ background: heroVisual.overlay }} />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_18%,rgba(255,255,255,0.14)_34%,transparent_50%)] opacity-0 transition-all duration-700 group-hover:translate-x-[140%] group-hover:opacity-100" />
          <Sparkles />
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={displayName}
              className="relative max-h-[210px] w-auto object-contain drop-shadow-[0_18px_32px_rgba(0,0,0,0.45)] transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              style={{
                filter: heroVisual.filter,
              }}
            />
          ) : (
            <div className="relative flex h-[210px] w-full items-center justify-center rounded-[1.25rem] border border-dashed border-white/10 text-sm text-white/28">
              No image
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Year</p>
            <p className="mt-2 text-lg font-semibold text-white">{yearLabel}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Floor</p>
            <p className="mt-2 text-lg font-semibold text-white">{priceLabel}</p>
          </div>
        </div>

        {collection ? (
          <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Collection</p>
            <p className="mt-2 text-base font-medium text-white/82">{collection}</p>
          </div>
        ) : null}

        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Variant</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stattrakOptions.map((option) => (
              <OptionButton key={option.label} {...option} />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Wear</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {wearOptions.map((option) => (
              <OptionButton key={option.label} {...option} />
            ))}
          </div>
        </div>

        {phaseOptions.length > 0 ? (
          <div className="mt-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Phases</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {phaseOptions.map((option) => (
                <PhaseCard key={option.label} {...option} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
