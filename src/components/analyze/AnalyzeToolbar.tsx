"use client";

import * as React from "react";
import { Camera, Eraser, MinusSquare, Paintbrush, PlusSquare, Redo2, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AnnotationType } from "./ChartAnnotationLayer";
import { exportChartAsImage } from "@/lib/charts/exportChartAsImage";
import { usePreferences } from "@/components/preferences/PreferencesProvider";

interface AnalyzeToolbarProps {
  onAddAnnotation: (type: AnnotationType) => void;
  onClearAnnotations: () => void;
  chartRef: React.RefObject<HTMLDivElement | null>;
  canRedoDrawing: boolean;
  canUndoDrawing: boolean;
  drawingColor: string;
  isDrawingEnabled: boolean;
  onDrawingColorChange: (color: string) => void;
  onFullClean: () => void;
  onRedoDrawing: () => void;
  onToggleDrawing: () => void;
  onUndoDrawing: () => void;
}

export function AnalyzeToolbar({
  canRedoDrawing,
  canUndoDrawing,
  chartRef,
  drawingColor,
  isDrawingEnabled,
  onAddAnnotation,
  onClearAnnotations,
  onDrawingColorChange,
  onFullClean,
  onRedoDrawing,
  onToggleDrawing,
  onUndoDrawing,
}: AnalyzeToolbarProps) {
  const { t } = usePreferences();
  const handleDrawingColorInput = React.useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      const nextColor = event.currentTarget.value.toLowerCase();

      if (!/^#[0-9a-f]{6}$/.test(nextColor) || nextColor === drawingColor.toLowerCase()) {
        return;
      }

      onDrawingColorChange(nextColor);
    },
    [drawingColor, onDrawingColorChange],
  );

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-md mt-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onAddAnnotation("positive")} 
        className="text-green-400 hover:text-green-300 hover:bg-green-500/10 gap-2"
      >
        <PlusSquare className="w-4 h-4" />
        <span className="hidden sm:inline">{t("addUpZone")}</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onAddAnnotation("negative")} 
        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
      >
        <MinusSquare className="w-4 h-4" />
        <span className="hidden sm:inline">{t("addDownZone")}</span>
      </Button>
      
      <div className="w-px h-6 bg-white/10 mx-2" />

      <Button
        variant={isDrawingEnabled ? "secondary" : "ghost"}
        size="sm"
        onClick={onToggleDrawing}
        className={`gap-2 ${
          isDrawingEnabled
            ? "text-[#4da3ff] bg-[#4da3ff]/10 hover:bg-[#4da3ff]/15"
            : "text-[color:var(--color-muted)] hover:text-white"
        }`}
      >
        <Paintbrush className="w-4 h-4" />
        <span className="hidden sm:inline">{t("stylus")}</span>
      </Button>

      <label className="flex h-9 items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 text-sm text-white/70">
        <span className="hidden sm:inline">{t("color")}</span>
        <input
          aria-label={`${t("color")} ${t("stylus")}`}
          className="h-5 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
          defaultValue={drawingColor}
          onInput={handleDrawingColorInput}
          type="color"
        />
      </label>

      <Button
        variant="ghost"
        size="sm"
        onClick={onUndoDrawing}
        disabled={!canUndoDrawing}
        className="text-[color:var(--color-muted)] hover:text-white gap-2"
      >
        <Undo2 className="w-4 h-4" />
        <span className="hidden sm:inline">Undo</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRedoDrawing}
        disabled={!canRedoDrawing}
        className="text-[color:var(--color-muted)] hover:text-white gap-2"
      >
        <Redo2 className="w-4 h-4" />
        <span className="hidden sm:inline">Redo</span>
      </Button>
      
      <div className="w-px h-6 bg-white/10 mx-2" />
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClearAnnotations} 
        className="text-[color:var(--color-muted)] hover:text-white gap-2"
      >
        <Trash2 className="w-4 h-4" />
        <span className="hidden sm:inline">{t("eraseZones")}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onFullClean}
        className="text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 gap-2"
      >
        <Eraser className="w-4 h-4" />
        <span className="hidden sm:inline">{t("fullClean")}</span>
      </Button>
      
      <div className="flex-1" />
      
      <Button 
        size="sm" 
        onClick={() => exportChartAsImage(chartRef)} 
        className="gap-2 bg-[#093066] hover:bg-[#0c4088] text-white shadow-lg"
      >
        <Camera className="w-4 h-4" />
        Exporter PNG
      </Button>
    </div>
  );
}
