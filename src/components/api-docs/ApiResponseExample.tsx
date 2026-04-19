import { ApiCodeBlock } from "@/components/api-docs/ApiCodeBlock";
import { ApiStatusBadge } from "@/components/api-docs/ApiStatusBadge";

export function ApiResponseExample({
  status,
  title,
  description,
  body,
}: {
  status: number;
  title: string;
  description: string;
  body: unknown;
}) {
  return (
    <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-white">{title}</h4>
          <p className="mt-1 max-w-2xl text-sm text-white/62">{description}</p>
        </div>
        <ApiStatusBadge code={status} />
      </div>
      <ApiCodeBlock code={JSON.stringify(body, null, 2)} language="json" />
    </div>
  );
}
