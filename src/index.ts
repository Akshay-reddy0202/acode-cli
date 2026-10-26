import { generateResponse } from "./llm/client.js";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

async function main(): Promise<void> {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });
  console.log("\n acode-cli");
  console.log("  Local AI coding assistant");
  console.log("  Type /exit to quit.\n");

  try {
    while (true) {
      const prompt = await rl.question("acode > ");
      const trimmedPrompt = prompt.trim();

      if (trimmedPrompt === "/exit") {
        console.log("Goodbye!");
        break;
      }

      if (!trimmedPrompt) {
        continue;
      }

      try {
        console.log("\nThinking...\n");
        const answer = await generateResponse(trimmedPrompt);
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
