import { generateResponse } from "./llm/client.js";

async function main(): Promise<void> {
  const prompt = "Explain what an inference engine does in two sentences.";

  console.log("Asking the local AI model...\n");

  const answer = await generateResponse(prompt);

  console.log("AI:", answer);
}

main().catch((error: unknown) => {
  console.error("Application failed:", error);
  process.exitCode = 1;
});
