"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";

interface AnalyzeFilterSelectProps {
  value: number;
  onChange: (days: number) => void;
}

export function AnalyzeFilterSelect({ value, onChange }: AnalyzeFilterSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (days: number) => {
    onChange(days);
    setIsOpen(false);
  };

  const getLabel = (days: number) => {
    if (days === 30) return "30 Days";
    if (days === 90) return "90 Days";
    return "1 Year";
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-xl hover:bg-[color:var(--color-card-strong)] transition-colors text-sm font-medium"
      >
        <span>{getLabel(value)}</span>
        <ChevronDown className="w-4 h-4 text-[color:var(--color-muted)]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-2 border-b border-[color:var(--color-border)] flex items-center gap-2">
            <Search className="w-4 h-4 text-[color:var(--color-muted)]" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none outline-none text-sm w-full text-[color:var(--color-ink)] placeholder-[color:var(--color-muted)]"
            />
          </div>
          <div className="p-1">
            <button 
              onClick={() => handleSelect(30)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${value === 30 ? 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-highlight)] font-medium' : 'hover:bg-[color:var(--color-card)] text-[color:var(--color-ink)]'}`}
            >
              30 Days
            </button>
            <button 
              onClick={() => handleSelect(90)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${value === 90 ? 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-highlight)] font-medium' : 'hover:bg-[color:var(--color-card)] text-[color:var(--color-ink)]'}`}
            >
              90 Days
            </button>
            <button 
              onClick={() => handleSelect(365)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${value === 365 ? 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-highlight)] font-medium' : 'hover:bg-[color:var(--color-card)] text-[color:var(--color-ink)]'}`}
            >
              1 Year
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
