import { readdir } from "node:fs/promises";
import path from "node:path";
import type { ListDirectoryInput } from "../types/tool-types.js";

export async function listDirectory(
  input: ListDirectoryInput,
  workspaceRoot: string,
): Promise<string[]> {
  const root = path.resolve(workspaceRoot);
  const target = path.resolve(root, input.directoryPath);
  const relativePath = path.relative(root, target);

  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Access denied: path is outside the workspace");
  }

  const entries = await readdir(target, { withFileTypes: true });

  return entries.map((entry) =>
    entry.isDirectory() ? `${entry.name}/` : entry.name,
  );
}
