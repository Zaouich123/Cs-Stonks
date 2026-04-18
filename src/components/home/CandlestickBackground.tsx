"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const generateChartData = () => {
  const points = 70;
  let currentPrice = 30; // Start lower
  const data = [];
  
  for (let i = 0; i < points; i++) {
    // Trend to match the image: small dip initially, then steady waves up
    let trend = 1.5;
    if (i < 10) trend = -2;
    else if (i > 30 && i < 40) trend = -1;
    else if (i > 50 && i < 55) trend = -1.5;
    
    const volatility = 4 + seededRandom(i) * 3;
    
    const open = currentPrice;
    const close = open + trend + (seededRandom(i + 10) - 0.4) * volatility;
    
    // Wicks
    const high = Math.max(open, close) + seededRandom(i + 100) * volatility;
    const low = Math.min(open, close) - seededRandom(i + 200) * volatility;
    
    data.push({ 
      open, 
      close, 
      high, 
      low,
      isBullish: close >= open 
    });
    currentPrice = close;
  }
  
  // Normalize
  const minLow = Math.min(...data.map(d => d.low));
  const maxHigh = Math.max(...data.map(d => d.high));
  const range = maxHigh - minLow;
  
  return data.map((d, i) => ({
    x: (i / (points - 1)) * 100,
    openY: 100 - ((d.open - minLow) / range) * 80 - 10,
    closeY: 100 - ((d.close - minLow) / range) * 80 - 10,
    highY: 100 - ((d.high - minLow) / range) * 80 - 10,
    lowY: 100 - ((d.low - minLow) / range) * 80 - 10,
    isBullish: d.isBullish
  }));
};

const chartData = generateChartData();

export function CandlestickBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
      {/* 2D Flat Chart Container */}
      <div className="absolute inset-0">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {chartData.map((d, i) => {
            const color = d.isBullish ? "#4ade80" : "#ef4444"; // Classic green/red
            const candleWidth = 0.6;
            const lineX = d.x;
            const topY = Math.min(d.openY, d.closeY);
            const bottomY = Math.max(d.openY, d.closeY);
            const height = Math.max(bottomY - topY, 0.5);
            
            return (
              <motion.g 
                key={i}
                initial={{ opacity: 0, scaleY: 0, transformOrigin: `50% ${d.openY}px` }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ 
                  duration: 0.3, 
                  delay: i * 0.04, 
                  ease: "easeOut" 
                }}
              >
                {/* Wick */}
                <line
                  x1={lineX}
                  y1={d.highY}
                  x2={lineX}
                  y2={d.lowY}
                  stroke={color}
                  strokeWidth={0.15}
                  opacity={0.8}
                />
                {/* Body */}
                <rect
                  x={lineX - candleWidth / 2}
                  y={topY}
                  width={candleWidth}
                  height={height}
                  fill={color}
                  rx={0.1}
                  opacity={0.9}
                />
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
