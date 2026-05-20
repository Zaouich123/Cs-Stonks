import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BackgroundFX } from "@/components/home/BackgroundFX";
import { SteamLoginCard } from "@/components/auth/SteamLoginCard";

interface AuthPageProps {
  searchParams?: Promise<{
    error?: string;
  }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = searchParams ? await searchParams : {};

  return (
    <div className="relative min-h-screen bg-[color:var(--color-surface)] selection:bg-[#4da3ff]/30 text-white overflow-hidden">
      <BackgroundFX />
      <Navbar />
      
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <SteamLoginCard error={params.error} />
      </main>
    </div>
  );
}
