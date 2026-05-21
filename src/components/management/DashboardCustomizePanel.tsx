"use client";

import * as React from "react";
import { Plus, SlidersHorizontal, Trash2, X } from "lucide-react";

import { usePreferences } from "@/components/preferences/PreferencesProvider";
import type { ManagementWidget } from "@/modules/management/types/management.types";

interface DashboardCustomizePanelProps {
  onWidgetsChange: (widgets: ManagementWidget[]) => void;
  widgets: ManagementWidget[];
}

function reorderWidgets(widgets: ManagementWidget[]) {
  return widgets
    .map((widget, index) => ({
      ...widget,
      position: index + 1,
    }))
    .sort((left, right) => left.position - right.position);
}

async function persistWidgets(widgets: ManagementWidget[]) {
  const response = await fetch("/api/management/widgets", {
    body: JSON.stringify({
      widgets: widgets.map((widget) => ({
        config: widget.config,
        enabled: widget.enabled,
        position: widget.position,
        size: widget.size,
        widgetType: widget.widgetType,
      })),
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
  const payload = await response.json();

  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Unable to save widgets.");
  }

  return payload.data.widgets as ManagementWidget[];
}

export function DashboardCustomizePanel({ onWidgetsChange, widgets }: DashboardCustomizePanelProps) {
  const { language } = usePreferences();
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const sortedWidgets = React.useMemo(
    () => [...widgets].sort((left, right) => left.position - right.position),
    [widgets],
  );
  const enabledWidgets = sortedWidgets.filter((widget) => widget.enabled);
  const disabledWidgets = sortedWidgets.filter((widget) => !widget.enabled);

  const updateWidgets = async (nextWidgets: ManagementWidget[]) => {
    const normalized = reorderWidgets(nextWidgets);

    onWidgetsChange(normalized);
    setSaving(true);

    try {
      const savedWidgets = await persistWidgets(normalized);
      onWidgetsChange(savedWidgets);
    } finally {
      setSaving(false);
    }
  };

  const setWidgetEnabled = (widget: ManagementWidget, enabled: boolean) => {
    void updateWidgets(
      sortedWidgets.map((candidate) =>
        candidate.widgetType === widget.widgetType ? { ...candidate, enabled } : candidate,
      ),
    );
  };

  return (
    <section className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-5 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl border border-[#4da3ff]/20 bg-[#4da3ff]/10 p-3 text-[#9acbff]">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {language === "FR" ? "Dashboard personnalisable" : "Customizable dashboard"}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/48">
              {language === "FR"
                ? "Ajoute ou retire les sections ici. Pour changer l'ordre, attrape une carte du dashboard et deplace-la."
                : "Add or remove sections here. To change the order, grab a dashboard card and drag it."}
            </p>
          </div>
        </div>
        {saving ? <span className="text-xs font-semibold text-[#9acbff]">Saving...</span> : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {enabledWidgets.map((widget, index) => (
          <article
            className="relative min-h-28 rounded-2xl border border-white/8 bg-[#07101d]/72 p-4 transition hover:border-white/14"
            key={widget.widgetType}
          >
            <button
              className="absolute right-3 top-3 rounded-full border border-rose-400/20 bg-rose-400/10 p-2 text-rose-200 transition hover:bg-rose-400/15 disabled:opacity-35"
              disabled={saving}
              onClick={() => setWidgetEnabled(widget, false)}
              title={language === "FR" ? "Retirer ce widget" : "Remove this widget"}
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <p className="pr-10 text-sm font-black text-white">{widget.label}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/32">
              {language === "FR" ? "Position" : "Position"} #{index + 1}
            </p>
            <p className="mt-4 text-xs leading-5 text-white/42">
              {language === "FR"
                ? "Deplace ce widget depuis la grille principale avec le mode layout."
                : "Move this widget from the main grid with layout mode."}
            </p>
          </article>
        ))}

        <button
          className="flex min-h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-[#4da3ff]/45 bg-[#4da3ff]/10 p-4 text-[#9acbff] transition hover:border-[#4da3ff]/70 hover:bg-[#4da3ff]/15 disabled:opacity-45"
          disabled={saving}
          onClick={() => setPanelOpen(true)}
          type="button"
        >
          <Plus className="h-7 w-7" />
          <span className="mt-2 text-xs font-black uppercase tracking-[0.16em]">
            {language === "FR" ? "Ajouter" : "Add"}
          </span>
        </button>
      </div>

      {panelOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#0b1422] shadow-[0_26px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/8 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9dccff]">
                  {language === "FR" ? "Widgets" : "Widgets"}
                </p>
                <h3 className="mt-1 text-xl font-black text-white">
                  {language === "FR" ? "Ajouter un element" : "Add an element"}
                </h3>
              </div>
              <button
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/55 transition hover:border-white/20 hover:text-white"
                onClick={() => setPanelOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid max-h-[520px] gap-3 overflow-y-auto p-5 sm:grid-cols-2">
              {disabledWidgets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm font-semibold text-white/42 sm:col-span-2">
                  {language === "FR" ? "Tous les widgets sont deja actifs." : "Every widget is already active."}
                </div>
              ) : (
                disabledWidgets.map((widget) => (
                  <button
                    className="group flex min-h-32 flex-col justify-between rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-left transition hover:border-[#4da3ff]/35 hover:bg-[#4da3ff]/10 disabled:opacity-45"
                    disabled={saving}
                    key={widget.widgetType}
                    onClick={() => {
                      setWidgetEnabled(widget, true);
                      setPanelOpen(false);
                    }}
                    type="button"
                  >
                    <div>
                      <p className="text-base font-black text-white">{widget.label}</p>
                      <p className="mt-2 text-xs leading-5 text-white/42">
                        {language === "FR"
                          ? "Ajoute ce bloc a ton dashboard personnel."
                          : "Add this block to your personal dashboard."}
                      </p>
                    </div>
                    <span className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#4da3ff]/30 bg-[#4da3ff]/10 text-[#9acbff] transition group-hover:bg-[#4da3ff]/20">
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                ))
              )}
            </div>
        </div>
        </div>
      ) : null}
    </section>
  );
}
