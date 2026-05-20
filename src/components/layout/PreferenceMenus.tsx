"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import type {
  CurrencyPreference,
  LanguagePreference,
} from "@/components/preferences/PreferencesProvider";
import { usePreferences } from "@/components/preferences/PreferencesProvider";
import { cn } from "@/components/ui/Button";

const currencies: Array<{ label: string; shortLabel: CurrencyPreference; value: CurrencyPreference }> = [
  { label: "USD ($)", shortLabel: "USD", value: "USD" },
  { label: "EUR (€)", shortLabel: "EUR", value: "EUR" },
];

const languages: Array<{ label: string; shortLabel: LanguagePreference; value: LanguagePreference }> = [
  { label: "Français", shortLabel: "FR", value: "FR" },
  { label: "English", shortLabel: "EN", value: "EN" },
];

function PreferenceDropdown<T extends string>({
  align = "left",
  label,
  onChange,
  options,
  value,
}: {
  align?: "left" | "right";
  label: string;
  onChange: (value: T) => void;
  options: Array<{ label: string; shortLabel: string; value: T }>;
  value: T;
}) {
  const detailsRef = React.useRef<HTMLDetailsElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!detailsRef.current?.contains(event.target as Node)) {
        detailsRef.current?.removeAttribute("open");
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <details ref={detailsRef} className="group relative">
      <summary
        aria-label={label}
        className="inline-flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-xl px-2.5 text-sm font-black text-white transition hover:bg-white/[0.06] [&::-webkit-details-marker]:hidden"
      >
        <span className="text-[#4da3ff]">{selected.shortLabel}</span>
        <ChevronDown
          className="h-3.5 w-3.5 text-white/55 transition group-open:rotate-180"
        />
      </summary>

      <div
        className={cn(
          "absolute top-12 z-[90] min-w-[138px] overflow-hidden rounded-xl border border-white/8 bg-[#171a22] py-1 shadow-[0_18px_50px_rgba(0,0,0,0.45)]",
          align === "right" ? "right-0" : "left-0",
        )}
      >
        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold transition",
                active ? "bg-white/8 text-white" : "text-white/75 hover:bg-white/[0.05] hover:text-white",
              )}
              onClick={() => {
                onChange(option.value);
                detailsRef.current?.removeAttribute("open");
              }}
              type="button"
            >
              <span>{option.label}</span>
              {active ? <Check className="h-4 w-4 text-[#2f8cff]" /> : null}
            </button>
          );
        })}
      </div>
    </details>
  );
}

export function PreferenceMenus() {
  const { currency, language, setCurrency, setLanguage } = usePreferences();

  return (
    <div className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/[0.035] px-1 py-0.5 backdrop-blur md:flex">
      <PreferenceDropdown
        label="Choisir la devise"
        onChange={setCurrency}
        options={currencies}
        value={currency}
      />
      <div className="h-5 w-px bg-white/8" />
      <PreferenceDropdown
        align="right"
        label="Choisir la langue"
        onChange={setLanguage}
        options={languages}
        value={language}
      />
    </div>
  );
}
