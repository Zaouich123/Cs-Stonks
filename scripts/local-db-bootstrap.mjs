import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const prismaBin = path.join(rootDir, "node_modules", ".bin", "prisma.cmd");
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");

const serverConfig = {
  name: "cs-stonks-local",
};

function fail(message, details) {
  console.error(`[db:local] ${message}`);

  if (details) {
    console.error(details);
  }

  process.exit(1);
}

function runCommand(command, { allowFailure = false, env, quiet = false } = {}) {
  const result = spawnSync(command, {
    cwd: rootDir,
    encoding: "utf8",
    env: env ? { ...process.env, ...env } : process.env,
    shell: true,
  });

  if (!quiet && result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (!quiet && result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status !== 0 && !allowFailure) {
    fail(`Command failed: ${command}`, result.stderr || result.stdout);
  }

  return result;
}

function tryGenerateClient() {
  const result = runCommand(`"${prismaBin}" generate`, {
    allowFailure: true,
    quiet: true,
  });

  if (result.status === 0) {
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }

    if (result.stderr) {
      process.stderr.write(result.stderr);
    }

    return;
  }

  const combinedOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  if (combinedOutput.includes("EPERM: operation not permitted, rename")) {
    console.warn(
      "[db:local] Prisma generate was skipped because Windows locked the query engine file. Continuing with the existing client.",
    );
    return;
  }

  fail("Command failed: Prisma generate", combinedOutput);
}

function getServerStatus() {
  const result = runCommand(`"${prismaBin}" dev ls`, { quiet: true });

  if (result.status !== 0) {
    fail("Unable to inspect Prisma Dev servers.", result.stderr || result.stdout);
  }

  const lines = result.stdout.split(/\r?\n/);
  const serverLine = lines.find((line) => line.trim().startsWith(serverConfig.name));

  if (!serverLine) {
    return "missing";
  }

  if (serverLine.includes("running")) {
    return "running";
  }

  if (serverLine.includes("not_running")) {
    return "not_running";
  }

  return "unknown";
}

function getServerConnectionInfo() {
  const result = runCommand(`"${prismaBin}" dev ls`, { quiet: true });

  if (result.status !== 0) {
    fail("Unable to inspect Prisma Dev server URLs.", result.stderr || result.stdout);
  }

  const apiKeyMatches = result.stdout.matchAll(/api_key=([A-Za-z0-9+/=_-]+)/g);

  for (const match of apiKeyMatches) {
    try {
      const decoded = Buffer.from(match[1], "base64").toString("utf8");
      const parsed = JSON.parse(decoded);

      if (parsed.name === serverConfig.name) {
        const databaseUrl = new URL(parsed.databaseUrl);
        databaseUrl.searchParams.set("pgbouncer", "true");

        return {
          databaseUrl: databaseUrl.toString(),
          rawDatabaseUrl: parsed.databaseUrl,
          shadowDatabaseUrl: parsed.shadowDatabaseUrl,
        };
      }
    } catch {
      // Ignore malformed hyperlink payloads and continue scanning.
    }
  }

  fail(`Unable to resolve connection info for Prisma Dev server '${serverConfig.name}'.`);
}

function ensureEnvFile(connectionInfo) {
  const sourcePath = existsSync(envPath) ? envPath : envExamplePath;
  const sourceContent = existsSync(sourcePath) ? readFileSync(sourcePath, "utf8") : "";
  const lines = sourceContent.length > 0 ? sourceContent.split(/\r?\n/) : [];
  const updatedLines = [];
  let databaseUrlWritten = false;
  let shadowDatabaseUrlWritten = false;

  for (const line of lines) {
    if (line.startsWith("DATABASE_URL=")) {
      updatedLines.push(`DATABASE_URL="${connectionInfo.databaseUrl}"`);
      databaseUrlWritten = true;
      continue;
    }

    if (line.startsWith("SHADOW_DATABASE_URL=")) {
      updatedLines.push(`SHADOW_DATABASE_URL="${connectionInfo.shadowDatabaseUrl}"`);
      shadowDatabaseUrlWritten = true;
      continue;
    }

    updatedLines.push(line);
  }

  if (!databaseUrlWritten) {
    updatedLines.push(`DATABASE_URL="${connectionInfo.databaseUrl}"`);
  }

  if (!shadowDatabaseUrlWritten) {
    updatedLines.push(`SHADOW_DATABASE_URL="${connectionInfo.shadowDatabaseUrl}"`);
  }

  writeFileSync(envPath, `${updatedLines.join("\n").replace(/\n+$/u, "")}\n`, "utf8");
}

