import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as meterGET } from "@/app/api/vesta/meter/route";
import { addAnswer, addUsage, answersLeft, averagePerAnswer, burnRate, burnTotals, clock, emptyTally, formatTokens, remainingPct } from "@/lib/vesta/burn";
import { engineChain, engineModel, freellmapiBaseURL, FREELLMAPI_DEFAULT_URL, listEngines } from "@/lib/vesta/engines";
import type { VestaEvent } from "@/lib/vesta/events";
import { getFreeLLMAPIStatus, resetFreeLLMAPISession } from "@/lib/vesta/freellmapi-status";
import { createProvider } from "@/lib/vesta/providers";
import { servedModelOf, usageOf } from "@/lib/vesta/providers/openai-compat";
import type { ChatSession, Provider, ProviderReply } from "@/lib/vesta/providers/types";
import { clearVestaCache, cooldownStatus, runVesta, type RouterDeps } from "@/lib/vesta/router";

// ------------------------------------------------------------------ helpers
function scripted(id: Provider["id"], replies: (ProviderReply | Error)[], model = `${id}-test-model`): Provider {
  return {
    id,
    model,
    startSession(): ChatSession {
      let i = 0;
      return {
        async send() {
          const r = replies[Math.min(i++, replies.length - 1)];
          if (r instanceof Error) throw r;
          return r;
        },
        addToolResults() {},
        addUserText() {},
      };
    },
  };
}

const httpError = (status: number) => Object.assign(new Error(`status ${status}`), { status });
const GOOD: ProviderReply[] = [
  { text: "", toolCalls: [{ id: "a", name: "physics_calc", args: { o2_pct: 34, pressure_psi: 8.2 } }], stop: "tool_use", usage: { input: 1200, output: 40 }, servedModel: "google/gemini-3.5-flash" },
  { text: "pO2 is **2.788 psi** (lib/physics.ts).\nConfidence: supported", toolCalls: [], stop: "end", usage: { input: 1500, output: 60 }, servedModel: "google/gemini-3.5-flash" },
];

async function ask(deps: RouterDeps, engine: "auto" | "freellmapi" | "openai" = "auto", useCache = false) {
  const events: VestaEvent[] = [];
  await runVesta({ messages: [{ role: "user", content: "What is pO2 at 34% O2 and 8.2 psi?" }], missionId: "lunar-rover", level: "researcher", engine }, (e) => events.push(e), {
    chunkDelayMs: 0,
    useCache,
    timeoutMs: 200,
    log: () => {},
    ...deps,
  });
  const engines = events.filter((e): e is Extract<VestaEvent, { type: "engine" }> => e.type === "engine");
  const usage = events.filter((e): e is Extract<VestaEvent, { type: "usage" }> => e.type === "usage");
  return { events, engines, usage, last: engines[engines.length - 1] };
}

beforeEach(() => clearVestaCache());

