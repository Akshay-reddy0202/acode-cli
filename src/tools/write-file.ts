import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { WriteFileInput } from "../types/tool-types.js";

export async function writeFileTool(
  input: WriteFileInput,
  workspaceRoot: string,
): Promise<string> {
  const root = path.resolve(workspaceRoot);
  const target = path.resolve(root, input.filePath);
  const relativePath = path.relative(root, target);

  if (
    !input.filePath.trim() ||
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Access denied: invalid path or path outside workspace");
  }

  await mkdir(path.dirname(target), { recursive: true });

  await writeFile(target, input.content, {
    encoding: "utf8",
    flag: "w",
  });

  return `Successfully wrote file: ${relativePath}`;
}
