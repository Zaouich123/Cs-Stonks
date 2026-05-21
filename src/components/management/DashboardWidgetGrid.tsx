"use client";

import * as React from "react";
import { DashboardWidgetSize, DashboardWidgetType } from "@prisma/client";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, X } from "lucide-react";

import { Cs2UpdateWidget } from "@/components/management/widgets/Cs2UpdateWidget";
import { InventoryValueWidget } from "@/components/management/widgets/InventoryValueWidget";
import { MarketplaceSalesWidget } from "@/components/management/widgets/MarketplaceSalesWidget";
import { NotificationsWidget } from "@/components/management/widgets/NotificationsWidget";
import { TrackedSkinChartWidget } from "@/components/management/widgets/TrackedSkinChartWidget";
import { TradeTrackerWidget } from "@/components/management/widgets/TradeTrackerWidget";
import type { ManagementDashboardData } from "@/modules/management/types/management.types";
import type { ManagementWidget } from "@/modules/management/types/management.types";

interface DashboardWidgetGridProps {
  data: ManagementDashboardData;
  onTrackedSkinsChange: (trackedSkins: ManagementDashboardData["trackedSkins"]) => void;
  onWidgetsChange: (widgets: ManagementWidget[]) => void;
}

interface SortableWidgetCardProps {
  children: React.ReactNode;
  layoutMode: boolean;
  onRemove: (widget: ManagementWidget) => void;
  widget: ManagementWidget;
}

