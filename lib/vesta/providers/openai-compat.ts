import OpenAI from "openai";
import { PROVIDER_TIMEOUT_MS } from "./anthropic";
import { EngineError, type ChatSession, type HistoryMessage, type Provider, type ProviderReply, type ToolResultMessage, type ToolSpec } from "./types";

const MAX_TOKENS = 1500;

type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export interface OpenAICompatOptions {
  id: Provider["id"];
  apiKey: string;
  model: string;
  baseURL: string;
  /** Sent on every request through the OpenAI client's defaultHeaders. */
  headers?: Record<string, string>;
  /** Extra request fields, spread into chat.completions.create. */
  extraBody?: (model: string) => Record<string, unknown>;
  /** Sampling temperature; null leaves it out (some reasoning models accept only their default). */
  temperature?: (model: string) => number | null;
  /** Routers only: read the model that really answered (FreeLLMAPI sends it in the body and X-Routed-Via). */
  reportServedModel?: boolean;
}

/** "<platform>/<model>" from a router's X-Routed-Via header, else the body's model field. */
export function servedModelOf(bodyModel: unknown, routedVia: string | null | undefined): string | undefined {
  const via = (routedVia ?? "").trim();
  if (via && via.length <= 160) return via;
  return typeof bodyModel === "string" && bodyModel && bodyModel !== "auto" ? bodyModel.slice(0, 160) : undefined;
}

/** OpenAI-style usage block → our TokenUsage (null for any number the service left out). */
export function usageOf(u: { prompt_tokens?: unknown; completion_tokens?: unknown } | null | undefined): ProviderReply["usage"] {
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : null);
  return { input: n(u?.prompt_tokens), output: n(u?.completion_tokens) };
}

/** Any service with an OpenAI-compatible chat completions endpoint, through the openai SDK. */
export function openAICompatProvider({ id, apiKey, model, baseURL, headers, extraBody, temperature, reportServedModel }: OpenAICompatOptions): Provider {
  const client = new OpenAI({ apiKey, baseURL, defaultHeaders: headers, maxRetries: 0, timeout: PROVIDER_TIMEOUT_MS });
  return {
    id,
    model,
    startSession({ system, history, tools }: { system: string; history: HistoryMessage[]; tools: ToolSpec[] }): ChatSession {
      const messages: Msg[] = [{ role: "system", content: system }, ...history.map((m) => ({ role: m.role, content: m.content }) as Msg)];
      const toolDefs: OpenAI.Chat.Completions.ChatCompletionTool[] = tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
      return {
        async send(signal: AbortSignal): Promise<ProviderReply> {
          const temp = temperature ? temperature(model) : 0.2;
          const { data: res, response } = await client.chat.completions
            .create(
              {
                model,
                messages,
                tools: toolDefs,
                tool_choice: "auto",
                max_completion_tokens: MAX_TOKENS,
                ...(temp === null ? {} : { temperature: temp }),
                ...extraBody?.(model),
              } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
              { signal, timeout: PROVIDER_TIMEOUT_MS },
            )
            .withResponse();
          const choice = res.choices?.[0];
          if (!choice) throw new EngineError("server", "empty response");
          const msg = choice.message;
          const calls = (msg.tool_calls ?? []).filter((c) => c.type === "function");
          messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls.length ? calls : undefined } as Msg);
          const toolCalls = calls.map((c) => {
            if (c.type !== "function") throw new EngineError("bad_tool_output");
            let args: unknown;
            try {
              args = c.function.arguments ? JSON.parse(c.function.arguments) : {};
            } catch {
              throw new EngineError("bad_tool_output", "tool arguments are not valid JSON");
            }
            return { id: c.id, name: c.function.name, args };
          });
          return {
            text: msg.content ?? "",
            toolCalls,
            stop: toolCalls.length ? "tool_use" : choice.finish_reason === "length" ? "max_tokens" : "end",
            usage: usageOf(res.usage),
            servedModel: reportServedModel ? servedModelOf(res.model, response.headers.get("x-routed-via")) : undefined,
          };
        },
        addToolResults(results: ToolResultMessage[]) {
          for (const r of results) messages.push({ role: "tool", tool_call_id: r.id, content: r.content });
        },
        addUserText(text: string) {
          messages.push({ role: "user", content: text });
        },
      };
    },
  };
}
