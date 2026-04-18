import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/5 p-1 backdrop-blur-md border border-white/10 shadow-[0_0_15px_rgba(9,48,102,0.5)]">
        <Image
          src="/Logo.webp"
          alt="Cs-Stonks Logo"
          fill
          className="object-contain"
        />
      </div>
      <span className="font-sans text-xl font-bold tracking-tight text-white">
        Cs-Stonks
      </span>
    </Link>
  );
}
