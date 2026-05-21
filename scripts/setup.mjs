#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const args = new Set(process.argv.slice(2));

const shouldShowHelp = args.has("--help") || args.has("-h");
const shouldSkipInstall = args.has("--skip-install");
const shouldSkipCatalog = args.has("--skip-catalog");
const shouldSkipPrices = args.has("--skip-prices");

function log(message) {
  console.log(`[setup] ${message}`);
}

function fail(message) {
  console.error(`[setup] ${message}`);
  process.exit(1);
}

function runNpmScript(scriptName) {
  runCommand(npmCommand, ["run", scriptName]);
}

function runCommand(command, commandArgs) {
  log(`Running: ${command} ${commandArgs.join(" ")}`);

  const result = spawnSync(command, commandArgs, {
    cwd: rootDir,
    env: process.env,
    shell: false,
    stdio: "inherit",
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    fail(`Command failed with exit code ${result.status}: ${command} ${commandArgs.join(" ")}`);
  }
}

function ensureEnvFile() {
  if (existsSync(envPath)) {
    log(".env already exists. Keeping current local values.");
    return;
  }

  if (!existsSync(envExamplePath)) {
    fail(".env.example was not found, so .env cannot be created automatically.");
  }

  copyFileSync(envExamplePath, envPath);
  log(".env created from .env.example.");
}

function stripEnvQuotes(value) {
  const trimmedValue = value.trim();

  if (
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
  ) {
    return trimmedValue.slice(1, -1);
  }

  return trimmedValue;
}

function shouldReplaceSessionSecret(line) {
  const separatorIndex = line.indexOf("=");

  if (separatorIndex === -1) {
    return false;
  }

  const value = stripEnvQuotes(line.slice(separatorIndex + 1));

  return value.length === 0 || value === "replace-with-a-long-random-secret";
}

function ensureSessionSecret() {
  const envContent = readFileSync(envPath, "utf8");
  const lines = envContent.split(/\r?\n/);
  const secret = randomBytes(48).toString("hex");
  let didFindSessionSecret = false;
  let didUpdateSessionSecret = false;

  const updatedLines = lines.map((line) => {
    if (!line.startsWith("SESSION_SECRET=")) {
      return line;
    }

    didFindSessionSecret = true;

    if (!shouldReplaceSessionSecret(line)) {
      return line;
    }

    didUpdateSessionSecret = true;
    return `SESSION_SECRET="${secret}"`;
  });

  if (!didFindSessionSecret) {
    updatedLines.push(`SESSION_SECRET="${secret}"`);
    didUpdateSessionSecret = true;
  }

  writeFileSync(envPath, `${updatedLines.join("\n").replace(/\n+$/u, "")}\n`, "utf8");

  if (didUpdateSessionSecret) {
    log("SESSION_SECRET generated in .env.");
  } else {
    log("SESSION_SECRET already exists. Keeping current value.");
  }
}

function showHelp() {
  console.log(`Cs-Stonks local setup

Usage:
  npm run setup

Options:
  --skip-install   Do not run npm ci.
  --skip-catalog   Do not import the catalog.
  --skip-prices    Do not run the daily market price pipeline.
  --help           Show this help.

Default flow:
  npm ci
  copy .env.example to .env if needed
  generate SESSION_SECRET if needed
  prisma generate
  start Docker PostgreSQL
  prisma migrate deploy
  import catalog
  sync market prices
`);
}

if (shouldShowHelp) {
  showHelp();
  process.exit(0);
}

log("Starting Cs-Stonks local setup.");

if (!shouldSkipInstall) {
  runCommand(npmCommand, ["ci"]);
} else {
  log("Skipping npm ci.");
}

ensureEnvFile();
ensureSessionSecret();

runNpmScript("prisma:generate");
runNpmScript("db:docker:up");
runNpmScript("prisma:migrate:deploy");

if (!shouldSkipCatalog) {
  runNpmScript("job:catalog");
} else {
  log("Skipping catalog import.");
}

if (!shouldSkipPrices) {
  runNpmScript("jobs:daily-markets");
} else {
  log("Skipping price sync. Run npm run jobs:daily-markets when you want market data.");
}

log("Setup complete. Start the app with: npm run dev");
