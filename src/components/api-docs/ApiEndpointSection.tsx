import { ApiMethodBadge } from "@/components/api-docs/ApiMethodBadge";
import { ApiParamsTable } from "@/components/api-docs/ApiParamsTable";
import { ApiRequestExample } from "@/components/api-docs/ApiRequestExample";
import { ApiResponseExample } from "@/components/api-docs/ApiResponseExample";
import { ApiStatusBadge } from "@/components/api-docs/ApiStatusBadge";
import type { ApiDocEndpoint } from "@/lib/api-docs/api-docs-data";

export function ApiEndpointSection({
  endpoint,
}: {
  endpoint: ApiDocEndpoint;
}) {
  return (
    <section
      className="scroll-mt-28 rounded-[2rem] border border-white/10 bg-[#071123]/78 p-6 shadow-[0_22px_65px_rgba(0,0,0,0.34)] md:p-8"
      id={endpoint.id}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#7eb7ff]">{endpoint.category.replace("-", " ")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ApiMethodBadge method={endpoint.method} />
              <code className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80">
                {endpoint.path}
              </code>
            </div>
            <h3 className="mt-5 text-2xl font-semibold text-white">{endpoint.name}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/64">{endpoint.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {endpoint.statusCodes.map((status) => (
              <ApiStatusBadge code={status.code} key={`${endpoint.id}-${status.code}`} label={status.label} />
            ))}
          </div>
        </div>

        {endpoint.notes?.length ? (
          <div className="rounded-[1.5rem] border border-[#4da3ff]/15 bg-[#093066]/18 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8cc4ff]">Implementation notes</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/68">
              {endpoint.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-4">
          <ApiParamsTable params={endpoint.pathParams ?? []} title="Path parameters" />
          <ApiParamsTable params={endpoint.queryParams ?? []} title="Query parameters" />
          <ApiParamsTable params={endpoint.bodyParams ?? []} title="JSON body" />
        </div>

        <ApiRequestExample code={endpoint.requestExample} language={endpoint.requestLanguage ?? "bash"} />

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Responses</p>
          </div>
          <div className="space-y-4">
            {endpoint.responses.map((response) => (
              <ApiResponseExample
                body={response.body}
                description={response.description}
                key={`${endpoint.id}-${response.status}-${response.title}`}
                status={response.status}
                title={response.title}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
