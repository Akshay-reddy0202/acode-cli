import type { Interface } from "node:readline/promises";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type {
  ApprovalDecision,
  PermissionContext,
  PermissionRequest,
  PermissionMode,
} from "../types/permission-types.js";

export async function askForApprovalDefault(
  request: PermissionRequest,
): Promise<ApprovalDecision> {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    return await askForApproval(request, rl);
  } finally {
    rl.close();
  }
}

export async function authorizeOperation(
  mode: PermissionMode,
  request: PermissionRequest,
  context: PermissionContext,
): Promise<boolean> {
  if (mode === "deny") {
    return false;
  }

  if (mode === "allow") {
    return true;
  }

  const decision = await context.requestApproval(request);
  return decision === "once";
}

export async function askForApproval(
  request: PermissionRequest,
  rl: Interface,
): Promise<ApprovalDecision> {
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
}

export function createCliPermissionContext(rl: Interface): PermissionContext {
  return {
    requestApproval: (request) => askForApproval(request, rl),
  };
}
