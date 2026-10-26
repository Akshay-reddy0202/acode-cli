import path from "node:path";
import { authorizeOperation, askForApproval } from "../tools/permissions.js";
import { toolPermissions } from "../config/permissions.js";
import { listDirectory } from "../tools/list-directory.js";

async function main(): Promise<void> {
  const workspaceRoot = path.resolve(".");

  const request = {
    toolName: "list_directory",
    description: "List files in the project directory",
    input: { directoryPath: "." },
  };

  const mode = toolPermissions.list_directory ?? "deny";

  const allowed = await authorizeOperation(mode, request, {
    requestApproval: askForApproval,
  });

  if (!allowed) {
    console.log("Permission denied. Directory was not listed.");
    return;
  }

  const entries = await listDirectory({ directoryPath: "." }, workspaceRoot);

  console.log("\nDirectory contents:");
  for (const entry of entries) {
    console.log(`- ${entry}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
