export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiDocParam {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  example?: string;
}

export interface ApiDocResponseExample {
  status: number;
  title: string;
  description: string;
  body: unknown;
}

export interface ApiDocEndpoint {
  id: string;
  name: string;
  method: ApiMethod;
  path: string;
  category: string;
  description: string;
  notes?: string[];
  pathParams?: ApiDocParam[];
  queryParams?: ApiDocParam[];
  bodyParams?: ApiDocParam[];
  requestExample: string;
  requestLanguage?: "bash" | "json";
  responses: ApiDocResponseExample[];
  statusCodes: Array<{ code: number; label: string }>;
}

export interface ApiDocSection {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
}

export const apiDocSections: ApiDocSection[] = [
  {
    id: "introduction",
    title: "Overview",
    eyebrow: "Introduction",
    summary:
      "CS-Stonks exposes item discovery, latest pricing, historical snapshots, and internal ingestion utilities through a compact JSON API.",
  },
  {
    id: "conventions",
    title: "Base URL & Conventions",
    eyebrow: "Conventions",
    summary:
      "Responses use a consistent wrapper with `ok`, `data`, and `error`. Public routes are read-only, while internal routes are intended for ingestion and operations.",
  },
  {
    id: "public-endpoints",
    title: "Public API",
    eyebrow: "Read API",
    summary:
      "Use the public routes to search items, inspect a single item, read current prices, and build charts from historical snapshots.",
  },
  {
    id: "internal-endpoints",
    title: "Internal Operations",
    eyebrow: "Ingestion API",
    summary:
      "Internal routes trigger catalog syncs, price ingestions, snapshots, and health checks for jobs and infrastructure.",
  },
  {
    id: "status-codes",
    title: "HTTP Status Codes",
    eyebrow: "Responses",
    summary:
      "Successful routes return green success codes, while validation and application errors are surfaced with structured red error payloads.",
  },
];

export const apiDocStatusReference = [
  {
    code: 200,
    label: "OK",
    description: "The request succeeded and returned a valid JSON payload.",
  },
  {
    code: 400,
    label: "Bad Request",
    description: "The request body or query string failed validation or contained invalid JSON.",
  },
  {
    code: 404,
    label: "Not Found",
    description: "The requested item or resource does not exist.",
  },
  {
    code: 500,
    label: "Internal Server Error",
    description: "An unexpected error occurred inside the application or a provider dependency failed.",
  },
];

