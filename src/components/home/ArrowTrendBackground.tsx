"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ArrowTrendBackground() {
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 1000], [0, -150]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ y: yParallax }}
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        {/* Main trend arrow shooting up */}
        <motion.div
          className="absolute bottom-0 left-0"
          initial={{ x: "-20vw", y: "20vh", opacity: 0 }}
          animate={{ x: "120vw", y: "-100vh", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex items-center -rotate-[35deg] drop-shadow-[0_0_15px_rgba(77,163,255,0.5)]">
            <div className="h-[2px] w-[40vw] bg-gradient-to-r from-transparent via-[#093066] to-[#4da3ff]" />
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[#4da3ff] -ml-4">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </motion.div>

        {/* Secondary subtle trend arrow */}
        <motion.div
          className="absolute bottom-[10vh] left-0"
          initial={{ x: "-10vw", y: "30vh", opacity: 0 }}
          animate={{ x: "100vw", y: "-120vh", opacity: [0, 0.4, 0.4, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <div className="flex items-center -rotate-[45deg] drop-shadow-[0_0_10px_rgba(9,48,102,0.5)]">
            <div className="h-[1px] w-[50vw] bg-gradient-to-r from-transparent via-[#030816] to-[#093066]" />
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-[#093066] -ml-3">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
