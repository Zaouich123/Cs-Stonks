"use client";

import * as React from "react";
import { motion, useMotionValue } from "framer-motion";

export type AnnotationType = "positive" | "negative";

export interface Annotation {
  id: string;
  type: AnnotationType;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface ChartAnnotationLayerProps {
  annotations: Annotation[];
  onRemove: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Annotation>) => void;
}

function ResizableAnnotation({ ann, onRemove }: { ann: Annotation, onRemove: (id: string) => void }) {
  const x = useMotionValue(ann.x);
  const y = useMotionValue(ann.y);
  const width = useMotionValue(ann.width || 192);
  const height = useMotionValue(ann.height || 128);

  const handleResize = (e: React.PointerEvent, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width.get();
    const startHeight = height.get();
    const startPosX = x.get();
    const startPosY = y.get();

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;

      if (corner.includes("e")) newWidth = Math.max(50, startWidth + dx);
      if (corner.includes("w")) {
        newWidth = Math.max(50, startWidth - dx);
        newX = startPosX + startWidth - newWidth;
      }
      if (corner.includes("s")) newHeight = Math.max(50, startHeight + dy);
      if (corner.includes("n")) {
        newHeight = Math.max(50, startHeight - dy);
        newY = startPosY + startHeight - newHeight;
      }

      width.set(newWidth);
      height.set(newHeight);
      x.set(newX);
      y.set(newY);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleStyle = "absolute w-4 h-4 bg-white/20 border border-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity";

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{ x, y, width, height }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute pointer-events-auto flex items-center justify-center border-2 rounded-lg shadow-2xl group ${
        ann.type === "positive" 
          ? "bg-green-500/20 border-green-500/60" 
          : "bg-red-500/20 border-red-500/60"
      }`}
    >
      <div className="absolute inset-0 cursor-move" />
      
      {/* 4 Corners for Resizing */}
      <div onPointerDown={(e) => handleResize(e, "nw")} className={`${handleStyle} -top-2 -left-2 cursor-nwse-resize`} />
      <div onPointerDown={(e) => handleResize(e, "ne")} className={`${handleStyle} -top-2 -right-2 cursor-nesw-resize`} />
      <div onPointerDown={(e) => handleResize(e, "sw")} className={`${handleStyle} -bottom-2 -left-2 cursor-nesw-resize`} />
      <div onPointerDown={(e) => handleResize(e, "se")} className={`${handleStyle} -bottom-2 -right-2 cursor-nwse-resize`} />

      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(ann.id); }}
        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d182a] border border-white/10 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-red-500/20 hover:text-red-400 z-10"
      >
        ×
      </button>
    </motion.div>
  );
}

export function ChartAnnotationLayer({ annotations, onRemove, onUpdate }: ChartAnnotationLayerProps) {
  void onUpdate;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {annotations.map((ann) => (
        <ResizableAnnotation key={ann.id} ann={ann} onRemove={onRemove} />
      ))}
    </div>
  );
}
