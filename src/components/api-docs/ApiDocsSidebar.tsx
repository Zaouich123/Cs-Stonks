"use client";

import * as React from "react";

import { cn } from "@/components/ui/Button";
import { ApiSectionNavItem } from "@/components/api-docs/ApiSectionNavItem";
import { apiDocEndpoints, apiDocNavigation, apiDocSections } from "@/lib/api-docs/api-docs-data";
import { localizeApiDocEndpoints, localizeApiDocSections } from "@/lib/api-docs/api-docs-i18n";
import { usePreferences } from "@/components/preferences/PreferencesProvider";

export function ApiDocsSidebar({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const { language, t } = usePreferences();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const sections = React.useMemo(() => localizeApiDocSections(apiDocSections, language), [language]);
  const endpoints = React.useMemo(() => localizeApiDocEndpoints(apiDocEndpoints, language), [language]);

  const groupedEndpoints = sections.map((section) => ({
    ...section,
    endpoints: endpoints.filter((endpoint) => endpoint.category === section.id),
  }));

  const activeLabel =
    sections.find((item) => item.id === activeId)?.title ??
    endpoints.find((item) => item.id === activeId)?.name ??
    apiDocNavigation.find((item) => item.id === activeId)?.label ??
    (language === "FR" ? "Ouvrir la navigation" : "Open navigation");

  function handleSelect(id: string) {
    onSelect(id);
    setMobileOpen(false);
  }

  return (
    <>
      <div className="sticky top-20 z-30 mb-4 lg:hidden">
        <button
          className="flex w-full items-center justify-between rounded-[1.5rem] border border-white/10 bg-[#071123]/90 px-5 py-4 text-left backdrop-blur-xl"
          onClick={() => setMobileOpen((open) => !open)}
          type="button"
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{t("apiDocsViewport")}</p>
            <p className="mt-1 text-sm font-medium text-white">{activeLabel}</p>
          </div>
          <span className="text-xs font-semibold text-[#7eb7ff]">{mobileOpen ? t("close") : t("browse")}</span>
        </button>
      </div>

      <aside
        className={cn(
          "top-24 h-fit rounded-[2rem] border border-white/10 bg-[#071123]/80 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:sticky",
          mobileOpen ? "block" : "hidden lg:block",
        )}
      >
        <div className="border-b border-white/8 px-2 pb-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7eb7ff]">Cs-Stonks API</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{t("apiDocsReference")}</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">
            {t("apiDocsChooseSection")}
          </p>
        </div>

        <div className="mt-4 space-y-4">
          {groupedEndpoints.map((section) => (
            <div key={section.id} className="space-y-2">
              <ApiSectionNavItem
                active={activeId === section.id}
                label={section.title}
                onClick={() => handleSelect(section.id)}
              />
              {section.endpoints.length > 0 ? (
                <div className="space-y-2 pl-3">
                  {section.endpoints.map((endpoint) => (
                    <ApiSectionNavItem
                      active={activeId === endpoint.id}
                      compact
                      key={endpoint.id}
                      label={endpoint.name}
                      method={endpoint.method}
                      onClick={() => handleSelect(endpoint.id)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
