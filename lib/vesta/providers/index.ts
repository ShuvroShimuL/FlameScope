import { engineKey, engineModel, freellmapiBaseURL, type AiEngineId } from "../engines";
import { anthropicProvider } from "./anthropic";
import { freeLLMAPIProvider } from "./freellmapi";
import { geminiProvider } from "./gemini";
import { groqProvider } from "./groq";
import { openAIProvider } from "./openai";
import { openRouterProvider } from "./openrouter";
import type { Provider } from "./types";

/** Build a provider from env, or undefined when its key is missing. */
export function createProvider(id: AiEngineId, env: NodeJS.ProcessEnv = process.env): Provider | undefined {
  const key = engineKey(id, env);
  if (!key) return undefined;
  const model = engineModel(id, env);
  switch (id) {
    case "claude":
      return anthropicProvider(key, model);
    case "openai":
      return openAIProvider(key, model);
    case "freellmapi":
      return freeLLMAPIProvider(key, model, freellmapiBaseURL(env));
    case "openrouter":
      return openRouterProvider(key, model);
    case "groq":
      return groqProvider(key, model);
    case "gemini":
      return geminiProvider(key, model);
  }
}
