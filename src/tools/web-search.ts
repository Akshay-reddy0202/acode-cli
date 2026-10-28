import type { WebSearchInput } from "../types/tool-types.js";

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

function cleanHtml(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractActualUrl(rawUrl: string): string {
  try {
    const fullUrl = rawUrl.startsWith("//")
      ? `https:${rawUrl}`
      : rawUrl.startsWith("http")
        ? rawUrl
        : `https://duckduckgo.com${rawUrl}`;

    const parsed = new URL(fullUrl);
    const target = parsed.searchParams.get("uddg");

    if (target) {
      return decodeURIComponent(target);
    }

    return fullUrl;
  } catch {
    return rawUrl;
  }
}

export async function webSearchTool(input: WebSearchInput): Promise<string> {
  const query = input.query.trim();

  if (!query) {
    throw new Error("Search query cannot be empty.");
  }

  try {
    // DuckDuckGo HTML endpoint requires POST with standard browser headers to avoid anti-bot blocks
    const response = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      body: new URLSearchParams({ q: query }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo returned HTTP status ${response.status}`);
    }

    const html = await response.text();
    const results: WebSearchResult[] = [];

    // Split HTML by search result blocks to avoid fragile nested tag regexes
    const rawBlocks = html
      .split(/class="[^"]*result\s+results_links/i)
      .slice(1);

    for (const block of rawBlocks) {
      if (results.length >= 5) {
        break;
      }

      const titleMatch = block.match(
        /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
      );

      const snippetMatch = block.match(
        /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i,
      );

      const rawUrl = titleMatch?.[1];
      const rawTitle = titleMatch?.[2];
      const rawSnippet = snippetMatch?.[1] ?? "";

      if (!rawUrl || !rawTitle) {
        continue;
      }

      const url = extractActualUrl(rawUrl);
      const title = cleanHtml(rawTitle);
      const snippet = cleanHtml(rawSnippet);

      if (title && url.startsWith("http")) {
        results.push({
          title,
          url,
          snippet,
        });
      }
    }

    if (results.length === 0) {
      return `No web search results found for: "${query}".`;
    }

    return JSON.stringify(results, null, 2);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Web search failed: ${message}`);
  }
}
