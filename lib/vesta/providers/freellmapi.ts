import { openAICompatProvider } from "./openai-compat";
import type { Provider } from "./types";

/**
 * FreeLLMAPI: a router the user runs on their own PC (github.com/tashfeenahmed/freellmapi). One
 * OpenAI-compatible endpoint over their free provider keys; with model "auto" it picks the model itself
 * and, because VESTA sends tools, only from models that can call tools. Local only: the live site
 * on Vercel cannot reach a PC, so there it simply has no key.
 */
export function freeLLMAPIProvider(apiKey: string, model: string, baseURL: string): Provider {
  return openAICompatProvider({
    id: "freellmapi",
    apiKey,
    model,
    baseURL,
    headers: { "X-Title": "HEARTH VESTA" },
    reportServedModel: true,
  });
}
