import { generateResponse } from "../llm/client.js";
import type { ChatMessage } from "../types/llm-types.js";

export class Conversation {
  private readonly messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are acode-cli, a helpful AI coding assistant. Give clear, accurate, concise answers, especially for programming questions.",
    },
  ];

  async send(userInput: string): Promise<string> {
    this.messages.push({
      role: "user",
      content: userInput,
    });

    try {
      const answer = await generateResponse(this.messages);
      this.messages.push({
        role: "assistant",
        content: answer,
      });
      return answer;
    } catch (error) {
      this.messages.pop();
      throw error;
    }
  }
}
