import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const prismaBin = path.join(rootDir, "node_modules", ".bin", "prisma.cmd");
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");

const targetDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/cs_stonks?schema=public";
const targetShadowDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/cs_stonks_shadow?schema=public";
const chunkSize = 500;

function fail(message, details) {
  console.error(`[db:docker] ${message}`);

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

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf8");
  const envEntries = {};

  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    envEntries[key] = value;
  }

  return envEntries;
}

function updateEnvFile() {
  const sourcePath = existsSync(envPath) ? envPath : envExamplePath;
  const sourceContent = existsSync(sourcePath) ? readFileSync(sourcePath, "utf8") : "";
  const lines = sourceContent.length > 0 ? sourceContent.split(/\r?\n/) : [];
  const updatedLines = [];
  let databaseUrlWritten = false;
  let shadowDatabaseUrlWritten = false;

  for (const line of lines) {
    if (line.startsWith("DATABASE_URL=")) {
      updatedLines.push(`DATABASE_URL="${targetDatabaseUrl}"`);
      databaseUrlWritten = true;
      continue;
    }

    if (line.startsWith("SHADOW_DATABASE_URL=")) {
      updatedLines.push(`SHADOW_DATABASE_URL="${targetShadowDatabaseUrl}"`);
      shadowDatabaseUrlWritten = true;
      continue;
    }

    updatedLines.push(line);
  }

  if (!databaseUrlWritten) {
    updatedLines.push(`DATABASE_URL="${targetDatabaseUrl}"`);
  }

  if (!shadowDatabaseUrlWritten) {
    updatedLines.push(`SHADOW_DATABASE_URL="${targetShadowDatabaseUrl}"`);
  }

  writeFileSync(envPath, `${updatedLines.join("\n").replace(/\n+$/u, "")}\n`, "utf8");
}

function ensureDockerRunning() {
  runCommand("docker compose up -d postgres");
}

async function waitForDockerDatabase() {
  const [{ PrismaClient }] = await Promise.all([import("@prisma/client")]);
  const maxAttempts = 30;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const prisma = new PrismaClient({
      datasources: {
        db: { url: targetDatabaseUrl },
      },
    });

    try {
      await prisma.$queryRawUnsafe("select 1 as ok");
      await prisma.$disconnect();
      return;
    } catch (error) {
      await prisma.$disconnect().catch(() => {});

      if (attempt === maxAttempts) {
        fail("Docker PostgreSQL is not reachable on localhost:5432.", String(error));
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });
    }
  }
}

function pushSchemaToDocker() {
  runCommand(`"${prismaBin}" db push --skip-generate`, {
    env: {
      DATABASE_URL: targetDatabaseUrl,
      SHADOW_DATABASE_URL: targetShadowDatabaseUrl,
    },
  });
}

function createChunkedArray(items) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

