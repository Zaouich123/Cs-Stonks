"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/Button";

export function HeroSection({ skinImageUrl }: { skinImageUrl: string }) {
  return (
    <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 pt-20 md:px-12 lg:flex-row lg:items-center">
      
      {/* Left Column: Text Content */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-start text-left lg:w-1/2"
      >


        <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Master the <br />
          <span className="aurora-text-clip py-2">
            CS2 Market
          </span>
        </h1>

        <p className="mb-10 max-w-xl text-lg text-[#8b9bb4] sm:text-xl leading-relaxed">
          The premium platform for tracking CS2 skin prices, analyzing market trends, and finding the best investment opportunities in real-time.
        </p>

        <div className="flex w-full flex-col gap-4 sm:flex-row">
          <Button variant="primary" size="lg" className="w-full sm:w-auto">
            Explore Markets
          </Button>
          <Button variant="ghost" size="lg" className="w-full sm:w-auto group">
            Access API
            <svg
              className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Button>
        </div>
      </motion.div>

      {/* Right Column: Breathing Skin Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        className="mt-16 flex justify-center lg:mt-0 lg:w-1/2 lg:justify-end"
      >
        <div className="relative flex h-[400px] w-full max-w-[500px] items-center justify-center">
          {/* Background Glow behind the skin */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="h-[60%] w-[60%] rounded-full bg-[#4da3ff] blur-[100px]"
            />
          </div>

          {/* Floating Skin Image */}
          <motion.img
            src={skinImageUrl}
            alt="AWP | Dragon Lore Example"
            className="relative z-10 w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
            animate={{
              y: [-15, 15, -15],
              rotateZ: [-2, 2, -2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>

    </section>
  );
}
