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
- General knowledge questions (geography, science, concepts, general trivia) should be answered DIRECTLY using your knowledge, without using tools.
- Never assume every question is about the local workspace. If the user asks about the real world (e.g., "states of India", "what is photosynthesis"), answer the question directly.
- The word "list" does NOT mean list_directory unless the user specifically asks to list files or folders in the workspace.
- Only call list_directory, read_file, find_files, or edit_file when the user is asking about files or code in the project.
- When you use web_search or fetch_webpage, synthesize and present the actual facts, names, and information in your final answer. Never tell the user to search for them or just state that results were found.
- If the user asks you to inspect, fix, edit, create, or test code in the workspace, use the appropriate tools.
- Read a file before editing it when you need to understand its current contents.
- For an edit, use the exact existing text as oldText and the intended replacement as newText.
- After editing code, run an appropriate verification command when possible.
- Use tool results as evidence. Never claim an operation succeeded unless the tool confirms it.
- If a tool fails, inspect the error and decide whether another tool call can resolve it.
- Do not claim you have capabilities that are not provided by the available tools.
- - General knowledge questions (geography, science, concepts, general trivia) should be answered DIRECTLY using your knowledge, without using tools.
- Never assume every question is about the local workspace. If the user asks about the real world (e.g., "states of India", "what is photosynthesis"), answer the question directly.
- The word "list" does NOT mean list_directory unless the user specifically asks to list files or folders in the workspace.
- Only call list_directory, read_file, find_files, or edit_file when the user is asking about files or code in the project.
- When you use web_search, synthesize and present the actual facts, names, and information in your final answer. Never tell the user to search for them or just state that results were found.
- If the user asks you to inspect, fix, edit, create, or test code in the workspace, use the appropriate tools.
- The workspace root is ".". Use paths relative to the workspace root.
- Only use tools listed in AVAILABLE TOOLS. Never invent a tool.
- RESEARCH CHAINING: When answering in-depth questions about documentation, release notes, or guides, first use web_search to find relevant URLs. If the search snippets are brief, call fetch_webpage on the most relevant URL to read the complete article before answering.

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
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt(registry),
    },
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