async function migrateDataFromSource(sourceDatabaseUrl) {
  if (!sourceDatabaseUrl || sourceDatabaseUrl === targetDatabaseUrl) {
    console.log("[db:docker] No external source database detected. Skipping data migration.");
    return;
  }

  const [{ PrismaClient }] = await Promise.all([import("@prisma/client")]);
  const sourcePrisma = new PrismaClient({
    datasources: {
      db: { url: sourceDatabaseUrl },
    },
  });
  const targetPrisma = new PrismaClient({
    datasources: {
      db: { url: targetDatabaseUrl },
    },
  });

  try {
    console.log("[db:docker] Reading source data...");

    const [markets, items, syncRuns, latestPrices, dailySnapshots] = await Promise.all([
      sourcePrisma.market.findMany(),
      sourcePrisma.item.findMany(),
      sourcePrisma.syncRun.findMany(),
      sourcePrisma.latestPrice.findMany(),
      sourcePrisma.dailySnapshot.findMany(),
    ]);

    console.log(
      `[db:docker] Source counts: items=${items.length}, markets=${markets.length}, latestPrices=${latestPrices.length}, dailySnapshots=${dailySnapshots.length}, syncRuns=${syncRuns.length}`,
    );

    await targetPrisma.$executeRawUnsafe(
      'TRUNCATE TABLE "DailySnapshot", "LatestPrice", "SyncRun", "Market", "Item" RESTART IDENTITY CASCADE',
    );

    for (const chunk of createChunkedArray(markets)) {
      if (chunk.length > 0) {
        await targetPrisma.market.createMany({ data: chunk });
      }
    }

    for (const chunk of createChunkedArray(items)) {
      if (chunk.length > 0) {
        await targetPrisma.item.createMany({ data: chunk });
      }
    }

    for (const chunk of createChunkedArray(syncRuns)) {
      if (chunk.length > 0) {
        await targetPrisma.syncRun.createMany({ data: chunk });
      }
    }

    for (const chunk of createChunkedArray(latestPrices)) {
      if (chunk.length > 0) {
        await targetPrisma.latestPrice.createMany({ data: chunk });
      }
    }

    for (const chunk of createChunkedArray(dailySnapshots)) {
      if (chunk.length > 0) {
        await targetPrisma.dailySnapshot.createMany({ data: chunk });
      }
    }

    const [targetItems, targetMarkets, targetLatestPrices, targetSnapshots, targetSyncRuns] =
      await Promise.all([
        targetPrisma.item.count(),
        targetPrisma.market.count(),
        targetPrisma.latestPrice.count(),
        targetPrisma.dailySnapshot.count(),
        targetPrisma.syncRun.count(),
      ]);

    console.log(
      `[db:docker] Target counts: items=${targetItems}, markets=${targetMarkets}, latestPrices=${targetLatestPrices}, dailySnapshots=${targetSnapshots}, syncRuns=${targetSyncRuns}`,
    );
  } finally {
    await sourcePrisma.$disconnect().catch(() => {});
    await targetPrisma.$disconnect().catch(() => {});
  }
}

async function showStatus() {
  const [{ PrismaClient }] = await Promise.all([import("@prisma/client")]);
  const prisma = new PrismaClient({
    datasources: {
      db: { url: targetDatabaseUrl },
    },
  });

  try {
    const [items, markets, latestPrices, dailySnapshots, syncRuns] = await Promise.all([
      prisma.item.count(),
      prisma.market.count(),
      prisma.latestPrice.count(),
      prisma.dailySnapshot.count(),
      prisma.syncRun.count(),
    ]);

    console.log("[db:docker] Docker PostgreSQL is ready.");
    console.log(`[db:docker] DATABASE_URL: ${targetDatabaseUrl}`);
    console.log(`[db:docker] SHADOW_DATABASE_URL: ${targetShadowDatabaseUrl}`);
    console.log(`[db:docker] Items: ${items}`);
    console.log(`[db:docker] Markets: ${markets}`);
    console.log(`[db:docker] Latest prices: ${latestPrices}`);
    console.log(`[db:docker] Daily snapshots: ${dailySnapshots}`);
    console.log(`[db:docker] Sync runs: ${syncRuns}`);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function setupDockerDatabase() {
  const currentEnv = parseEnvFile(envPath);
  const sourceDatabaseUrl = currentEnv.DATABASE_URL;

  ensureDockerRunning();
  await waitForDockerDatabase();
  pushSchemaToDocker();
  await migrateDataFromSource(sourceDatabaseUrl);
  updateEnvFile();
  await showStatus();
}

const command = process.argv[2] ?? "setup";

if (command === "setup") {
  await setupDockerDatabase();
} else if (command === "up") {
  ensureDockerRunning();
  await waitForDockerDatabase();
  updateEnvFile();
  await showStatus();
} else if (command === "status") {
  await showStatus();
} else if (command === "down") {
  runCommand("docker compose down");
} else {
  fail(`Unknown command '${command}'. Expected setup, up, status or down.`);
}
