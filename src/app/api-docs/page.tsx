"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Navbar } from "@/components/layout/Navbar";
import { ApiCodeBlock } from "@/components/api-docs/ApiCodeBlock";
import { ApiDocsHeader } from "@/components/api-docs/ApiDocsHeader";
import { ApiDocsSidebar } from "@/components/api-docs/ApiDocsSidebar";
import { ApiEndpointSection } from "@/components/api-docs/ApiEndpointSection";
import { ApiStatusBadge } from "@/components/api-docs/ApiStatusBadge";
import { ApiMethodBadge } from "@/components/api-docs/ApiMethodBadge";
import {
  apiDocConventions,
  apiDocEndpoints,
  apiDocSections,
  apiDocStatusReference,
} from "@/lib/api-docs/api-docs-data";

const SHOW_DOCS_HERO = false;

function OverviewPanel() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-[#071123]/72 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.34)] md:p-8">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#7eb7ff]">{apiDocSections[0]?.eyebrow}</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">{apiDocSections[0]?.title}</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/66">{apiDocSections[0]?.summary}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">What this API covers</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/68">
              <li>Public catalog search backed by Postgres.</li>
              <li>Latest market prices enriched with Skinport listing and sales signals.</li>
              <li>Historical snapshots used by analytics charts.</li>
              <li>Internal sync utilities for catalog, pricing, and operations.</li>
            </ul>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Response contract</p>
            <p className="mt-4 text-sm leading-6 text-white/68">
              Every documented route returns a stable JSON envelope so frontend screens and automation can share the
              same parsing strategy.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ApiStatusBadge code={200} label="Success" />
              <ApiStatusBadge code={400} label="Validation" />
              <ApiStatusBadge code={404} label="Missing" />
              <ApiStatusBadge code={500} label="Runtime" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[#071123]/72 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.34)] md:p-8">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#7eb7ff]">{apiDocSections[1]?.eyebrow}</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">{apiDocSections[1]?.title}</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/66">{apiDocSections[1]?.summary}</p>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Base URL</p>
              <p className="mt-2 text-lg font-medium text-white">{apiDocConventions.baseUrl}</p>
              <p className="mt-2 text-sm leading-6 text-white/62">
                Examples use `http://localhost:3000`, but deployed environments follow the same route paths on the
                current origin.
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Headers</p>
              <div className="mt-3 space-y-3">
                {apiDocConventions.headers.map((header) => (
                  <div key={header.name} className="rounded-2xl border border-white/8 bg-black/10 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <code className="text-sm text-cyan-200">{header.name}</code>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/65">
                        {header.value}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/58">{header.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ApiCodeBlock code={JSON.stringify(apiDocConventions.responseEnvelope, null, 2)} language="json" />
        </div>
      </section>
    </div>
  );
}

function EndpointCategoryPanel({
  categoryId,
}: {
  categoryId: "public-endpoints" | "internal-endpoints";
}) {
  const section = apiDocSections.find((item) => item.id === categoryId);
  const endpoints = apiDocEndpoints.filter((endpoint) => endpoint.category === categoryId);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-[#071123]/72 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.34)] md:p-8">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#7eb7ff]">{section?.eyebrow}</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">{section?.title}</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/66">{section?.summary}</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {endpoints.map((endpoint) => (
          <article
            key={endpoint.id}
            className="rounded-[1.75rem] border border-white/10 bg-[#071123]/78 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <div className="flex flex-wrap items-center gap-3">
              <ApiMethodBadge method={endpoint.method} />
              <code className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/72">
                {endpoint.path}
              </code>
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">{endpoint.name}</h3>
            <p className="mt-3 text-sm leading-7 text-white/64">{endpoint.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {endpoint.statusCodes.map((status) => (
                <ApiStatusBadge code={status.code} key={`${endpoint.id}-${status.code}`} label={status.label} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function StatusCodesPanel() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#071123]/72 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.34)] md:p-8">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[#7eb7ff]">{apiDocSections[4]?.eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold text-white">{apiDocSections[4]?.title}</h2>
      <p className="mt-4 max-w-3xl text-base leading-8 text-white/66">{apiDocSections[4]?.summary}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {apiDocStatusReference.map((status) => (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5" key={`${status.code}-${status.label}`}>
            <ApiStatusBadge code={status.code} label={status.label} />
            <p className="mt-4 text-sm leading-7 text-white/68">{status.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivePanel({
  activeId,
}: {
  activeId: string;
}) {
  const endpoint = apiDocEndpoints.find((item) => item.id === activeId);

  if (endpoint) {
    return <ApiEndpointSection endpoint={endpoint} />;
  }

  if (activeId === "public-endpoints" || activeId === "internal-endpoints") {
    return <EndpointCategoryPanel categoryId={activeId} />;
  }

  if (activeId === "status-codes") {
    return <StatusCodesPanel />;
  }

  return <OverviewPanel />;
}

export default function ApiDocsPage() {
  const [activeId, setActiveId] = React.useState("introduction");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-surface)] pb-28 text-white selection:bg-[#4da3ff]/30">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-28 h-80 w-80 rounded-full bg-[#093066]/30 blur-3xl" />
        <div className="absolute right-[-10rem] top-[28rem] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(77,163,255,0.12),transparent_48%)]" />
      </div>

      <Navbar />

      <main className="relative z-10 mx-auto flex w-full max-w-[96rem] flex-col gap-8 px-6 pt-24 md:px-10 md:pt-32 xl:px-12">
        {SHOW_DOCS_HERO ? <ApiDocsHeader /> : null}

        <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
          <ApiDocsSidebar activeId={activeId} onSelect={setActiveId} />

          <div className="min-w-0 rounded-[2rem] border border-white/10 bg-[#050d1b]/55 p-2 shadow-[0_28px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl lg:sticky lg:top-24 lg:h-[calc(100vh-7.5rem)]">
            <div className="h-full overflow-y-auto rounded-[1.5rem] pr-1 lg:pr-2">
            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                initial={{ opacity: 0, x: 18, filter: "blur(6px)" }}
                key={activeId}
                transition={{ duration: 0.24, ease: "easeOut" }}
                exit={{ opacity: 0, x: -18, filter: "blur(6px)" }}
              >
                <ActivePanel activeId={activeId} />
              </motion.div>
            </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