async function getDatabaseCounts(connectionInfo) {
  process.env.DATABASE_URL = connectionInfo.databaseUrl;
  process.env.SHADOW_DATABASE_URL = connectionInfo.shadowDatabaseUrl;

  const [{ PrismaClient }] = await Promise.all([import("@prisma/client")]);
  const prisma = new PrismaClient();

  try {
    const [items, markets, latestPrices, syncRuns] = await Promise.all([
      prisma.item.count(),
      prisma.market.count(),
      prisma.latestPrice.count(),
      prisma.syncRun.count(),
    ]);

    return {
      items,
      latestPrices,
      markets,
      syncRuns,
    };
  } finally {
    await prisma.$disconnect();
  }
}

function tryPushSchema(connectionInfo) {
  const result = runCommand(`"${prismaBin}" db push --skip-generate`, {
    allowFailure: true,
    env: {
      DATABASE_URL: connectionInfo.rawDatabaseUrl,
      SHADOW_DATABASE_URL: connectionInfo.shadowDatabaseUrl,
    },
    quiet: true,
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return result;
}

function printSummary(connectionInfo, counts) {
  const databasePort = new URL(connectionInfo.databaseUrl).port;
  const shadowDatabasePort = new URL(connectionInfo.shadowDatabaseUrl).port;

  console.log("");
  console.log("[db:local] Local database is ready.");
  console.log(`[db:local] Prisma Dev server: ${serverConfig.name}`);
  console.log(`[db:local] DATABASE_URL port: ${databasePort}`);
  console.log(`[db:local] SHADOW_DATABASE_URL port: ${shadowDatabasePort}`);
  console.log(`[db:local] Items: ${counts.items}`);
  console.log(`[db:local] Markets: ${counts.markets}`);
  console.log(`[db:local] Latest prices: ${counts.latestPrices}`);
  console.log(`[db:local] Sync runs: ${counts.syncRuns}`);
}

async function startServer() {
  if (!existsSync(prismaBin)) {
    fail("Prisma CLI not found. Run `npm install` first.");
  }

  const status = getServerStatus();

  if (status === "running") {
    console.log(`[db:local] Prisma Dev server '${serverConfig.name}' is already running.`);
    return;
  }

  if (status === "not_running") {
    runCommand(`"${prismaBin}" dev start ${serverConfig.name}`);
    return;
  }

  runCommand(`"${prismaBin}" dev -d --name ${serverConfig.name}`);
}

async function setupDatabase() {
  await startServer();
  const connectionInfo = getServerConnectionInfo();

  ensureEnvFile(connectionInfo);

  tryGenerateClient();
  const dbPushResult = tryPushSchema(connectionInfo);
  let initialCounts;

  try {
    initialCounts = await getDatabaseCounts(connectionInfo);
  } catch (error) {
    if (dbPushResult.status !== 0) {
      fail(
        "Schema sync did not complete and the database is still not queryable.",
        `${dbPushResult.stdout ?? ""}\n${dbPushResult.stderr ?? ""}\n${String(error)}`,
      );
    }

    throw error;
  }

  if (dbPushResult.status !== 0) {
    console.warn("[db:local] Prisma db push failed, but the schema is already queryable. Continuing.");
  }

  if (initialCounts.items === 0) {
    console.log("[db:local] Catalog is empty. Running initial catalog import...");
    runCommand("node --env-file=.env --import tsx ./src/modules/catalog/jobs/runCatalogSyncJob.ts");
  } else {
    console.log(`[db:local] Catalog already present (${initialCounts.items} items). Skipping import.`);
  }

  const finalCounts = await getDatabaseCounts(connectionInfo);
  printSummary(connectionInfo, finalCounts);
}

async function showStatus() {
  await startServer();
  const connectionInfo = getServerConnectionInfo();
  ensureEnvFile(connectionInfo);
  const counts = await getDatabaseCounts(connectionInfo);
  printSummary(connectionInfo, counts);
}

function stopServer() {
  runCommand(`"${prismaBin}" dev stop ${serverConfig.name}`, { allowFailure: true });
}

const command = process.argv[2] ?? "setup";

if (command === "setup") {
  await setupDatabase();
} else if (command === "start") {
  await startServer();
  const connectionInfo = getServerConnectionInfo();
  ensureEnvFile(connectionInfo);
  const databasePort = new URL(connectionInfo.databaseUrl).port;
  const shadowDatabasePort = new URL(connectionInfo.shadowDatabaseUrl).port;
  console.log(`[db:local] Server '${serverConfig.name}' started.`);
  console.log(`[db:local] DATABASE_URL port: ${databasePort}`);
  console.log(`[db:local] SHADOW_DATABASE_URL port: ${shadowDatabasePort}`);
} else if (command === "status") {
  await showStatus();
} else if (command === "stop") {
  stopServer();
  console.log(`[db:local] Server '${serverConfig.name}' stopped.`);
} else {
  fail(`Unknown command '${command}'. Expected setup, start, status or stop.`);
}
