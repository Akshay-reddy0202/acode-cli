import path from "node:path";
import { listDirectory } from "../tools/list-directory.js";

async function main(): Promise<void> {
  const workspaceRoot = path.resolve(".");
  const entries = await listDirectory({ directoryPath: "." }, workspaceRoot);

  console.log("Workspace contents:");
  for (const entry of entries) {
    console.log(`- ${entry}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
