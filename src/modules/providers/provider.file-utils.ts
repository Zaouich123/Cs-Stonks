import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readLocalJsonFixture<T>(relativePath: string): Promise<T> {
  const fixturePath = path.resolve(process.cwd(), relativePath);
  const fileContents = await readFile(fixturePath, "utf-8");

  return JSON.parse(fileContents) as T;
}

