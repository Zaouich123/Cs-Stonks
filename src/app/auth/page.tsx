import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BackgroundFX } from "@/components/home/BackgroundFX";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <div className="relative min-h-screen bg-[color:var(--color-surface)] selection:bg-[#4da3ff]/30 text-white overflow-hidden">
      <BackgroundFX />
      <Navbar />
      
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <AuthCard>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Welcome Back</h1>
            <p className="text-[color:var(--color-muted)] text-sm">Sign in to manage your inventory and track market prices.</p>
          </div>
          <AuthForm />
        </AuthCard>
      </main>
    </div>
  );
}
