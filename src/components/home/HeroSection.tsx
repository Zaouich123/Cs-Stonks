"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/Button";

export function HeroSection() {
  return (
    <section className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 text-center md:px-12 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4da3ff] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4da3ff]"></span>
          </span>
          Live Market Tracking
        </div>

        <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4da3ff] to-[#093066]">CS2 Market</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-[#8b9bb4] sm:text-xl leading-relaxed">
          The premium platform for tracking CS2 skin prices, analyzing market trends, and finding the best investment opportunities in real-time.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button variant="primary" size="lg" className="w-full sm:w-auto">
            Explore Markets
          </Button>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto group">
            View Analytics
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
    </section>
  );
}
