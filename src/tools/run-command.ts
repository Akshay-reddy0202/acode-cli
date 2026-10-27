import { spawn } from "node:child_process";
import path from "node:path";

import type { RunCommandInput } from "../types/tool-types.js";

export interface CommandResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export async function runCommandTool(
  input: RunCommandInput,
  workspaceRoot: string,
): Promise<CommandResult> {
  const root = path.resolve(workspaceRoot);

  if (!input.command.trim()) {
    throw new Error("Invalid input: command cannot be empty.");
  }

  return new Promise((resolve, reject) => {
    const child = spawn("bash", ["-c", input.command], {
      cwd: root,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (exitCode) => {
      resolve({
        exitCode,
        stdout,
        stderr,
      });
    });
  });
}
