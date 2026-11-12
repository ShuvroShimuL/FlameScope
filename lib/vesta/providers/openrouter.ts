import { openAICompatProvider } from "./openai-compat";
import { BRAND } from "../../brand";
import type { Provider } from "./types";

/** OpenRouter via the openai SDK pointed at OpenRouter's OpenAI-compatible endpoint. */
export function openRouterProvider(apiKey: string, model: string): Provider {
  return openAICompatProvider({
    id: "openrouter",
    apiKey,
    model,
    baseURL: "https://openrouter.ai/api/v1",
    headers: { "HTTP-Referer": BRAND.urls.repo, "X-Title": `${BRAND.name} ${BRAND.assistant.name}` },
    // low effort, reasoning left out of the reply: fast answers, and the output budget goes to the answer and tool calls
    extraBody: () => ({ reasoning: { effort: "low", exclude: true } }),
  });
}
