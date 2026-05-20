import { redirect } from "next/navigation";

import { BackgroundFX } from "@/components/home/BackgroundFX";
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";
import { Navbar } from "@/components/layout/Navbar";
import { getCurrentSession } from "@/modules/auth/session/sessionCookie";

export default async function InventoryPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-surface)] text-white">
      <BackgroundFX />
      <Navbar />

      <main className="relative z-10 mx-auto flex w-full max-w-[112rem] flex-col px-4 pb-16 pt-28 md:px-8 md:pt-32">
        <InventoryDashboard
          initialUser={{
            steamAvatar: session.user.steamAvatarMedium ?? session.user.steamAvatar,
            steamId: session.user.steamId,
            steamPersonaName: session.user.steamPersonaName,
          }}
        />
      </main>
    </div>
  );
}
