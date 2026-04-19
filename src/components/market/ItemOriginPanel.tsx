"use client";

import Link from "next/link";
import { isDiscontinuedCase } from "@/lib/cases/discontinuedCases";

interface DropCase {
  collection: string | null;
  displayName: string;
  id: string;
  imageUrl: string | null;
  steamImageUrl: string | null;
}

interface ItemOriginPanelProps {
  collection: string | null;
  dropCases: DropCase[];
  inferredFromFinish?: boolean;
}

export function ItemOriginPanel({
  collection,
  dropCases,
  inferredFromFinish = false,
}: ItemOriginPanelProps) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,#08111f_0%,#050b16_100%)] p-6 md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4da3ff]">Origin</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Drop cases</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Which cases are most likely to drop this item.
            </p>
          </div>
          {inferredFromFinish ? (
            <span className="rounded-full border border-[#4da3ff]/20 bg-[#093066]/25 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#9cc9ff]">
              Finish inferred
            </span>
          ) : null}
        </div>

        {dropCases.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dropCases.map((dropCase) => {
              const imageUrl = dropCase.imageUrl ?? dropCase.steamImageUrl;
              const discontinued = isDiscontinuedCase(dropCase.displayName);

              return (
                <Link
                  key={dropCase.id}
                  href={`/market/${dropCase.id}`}
                  className="group relative rounded-xl border border-white/8 bg-[linear-gradient(180deg,#0d182a_0%,#07101e_100%)] p-5 transition-all hover:border-white/15 hover:bg-white/[0.04]"
                >
                  {discontinued ? (
                    <span className="absolute right-3 top-3 rounded-full border border-rose-400/20 bg-rose-500/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300">
                      Discontinued
                    </span>
                  ) : (
                    <span className="absolute right-3 top-3 rounded-full border border-emerald-400/20 bg-emerald-500/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      Active
                    </span>
                  )}

                  <div className="flex flex-col items-center gap-4 pt-4 text-center">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] p-3">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={dropCase.displayName}
                          className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-[1.08]"
                        />
                      ) : (
                        <span className="text-[10px] uppercase tracking-[0.18em] text-white/25">No image</span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-white group-hover:text-[#4da3ff] transition-colors">
                      {dropCase.displayName}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm leading-6 text-white/45">
            No drop case has been mapped for this item yet.
          </p>
        )}
      </div>
    </div>
  );
}
