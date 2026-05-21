"use client";

import * as React from "react";
import { ExternalLink, Newspaper } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import type { ManagementCs2NewsItem } from "@/modules/management/types/management.types";
import { WidgetShell } from "@/components/management/widgets/WidgetShell";

export function Cs2UpdateWidget({ updates }: { updates: ManagementCs2NewsItem[] }) {
  const { language } = usePreferences();
  const [selectedUpdate, setSelectedUpdate] = React.useState<ManagementCs2NewsItem | null>(null);
  const latestUpdate = updates[0] ?? null;

  return (
    <WidgetShell
      eyebrow={language === "FR" ? "Veille CS2" : "CS2 watch"}
      title={language === "FR" ? "Derniere news CS2" : "Latest CS2 news"}
    >
      {latestUpdate ? (
        <>
          <button
            className="w-full rounded-2xl border border-[#4da3ff]/20 bg-[#4da3ff]/[0.08] p-5 text-left transition hover:border-[#4da3ff]/45 hover:bg-[#4da3ff]/[0.12]"
            onClick={() => setSelectedUpdate(latestUpdate)}
            type="button"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="mt-1 rounded-xl border border-white/10 bg-white/[0.06] p-2 text-[#9acbff]">
                  <Newspaper className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{latestUpdate.title}</p>
                  {latestUpdate.details.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {latestUpdate.details.slice(0, 2).map((detail) => (
                        <li className="flex gap-2 text-sm leading-6 text-white/58" key={detail}>
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9acbff]/70" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-white/52">{latestUpdate.summary}</p>
                  )}
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/55">
                {language === "FR" ? "Lire" : "Read"}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/35">
              <span>{new Date(latestUpdate.date).toLocaleDateString(language === "FR" ? "fr-FR" : "en-US")}</span>
              {latestUpdate.feedLabel ? <span>· {latestUpdate.feedLabel}</span> : null}
            </div>
          </button>

          {selectedUpdate ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#020712]/78 p-4 backdrop-blur-md">
              <article className="max-h-[82vh] w-full max-w-3xl overflow-y-auto rounded-[1.5rem] border border-white/10 bg-[#07101d] p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#9acbff]">
                      {selectedUpdate.feedLabel ?? "Steam news"}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">{selectedUpdate.title}</h3>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/35">
                      {new Date(selectedUpdate.date).toLocaleDateString(language === "FR" ? "fr-FR" : "en-US")}
                    </p>
                  </div>
                  <button
                    className="rounded-full border border-white/10 px-3 py-1.5 text-sm font-semibold text-white/65 transition hover:text-white"
                    onClick={() => setSelectedUpdate(null)}
                    type="button"
                  >
                    {language === "FR" ? "Fermer" : "Close"}
                  </button>
                </div>

                <div className="mt-6 space-y-3 text-sm leading-7 text-white/68">
                  {(selectedUpdate.fullText || selectedUpdate.summary)
                    .split(/(?<=\.)\s+|\n+/)
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                </div>

                <a
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition hover:text-white"
                  href={selectedUpdate.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {language === "FR" ? "Ouvrir la source" : "Open source"}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </article>
            </div>
          ) : null}
        </>
      ) : null}
    </WidgetShell>
  );
}
