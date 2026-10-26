import type { PermissionMode } from "../config/permissions.js";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

export type ApprovalDecision = "once" | "session" | "deny";

export interface PermissionRequest {
  toolName: string;
  description: string;
  input: unknown;
}

export interface PermissionContext {
  requestApproval(request: PermissionRequest): Promise<ApprovalDecision>;
}

export async function authorizeOperation(
  mode: PermissionMode,
  request: PermissionRequest,
  context: PermissionContext,
): Promise<boolean> {
  // Explicit deny always wins.
  if (mode === "deny") {
    return false;
  }

  // Default allow still requires normal security validation
  // before the tool actually executes.
  if (mode === "allow") {
    return true;
  }

  const decision = await context.requestApproval(request);

  // This authorizes only the current invocation.
  // Do not store "once" in persistent or session permissions.
  return decision === "once";
}

export async function askForApproval(
  request: PermissionRequest,
): Promise<ApprovalDecision> {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    console.log("\nPermission requested");
    console.log("--------------------");
    console.log(`Tool: ${request.toolName}`);
    console.log(`Operation: ${request.description}`);
    console.log("Input:", JSON.stringify(request.input, null, 2));
    console.log("\nChoose an option:");
    console.log("1. Allow this operation once");
    console.log("2. Deny");

    const answer = await rl.question("Your choice (1/2): ");

    if (answer.trim() === "1") {
      return "once";
    }

    return "deny";
  } finally {
    rl.close();
  }
}
