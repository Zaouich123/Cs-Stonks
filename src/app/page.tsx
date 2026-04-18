const actionCards = [
  {
    description:
      "Table Item avec variantes vendables uniques, types filtrables, phase, StatTrak, Souvenir, slug et searchText pour le read side.",
    title: "Item Catalog",
  },
  {
    description:
      "LatestPrice conserve l'etat courant par item et par market, tandis que le provider real Steam injecte des donnees externes via timeout, retry et mapping dedie.",
    title: "Real Ingestion",
  },
  {
    description:
      "DailySnapshot fige les LatestPrice a 02:05 Europe/Paris sans full fetch, et les endpoints /api/items exposent lecture catalogue, latest prices et history.",
    title: "Read API + Snapshots",
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
    purpose: "Met a jour LatestPrice et Market depuis json, mock ou le provider real Steam.",
  },
  {
    method: "GET",
    path: "/api/internal/pricing/latest",
    purpose: "Affiche les derniers prix persistes par item et par market pour verification.",
  },
  {
    method: "GET",
    path: "/api/items",
    purpose: "Liste les items avec pagination, recherche simple, filtres et metadonnees prêtes pour le frontend.",
  },
  {
    method: "GET",
    path: "/api/items/:itemId",
    purpose: "Retourne le detail d'un item du catalogue avec son identite complete.",
  },
  {
    method: "GET",
    path: "/api/items/:itemId/latest-prices",
    purpose: "Expose les derniers prix courants par market pour un item donne.",
  },
  {
    method: "GET",
    path: "/api/items/:itemId/history",
    purpose: "Expose l'historique DailySnapshot d'un item sous forme de serie exploitable pour des charts.",
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
  'curl -X POST http://localhost:3000/api/internal/sync/prices -H "Content-Type: application/json" -d "{\\"source\\":\\"real\\"}"',
  'curl http://localhost:3000/api/internal/pricing/latest',
  'curl "http://localhost:3000/api/items?query=ak+redline&limit=10"',
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
              Sprint 2: ingestion reelle, API de lecture et base prete pour les futures pages item.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[color:var(--color-muted)]">
              Le projet garde la base du sprint 1, puis ajoute un provider reel Steam,
              des syncs pricing plus robustes, et les endpoints `GET /api/items`
              necessaires pour brancher un frontend de consultation sans exposer Prisma brut.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-card-strong)] p-6">
            <div className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
              Runbook sprint 2
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
              API
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Endpoints du sprint 2
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
