"use client";

import * as React from "react";
import { PlusSquare, MinusSquare, Trash2, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AnnotationType } from "./ChartAnnotationLayer";
import { exportChartAsImage } from "@/lib/charts/exportChartAsImage";

interface AnalyzeToolbarProps {
  onAddAnnotation: (type: AnnotationType) => void;
  onClearAnnotations: () => void;
  chartRef: React.RefObject<HTMLDivElement | null>;
}

export function AnalyzeToolbar({ onAddAnnotation, onClearAnnotations, chartRef }: AnalyzeToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-md mt-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onAddAnnotation("positive")} 
        className="text-green-400 hover:text-green-300 hover:bg-green-500/10 gap-2"
      >
        <PlusSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Zone Haussière</span>
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onAddAnnotation("negative")} 
        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
      >
        <MinusSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Zone Baissière</span>
      </Button>
      
      <div className="w-px h-6 bg-white/10 mx-2" />
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClearAnnotations} 
        className="text-[color:var(--color-muted)] hover:text-white gap-2"
      >
        <Trash2 className="w-4 h-4" />
        <span className="hidden sm:inline">Effacer</span>
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
