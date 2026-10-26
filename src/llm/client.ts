const LLM_BASE_URL = "http://127.0.0.1:9931/v1";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  choices: {
    message: ChatMessage;
  }[];
}

export async function generateResponse(
  messages: ChatMessage[],
): Promise<string> {
  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M",
      messages,
      temperature: 0.2,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `LLM request failed: ${response.status} ${response.statusText}\n${errorBody}`,
    );
  }

  const data = (await response.json()) as ChatCompletionResponse;

  const answer = data.choices[0]?.message.content;

  if (!answer) {
    throw new Error("The model returned an empty response.");
  }

  return answer;
}