// ------------------------------------------------------------------ engines
describe("ChatGPT and FreeLLMAPI engines", () => {
  it("sit in the chain after Claude and before the free engines", () => {
    expect(engineChain("auto")).toEqual(["claude", "openai", "freellmapi", "openrouter", "groq", "gemini", "offline"]);
    expect(engineChain("freellmapi")[0]).toBe("freellmapi");
  });

  it("are available only with a key, and show 'no key' otherwise", () => {
    const none = listEngines({} as NodeJS.ProcessEnv);
    expect(none.find((e) => e.id === "openai")?.available).toBe(false);
    expect(none.find((e) => e.id === "freellmapi")?.available).toBe(false);
    const env = { FREELLMAPI_API_KEY: "fl-key-1234567890", OPENAI_API_KEY: "PASTE_HERE" } as unknown as NodeJS.ProcessEnv;
    const some = listEngines(env);
    expect(some.find((e) => e.id === "freellmapi")).toEqual({ id: "freellmapi", label: "FreeLLMAPI", available: true });
    expect(some.find((e) => e.id === "openai")).toEqual({ id: "openai", label: "ChatGPT", available: false });
  });

  it("FreeLLMAPI lets the router pick the model and defaults to the desktop app's address", () => {
    expect(engineModel("freellmapi", {} as NodeJS.ProcessEnv)).toBe("auto");
    expect(freellmapiBaseURL({} as NodeJS.ProcessEnv)).toBe(FREELLMAPI_DEFAULT_URL);
    expect(freellmapiBaseURL({ FREELLMAPI_BASE_URL: "http://localhost:3001/v1/ # note" } as unknown as NodeJS.ProcessEnv)).toBe("http://localhost:3001/v1");
    expect(freellmapiBaseURL({ FREELLMAPI_BASE_URL: "not a url" } as unknown as NodeJS.ProcessEnv)).toBe(FREELLMAPI_DEFAULT_URL);
  });

  it("builds providers from env without exposing the key", () => {
    const env = { FREELLMAPI_API_KEY: "fl-key-1234567890", OPENAI_API_KEY: "sk-test-1234567890" } as unknown as NodeJS.ProcessEnv;
    const f = createProvider("freellmapi", env);
    const o = createProvider("openai", env);
    expect([f?.id, f?.model]).toEqual(["freellmapi", "auto"]);
    expect([o?.id, o?.model]).toEqual(["openai", "gpt-5-mini"]);
    expect(JSON.stringify([f, o])).not.toContain("1234567890");
    expect(createProvider("openai", {} as NodeJS.ProcessEnv)).toBeUndefined();
  });

  it("FreeLLMAPI answers when set and falls back on a free-limit 429", async () => {
    const ok = await ask({ providers: { freellmapi: scripted("freellmapi", GOOD, "auto") } });
    expect(ok.last.id).toBe("freellmapi");
    expect(ok.last.badge).toBe("via FreeLLMAPI · auto");
    clearVestaCache();
    const r = await ask({ providers: { freellmapi: scripted("freellmapi", [httpError(429)]), groq: scripted("groq", GOOD) } });
    expect(r.last.id).toBe("groq");
    expect(r.last.note).toBe("FreeLLMAPI limit reached, answered with Groq");
    const rest = cooldownStatus().find((c) => c.id === "freellmapi");
    expect(rest?.total_seconds).toBe(60);
    expect(rest?.seconds_left).toBeGreaterThan(0);
    expect(rest?.reason).toBe("limit reached");
  });
});

// ------------------------------------------------------------------ token usage events
describe("token usage events", () => {
  it("come once per model call with the provider's numbers and the served model", async () => {
    const r = await ask({ providers: { freellmapi: scripted("freellmapi", GOOD, "auto") } });
    expect(r.usage).toEqual([
      { type: "usage", engine: "freellmapi", model: "auto", served: "google/gemini-3.5-flash", input: 1200, output: 40 },
      { type: "usage", engine: "freellmapi", model: "auto", served: "google/gemini-3.5-flash", input: 1500, output: 60 },
    ]);
    const types = r.events.map((e) => e.type);
    expect(types.indexOf("usage")).toBeGreaterThan(types.indexOf("engine"));
    expect(types.lastIndexOf("usage")).toBeLessThan(types.indexOf("text"));
  });

  it("say null when a provider reports no tokens", async () => {
    const r = await ask({ providers: { claude: scripted("claude", [{ text: "I can help with oxygen questions.\nConfidence: no_data", toolCalls: [], stop: "end" }]) } });
    expect(r.usage).toHaveLength(1);
    expect([r.usage[0].input, r.usage[0].output]).toEqual([null, null]);
  });

  it("are not replayed for a cached answer, and Offline mode sends none", async () => {
    const p = scripted("groq", GOOD);
    const first = await ask({ providers: { groq: p } }, "auto", true);
    const second = await ask({ providers: { groq: p } }, "auto", true);
    expect(first.usage).toHaveLength(2);
    expect(second.usage).toHaveLength(0);
    expect(second.events[second.events.length - 1]).toEqual({ type: "done", cached: true });
    clearVestaCache();
    const off = await ask({ providers: {} });
    expect(off.last.id).toBe("offline");
    expect(off.usage).toHaveLength(0);
  });
});

