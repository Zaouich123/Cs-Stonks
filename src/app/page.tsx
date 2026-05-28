import { Navbar } from "@/components/layout/Navbar";
import { BackgroundFX } from "@/components/home/BackgroundFX";
import { HomeFeatures } from "@/components/home/HomeFeatures";
import { HeroSection } from "@/components/home/HeroSection";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let skinImageUrl = "https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTdn2xZ_Ish0u_A89iki1Cx8kFoNWz0LdDGclM-ZAnZ_1m8wOq9gpe1uJ2YwXQ3vCkm53_bnArj1BwcP-Y7hfKcQV-r";

  try {
    const dragonLore = await prisma.item.findFirst({
      where: { baseItemName: { contains: "Dragon Lore" } }
    });
    if (dragonLore?.imageUrl) {
      skinImageUrl = dragonLore.imageUrl;
    }
  } catch {
    // Silently fallback if DB is unreachable to avoid Next.js dev overlay
  }

  return (
    <div className="relative min-h-screen bg-[#030816] selection:bg-[#4da3ff]/30 text-white overflow-hidden">
      <BackgroundFX />
      {/* <CandlestickBackground /> */}
      <Navbar />
      
      <main className="relative z-10 flex flex-col">
        <HeroSection skinImageUrl={skinImageUrl} />
        
        <HomeFeatures />
      </main>
    </div>
  );
}
