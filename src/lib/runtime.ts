import { fileURLToPath } from "node:url";

export function isDirectExecution(metaUrl: string): boolean {
  const executedScript = process.argv[1];

  if (!executedScript) {
    return false;
  }

  return fileURLToPath(metaUrl) === executedScript;
}

