import type { EngineChoice, EngineId } from "@/lib/vesta/engines";

/** How each engine is introduced in the Engine room. Words only: availability always comes from the server. */
export const ENGINE_META: Record<EngineChoice, { tag: string; blurb: string; short: string }> = {
  auto: { tag: "CHAIN", blurb: "Best available first, then falls back", short: "Auto" },
  claude: { tag: "PAID", blurb: "Anthropic API · best quality", short: "Claude" },
  openai: { tag: "PAID", blurb: "OpenAI API key", short: "ChatGPT" },
  freellmapi: { tag: "LOCAL", blurb: "Your free pool, on this PC", short: "FreeLLM" },
  openrouter: { tag: "FREE", blurb: "Free tier", short: "OpenRtr" },
  groq: { tag: "FREE", blurb: "Free tier · very fast", short: "Groq" },
  gemini: { tag: "FREE", blurb: "Free tier", short: "Gemini" },
  offline: { tag: "NO AI", blurb: "Rule-based, never fails", short: "Offline" },
};

export const ENGINE_COLORS: Record<EngineId, string> = {
  claude: "#ffb98a",
  openai: "#9ad1c4",
  freellmapi: "#ff7a2f",
  openrouter: "#c4b5fd",
  groq: "#f472b6",
  gemini: "#6ea8fe",
  offline: "#97a3bc",
};

const PLATFORM_COLORS: Record<string, string> = {
  google: "#6ea8fe",
  groq: "#f472b6",
  openrouter: "#c4b5fd",
  cerebras: "#fbbf24",
  mistral: "#fb923c",
  github: "#9ad1c4",
  cohere: "#86efac",
  nvidia: "#a3e635",
};
const SPARE = ["#67e8f9", "#fda4af", "#d8b4fe", "#fde68a", "#a5b4fc"];

/** A steady colour per FreeLLMAPI platform for the budget bar. */
export function platformColor(platform: string): string {
  const p = platform.toLowerCase();
  if (PLATFORM_COLORS[p]) return PLATFORM_COLORS[p];
  let h = 0;
  for (const c of p) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return SPARE[h % SPARE.length];
}
