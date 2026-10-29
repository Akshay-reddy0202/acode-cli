import { runAgent } from "./agent-loop.js";
import type { ToolRegistry } from "../tools/tool-registry.js";
import type { ChatMessage } from "../types/llm-types.js";

export class Conversation {
  private readonly history: ChatMessage[] = [];

  constructor(private readonly registry: ToolRegistry) {}

  async send(userInput: string): Promise<string> {
    // 1. Run the agent with current clean history
    const answer = await runAgent(userInput, this.registry, this.history);

    this.history.push({ role: "user", content: userInput });
    this.history.push({ role: "assistant", content: answer });

    // 3. Keep only the last 2 questions and answers (4 messages max)

    if (this.history.length > 4) {
      this.history.splice(0, this.history.length - 4);
    }

    return answer;
  }

  // Allows wiping memory when needed
  clear(): void {
    this.history.length = 0;
  }
}
