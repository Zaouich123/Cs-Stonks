"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";

export function AnalyzeFilterSelect() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-xl hover:bg-[color:var(--color-card-strong)] transition-colors text-sm font-medium"
      >
        <span>90 Days</span>
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
            <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[color:var(--color-card)] text-[color:var(--color-ink)] transition-colors">30 Days</button>
            <button className="w-full text-left px-3 py-2 text-sm rounded-lg bg-[color:var(--color-accent-soft)] text-[color:var(--color-highlight)] font-medium transition-colors">90 Days</button>
            <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[color:var(--color-card)] text-[color:var(--color-ink)] transition-colors">1 Year</button>
          </div>
        </div>
      )}
    </div>
  );
}
