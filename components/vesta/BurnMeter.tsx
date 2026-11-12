"use client";
import { useEffect, useMemo, useState } from "react";
import { IconFlame } from "@/components/ui/Icons";
import { useAppStore } from "@/lib/store";
import { averagePerAnswer, burnTotals, formatTokens } from "@/lib/vesta/burn";
import { ENGINE_LABELS, ENGINE_ORDER } from "@/lib/vesta/engines";
import { ENGINE_COLORS } from "./engineMeta";
import { prefersReducedMotion, useCountUp } from "./useEngineRoom";

const SPARKS = 9;

/** A small burst of embers each time a model call reports tokens. Decoration only: carries no number. */
export function EmberBurst({ pulse }: { pulse: number }) {
  const [bursts, setBursts] = useState<number[]>([]);
  useEffect(() => {
    if (!pulse || prefersReducedMotion()) return;
    setBursts((b) => [...b.slice(-2), pulse]);
    const t = setTimeout(() => setBursts((b) => b.filter((x) => x !== pulse)), 1100);
    return () => clearTimeout(t);
  }, [pulse]);
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {bursts.map((b) =>
        Array.from({ length: SPARKS }, (_, i) => {
          const angle = (i / SPARKS) * Math.PI * 2 + (b % 7) * 0.4;
          const dist = 18 + ((b * 13 + i * 7) % 16);
          return (
            <span
              key={`${b}-${i}`}
              className="ember-spark"
              style={{ "--dx": `${Math.cos(angle) * dist}px`, "--dy": `${Math.sin(angle) * dist - 10}px`, animationDelay: `${i * 18}ms` } as React.CSSProperties}
            />
          );
        }),
      )}
    </span>
  );
}

export function BurnMeter() {
  const burn = useAppStore((s) => s.burn);
  const pulse = useAppStore((s) => s.burnPulse);
  const reset = useAppStore((s) => s.resetBurn);
  const busy = useAppStore((s) => s.busy);
  const totals = useMemo(() => burnTotals(burn), [burn]);
  const shown = useCountUp(totals.total);
  const avg = averagePerAnswer(burn.answers);
  const rows = ENGINE_ORDER.map((id) => ({ id, b: burn.byEngine[id] }))
    .filter((r): r is { id: typeof r.id; b: NonNullable<typeof r.b> } => !!r.b)
    .sort((a, b) => b.b.input + b.b.output - (a.b.input + a.b.output));
  const top = Math.max(1, ...rows.map((r) => r.b.input + r.b.output));
  const inPct = totals.total ? (totals.input / totals.total) * 100 : 0;

  return (
    <section aria-labelledby="burn-h" className="rounded-lg border border-line bg-bg/60 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <h3 id="burn-h" className="font-mono text-[10px] uppercase tracking-wider text-muted">Token burn · this session</h3>
        <button type="button" disabled={busy || !totals.calls} onClick={reset} className="rounded px-1 font-mono text-[10px] text-muted transition hover:text-text disabled:opacity-40">
          reset
        </button>
      </div>
      <div className="mt-1 flex items-center gap-2.5">
        <span key={pulse} className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ember/40 bg-ember/10 ${pulse ? "burn-flare" : ""}`}>
          <IconFlame className={`h-5 w-5 text-ember ${busy ? "animate-flicker" : ""}`} />
          <EmberBurst pulse={pulse} />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-2xl font-semibold leading-none text-text" aria-live="polite">
            {shown.toLocaleString("en-US")}
            <span className="ml-1 text-xs font-normal text-muted">tokens</span>
          </p>
          <p className="mt-1 font-mono text-[10px] text-muted">
            {totals.calls} model call{totals.calls === 1 ? "" : "s"}
            {avg !== null && <> · avg {formatTokens(avg)} per answer</>}
          </p>
        </div>
      </div>

      {totals.total > 0 && (
        <div className="mt-2">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-raised" role="img" aria-label={`${totals.input} input tokens and ${totals.output} output tokens`}>
            <span className="bg-ember-soft/80 transition-all duration-700" style={{ width: `${inPct}%` }} />
            <span className="bg-ember transition-all duration-700" style={{ width: `${100 - inPct}%` }} />
          </div>
          <p className="mt-0.5 flex justify-between font-mono text-[10px] text-muted">
            <span>read {formatTokens(totals.input)}</span>
            <span>written {formatTokens(totals.output)}</span>
          </p>
        </div>
      )}

      {rows.length > 0 ? (
        <ul className="mt-2 space-y-1" aria-label="Tokens by engine">
          {rows.map(({ id, b }) => {
            const t = b.input + b.output;
            return (
              <li key={id} className="grid grid-cols-[72px_1fr_auto] items-center gap-2 font-mono text-[10px]">
                <span className="truncate text-text/90">{ENGINE_LABELS[id]}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-raised">
                  <span className="block h-full rounded-full transition-all duration-700" style={{ width: `${(t / top) * 100}%`, background: ENGINE_COLORS[id] }} />
                </span>
                <span className="text-muted">
                  {formatTokens(t)} · {b.calls}×
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-[11px] text-muted">Nothing burned yet. Ask VESTA something and watch this move.</p>
      )}
      {totals.unreported > 0 && (
        <p className="mt-1.5 text-[10px] text-warn">
          {totals.unreported} call{totals.unreported === 1 ? "" : "s"} did not report tokens, so the total is a minimum.
        </p>
      )}
      <p className="mt-1.5 text-[10px] leading-snug text-muted/80">Counted from what each provider reports. Offline mode and cached answers burn nothing.</p>
    </section>
  );
}
