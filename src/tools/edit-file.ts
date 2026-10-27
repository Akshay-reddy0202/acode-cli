import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { EditFileInput } from "../types/tool-types.js";

export async function editFileTool(
  input: EditFileInput,
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

  if (input.oldText.length === 0) {
    throw new Error("Invalid input: oldText cannot be empty.");
  }

  const originalContent = await readFile(target, "utf8");

  const firstMatch = originalContent.indexOf(input.oldText);

  if (firstMatch === -1) {
    throw new Error("Edit failed: oldText was not found in the file.");
  }

  const secondMatch = originalContent.indexOf(
    input.oldText,
    firstMatch + input.oldText.length,
  );

  if (secondMatch !== -1) {
    throw new Error(
      "Edit failed: oldText occurs more than once. Provide a more specific snippet.",
    );
  }

  const updatedContent =
    originalContent.slice(0, firstMatch) +
    input.newText +
    originalContent.slice(firstMatch + input.oldText.length);

  await writeFile(target, updatedContent, "utf8");

  return `Successfully edited file: ${relativePath}`;
}