export const apiDocEndpoints: ApiDocEndpoint[] = [
  {
    id: "get-items",
    name: "List items",
    method: "GET",
    path: "/api/items",
    category: "public-endpoints",
    description:
      "Returns paginated catalog items with lightweight market metadata, including the current lowest known price from your own database.",
    queryParams: [
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Page size, clamped between 1 and 50.",
        example: "20",
      },
      {
        name: "page",
        type: "number",
        required: false,
        description: "1-based page index.",
        example: "1",
      },
      {
        name: "query",
        type: "string",
        required: false,
        description: "Full-text search matched against normalized item search text.",
        example: "dragon lore",
      },
      {
        name: "itemType",
        type: "ItemType",
        required: false,
        description: "Optional enum filter such as `SKIN`, `KNIFE`, `CASE`, or `STICKER`.",
        example: "SKIN",
      },
      {
        name: "sort",
        type: "string",
        required: false,
        description: "Sort mode: `displayName_asc`, `displayName_desc`, or `createdAt_desc`.",
        example: "displayName_asc",
      },
    ],
    requestExample:
      "curl -X GET \"http://localhost:3000/api/items?limit=20&page=1&query=redline&itemType=SKIN&sort=displayName_asc\"",
    requestLanguage: "bash",
    responses: [
      {
        status: 200,
        title: "Paginated item list",
        description: "The catalog page and market table use this payload to render real data from Postgres.",
        body: {
          ok: true,
          data: {
            filters: {
              itemType: "SKIN",
              query: "redline",
              sort: "displayName_asc",
            },
            items: [
              {
                id: "cmo4x9la100btls3879qz8wsh",
                displayName: "AK-47 | Redline (Field-Tested)",
                marketHashName: "AK-47 | Redline (Field-Tested)",
                itemType: "SKIN",
                rarity: "Classified",
                slug: "ak-47-redline-field-tested",
                latestPriceCount: 1,
                lowestCurrentPrice: 24.95,
                lowestCurrentPriceCurrency: "USD",
              },
            ],
            pagination: {
              page: 1,
              limit: 20,
              totalItems: 1,
              totalPages: 1,
            },
          },
        },
      },
      {
        status: 400,
        title: "Validation error",
        description: "Returned when query params fail Zod validation.",
        body: {
          ok: false,
          error: {
            message: "Request payload validation failed.",
            details: {
              fieldErrors: {
                limit: ["Too big: expected number to be <=50"],
              },
            },
          },
        },
      },
    ],
    statusCodes: [
      { code: 200, label: "OK" },
      { code: 400, label: "Bad Request" },
      { code: 500, label: "Internal Server Error" },
    ],
  },
  {
    id: "get-item",
    name: "Get item by id",
    method: "GET",
    path: "/api/items/:itemId",
    category: "public-endpoints",
    description:
      "Returns the canonical item record used across the product, including naming, variant metadata, and presentation fields.",
    pathParams: [
      {
        name: "itemId",
        type: "string",
        required: true,
        description: "The internal item identifier stored in Postgres.",
        example: "cmo4x9la100btls3879qz8wsh",
      },
    ],
    requestExample:
      "curl -X GET \"http://localhost:3000/api/items/cmo4x9la100btls3879qz8wsh\"",
    requestLanguage: "bash",
    responses: [
      {
        status: 200,
        title: "Single item",
        description: "Use this route when loading a dedicated item detail page.",
        body: {
          ok: true,
          data: {
            id: "cmo4x9la100btls3879qz8wsh",
            displayName: "AK-47 | Redline (Field-Tested)",
            marketHashName: "AK-47 | Redline (Field-Tested)",
            variantKey: "AK-47 | Redline (Field-Tested)",
            itemType: "SKIN",
            weapon: "AK-47",
            skinName: "Redline",
            stattrak: false,
            souvenir: false,
          },
        },
      },
      {
        status: 404,
        title: "Missing item",
        description: "Returned when the item id is unknown.",
        body: {
          ok: false,
          error: {
            message: "Item not found.",
            details: {
              itemId: "missing-id",
            },
          },
        },
      },
    ],
    statusCodes: [
      { code: 200, label: "OK" },
      { code: 404, label: "Not Found" },
      { code: 500, label: "Internal Server Error" },
    ],
  },
  {
    id: "get-item-latest-prices",
    name: "Get latest prices for an item",
    method: "GET",
    path: "/api/items/:itemId/latest-prices",
    category: "public-endpoints",
    description:
      "Returns the latest stored market rows for a single item, including listing metrics, volume windows, and source URLs.",
    pathParams: [
      {
        name: "itemId",
        type: "string",
        required: true,
        description: "Internal item identifier.",
      },
    ],
    queryParams: [
      {
        name: "sort",
        type: "string",
        required: false,
        description: "Sort mode: `market_asc`, `market_desc`, `price_asc`, `price_desc`, or `fetchedAt_desc`.",
        example: "market_asc",
      },
    ],
    requestExample:
      "curl -X GET \"http://localhost:3000/api/items/cmo4x9la100btls3879qz8wsh/latest-prices?sort=market_asc\"",
    requestLanguage: "bash",
    responses: [
      {
        status: 200,
        title: "Current market rows",
        description: "This payload is ideal for market cards, compare views, and summary badges.",
        body: {
          ok: true,
          data: {
            count: 1,
            sort: "market_asc",
            prices: [
              {
                marketSlug: "skinport",
                marketName: "Skinport",
                price: 24.95,
                minPrice: 24.95,
                medianPrice: 25.1,
                meanPrice: 25.34,
                maxPrice: 26.12,
                suggestedPrice: 25.22,
                quantity: 14,
                sales24hVolume: 3,
                sales7dVolume: 18,
                sales30dVolume: 91,
                sales90dVolume: 310,
                sourceItemUrl: "https://skinport.com/item/ak-redline",
                sourceMarketUrl: "https://skinport.com/market/ak-redline",
              },
            ],
          },
        },
      },
      {
        status: 404,
        title: "Missing item",
        description: "Returned if the item id is invalid before prices are queried.",
        body: {
          ok: false,
          error: {
            message: "Item not found.",
            details: {
              itemId: "missing-id",
            },
          },
        },
      },
    ],
    statusCodes: [
      { code: 200, label: "OK" },
      { code: 404, label: "Not Found" },
      { code: 500, label: "Internal Server Error" },
    ],
  },
  {
    id: "get-item-history",
    name: "Get item history",
    method: "GET",
    path: "/api/items/:itemId/history",
    category: "public-endpoints",
    description:
      "Returns historical daily snapshots for a single item, optionally filtered by market and date range for charts and analysis views.",
    pathParams: [
      {
        name: "itemId",
        type: "string",
        required: true,
        description: "Internal item identifier.",
      },
    ],
    queryParams: [
      {
        name: "from",
        type: "ISO date",
        description: "Lower bound for `snapshotDate`.",
        example: "2026-01-01",
      },
      {
        name: "to",
        type: "ISO date",
        description: "Upper bound for `snapshotDate`.",
        example: "2026-04-19",
      },
      {
        name: "market",
        type: "string",
        description: "Optional market slug such as `skinport`.",
        example: "skinport",
      },
      {
        name: "sort",
        type: "string",
        description: "Either `asc` or `desc`.",
        example: "asc",
      },
    ],
    requestExample:
      "curl -X GET \"http://localhost:3000/api/items/cmo4x9la100btls3879qz8wsh/history?from=2026-01-01&to=2026-04-19&market=skinport&sort=asc\"",
    requestLanguage: "bash",
    responses: [
      {
        status: 200,
        title: "Snapshot series",
        description: "Each row maps directly to a stored `DailySnapshot` record in Postgres.",
        body: {
          ok: true,
          data: {
            count: 2,
            filters: {
              from: "2026-01-01T00:00:00.000Z",
              to: "2026-04-19T00:00:00.000Z",
              market: "skinport",
              sort: "asc",
            },
            series: [
              {
                date: "2026-04-18",
                hour: "02:05",
                marketSlug: "skinport",
                price: 24.7,
                minPrice: 24.7,
                medianPrice: 24.7,
                sales90dMin: 19.1,
                sales90dMedian: 23.3,
                sales90dVolume: 610,
              },
              {
                date: "2026-04-19",
                hour: "02:05",
                marketSlug: "skinport",
                price: 24.95,
                minPrice: 24.95,
                medianPrice: 25.1,
                sales90dMin: 19.2,
                sales90dMedian: 23.5,
                sales90dVolume: 614,
              },
            ],
          },
        },
      },
      {
        status: 400,
        title: "Invalid date range",
        description: "Bad date values are rejected during query parsing.",
        body: {
          ok: false,
          error: {
            message: "Request payload validation failed.",
          },
        },
      },
    ],
    statusCodes: [
      { code: 200, label: "OK" },
      { code: 400, label: "Bad Request" },
      { code: 404, label: "Not Found" },
      { code: 500, label: "Internal Server Error" },
    ],
  },
  {
    id: "post-sync-catalog",
    name: "Run catalog sync",
    method: "POST",
    path: "/api/internal/sync/catalog",
    category: "internal-endpoints",
    description:
      "Triggers a catalog ingestion against the configured provider and updates the local item catalog.",
    bodyParams: [
      {
        name: "source",
        type: "\"bymykel\" | \"json\" | \"local_fallback\" | \"mock\"",
        description: "Optional provider override for the current request.",
        example: "bymykel",
      },
    ],
    requestExample: JSON.stringify(
      {
        source: "bymykel",
      },
      null,
      2,
    ),
    requestLanguage: "json",
    responses: [
      {
        status: 200,
        title: "Catalog sync result",
        description: "Returns sync counts and metadata after catalog reconciliation.",
        body: {
          ok: true,
          data: {
            provider: "bymykel_catalog_provider",
            status: "SUCCESS",
            created: 120,
            updated: 27818,
            deactivated: 0,
            totalPersisted: 27938,
          },
        },
      },
      {
        status: 400,
        title: "Body validation error",
        description: "Returned if an unsupported catalog provider is passed.",
        body: {
          ok: false,
          error: {
            message: "Request payload validation failed.",
          },
        },
      },
    ],
    statusCodes: [
      { code: 200, label: "OK" },
      { code: 400, label: "Bad Request" },
      { code: 500, label: "Internal Server Error" },
    ],
  },
  {
    id: "post-sync-prices",
    name: "Run generic price sync",
    method: "POST",
    path: "/api/internal/sync/prices",
    category: "internal-endpoints",
    description:
      "Triggers the configured pricing provider and writes the latest prices into `LatestPrice`.",
    bodyParams: [
      {
        name: "source",
        type: "\"json\" | \"mock\" | \"real\" | \"skinport\"",
        description: "Optional provider override.",
        example: "skinport",
      },
    ],
    requestExample: JSON.stringify(
      {
        source: "skinport",
      },
      null,
      2,
    ),
    requestLanguage: "json",
    responses: [
      {
        status: 200,
        title: "Latest price sync result",
        description: "Includes persistence counts plus provider warning summaries.",
        body: {
          ok: true,
          data: {
            provider: "skinport_items_provider",
            status: "PARTIAL",
            totalPersisted: 15419,
            totalIgnored: 12519,
            providerItemsReceived: 19495,
            providerHistoryRecordsReceived: 32703,
            providerWarningCodeCounts: {
              NO_USABLE_PRICE: 8,
              ITEM_NOT_FOUND: 12511,
            },
          },
        },
      },
    ],
    statusCodes: [
      { code: 200, label: "OK" },
      { code: 400, label: "Bad Request" },
      { code: 500, label: "Internal Server Error" },
    ],
  },
  {
    id: "post-sync-skinport",
    name: "Run Skinport ingestion",
    method: "POST",
    path: "/api/internal/sync/skinport",
    category: "internal-endpoints",
    description:
      "Runs the dedicated Skinport ingestion pipeline with catalog matching, listing metrics, and sales history enrichment.",
    notes: [
      "No request body is required.",
      "This route is the preferred path when refreshing Skinport data specifically.",
    ],
    requestExample:
      "curl -X POST \"http://localhost:3000/api/internal/sync/skinport\"",
    requestLanguage: "bash",
    responses: [
      {
        status: 200,
        title: "Skinport sync result",
        description: "Shows exact and canonical matches plus ingestion totals.",
        body: {
          ok: true,
          data: {
            provider: "skinport_items_provider",
            totalAttemptedTargets: 15427,
            totalPersisted: 15419,
            matchedExactCount: 15423,
            matchedCanonicalCount: 4,
            providerItemsReceived: 19495,
            providerHistoryRecordsReceived: 32703,
          },
        },
      },
    ],
    statusCodes: [
      { code: 200, label: "OK" },
      { code: 500, label: "Internal Server Error" },
    ],
  },
  {
    id: "post-daily-snapshot",
    name: "Create daily snapshot",
    method: "POST",
    path: "/api/internal/snapshots/daily",
    category: "internal-endpoints",
    description:
      "Copies the current `LatestPrice` state into `DailySnapshot`, preserving chart-ready data for each item and market pair.",
    bodyParams: [
      {
        name: "snapshotDate",
        type: "ISO date",
        description: "Optional override for the snapshot date.",
        example: "2026-04-19",
      },
      {
        name: "snapshotHour",
        type: "HH:mm",
        description: "Optional display hour written to the snapshot rows.",
        example: "02:05",
      },
      {
        name: "timeZone",
        type: "string",
        description: "IANA timezone used when computing the start of day.",
        example: "Europe/Paris",
      },
      {
        name: "triggerSource",
        type: "string",
        description: "Optional human-readable source label for the sync run.",
        example: "manual_backfill",
      },
    ],
    requestExample: JSON.stringify(
      {
        snapshotDate: "2026-04-19",
        snapshotHour: "02:05",
        timeZone: "Europe/Paris",
        triggerSource: "manual_backfill",
      },
      null,
      2,
    ),
    requestLanguage: "json",
    responses: [
      {
        status: 200,
        title: "Snapshot write result",
        description: "Reports whether an existing snapshot window was replaced or extended.",
        body: {
          ok: true,
          data: {
            status: "SUCCESS",
            rowsWritten: 15429,
            snapshotDate: "2026-04-19",
            snapshotHour: "02:05",
            replacedExisting: true,
          },
        },
      },
    ],
    statusCodes: [
      { code: 200, label: "OK" },
      { code: 400, label: "Bad Request" },
      { code: 500, label: "Internal Server Error" },
    ],
  },
  {
    id: "get-health",
    name: "Read internal health",
    method: "GET",
    path: "/api/internal/health",
    category: "internal-endpoints",
    description:
      "Returns operational counts, cron settings, and provider configuration hints for quick diagnostics.",
    requestExample:
      "curl -X GET \"http://localhost:3000/api/internal/health\"",
    requestLanguage: "bash",
    responses: [
      {
        status: 200,
        title: "Operational health payload",
        description: "Useful for dashboards, smoke tests, and deployment verification.",
        body: {
          ok: true,
          data: {
            status: "ok",
            counts: {
              items: 27938,
              markets: 1,
              latestPrices: 15429,
              dailySnapshots: 15429,
              syncRuns: 42,
            },
            env: {
              internalCronEnabled: false,
              priceProvider: "skinport",
            },
          },
        },
      },
    ],
    statusCodes: [
      { code: 200, label: "OK" },
      { code: 500, label: "Internal Server Error" },
    ],
  },
];

export const apiDocNavigation = [
  ...apiDocSections.map((section) => ({
    id: section.id,
    label: section.title,
    kind: "section" as const,
  })),
  ...apiDocEndpoints.map((endpoint) => ({
    id: endpoint.id,
    label: endpoint.name,
    kind: "endpoint" as const,
    parent: endpoint.category,
    method: endpoint.method,
  })),
];

export const apiDocConventions = {
  baseUrl: "Current origin + route path",
  contentType: "application/json",
  headers: [
    {
      name: "Content-Type",
      value: "application/json",
      description: "Required for JSON POST bodies.",
    },
    {
      name: "Accept",
      value: "application/json",
      description: "Recommended for all consumers.",
    },
  ],
  responseEnvelope: {
    success: {
      ok: true,
      data: {
        "...": "payload",
      },
    },
    error: {
      ok: false,
      error: {
        message: "Human-readable error message",
        details: {
          "...": "optional metadata",
        },
      },
    },
  },
};