function reorderWidgets(widgets: ManagementWidget[]) {
  return widgets.map((widget, index) => ({
    ...widget,
    position: index + 1,
  }));
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

function getWidgetGridClassName(widget: ManagementWidget) {
  if (widget.size === DashboardWidgetSize.WIDE || widget.size === DashboardWidgetSize.LARGE) {
    return "xl:col-span-2";
  }

  return "";
}

function SortableWidgetCard({ children, layoutMode, onRemove, widget }: SortableWidgetCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    disabled: !layoutMode,
    id: widget.widgetType,
  });
  const dragAttributes = layoutMode ? attributes : {};
  const dragListeners = layoutMode ? listeners : {};
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-[1.35rem] transition ${getWidgetGridClassName(widget)} ${
        layoutMode ? "touch-none" : ""
      } ${isDragging ? "z-30 scale-[0.985] opacity-45" : ""}`}
    >
      <button
        ref={setActivatorNodeRef}
        className={`absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-[#030816]/90 p-2 text-white/55 shadow-xl backdrop-blur transition ${
          layoutMode
            ? "cursor-grab opacity-100 group-hover:text-white active:cursor-grabbing"
            : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
        }`}
        disabled={!layoutMode}
        title={layoutMode ? "Drag this widget" : "Enable layout mode to reorder"}
        type="button"
        {...dragAttributes}
        {...dragListeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {layoutMode ? (
        <button
          className="absolute right-16 top-4 z-20 rounded-full border border-rose-400/20 bg-[#030816]/90 p-2 text-rose-200/75 shadow-xl backdrop-blur transition hover:bg-rose-400/12 hover:text-rose-100"
          onClick={() => onRemove(widget)}
          title="Remove widget"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}

      {layoutMode ? (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-[1.35rem] border border-[#4da3ff]/24 bg-[#4da3ff]/0 transition group-hover:bg-[#4da3ff]/6" />
      ) : null}

      {children}
    </div>
  );
}

export function DashboardWidgetGrid({
  data,
  onTrackedSkinsChange,
  onWidgetsChange,
}: DashboardWidgetGridProps) {
  const [activeType, setActiveType] = React.useState<DashboardWidgetType | null>(null);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [selectedSize, setSelectedSize] = React.useState<DashboardWidgetSize>(DashboardWidgetSize.MEDIUM);
  const [isSaving, setIsSaving] = React.useState(false);
  const [layoutMode, setLayoutMode] = React.useState(false);
  const widgets = data.widgets.filter((widget) => widget.enabled).sort((a, b) => a.position - b.position);
  const disabledWidgets = data.widgets.filter((widget) => !widget.enabled).sort((a, b) => a.position - b.position);
  const widgetIds = widgets.map((widget) => widget.widgetType);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const saveWidgets = async (nextWidgets: ManagementWidget[]) => {
    const normalizedWidgets = reorderWidgets(nextWidgets);

    setIsSaving(true);
    onWidgetsChange(normalizedWidgets);

    try {
      const savedWidgets = await persistWidgets(normalizedWidgets);
      onWidgetsChange(savedWidgets);
    } catch {
      onWidgetsChange(data.widgets);
    } finally {
      setIsSaving(false);
    }
  };

  const persistWidgetOrder = async (orderedEnabledWidgets: ManagementWidget[]) => {
    await saveWidgets([...orderedEnabledWidgets, ...disabledWidgets]);
  };

  const addWidget = (widget: ManagementWidget) => {
    const nextWidgets = [
      ...widgets,
      {
        ...widget,
        enabled: true,
        size: selectedSize,
      },
      ...disabledWidgets.filter((candidate) => candidate.widgetType !== widget.widgetType),
    ];

    setAddModalOpen(false);
    void saveWidgets(nextWidgets);
  };

  const removeWidget = (widget: ManagementWidget) => {
    const nextWidgets = [
      ...widgets
        .filter((candidate) => candidate.widgetType !== widget.widgetType)
        .map((candidate) => ({ ...candidate })),
      {
        ...widget,
        enabled: false,
      },
      ...disabledWidgets.filter((candidate) => candidate.widgetType !== widget.widgetType),
    ];

    void saveWidgets(nextWidgets);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveType(event.active.id as DashboardWidgetType);
  };

  const handleDragCancel = () => {
    setActiveType(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveType(null);

    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    const activeIndex = widgets.findIndex((widget) => widget.widgetType === event.active.id);
    const overIndex = widgets.findIndex((widget) => widget.widgetType === event.over?.id);

    if (activeIndex < 0 || overIndex < 0) {
      return;
    }

    void persistWidgetOrder(arrayMove(widgets, activeIndex, overIndex));
  };

  const renderWidget = (widget: ManagementWidget) => {
    switch (widget.widgetType) {
      case DashboardWidgetType.TRACKED_SKIN_CHART:
        return (
          <TrackedSkinChartWidget
            onTrackedSkinsChange={onTrackedSkinsChange}
            trackedSkins={data.trackedSkins}
          />
        );
      case DashboardWidgetType.INVENTORY_VALUE:
        return <InventoryValueWidget inventory={data.inventory} />;
      case DashboardWidgetType.CS2_UPDATE:
        return <Cs2UpdateWidget updates={data.cs2Updates} />;
      case DashboardWidgetType.MARKETPLACE_SALES:
        return <MarketplaceSalesWidget listings={data.listings} />;
      case DashboardWidgetType.TRADE_TRACKER:
        return <TradeTrackerWidget trades={data.trades} />;
      case DashboardWidgetType.NOTIFICATIONS:
        return <NotificationsWidget notifications={data.notifications} />;
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <button
          className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
            layoutMode
              ? "border-[#4da3ff]/40 bg-[#4da3ff]/15 text-[#9acbff]"
              : "border-white/10 bg-white/[0.035] text-white/55 hover:text-white"
          }`}
          onClick={() => setLayoutMode((current) => !current)}
          type="button"
        >
          {isSaving ? "Sauvegarde..." : layoutMode ? "Modification active" : "Modifier le dashboard"}
        </button>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
          <div className="grid gap-5 xl:grid-cols-2">
            {widgets.map((widget) => (
              <SortableWidgetCard
                key={widget.widgetType}
                layoutMode={layoutMode}
                onRemove={removeWidget}
                widget={widget}
              >
                {renderWidget(widget)}
              </SortableWidgetCard>
            ))}

            {layoutMode ? (
              <button
                className="flex min-h-[230px] flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-[#4da3ff]/45 bg-[#4da3ff]/10 p-6 text-[#9acbff] transition hover:border-[#4da3ff]/70 hover:bg-[#4da3ff]/15 disabled:opacity-45"
                disabled={isSaving}
                onClick={() => setAddModalOpen(true)}
                type="button"
              >
                <Plus className="h-9 w-9" />
                <span className="mt-3 text-sm font-black uppercase tracking-[0.18em]">
                  Ajouter un widget
                </span>
                <span className="mt-2 max-w-xs text-center text-xs font-semibold leading-5 text-white/42">
                  Choisis une section et sa forme avant de l&apos;ajouter au dashboard.
                </span>
              </button>
            ) : null}
          </div>
        </SortableContext>
      </DndContext>

      {activeType ? (
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-[#9acbff]/75">
          Moving {activeType.toLowerCase().replaceAll("_", " ")}
        </p>
      ) : null}

      {addModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#0b1422] shadow-[0_26px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/8 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9dccff]">
                  Dashboard
                </p>
                <h3 className="mt-1 text-xl font-black text-white">Ajouter un widget</h3>
              </div>
              <button
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/55 transition hover:border-white/20 hover:text-white"
                onClick={() => setAddModalOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-white/8 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Format</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  {
                    label: "Carre",
                    size: DashboardWidgetSize.MEDIUM,
                  },
                  {
                    label: "Rectangle",
                    size: DashboardWidgetSize.WIDE,
                  },
                ].map((option) => (
                  <button
                    className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                      selectedSize === option.size
                        ? "border-[#4da3ff]/45 bg-[#4da3ff]/18 text-[#b9dcff]"
                        : "border-white/10 bg-white/[0.035] text-white/50 hover:text-white"
                    }`}
                    key={option.size}
                    onClick={() => setSelectedSize(option.size)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid max-h-[500px] gap-3 overflow-y-auto p-5 sm:grid-cols-2">
              {disabledWidgets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm font-semibold text-white/42 sm:col-span-2">
                  Tous les widgets sont deja actifs.
                </div>
              ) : (
                disabledWidgets.map((widget) => (
                  <button
                    className={`group flex min-h-32 flex-col justify-between rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-left transition hover:border-[#4da3ff]/35 hover:bg-[#4da3ff]/10 disabled:opacity-45 ${
                      selectedSize === DashboardWidgetSize.WIDE ? "sm:col-span-2" : ""
                    }`}
                    disabled={isSaving}
                    key={widget.widgetType}
                    onClick={() => addWidget(widget)}
                    type="button"
                  >
                    <div>
                      <p className="text-base font-black text-white">{widget.label}</p>
                      <p className="mt-2 text-xs leading-5 text-white/42">
                        Ajoute ce bloc en format {selectedSize === DashboardWidgetSize.WIDE ? "rectangle" : "carre"}.
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
