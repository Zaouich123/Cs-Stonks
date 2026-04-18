"use client";

import { useEffect, useState } from "react";
import { Logo } from "../ui/Logo";
import { Button } from "../ui/Button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-6 py-4 md:px-12 ${
        scrolled
          ? "bg-[#030816]/80 backdrop-blur-lg border-b border-white/5 py-3 shadow-lg"
          : "bg-transparent py-6"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Markets
          </a>
          <a
            href="#"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Portfolio
          </a>
          <a
            href="#"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Analytics
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden md:inline-flex">
            Log in
          </Button>
          <Button variant="primary">Get Started</Button>
        </div>
      </div>
    </header>
  );
}
