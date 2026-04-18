import * as React from "react";
import { GlassCard } from "@/components/ui/GlassCard";

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <GlassCard className="w-full max-w-md p-8 md:p-10 shadow-2xl relative">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#093066] to-transparent opacity-50" />
      {children}
    </GlassCard>
  );
}
