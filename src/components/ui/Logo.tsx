import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <span className="font-sans text-xl font-bold tracking-tight text-white">
        Cs-Stonks
      </span>
    </Link>
  );
}
