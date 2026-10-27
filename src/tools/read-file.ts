import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReadFileInput } from "../types/tool-types.js";

export async function readFileTool(
  input: ReadFileInput,
  workspaceRoot: string,
): Promise<string> {
  const root = path.resolve(workspaceRoot);
  const target = path.resolve(root, input.filePath);
  const relativePath = path.relative(root, target);

  // Prevent reading paths outside the workspace.
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Access denied: path is outside the workspace");
  }

  const content = await readFile(target, "utf8");

  return content;
}
