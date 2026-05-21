"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface EmptyStateProps {
  actionHref: string;
  actionLabel: string;
  description: string;
  title: string;
}

export function EmptyState({ actionHref, actionLabel, description, title }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-5">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/48">{description}</p>
      <Link
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/78 transition hover:bg-white/[0.08] hover:text-white"
        href={actionHref}
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
