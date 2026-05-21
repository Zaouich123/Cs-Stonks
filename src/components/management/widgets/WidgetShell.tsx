"use client";

import type { ReactNode } from "react";

import { cn } from "@/components/ui/Button";

interface WidgetShellProps {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  title: string;
}

export function WidgetShell({ action, children, className, eyebrow, title }: WidgetShellProps) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[1.35rem] border border-white/8 bg-[#07101d]/76 p-5 shadow-[0_18px_58px_rgba(0,0,0,0.26)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#093066]/24 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#4da3ff]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="relative mt-5">{children}</div>
    </article>
  );
}
