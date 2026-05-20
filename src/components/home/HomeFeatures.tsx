"use client";

import { usePreferences } from "@/components/preferences/PreferencesProvider";

export function HomeFeatures() {
  const { t } = usePreferences();
  const features = [
    { title: t("homeFeatureDataTitle"), desc: t("homeFeatureDataDescription") },
    { title: t("homeFeatureAnalyticsTitle"), desc: t("homeFeatureAnalyticsDescription") },
    { title: t("homeFeaturePortfolioTitle"), desc: t("homeFeaturePortfolioDescription") },
  ];

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-32 md:px-12">
      <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl md:p-12">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, idx) => (
            <div key={feature.title} className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#093066] font-bold text-[#4da3ff]">
                0{idx + 1}
              </div>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="leading-relaxed text-[#8b9bb4]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
