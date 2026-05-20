import type { ApiDocEndpoint, ApiDocSection } from "@/lib/api-docs/api-docs-data";
import type { LanguagePreference } from "@/components/preferences/PreferencesProvider";

const sectionTranslations: Record<string, Partial<ApiDocSection>> = {
  introduction: {
    title: "Vue d'ensemble",
    eyebrow: "Introduction",
    summary:
      "CS-Stonks expose la découverte d'items, les derniers prix, les snapshots historiques et les outils d'ingestion internes via une API JSON compacte.",
  },
  conventions: {
    title: "URL de base & conventions",
    eyebrow: "Conventions",
    summary:
      "Les réponses utilisent une enveloppe constante avec `ok`, `data` et `error`. Les routes publiques sont en lecture seule, les routes internes servent aux opérations d'ingestion.",
  },
  "public-endpoints": {
    title: "API publique",
    eyebrow: "API lecture",
    summary:
      "Utilise les routes publiques pour rechercher des items, lire une fiche, récupérer les prix actuels et construire des graphiques depuis les snapshots.",
  },
  "internal-endpoints": {
    title: "Opérations internes",
    eyebrow: "API ingestion",
    summary:
      "Les routes internes déclenchent les syncs catalogue, les ingestions de prix, les snapshots et les vérifications d'infrastructure.",
  },
  "status-codes": {
    title: "Codes HTTP",
    eyebrow: "Réponses",
    summary:
      "Les succès utilisent des codes verts, tandis que les erreurs de validation ou runtime remontent des payloads structurés.",
  },
};

const endpointTranslations: Record<string, Partial<ApiDocEndpoint>> = {
  "get-items": {
    name: "Lister les items",
    description:
      "Retourne les items du catalogue paginés avec les métadonnées marché, dont le prix actuel le plus bas connu dans ta propre base.",
  },
  "get-item": {
    name: "Lire un item par id",
    description:
      "Retourne l'item canonique utilisé dans le produit, avec son nommage, ses variantes et ses champs de présentation.",
  },
  "get-item-latest-prices": {
    name: "Lire les derniers prix d'un item",
    description:
      "Retourne les derniers prix connus par market pour un item, triables par marché ou par prix.",
  },
  "get-item-history": {
    name: "Lire l'historique d'un item",
    description:
      "Retourne les snapshots historiques d'un item pour alimenter les graphiques Analytics et les fiches market.",
  },
  "post-sync-catalog": {
    name: "Lancer la sync catalogue",
    description:
      "Déclenche l'import ou la mise à jour du catalogue local depuis la source configurée.",
  },
  "post-sync-prices": {
    name: "Lancer la sync prix générique",
    description:
      "Déclenche la synchronisation des prix depuis le provider demandé ou le provider par défaut.",
  },
  "post-sync-skinport": {
    name: "Lancer l'ingestion Skinport",
    description:
      "Lance le pipeline Skinport dédié avec matching catalogue, métriques de listings et historique de ventes.",
  },
  "post-sync-csfloat": {
    name: "Lancer l'ingestion CSFloat",
    description:
      "Lance le pipeline CSFloat pour stocker les prix planchers dans `LatestPrice`.",
  },
  "post-sync-csfloat-snapshot": {
    name: "Lancer CSFloat puis snapshot",
    description:
      "Lance l'ingestion CSFloat puis crée un snapshot journalier depuis les prix locaux.",
  },
  "post-daily-snapshot": {
    name: "Créer un snapshot journalier",
    description:
      "Copie l'état courant de `LatestPrice` dans `DailySnapshot` pour conserver les données exploitables par les graphiques.",
  },
  "get-health": {
    name: "Lire la santé interne",
    description:
      "Retourne un état rapide de l'application, de la base et des services internes.",
  },
};

const statusTranslations: Record<number, { label: string; description?: string }> = {
  200: {
    label: "OK",
    description: "La requête a réussi et a renvoyé un payload JSON valide.",
  },
  400: {
    label: "Requête invalide",
    description: "Le body ou les paramètres de requête ne passent pas la validation.",
  },
  404: {
    label: "Introuvable",
    description: "L'item ou la ressource demandée n'existe pas.",
  },
  500: {
    label: "Erreur serveur",
    description: "Une erreur inattendue est survenue dans l'application ou chez un provider.",
  },
};

function localizeStatusCodes(endpoint: ApiDocEndpoint, language: LanguagePreference) {
  if (language !== "FR") {
    return endpoint.statusCodes;
  }

  return endpoint.statusCodes.map((status) => ({
    ...status,
    label: statusTranslations[status.code]?.label ?? status.label,
  }));
}

export function localizeApiDocSections(sections: ApiDocSection[], language: LanguagePreference) {
  if (language !== "FR") {
    return sections;
  }

  return sections.map((section) => ({
    ...section,
    ...sectionTranslations[section.id],
  }));
}

export function localizeApiDocEndpoint(endpoint: ApiDocEndpoint, language: LanguagePreference): ApiDocEndpoint {
  if (language !== "FR") {
    return endpoint;
  }

  return {
    ...endpoint,
    ...endpointTranslations[endpoint.id],
    statusCodes: localizeStatusCodes(endpoint, language),
    responses: endpoint.responses.map((response) => ({
      ...response,
      title:
        response.status === 200
          ? "Réponse réussie"
          : statusTranslations[response.status]?.label ?? response.title,
      description:
        response.status === 200
          ? "Exemple de réponse JSON renvoyée par cette route."
          : statusTranslations[response.status]?.description ?? response.description,
    })),
  };
}

export function localizeApiDocEndpoints(endpoints: ApiDocEndpoint[], language: LanguagePreference) {
  return endpoints.map((endpoint) => localizeApiDocEndpoint(endpoint, language));
}

export function localizeApiStatusReference<T extends { code: number; label: string; description: string }>(
  statuses: T[],
  language: LanguagePreference,
) {
  if (language !== "FR") {
    return statuses;
  }

  return statuses.map((status) => ({
    ...status,
    label: statusTranslations[status.code]?.label ?? status.label,
    description: statusTranslations[status.code]?.description ?? status.description,
  }));
}
