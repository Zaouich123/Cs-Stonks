/**
 * CS2 active drop pool cases (as of April 2026).
 * Any case NOT in this list is considered discontinued (no longer droppable in-game).
 *
 * Source: https://csgostocks.de / https://csgodatabase.com
 */
const ACTIVE_DROP_POOL_CASES: string[] = [
  // Weekly Care Package rotation
  "Kilowatt Case",
  "Revolution Case",
  "Dreams & Nightmares Case",
  // Armory Pass cases
  "Gallery Case",
  "Fever Case",
];

/**
 * Sealed containers that are currently in the active drop pool.
 * These use partial matching because sealed terminals/capsules may have
 * slightly different display names.
 */
const ACTIVE_SEALED_PATTERNS: string[] = [
  "Dead Hand Terminal",
  "Genesis Terminal",
];

/**
 * Returns true if a case with the given display name is discontinued
 * (no longer obtainable through in-game drops).
 */
export function isDiscontinuedCase(displayName: string): boolean {
  const normalized = displayName.trim();

  if (ACTIVE_DROP_POOL_CASES.some((name) => normalized.toLowerCase() === name.toLowerCase())) {
    return false;
  }

  if (ACTIVE_SEALED_PATTERNS.some((pattern) => normalized.toLowerCase().includes(pattern.toLowerCase()))) {
    return false;
  }

  return true;
}
