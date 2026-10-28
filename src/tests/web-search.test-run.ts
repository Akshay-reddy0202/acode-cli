import { webSearchTool } from "../tools/web-search.js";

async function main(): Promise<void> {
  const result = await webSearchTool({
    query: "official Node.js v24 documentation",
  });

  console.log("\nWeb search results:\n");
  console.log(result);
}

main().catch((error: unknown) => {
  console.error("Web search test failed:", error);
  process.exitCode = 1;
});