/**
 * Token bookkeeping for the Engine room. Pure and tested: every number the Engine room shows is either a
 * count the providers reported (via `usage` events), FreeLLMAPI's own figures, or one of these formulas.
 */
import type { EngineId } from "./engines";

export interface EngineBurn {
  input: number;
  output: number;
  /** Model calls made, including the ones whose provider did not report tokens. */
  calls: number;
  /** Calls without a token count: their tokens are missing from the totals, not guessed. */
  unreported: number;
}

export interface BurnTally {
  byEngine: Partial<Record<EngineId, EngineBurn>>;
  /** Tokens each finished AI answer used (only answers where every call reported tokens). */
  answers: number[];
}

export interface UsageLike {
  engine: EngineId;
  input: number | null;
  output: number | null;
}

export const emptyTally = (): BurnTally => ({ byEngine: {}, answers: [] });

/** Add one model call to the tally (returns a new object; the input is not changed). */
export function addUsage(t: BurnTally, u: UsageLike): BurnTally {
  const prev = t.byEngine[u.engine] ?? { input: 0, output: 0, calls: 0, unreported: 0 };
  const known = u.input !== null || u.output !== null;
  const next: EngineBurn = {
    input: prev.input + (u.input ?? 0),
    output: prev.output + (u.output ?? 0),
    calls: prev.calls + 1,
    unreported: prev.unreported + (known ? 0 : 1),
  };
  return { ...t, byEngine: { ...t.byEngine, [u.engine]: next } };
}

/** Record a finished answer's token total; keeps the last 50. */
export function addAnswer(t: BurnTally, tokens: number): BurnTally {
  if (!(tokens > 0)) return t;
  return { ...t, answers: [...t.answers, tokens].slice(-50) };
}

export function burnTotals(t: BurnTally): { input: number; output: number; total: number; calls: number; unreported: number } {
  let input = 0;
  let output = 0;
  let calls = 0;
  let unreported = 0;
  for (const b of Object.values(t.byEngine)) {
    if (!b) continue;
    input += b.input;
    output += b.output;
    calls += b.calls;
    unreported += b.unreported;
  }
  return { input, output, total: input + output, calls, unreported };
}

/** Mean tokens per answer, rounded; null before the first measured answer. */
export function averagePerAnswer(answers: number[]): number | null {
  if (!answers.length) return null;
  return Math.round(answers.reduce((a, b) => a + b, 0) / answers.length);
}

/** How many more answers a budget covers at the measured average: floor(remaining / average). */
export function answersLeft(remaining: number | null | undefined, average: number | null): number | null {
  if (remaining == null || !Number.isFinite(remaining) || remaining < 0 || !average || average <= 0) return null;
  return Math.floor(remaining / average);
}

/** Share of a budget still left, 0–100, rounded DOWN to one decimal so a used budget never reads 100%; null without a budget. */
export function remainingPct(remaining: number, total: number): number | null {
  if (!(total > 0)) return null;
  return Math.floor(Math.max(0, Math.min(1, remaining / total)) * 1000) / 10;
}

/** Tokens per second over an elapsed time; null under a tenth of a second. */
export function burnRate(tokens: number, ms: number): number | null {
  if (!(ms >= 100) || !(tokens >= 0)) return null;
  return Math.round((tokens / ms) * 1000);
}

/** 653 → "653", 12 400 → "12.4k", 141 000 000 → "141.0M" (same style as FreeLLMAPI's dashboard). */
export function formatTokens(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "–";
  const a = Math.abs(n);
  if (a < 1000) return String(Math.round(n));
  if (a < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  if (a < 1_000_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000_000_000).toFixed(2)}B`;
}

/** Seconds as m:ss for cooldown timers. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
