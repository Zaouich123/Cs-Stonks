"use client";

import * as React from "react";

import { cn } from "@/components/ui/Button";

function renderJsonTokens(line: string, lineIndex: number) {
  const tokens: React.ReactNode[] = [];
  const regex =
    /"(\\.|[^"\\])*"(?=\s*:)?|"(\\.|[^"\\])*"|true|false|null|-?\d+(?:\.\d+)?|[{}\[\],:]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(
        <span key={`${lineIndex}-plain-${lastIndex}`} className="text-white/75">
          {line.slice(lastIndex, match.index)}
        </span>,
      );
    }

    const value = match[0];
    const nextChar = line.slice(regex.lastIndex).trimStart()[0];
    const isKey = value.startsWith('"') && nextChar === ":";
    const className = value === "true" || value === "false"
      ? "text-violet-300"
      : value === "null"
        ? "text-white/40"
        : /^[{}\[\],:]$/.test(value)
          ? "text-white/35"
          : /^-?\d/.test(value)
            ? "text-amber-300"
            : isKey
              ? "text-cyan-300"
              : "text-emerald-300";

    tokens.push(
      <span key={`${lineIndex}-token-${match.index}`} className={className}>
        {value}
      </span>,
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push(
      <span key={`${lineIndex}-tail-${lastIndex}`} className="text-white/75">
        {line.slice(lastIndex)}
      </span>,
    );
  }

  return tokens;
}

function renderShellTokens(line: string, lineIndex: number) {
  const parts = line.split(/(\s+)/);

  return parts.map((part, tokenIndex) => {
    let className = "text-white/80";

    if (part === "curl") {
      className = "text-cyan-300";
    } else if (part.startsWith("-")) {
      className = "text-amber-300";
    } else if (part.startsWith("http://") || part.startsWith("https://") || part.startsWith('"http')) {
      className = "text-emerald-300";
    } else if (/^GET$|^POST$|^PATCH$|^PUT$|^DELETE$/.test(part.replace(/"/g, ""))) {
      className = "text-violet-300";
    }

    return (
      <span key={`${lineIndex}-${tokenIndex}`} className={className}>
        {part}
      </span>
    );
  });
}

export function ApiCodeBlock({
  code,
  language = "json",
  className,
}: {
  code: string;
  language?: "json" | "bash";
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const lines = code.trim().split("\n");

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#050b18] shadow-[0_24px_60px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-[11px] uppercase tracking-[0.24em] text-white/45">{language}</span>
        </div>
        <button
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/70 transition hover:border-[#4da3ff]/40 hover:text-white"
          onClick={handleCopy}
          type="button"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <pre className="min-w-full px-0 py-4 text-sm leading-7">
          {lines.map((line, index) => (
            <div key={`${index}-${line}`} className="grid grid-cols-[3rem_minmax(0,1fr)] px-4">
              <span className="select-none pr-4 text-right text-white/20">{index + 1}</span>
              <code className="font-mono">
                {language === "json" ? renderJsonTokens(line, index) : renderShellTokens(line, index)}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
