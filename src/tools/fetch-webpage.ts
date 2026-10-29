import type { FetchWebpageInput } from "../types/tool-types.js";

const MAX_CONTENT_LENGTH = 5000;

function cleanHtmlToText(html: string): string {
  return (
    html
      // Remove scripts, styles, noscript, svg, nav, footer
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
      // Convert headings and block tags to newlines
      .replace(/<\/(h[1-6]|p|div|li|tr)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      // Remove all remaining HTML tags
      .replace(/<[^>]+>/g, "")
      // Decode common HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      // Clean up excessive whitespace
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n\n")
      .trim()
  );
}

export async function fetchWebpageTool(
  input: FetchWebpageInput,
): Promise<string> {
  const rawUrl = input.url.trim();

  if (!rawUrl) {
    throw new Error("URL cannot be empty.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Only http: and https: protocols are supported.");
    }
  } catch (error) {
    throw new Error(
      `Invalid URL: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  try {
    const response = await fetch(parsedUrl.href, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch page: HTTP status ${response.status} ${response.statusText}`,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/json")
    ) {
      return `Page fetched successfully, but content type is not readable text (${contentType}).`;
    }

    const rawContent = await response.text();
    const cleanText = contentType.includes("text/html")
      ? cleanHtmlToText(rawContent)
      : rawContent.trim();

    if (!cleanText) {
      return `No readable text content found at: ${parsedUrl.href}`;
    }

    if (cleanText.length > MAX_CONTENT_LENGTH) {
      return (
        cleanText.slice(0, MAX_CONTENT_LENGTH) +
        `\n\n[Content truncated at ${MAX_CONTENT_LENGTH} characters...]`
      );
    }

    return cleanText;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch webpage "${rawUrl}": ${message}`);
  }
}
