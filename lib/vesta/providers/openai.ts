import { openAICompatProvider } from "./openai-compat";
import type { Provider } from "./types";

/** GPT-5 and o-series reasoning models accept only their default temperature. */
const isReasoningModel = (m: string) => /^(gpt-5|o\d)/i.test(m);

/** ChatGPT models via the OpenAI API (paid key from platform.openai.com). */
export function openAIProvider(apiKey: string, model: string): Provider {
  return openAICompatProvider({
    id: "openai",
    apiKey,
    model,
    baseURL: "https://api.openai.com/v1",
    temperature: (m) => (isReasoningModel(m) ? null : 0.2),
    // low effort keeps reasoning models fast and cheap; the answer and tool calls get the output budget
    extraBody: (m) => (isReasoningModel(m) ? { reasoning_effort: "low" } : {}),
  });
}
