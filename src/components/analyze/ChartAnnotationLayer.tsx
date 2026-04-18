"use client";

import * as React from "react";
import { motion } from "framer-motion";

export type AnnotationType = "positive" | "negative";

export interface Annotation {
  id: string;
  type: AnnotationType;
  x: number;
  y: number;
}

interface ChartAnnotationLayerProps {
  annotations: Annotation[];
  onRemove: (id: string) => void;
}

export function ChartAnnotationLayer({ annotations, onRemove }: ChartAnnotationLayerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {annotations.map((ann) => (
        <motion.div
          key={ann.id}
          drag
          dragMomentum={false}
          initial={{ x: ann.x, y: ann.y, opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute pointer-events-auto cursor-move flex items-center justify-center border-2 w-48 h-32 rounded-lg shadow-2xl backdrop-blur-sm group ${
            ann.type === "positive" 
              ? "bg-green-500/10 border-green-500/40" 
              : "bg-red-500/10 border-red-500/40"
          }`}
        >
          <button 
            onClick={() => onRemove(ann.id)}
            className="absolute -top-3 -right-3 bg-[#0d182a] border border-white/10 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-red-500/20 hover:text-red-400"
          >
            ×
          </button>
        </motion.div>
      ))}
    </div>
  );
}
