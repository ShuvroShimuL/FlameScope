/**
 * Read-only status of the user's local FreeLLMAPI app for the Engine room (server side only).
 *
 * - Provider health: GET {base}/providers with the unified API key (FreeLLMAPI's documented status endpoint).
 * - Monthly token budget: the desktop app lets programs on the same PC open a dashboard session
 *   (POST /api/auth/desktop-session), then GET /api/fallback/token-usage — the numbers on its Models page.
 *   Only tried when the address is this computer, and FREELLMAPI_BUDGET=off turns it off.
 *
 * Never returns a key, a session token or provider error text. Everything fails soft to "not connected".
 */
import { z } from "zod";
import { engineKey, freellmapiBaseURL } from "./engines";

const TIMEOUT_MS = 2500;
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

export type ProviderHealth = "healthy" | "rate_limited" | "invalid" | "unknown";

export interface FreeLLMAPIStatus {
  /** The app answered with this key. */
  connected: boolean;
  /** Why not, in plain words (no provider text). */
  problem?: "unreachable" | "key_rejected" | "error";
  providers: { name: string; status: ProviderHealth; keys: number; requests_remaining_pct: number | null; resume_at: string | null }[];
  /** FreeLLMAPI's own monthly estimate from published free-tier quotas. Null when it could not be read. */
  budget: null | {
    total: number;
    used: number;
    remaining: number;
    models: { name: string; platform: string; budget: number; used: number; remaining: number }[];
    /** Models in the pool with no published quota (not counted in the total). */
    unpublished: number;
  };
}

const num = z.coerce.number().finite().catch(0);

const ProvidersBody = z.object({
  providers: z
    .array(
      z.object({
        name: z.string().catch("unknown"),
        platform: z.string().optional(),
        status: z.enum(["healthy", "rate_limited", "invalid", "unknown"]).catch("unknown"),
        keys: num,
        requests_remaining_pct: z.number().finite().nullable().optional(),
        resume_at: z.string().nullable().optional(),
      }),
    )
    .catch([]),
});

const UsageBody = z.object({
  totalBudget: num,
  totalUsed: num,
  models: z
    .array(z.object({ displayName: z.string().catch("model"), platform: z.string().catch("unknown"), budget: num, used: num }))
    .catch([]),
});

type Fetch = typeof fetch;

async function call(f: Fetch, url: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await f(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(t);
  }
}

/** The dashboard session, kept in server memory only and renewed when it stops working. */
let session: { origin: string; token: string } | null = null;

export function resetFreeLLMAPISession() {
  session = null;
}

async function desktopToken(f: Fetch, origin: string, fresh: boolean): Promise<string | null> {
  if (!fresh && session?.origin === origin) return session.token;
  const res = await call(f, `${origin}/api/auth/desktop-session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  if (!res.ok) return null;
  const token = ((await res.json()) as { token?: unknown })?.token;
  if (typeof token !== "string" || token.length < 16) return null;
  session = { origin, token };
  return token;
}

async function readBudget(f: Fetch, origin: string): Promise<FreeLLMAPIStatus["budget"]> {
  for (const fresh of [false, true]) {
    const token = await desktopToken(f, origin, fresh);
    if (!token) return null;
    const res = await call(f, `${origin}/api/fallback/token-usage`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) {
      session = null;
      continue;
    }
    if (!res.ok) return null;
    const body = UsageBody.safeParse(await res.json());
    if (!body.success) return null;
    const models = body.data.models
      .filter((m) => m.budget > 0)
      .map((m) => ({ name: m.displayName.slice(0, 80), platform: m.platform.slice(0, 40), budget: m.budget, used: m.used, remaining: Math.max(0, m.budget - m.used) }));
    const total = body.data.totalBudget;
    const used = body.data.totalUsed;
    return { total, used, remaining: Math.max(0, total - used), models, unpublished: body.data.models.length - models.length };
  }
  return null;
}

/** Null when no FreeLLMAPI key is set (e.g. on the live site): the Engine room then says "not connected". */
export async function getFreeLLMAPIStatus(env: NodeJS.ProcessEnv = process.env, f: Fetch = fetch): Promise<FreeLLMAPIStatus | null> {
  const key = engineKey("freellmapi", env);
  if (!key) return null;
  const base = freellmapiBaseURL(env);
  const out: FreeLLMAPIStatus = { connected: false, providers: [], budget: null };

  try {
    const res = await call(f, `${base}/providers`, { headers: { Authorization: `Bearer ${key}` } });
    if (res.status === 401 || res.status === 403) return { ...out, problem: "key_rejected" };
    if (!res.ok) return { ...out, problem: "error" };
    const body = ProvidersBody.safeParse(await res.json());
    out.connected = true;
    if (body.success) {
      out.providers = body.data.providers.slice(0, 40).map((p) => ({
        name: p.name.slice(0, 60),
        status: p.status,
        keys: p.keys,
        requests_remaining_pct: p.requests_remaining_pct ?? null,
        resume_at: p.resume_at ?? null,
      }));
    }
  } catch {
    return { ...out, problem: "unreachable" };
  }

  const url = new URL(base);
  if (env.FREELLMAPI_BUDGET?.trim().toLowerCase() !== "off" && LOCAL_HOSTS.has(url.hostname)) {
    try {
      out.budget = await readBudget(f, url.origin);
    } catch {
      out.budget = null;
    }
  }
  return out;
}
