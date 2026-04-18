import * as React from "react";
import { cn } from "./Button";

export function GlassCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-card)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
