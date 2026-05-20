import { normalizeSearchText } from "@/modules/catalog/catalog.normalizer";
import type {
  PriceProviderWarning,
  PriceSyncTargetItem,
} from "@/modules/providers/provider.types";

export const MAX_PROVIDER_WARNINGS = 100;

interface TargetMatch {
  matchType: "canonical" | "exact";
  target: PriceSyncTargetItem;
}

export function clampPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function capWarnings(warnings: PriceProviderWarning[]) {
  return warnings.slice(0, MAX_PROVIDER_WARNINGS);
}

export function countWarningsByCode(warnings: PriceProviderWarning[]) {
  return warnings.reduce<Record<string, number>>((counts, warning) => {
    counts[warning.code] = (counts[warning.code] ?? 0) + 1;

    return counts;
  }, {});
}

function pushToMapList<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const current = map.get(key) ?? [];
  current.push(value);
  map.set(key, current);
}

function pickCandidate(
  candidates: PriceSyncTargetItem[] | undefined,
  providerPhase?: string | null,
) {
  if (!candidates || candidates.length === 0) {
    return null;
  }

  const normalizedProviderPhase = providerPhase ? normalizeSearchText(providerPhase) : null;

  if (normalizedProviderPhase) {
    const phaseMatches = candidates.filter((candidate) =>
      candidate.phase ? normalizeSearchText(candidate.phase) === normalizedProviderPhase : false,
    );

    if (phaseMatches.length === 1) {
      return phaseMatches[0];
    }
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  const phaseLessCandidates = candidates.filter((candidate) => candidate.phase === null);

  return phaseLessCandidates.length === 1 ? phaseLessCandidates[0] : null;
}

export function createPriceTargetMatcher(items: PriceSyncTargetItem[]) {
  const exactTargets = new Map<string, PriceSyncTargetItem[]>();
  const canonicalTargets = new Map<string, PriceSyncTargetItem[]>();

  for (const item of items) {
    pushToMapList(exactTargets, item.marketHashName.trim(), item);
    pushToMapList(canonicalTargets, normalizeSearchText(item.marketHashName), item);
  }

  return {
    match(marketHashName: string, phase?: string | null): TargetMatch | null {
      const exactTarget = pickCandidate(exactTargets.get(marketHashName.trim()), phase);

      if (exactTarget) {
        return {
          matchType: "exact",
          target: exactTarget,
        };
      }

      const canonicalTarget = pickCandidate(
        canonicalTargets.get(normalizeSearchText(marketHashName)),
        phase,
      );

      if (canonicalTarget) {
        return {
          matchType: "canonical",
          target: canonicalTarget,
        };
      }

      return null;
    },
  };
}

export function buildMissingTargetWarnings(
  items: PriceSyncTargetItem[],
  matchedVariantKeys: Set<string>,
  providerLabel: string,
) {
  const warnings: PriceProviderWarning[] = [];

  for (const target of items) {
    if (!matchedVariantKeys.has(target.variantKey)) {
      warnings.push({
        code: "ITEM_NOT_FOUND",
        marketHashName: target.marketHashName,
        message: `${providerLabel} did not return "${target.marketHashName}".`,
        variantKey: target.variantKey,
      });
    }
  }

  return warnings;
}
