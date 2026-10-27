import path from "node:path";
import type { PermissionContext } from "../types/permission-types.js";
import type {
  ReadFileInput,
  ToolDefinition,
  FindFilesInput,
  WriteFileInput,
  EditFileInput,
  RunCommandInput,
} from "../types/tool-types.js";
import { listDirectory } from "./list-directory.js";
import { ToolRegistry } from "./tool-registry.js";
import { readFileTool } from "./read-file.js";
import { findFiles } from "./find-files.js";
import { writeFileTool } from "./write-file.js";
import { editFileTool } from "./edit-file.js";
import { runCommandTool, type CommandResult } from "./run-command.js";

export function createToolRegistry(
  workspaceRoot: string = process.cwd(),
  permissionContext?: PermissionContext,
): ToolRegistry {
  const registry = new ToolRegistry(permissionContext);
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

  const readFileDefinition: ToolDefinition<ReadFileInput, string> = {
    name: "read_file",
    description: "Read a text file inside the workspace.",
    parseInput(input) {
      if (
        typeof input !== "object" ||
        input === null ||
        !("filePath" in input) ||
        typeof input.filePath !== "string"
      ) {
        throw new Error("Invalid input: filePath must be a string.");
      }

      return { filePath: input.filePath };
    },
    execute: (input) => readFileTool(input, root),
  };

  const findFilesDefinition: ToolDefinition<FindFilesInput, string[]> = {
    name: "find_files",
    description: "Find files by name or extension inside the workspace.",

    parseInput(input) {
      if (typeof input !== "object" || input === null) {
        throw new Error("Invalid input: expected an object.");
      }

      if (
        !("pattern" in input) ||
        typeof input.pattern !== "string" ||
        input.pattern.trim() === ""
      ) {
        throw new Error("Invalid input: pattern must be a non-empty string.");
      }

      if ("directoryPath" in input && typeof input.directoryPath !== "string") {
        throw new Error("Invalid input: directoryPath must be a string.");
      }

      const pattern = input.pattern;
      const directoryPath =
        "directoryPath" in input ? input.directoryPath : undefined;

      if (typeof pattern !== "string") {
        throw new Error("Invalid input: pattern must be a string.");
      }

      if (typeof directoryPath === "string") {
        return { pattern, directoryPath };
      }

      return { pattern };
    },
    execute: (input) => findFiles(input, root),
  };

  const writeFileDefinition: ToolDefinition<WriteFileInput, string> = {
    name: "write_file",
    description: "Create or overwrite a text file inside the workspace.",

    parseInput(input) {
      if (typeof input !== "object" || input === null) {
        throw new Error("Invalid input: expected an object.");
      }

      if (
        !("filePath" in input) ||
        typeof input.filePath !== "string" ||
        input.filePath.trim() === ""
      ) {
        throw new Error("Invalid input: filePath must be a non-empty string.");
      }

      if (!("content" in input) || typeof input.content !== "string") {
        throw new Error("Invalid input: content must be a string.");
      }

      return {
        filePath: input.filePath,
        content: input.content,
      };
    },

    execute: (input) => writeFileTool(input, root),
  };

  const editFileDefinition: ToolDefinition<EditFileInput, string> = {
    name: "edit_file",
    description: "Replace a unique text snippet in an existing workspace file.",

    parseInput(input) {
      if (typeof input !== "object" || input === null) {
        throw new Error("Invalid input: expected an object.");
      }

      if (
        !("filePath" in input) ||
        typeof input.filePath !== "string" ||
        input.filePath.trim() === ""
      ) {
        throw new Error("Invalid input: filePath must be a non-empty string.");
      }

      if (!("oldText" in input) || typeof input.oldText !== "string") {
        throw new Error("Invalid input: oldText must be a string.");
      }

      if (!("newText" in input) || typeof input.newText !== "string") {
        throw new Error("Invalid input: newText must be a string.");
      }

      return {
        filePath: input.filePath,
        oldText: input.oldText,
        newText: input.newText,
      };
    },

    execute: (input) => editFileTool(input, root),
  };

  const runCommandDefinition: ToolDefinition<RunCommandInput, CommandResult> = {
    name: "run_command",
    description:
      "Execute a Bash command inside the workspace and return its output.",

    parseInput(input) {
      if (
        typeof input !== "object" ||
        input === null ||
        !("command" in input) ||
        typeof input.command !== "string" ||
        input.command.trim() === ""
      ) {
        throw new Error("Invalid input: command must be a non-empty string.");
      }

      return { command: input.command };
    },

    execute: (input) => runCommandTool(input, root),
  };

  registry.register(listDirectoryTool);
  registry.register(readFileDefinition);
  registry.register(findFilesDefinition);
  registry.register(writeFileDefinition);
  registry.register(editFileDefinition);
  registry.register(runCommandDefinition);

  return registry;
}
