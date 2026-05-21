import { redirect } from "next/navigation";

import { ExchangeAnalyzer } from "@/components/exchanges/ExchangeAnalyzer";
import { BackgroundFX } from "@/components/home/BackgroundFX";
import { Navbar } from "@/components/layout/Navbar";
import { getCurrentSession } from "@/modules/auth/session/sessionCookie";

export default async function ExchangesPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-surface)] text-white selection:bg-[#4da3ff]/30">
      <BackgroundFX />
      <Navbar />

      <main className="relative z-10 mx-auto flex w-full max-w-[96rem] flex-col px-5 pb-16 pt-28 md:px-10 md:pt-32">
        <ExchangeAnalyzer />
      </main>
    </div>
  );
}
