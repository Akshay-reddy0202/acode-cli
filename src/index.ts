import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Conversation } from "./agent/conversation.js";
import { createToolRegistry } from "./tools/tool-registration.js";
import { createCliPermissionContext } from "./tools/permissions.js";

async function main(): Promise<void> {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  const permissionContext = createCliPermissionContext(rl);
  const registry = createToolRegistry(process.cwd(), permissionContext);
  const conversation = new Conversation(registry);

  console.log("\n acode-cli");
  console.log("  Local AI coding assistant");

  try {
    while (true) {
      const prompt = await rl.question("acode > ");
      const trimmedPrompt = prompt.trim();

      if (trimmedPrompt === "/exit") {
        console.log("Goodbye!");
        break;
      }

      if (trimmedPrompt === "/clear") {
        console.clear();
        console.log("\n acode-cli");
        console.log("  Local AI coding assistant");
        continue;
      }

      if (trimmedPrompt === "/reset") {
        conversation.clear();
        console.log("Memory reset! Starting a fresh conversation.\n");
        continue;
      }

      if (!trimmedPrompt) {
        continue;
      }

      try {
        console.log("\nThinking...\n");

        const answer = await conversation.send(trimmedPrompt);

        console.log(`AI: ${answer}\n`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Request failed: ${message}\n`);
      }
    }
  } finally {
    rl.close();
  }
}

main().catch((error: unknown) => {
  console.error("Application failed:", error);
  process.exitCode = 1;
});
