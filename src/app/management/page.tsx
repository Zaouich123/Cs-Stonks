import { redirect } from "next/navigation";

import { BackgroundFX } from "@/components/home/BackgroundFX";
import { Navbar } from "@/components/layout/Navbar";
import { ManagementDashboardClient } from "@/components/management/ManagementDashboardClient";
import { getCurrentSession } from "@/modules/auth/session/sessionCookie";
import { ManagementService } from "@/modules/management/services/managementService";

export default async function ManagementPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  const service = new ManagementService();
  await service.seedWelcomeNotification(session.user.id);
  const data = await service.getDashboardData(session.user.id);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-surface)] text-white selection:bg-[#4da3ff]/30">
      <BackgroundFX />
      <Navbar />

      <main className="relative z-10 mx-auto flex w-full max-w-[96rem] flex-col px-5 pb-16 pt-28 md:px-10 md:pt-32">
        <ManagementDashboardClient data={data} user={session.user} />
      </main>
    </div>
  );
}
