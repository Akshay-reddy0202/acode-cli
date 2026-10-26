import { createToolRegistry } from "../tools/register-tools.js";

async function main(): Promise<void> {
  const registry = createToolRegistry();

  console.log("Registered tools:", registry.list());

  const result = await registry.execute("list_directory", {
    directoryPath: ".",
  });

  console.log("\nDirectory contents:");
  console.log(result);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
