import { readdir } from "node:fs/promises";
import path from "node:path";

import type { FindFilesInput } from "../types/tool-types.js";

export async function findFiles(
  input: FindFilesInput,
  workspaceRoot: string,
): Promise<string[]> {
  const root = path.resolve(workspaceRoot);
  const startDirectory = path.resolve(root, input.directoryPath ?? ".");

  const relativeStart = path.relative(root, startDirectory);

  if (
    relativeStart === ".." ||
    relativeStart.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeStart)
  ) {
    throw new Error("Access denied: path is outside the workspace");
  }

  const matches: string[] = [];

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue;
      }

      if (
        entry.isDirectory() &&
        ["node_modules", ".git", "dist"].includes(entry.name)
      ) {
        continue;
      }

      const fullPath = path.join(directory, entry.name);
      const relativePath = path.relative(root, fullPath);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && matchesPattern(entry.name, input.pattern)) {
        matches.push(relativePath);
      }
    }
  }

  await walk(startDirectory);
  return matches;
}

function matchesPattern(fileName: string, pattern: string): boolean {
  if (pattern.startsWith("*.")) {
    return fileName.endsWith(pattern.slice(1));
  }

  return fileName.toLowerCase().includes(pattern.toLowerCase());
}
