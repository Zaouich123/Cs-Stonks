import { redirect } from "next/navigation";

import { BackgroundFX } from "@/components/home/BackgroundFX";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileActionsCard } from "@/components/profile/ProfileActionsCard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PhoneSettingsCard } from "@/components/profile/PhoneSettingsCard";
import { SteamIdentityCard } from "@/components/profile/SteamIdentityCard";
import { TradeLinkCard } from "@/components/profile/TradeLinkCard";
import { getCurrentSession } from "@/modules/auth/session/sessionCookie";

export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-surface)] text-white">
      <BackgroundFX />
      <Navbar />

      <main className="relative z-10 mx-auto flex w-full max-w-[96rem] flex-col gap-8 px-5 pb-16 pt-32 md:px-10">
        <ProfileHeader user={session.user} />

        <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.6fr)]">
          <div className="space-y-5">
            <SteamIdentityCard user={session.user} />
            <ProfileActionsCard user={session.user} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <TradeLinkCard initialTradeLink={session.user.tradeLink} />
            <PhoneSettingsCard
              initialPhoneCountryCode={session.user.phoneCountryCode}
              initialPhoneNumber={session.user.phoneNumber}
              phoneVerified={session.user.phoneVerified}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
