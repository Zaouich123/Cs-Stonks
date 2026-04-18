"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";

export function AuthForm() {
  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--color-muted)]">Email Address</label>
        <input 
          type="email" 
          placeholder="you@example.com" 
          className="w-full bg-[#0d182a]/50 border border-[color:var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[#4da3ff]/50 focus:ring-1 focus:ring-[#4da3ff]/50 transition-all placeholder:text-gray-600"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--color-muted)]">Password</label>
        <input 
          type="password" 
          placeholder="••••••••" 
          className="w-full bg-[#0d182a]/50 border border-[color:var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[#4da3ff]/50 focus:ring-1 focus:ring-[#4da3ff]/50 transition-all placeholder:text-gray-600"
        />
      </div>
      <Button className="w-full mt-4 py-6 text-lg tracking-wide">
        Sign In
      </Button>
      <div className="text-center mt-6">
        <p className="text-sm text-[color:var(--color-muted)]">
          Don&apos;t have an account? <a href="#" className="text-[#4da3ff] hover:text-[#7bbdff] transition-colors hover:underline">Sign up</a>
        </p>
      </div>
    </form>
  );
}
