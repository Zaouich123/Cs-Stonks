"use client";

import { useEffect, useRef } from "react";

export function BackgroundFX() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = ev;
      // Calculate coordinates relative to the document in case of scroll
      containerRef.current.style.setProperty("--mouse-x", `${clientX}px`);
      containerRef.current.style.setProperty("--mouse-y", `${clientY}px`);
    };
    
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base dark layer */}
      <div className="absolute inset-0 bg-[#030816]" />

      {/* Deep blue accent glow */}
      <div
        className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vw] rounded-full bg-[#093066]/20 blur-[120px]"
        style={{ transform: "translate3d(0, 0, 0)" }}
      />
      <div
        className="absolute top-[40%] -right-[20%] h-[60vh] w-[60vw] rounded-full bg-[#093066]/15 blur-[150px]"
        style={{ transform: "translate3d(0, 0, 0)" }}
      />
      
      {/* Subtle highlight */}
      <div
        className="absolute top-[20%] left-[60%] h-[40vh] w-[40vw] rounded-full bg-[#4da3ff]/5 blur-[100px]"
        style={{ transform: "translate3d(0, 0, 0)" }}
      />

      {/* Base faint grid */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      />

      {/* Interactive bright grid that follows mouse */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#4da3ff25_1px,transparent_1px),linear-gradient(to_bottom,#4da3ff25_1px,transparent_1px)] bg-[size:4rem_4rem]"
        style={{
          maskImage: "radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), black 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), black 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
