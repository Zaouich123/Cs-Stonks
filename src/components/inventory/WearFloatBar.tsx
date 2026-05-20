"use client";

import { cn } from "@/components/ui/Button";

interface WearFloatBarProps {
  className?: string;
  value: number | null;
}

export function WearFloatBar({ className, value }: WearFloatBarProps) {
  const markerPosition = value === null ? 0 : Math.max(0, Math.min(100, value * 100));

  return (
    <div className={cn("relative h-3 w-full rounded-full bg-white/8", className)}>
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="grid h-full grid-cols-[7fr_8fr_23fr_7fr_55fr]">
          <span className="bg-lime-400" />
          <span className="bg-green-500" />
          <span className="bg-amber-300" />
          <span className="bg-orange-400" />
          <span className="bg-red-500" />
        </div>
      </div>

      {value !== null ? (
        <span
          className="absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
          style={{ left: `${markerPosition}%` }}
        />
      ) : null}
    </div>
  );
}
