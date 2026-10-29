import type { ChatMessage } from "../types/llm-types.js";
import { generateResponse } from "../llm/client.js";
import type { ToolRegistry } from "../tools/tool-registry.js";

const MAX_ITERATIONS = 15;

interface ToolCallResponse {
  type: "tool_call";
  name: string;
  input: unknown;
}

interface FinalResponse {
  type: "final";
  answer: string;
}

type AgentResponse = ToolCallResponse | FinalResponse;

function buildSystemPrompt(registry: ToolRegistry): string {
  const availableTools = registry.describeTools();

  return `You are acode, an AI coding and terminal assistant.

CAPABILITIES AND BEHAVIOR:
    - You have tools to inspect, edit, and run code in the local workspace (".").
    - For local files or code: ALWAYS use tools (read_file, edit_file, run_command) to inspect or test before answering.
    - For documentation, current information, or libraries: Use web_search (and fetch_webpage to read full documentation links).
    - For general concepts or simple questions: Answer directly using your knowledge without tools.

AVAILABLE TOOLS:
${JSON.stringify(availableTools, null, 2)}

RESPONSE PROTOCOL:
Return exactly one JSON object per response. Do not use Markdown fences.

To call a tool:
{"type":"tool_call","name":"TOOL_NAME","input":{}}

To provide your final answer:
{"type":"final","answer":"Your answer"}

The tool_call name must exactly match a name in AVAILABLE TOOLS.
The input must match that tool's inputSchema.
Return only one tool call per response. After receiving the tool result, decide whether to call another tool or provide the final answer.
Escape special characters such as quotation marks and newlines correctly inside JSON strings.

Example tool call:
{"type":"tool_call","name":"run_command","input":{"command":"free -h"}}

Example final answer:
{"type":"final","answer":"The command completed successfully."}`;
}

function parseAgentResponse(response: string): AgentResponse {
  const cleaned = response
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Response did not contain a valid JSON object.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("Response contained invalid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Response must be a JSON object.");
  }

  if (
    "type" in parsed &&
    parsed.type === "tool_call" &&
    "name" in parsed &&
    typeof parsed.name === "string" &&
    "input" in parsed
  ) {
    return {
      type: "tool_call",
      name: parsed.name,
      input: parsed.input,
    };
  }

  if (
    "type" in parsed &&
    parsed.type === "final" &&
    "answer" in parsed &&
    typeof parsed.answer === "string"
  ) {
    return {
      type: "final",
      answer: parsed.answer,
    };
  }

  throw new Error("Response did not match the required agent protocol.");
}

export async function runAgent(
  userRequest: string,
  registry: ToolRegistry,
  sessionHistory: ChatMessage[] = [],
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt(registry),
    },
    ...sessionHistory,
    {
      role: "user",
      content: userRequest,
    },
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await generateResponse(messages);

    messages.push({
      role: "assistant",
      content: response,
    });

    let decision: AgentResponse;

    try {
      decision = parseAgentResponse(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      messages.push({
        role: "user",
        content:
          `Your previous response was invalid: ${message}\n` +
          'Return exactly one valid JSON object: either {"type":"tool_call","name":"TOOL_NAME","input":{}} ' +
          'or {"type":"final","answer":"Your answer"}. ' +
          "For tool calls, use only a tool and input schema listed in the system prompt.",
      });

      continue;
    }

    if (decision.type === "final") {
      return decision.answer;
    }

    console.log(`\n🔧 Selected tool: ${decision.name}`);
    switch (decision.name) {
      case "read_file":
        console.log("📂 Reading file...");
        break;
      case "list_directory":
        console.log("📁 Listing directory...");
        break;
      case "find_files":
        console.log("🔎 Finding files...");
        break;
      case "write_file":
        console.log("📝 Writing file...");
        break;
      case "edit_file":
        console.log("✏️ Editing file...");
        break;
      case "run_command":
        console.log("▶ Running command...");
        break;
      case "web_search":
        console.log("🌐 Searching the web...");
        break;
      case "fetch_webpage":
        console.log("📄 Reading webpage...");
        break;
    }

    try {
      const result = await registry.execute(decision.name, decision.input);

      messages.push({
        role: "user",
        content:
          `Result from tool "${decision.name}":\n` + JSON.stringify(result),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      messages.push({
        role: "user",
        content:
          `Tool "${decision.name}" failed: ${message}\n` +
          "Use this error to decide what to do next. " +
          "Do not claim the operation succeeded.",
      });
    }
  }

  return (
    `I reached the maximum of ${MAX_ITERATIONS} agent iterations ` +
    "before completing the request. Some operations may have been performed; " +
    "check the tool results before retrying."
  );
}
