import { cn } from "@/components/ui/Button";

function getStatusTone(code: number) {
  if (code >= 200 && code < 300) {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }

  if (code >= 400 && code < 500) {
    return "border-orange-400/30 bg-orange-500/15 text-orange-100";
  }

  if (code >= 500) {
    return "border-rose-400/30 bg-rose-500/15 text-rose-100";
  }

  return "border-white/10 bg-white/5 text-white/70";
}

export function ApiStatusBadge({
  code,
  label,
  className,
}: {
  code: number;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold",
        getStatusTone(code),
        className,
      )}
    >
      {code}
      {label ? <span className="ml-2 text-[11px] uppercase tracking-[0.18em] opacity-80">{label}</span> : null}
    </span>
  );
}
