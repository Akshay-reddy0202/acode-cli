import type { ChatMessage } from "../types/llm-types.js";
import { generateResponse } from "../llm/client.js";
import type { ToolRegistry } from "../tools/tool-registry.js";

const MAX_ITERATIONS = 5;

const SYSTEM_PROMPT = `You are acode, an AI coding assistant with direct terminal access to the user's computer.

CAPABILITIES & AGENCY:
- You have access to a real Linux/WSL terminal and filesystem.
- NEVER say "as an AI I cannot access your computer or hardware". Instead, USE YOUR TOOLS to find the answer.
- For system or hardware questions (RAM, CPU, OS, disk, git status), use "run_command" with standard Linux commands (e.g., free -h, lscpu, uname -a, df -h).
- The workspace root is "." (current directory). Never ask the user for paths.

### AVAILABLE TOOLS
1. list_directory: {"directoryPath": "."}
2. read_file: {"filePath": "README.md"}
3. find_files: {"pattern": "*.ts", "directoryPath": "src"}
4. write_file: {"filePath": "example.txt", "content": "Hello"}
5. edit_file: {"filePath": "example.txt", "oldText": "Hello", "newText": "Hi"}
6. run_command: {"command": "free -h"} (Executes any Bash command in the terminal)

### RESPONSE PROTOCOL
Return EXACTLY ONE JSON object per response. No markdown fences.

- To call a tool:
{"type":"tool_call","name":"TOOL_NAME","input":{...}}

- To give the final answer:
{"type":"final","answer":"Your answer"}

CRITICAL: Never put raw line breaks inside JSON strings. Use \\n for newlines.

### EXAMPLES

User: What is the RAM of this pc?
Assistant: {"type":"tool_call","name":"run_command","input":{"command":"free -h"}}

User: Result from tool "run_command": {"stdout":"total used free\\nMem: 15Gi 6.2Gi 5.8Gi"}
Assistant: {"type":"final","answer":"This PC has 16 GB of RAM (15 GiB total, with approximately 5.8 GiB currently free)."}

User: List all files in the project
Assistant: {"type":"tool_call","name":"list_directory","input":{"directoryPath":"."}}

User: Hi!
Assistant: {"type":"final","answer":"Hello! I'm acode. How can I help you with your project or system today?"}
`;

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

function parseAgentResponse(response: string): AgentResponse {
  const cleaned = response
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  // If there are no JSON brackets, it's a natural language final answer!
  if (start === -1 || end === -1 || end < start) {
    return { type: "final", answer: cleaned };
  }

  try {
    const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1));

    if (
      typeof parsed === "object" &&
      parsed !== null &&
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
      typeof parsed === "object" &&
      parsed !== null &&
      "type" in parsed &&
      parsed.type === "final" &&
      "answer" in parsed &&
      typeof parsed.answer === "string"
    ) {
      return { type: "final", answer: parsed.answer };
    }
  } catch {
    // If JSON parsing failed because of raw newlines in an answer:
    if (!cleaned.includes('"tool_call"')) {
      return { type: "final", answer: cleaned };
    }
  }

  // Only throw an error if it attempted a tool call and broke the syntax
  throw new Error("Invalid agent tool call format.");
}

export async function runAgent(
  userRequest: string,
  registry: ToolRegistry,
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
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
    } catch {
      messages.push({
        role: "user",
        content:
          "Your previous response was not valid JSON in the required format. " +
          'Return either {"type":"tool_call","name":"TOOL_NAME","input":{}} ' +
          'or {"type":"final","answer":"Your answer"}.',
      });
      continue;
    }

    if (decision.type === "final") {
      return decision.answer;
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
          `Tool "${decision.name}" failed:${message}\n` +
          "Use this error to decide what to do next",
      });
    }
  }

  return "I reached the maximum number of tool iterations. Please try a more specific request. ";
}
