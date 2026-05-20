import type { ApiDocParam } from "@/lib/api-docs/api-docs-data";
import { usePreferences } from "@/components/preferences/PreferencesProvider";

export function ApiParamsTable({
  title,
  params,
}: {
  title: string;
  params: ApiDocParam[];
}) {
  const { language, t } = usePreferences();

  if (params.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/8 px-5 py-4">
        <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/55">{title}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/6 text-left text-sm">
          <thead>
            <tr className="text-white/45">
              <th className="px-5 py-3 font-medium">{t("name")}</th>
              <th className="px-5 py-3 font-medium">{t("type")}</th>
              <th className="px-5 py-3 font-medium">{t("required")}</th>
              <th className="px-5 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {params.map((param) => (
              <tr key={`${title}-${param.name}`} className="align-top">
                <td className="px-5 py-4 font-mono text-cyan-200">{param.name}</td>
                <td className="px-5 py-4 text-amber-200">{param.type}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                      param.required
                        ? "bg-rose-500/15 text-rose-200"
                        : "bg-white/8 text-white/55"
                    }`}
                  >
                    {param.required ? (language === "FR" ? "Oui" : "Yes") : t("optional")}
                  </span>
                </td>
                <td className="px-5 py-4 text-white/72">
                  <p>{param.description}</p>
                  {param.example ? (
                    <p className="mt-2 font-mono text-xs text-white/40">
                      {language === "FR" ? "Exemple" : "Example"}: {param.example}
                    </p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