// ------------------------------------------------------------------ OpenAI-format helpers
describe("OpenAI-format usage and routed model", () => {
  it("reads prompt / completion tokens and keeps unknowns null", () => {
    expect(usageOf({ prompt_tokens: 812, completion_tokens: 95 })).toEqual({ input: 812, output: 95 });
    expect(usageOf(undefined)).toEqual({ input: null, output: null });
    expect(usageOf({ prompt_tokens: -3, completion_tokens: "7" })).toEqual({ input: null, output: null });
  });

  it("prefers FreeLLMAPI's X-Routed-Via header, then the body's model, never 'auto'", () => {
    expect(servedModelOf("gemini-3.5-flash", "google/gemini-3.5-flash")).toBe("google/gemini-3.5-flash");
    expect(servedModelOf("qwen3.8-27b", null)).toBe("qwen3.8-27b");
    expect(servedModelOf("auto", "")).toBeUndefined();
  });
});

// ------------------------------------------------------------------ burn maths
describe("burn maths", () => {
  it("adds calls per engine and counts calls without a token report", () => {
    let t = emptyTally();
    t = addUsage(t, { engine: "groq", input: 1000, output: 200 });
    t = addUsage(t, { engine: "groq", input: null, output: null });
    t = addUsage(t, { engine: "freellmapi", input: 50, output: null });
    expect(t.byEngine.groq).toEqual({ input: 1000, output: 200, calls: 2, unreported: 1 });
    expect(burnTotals(t)).toEqual({ input: 1050, output: 200, total: 1250, calls: 3, unreported: 1 });
  });

  it("averages answers and turns a budget into answers left: floor(remaining / average)", () => {
    let t = emptyTally();
    t = addAnswer(addAnswer(addAnswer(t, 3000), 5000), 0);
    expect(t.answers).toEqual([3000, 5000]);
    expect(averagePerAnswer(t.answers)).toBe(4000);
    expect(averagePerAnswer([])).toBeNull();
    expect(answersLeft(141_000_000, 4000)).toBe(35_250);
    expect(answersLeft(141_000_000, null)).toBeNull();
    expect(answersLeft(null, 4000)).toBeNull();
  });

  it("gives remaining share, burn rate, token labels and clocks", () => {
    expect(remainingPct(140_999_347, 141_000_000)).toBe(99.9);
    expect(remainingPct(141_000_000, 141_000_000)).toBe(100);
    expect(remainingPct(70_500_000, 141_000_000)).toBe(50);
    expect(remainingPct(5, 0)).toBeNull();
    expect(burnRate(3000, 2000)).toBe(1500);
    expect(burnRate(10, 50)).toBeNull();
    expect([formatTokens(653), formatTokens(12_400), formatTokens(141_000_000), formatTokens(null)]).toEqual(["653", "12.4k", "141.0M", "–"]);
    expect([clock(42), clock(61), clock(-3)]).toEqual(["0:42", "1:01", "0:00"]);
  });
});

// ------------------------------------------------------------------ FreeLLMAPI status
const KEY = "fl-unified-KEY-0123456789";
const SESSION = "session-TOKEN-abcdefabcdefabcdef";
const ENV = { FREELLMAPI_API_KEY: KEY } as unknown as NodeJS.ProcessEnv;

type Route = (init: RequestInit | undefined) => Response;
function fakeFetch(routes: Record<string, Route>) {
  const calls: string[] = [];
  const f = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(`${init?.method ?? "GET"} ${url}`);
    const route = routes[url];
    if (!route) throw new TypeError("fetch failed");
    return route(init);
  }) as typeof fetch;
  return { f, calls };
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const BASE = "http://127.0.0.1:31415";
const PROVIDERS = { providers: [{ platform: "google", name: "Google AI Studio", status: "healthy", keys: 1 }, { platform: "groq", name: "Groq", status: "rate_limited", keys: 1, resume_at: "2026-11-12T10:00:00.000Z" }], counts: {} };
const USAGE = {
  totalBudget: 9_000_000,
  totalUsed: 653,
  models: [
    { displayName: "Gemini 3.5 Flash", platform: "google", budget: 3_000_000, used: 653 },
    { displayName: "GPT-OSS 120B (Groq)", platform: "groq", budget: 6_000_000, used: 0 },
    { displayName: "Gemini 3.8 Flash", platform: "google", budget: 0, used: 0 },
  ],
};

