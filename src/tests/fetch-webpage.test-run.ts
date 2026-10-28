import { fetchWebpageTool } from "../tools/fetch-webpage.js";

async function main(): Promise<void> {
  console.log("Testing fetch_webpage with example.com...\n");

  const result = await fetchWebpageTool({
    url: "https://example.com",
  });

  console.log("Result:\n");
  console.log(result);
}

main().catch((error: unknown) => {
  console.error("fetch_webpage test failed:", error);
  process.exitCode = 1;
});

