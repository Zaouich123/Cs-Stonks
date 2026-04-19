import { ApiCodeBlock } from "@/components/api-docs/ApiCodeBlock";

export function ApiRequestExample({
  code,
  language = "bash",
}: {
  code: string;
  language?: "bash" | "json";
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/8" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Request Example</p>
      </div>
      <ApiCodeBlock code={code} language={language} />
    </div>
  );
}