describe("FreeLLMAPI status", () => {
  beforeEach(() => resetFreeLLMAPISession());

  it("is null without a key (the live site)", async () => {
    const { f, calls } = fakeFetch({});
    expect(await getFreeLLMAPIStatus({} as NodeJS.ProcessEnv, f)).toBeNull();
    expect(calls).toEqual([]);
  });

  it("reads provider health with the key and the monthly budget through the desktop session", async () => {
    const auth: string[] = [];
    const { f } = fakeFetch({
      [`${BASE}/v1/providers`]: (init) => (auth.push(String((init?.headers as Record<string, string>).Authorization)), json(PROVIDERS)),
      [`${BASE}/api/auth/desktop-session`]: () => json({ token: SESSION }),
      [`${BASE}/api/fallback/token-usage`]: (init) => (auth.push(String((init?.headers as Record<string, string>).Authorization)), json(USAGE)),
    });
    const s = await getFreeLLMAPIStatus(ENV, f);
    expect(auth).toEqual([`Bearer ${KEY}`, `Bearer ${SESSION}`]);
    expect(s?.connected).toBe(true);
    expect(s?.providers.map((p) => [p.name, p.status, p.resume_at])).toEqual([
      ["Google AI Studio", "healthy", null],
      ["Groq", "rate_limited", "2026-11-12T10:00:00.000Z"],
    ]);
    expect(s?.budget).toEqual({
      total: 9_000_000,
      used: 653,
      remaining: 8_999_347,
      unpublished: 1,
      models: [
        { name: "Gemini 3.5 Flash", platform: "google", budget: 3_000_000, used: 653, remaining: 2_999_347 },
        { name: "GPT-OSS 120B (Groq)", platform: "groq", budget: 6_000_000, used: 0, remaining: 6_000_000 },
      ],
    });
    const out = JSON.stringify(s);
    expect(out).not.toContain(KEY);
    expect(out).not.toContain(SESSION);
  });

  it("renews an expired dashboard session once", async () => {
    let n = 0;
    const { f, calls } = fakeFetch({
      [`${BASE}/v1/providers`]: () => json(PROVIDERS),
      [`${BASE}/api/auth/desktop-session`]: () => json({ token: `${SESSION}-${++n}` }),
      [`${BASE}/api/fallback/token-usage`]: (init) => ((init?.headers as Record<string, string>).Authorization.endsWith("-1") ? json({}, 401) : json(USAGE)),
    });
    const s = await getFreeLLMAPIStatus(ENV, f);
    expect(s?.budget?.total).toBe(9_000_000);
    expect(calls.filter((c) => c.includes("desktop-session"))).toHaveLength(2);
  });

  it("explains a rejected key or a closed app, without provider text", async () => {
    const rejected = await getFreeLLMAPIStatus(ENV, fakeFetch({ [`${BASE}/v1/providers`]: () => json({ error: { message: "Invalid API key" } }, 401) }).f);
    expect(rejected).toEqual({ connected: false, providers: [], budget: null, problem: "key_rejected" });
    const closed = await getFreeLLMAPIStatus(ENV, fakeFetch({}).f);
    expect(closed).toEqual({ connected: false, providers: [], budget: null, problem: "unreachable" });
  });

  it("skips the budget when turned off or when FreeLLMAPI is not on this PC", async () => {
    const off = fakeFetch({ [`${BASE}/v1/providers`]: () => json(PROVIDERS) });
    const s1 = await getFreeLLMAPIStatus({ ...ENV, FREELLMAPI_BUDGET: "off" } as NodeJS.ProcessEnv, off.f);
    expect(s1?.budget).toBeNull();
    expect(off.calls.some((c) => c.includes("/api/"))).toBe(false);
    const remote = fakeFetch({ "https://llm.example.org/v1/providers": () => json(PROVIDERS) });
    const s2 = await getFreeLLMAPIStatus({ ...ENV, FREELLMAPI_BASE_URL: "https://llm.example.org/v1" } as NodeJS.ProcessEnv, remote.f);
    expect(s2?.connected).toBe(true);
    expect(s2?.budget).toBeNull();
    expect(remote.calls).toEqual(["GET https://llm.example.org/v1/providers"]);
  });
});

describe("meter endpoint", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("returns cooldowns and no FreeLLMAPI reading without a key, never a key", async () => {
    delete process.env.FREELLMAPI_API_KEY;
    process.env.GROQ_API_KEY = "gsk_SECRET_456";
    const res = await meterGET();
    const body = await res.text();
    expect(JSON.parse(body)).toEqual({ cooldowns: [], freellmapi: null });
    expect(body).not.toContain("SECRET");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
