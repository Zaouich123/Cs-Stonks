const actionCards = [
  {
    description:
      "Table Item avec variantes vendables uniques, types filtrables, phase, StatTrak, Souvenir et metadonnees exploitables.",
    title: "Item Catalog",
  },
  {
    description:
      "LatestPrice conserve l'etat courant par item et par market, tandis que Market centralise steam, skinport, csfloat et futures sources.",
    title: "Markets + LatestPrice",
  },
  {
    description:
      "DailySnapshot fige les LatestPrice a 02:05 Europe/Paris sans full fetch, avec audit complet dans SyncRun.",
    title: "Snapshots + Audit",
  },
];

const internalEndpoints = [
  {
    method: "POST",
    path: "/api/internal/sync/catalog",
    purpose: "Synchronise le catalogue via JsonCatalogProvider ou MockCatalogProvider.",
  },
  {
    method: "POST",
    path: "/api/internal/sync/prices",
    purpose: "Met a jour LatestPrice et Market a partir des fixtures json/mock multi-market.",
  },
  {
    method: "GET",
    path: "/api/internal/pricing/latest",
    purpose: "Affiche les derniers prix persistes par item et par market pour verification.",
  },
  {
    method: "POST",
    path: "/api/internal/snapshots/daily",
    purpose: "Fige l'etat courant de LatestPrice dans DailySnapshot a une heure logique donnee.",
  },
  {
    method: "GET",
    path: "/api/internal/health",
    purpose: "Retourne l'etat du service, les compteurs data et la configuration cron recommandee.",
  },
];

const runbook = [
  "npm run prisma:generate",
  "npm run dev",
  'curl http://localhost:3000/api/internal/health',
  'curl -X POST http://localhost:3000/api/internal/sync/catalog -H "Content-Type: application/json" -d "{\\"source\\":\\"json\\"}"',
  'curl -X POST http://localhost:3000/api/internal/sync/prices -H "Content-Type: application/json" -d "{\\"source\\":\\"json\\"}"',
  'curl http://localhost:3000/api/internal/pricing/latest',
  'curl -X POST http://localhost:3000/api/internal/snapshots/daily -H "Content-Type: application/json" -d "{\\"snapshotHour\\":\\"02:05\\",\\"timeZone\\":\\"Europe/Paris\\"}"',
  "npm run job:catalog",
  "npm run job:prices",
  "npm run job:snapshot",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
      <section className="overflow-hidden rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-8 shadow-[0_30px_80px_rgba(22,32,42,0.08)] backdrop-blur md:p-10">
        <div className="mb-6 inline-flex rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-accent-soft)] px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--color-highlight)]">
          Sprint backend data layer
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-[color:var(--color-ink)] sm:text-5xl">
              V1 data platform prete pour catalogue, multi-market latest prices et snapshots journaliers.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[color:var(--color-muted)]">
              Le sprint aligne Item, Market, LatestPrice, DailySnapshot et SyncRun
              dans Prisma. Les routes internes restent minces, les jobs sont appelables
              manuellement, et le scheduler documente la cadence cible sans forcer une
              infra complexe.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-card-strong)] p-6">
            <div className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
              Runbook express
            </div>
            <div className="space-y-3">
              {runbook.map((command) => (
                <pre
                  key={command}
                  className="overflow-x-auto rounded-2xl bg-[#132127] px-4 py-3 font-mono text-sm text-[#f8f2e8]"
                >
                  {command}
                </pre>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {actionCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6 shadow-[0_18px_40px_rgba(22,32,42,0.06)]"
          >
            <div className="mb-4 h-2 w-16 rounded-full bg-[color:var(--color-accent)]" />
            <h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em]">
              {card.title}
            </h2>
            <p className="text-base leading-7 text-[color:var(--color-muted)]">
              {card.description}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
              Internal API
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Endpoints du sprint
            </h2>
          </div>
          <a
            className="inline-flex rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card-strong)] px-5 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5"
            href="/api/internal/health"
          >
            Ouvrir le health JSON
          </a>
        </div>

        <div className="grid gap-4">
          {internalEndpoints.map((endpoint) => (
            <article
              key={endpoint.path}
              className="grid gap-3 rounded-[1.35rem] border border-[color:var(--color-border)] bg-[color:var(--color-card-strong)] p-5 md:grid-cols-[110px_1fr_1.2fr]"
            >
              <span className="inline-flex w-fit rounded-full bg-[color:var(--color-accent-soft)] px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                {endpoint.method}
              </span>
              <code className="self-center font-mono text-sm text-[color:var(--color-ink)]">
                {endpoint.path}
              </code>
              <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                {endpoint.purpose}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
