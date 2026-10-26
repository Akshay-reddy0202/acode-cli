import path from "node:path";

import type { ToolDefinition } from "../types/tool-types.js";
import { listDirectory } from "./list-directory.js";
import { ToolRegistry } from "./registry.js";

export function createToolRegistry(
  workspaceRoot: string = process.cwd(),
): ToolRegistry {
  const registry = new ToolRegistry();
  const root = path.resolve(workspaceRoot);

  const listDirectoryTool: ToolDefinition<{ directoryPath: string }, string[]> =
    {
      name: "list_directory",
      description: "List files and directories inside the workspace.",

      parseInput(input) {
        if (
          typeof input !== "object" ||
          input === null ||
          !("directoryPath" in input) ||
          typeof input.directoryPath !== "string"
        ) {
          throw new Error("Invalid input: directoryPath must be a string.");
        }

        return { directoryPath: input.directoryPath };
      },

      execute: (input) => listDirectory(input, root),
    };

  registry.register(listDirectoryTool);

  return registry;
}
