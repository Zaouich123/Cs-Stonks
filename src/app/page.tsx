import { Navbar } from "@/components/layout/Navbar";
import { BackgroundFX } from "@/components/home/BackgroundFX";
import { ArrowTrendBackground } from "@/components/home/ArrowTrendBackground";
import { HeroSection } from "@/components/home/HeroSection";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#030816] selection:bg-[#4da3ff]/30 text-white overflow-hidden">
      <BackgroundFX />
      <ArrowTrendBackground />
      <Navbar />
      
      <main className="relative z-10 flex flex-col">
        <HeroSection />
        
        {/* Placeholder for Section 2 to add depth */}
        <section className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-32 md:px-12">
          <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl md:p-12 shadow-2xl">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { title: "Real-time Data", desc: "Track CS2 skins with up-to-the-minute price updates from major markets." },
                { title: "Deep Analytics", desc: "Analyze historical trends, volume, and liquidity to make informed decisions." },
                { title: "Portfolio Management", desc: "Monitor your inventory value and track your return on investment effortlessly." }
              ].map((feature, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="h-10 w-10 rounded-full bg-[#093066] flex items-center justify-center text-[#4da3ff] font-bold">
                    0{idx + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="text-[#8b9bb4] leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
