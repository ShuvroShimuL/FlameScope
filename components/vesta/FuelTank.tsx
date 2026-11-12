"use client";
import { useState } from "react";
import { IconGauge, IconRefresh } from "@/components/ui/Icons";
import { useAppStore } from "@/lib/store";
import { answersLeft, averagePerAnswer, formatTokens, remainingPct } from "@/lib/vesta/burn";
import type { FreeLLMAPIStatus } from "@/lib/vesta/freellmapi-status";
import { platformColor } from "./engineMeta";
import { useCountUp } from "./useEngineRoom";

const LEGEND_SHORT = 5;

function levelColor(pct: number): string {
  return pct > 50 ? "#5ee6a8" : pct > 20 ? "#ffc857" : "#ff5d6c";
}

/** Half-circle fuel gauge. The needle and arc follow the remaining share. */
function Gauge({ pct }: { pct: number }) {
  const r = 46;
  const len = Math.PI * r;
  const color = levelColor(pct);
  return (
    <svg viewBox="0 0 120 68" className="h-[68px] w-[120px] shrink-0" role="img" aria-label={`${pct}% of the monthly budget left`}>
      <path d={`M ${60 - r} 60 A ${r} ${r} 0 0 1 ${60 + r} 60`} fill="none" stroke="#1f2a44" strokeWidth="9" strokeLinecap="round" />
      <path
        d={`M ${60 - r} 60 A ${r} ${r} 0 0 1 ${60 + r} 60`}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * len} ${len}`}
        className="transition-[stroke-dasharray] duration-1000 ease-out"
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
      {[0, 25, 50, 75, 100].map((t) => {
        const a = Math.PI * (1 - t / 100);
        return <line key={t} x1={60 + Math.cos(a) * 36} y1={60 - Math.sin(a) * 36} x2={60 + Math.cos(a) * 32} y2={60 - Math.sin(a) * 32} stroke="#97a3bc" strokeWidth="1" opacity="0.6" />;
      })}
      <g className="gauge-needle" style={{ transform: `rotate(${-90 + (pct / 100) * 180}deg)` }}>
        <line x1="60" y1="60" x2="60" y2="22" stroke="#e8ecf6" strokeWidth="2" strokeLinecap="round" />
      </g>
      <circle cx="60" cy="60" r="4.5" fill="#ff7a2f" />
      <text x="14" y="67" fontSize="7" fill="#97a3bc" fontFamily="var(--font-mono)">E</text>
      <text x="101" y="67" fontSize="7" fill="#97a3bc" fontFamily="var(--font-mono)">F</text>
    </svg>
  );
}

function Explain({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[11px] leading-snug text-muted">{children}</p>;
}

const STATUS_DOT: Record<string, string> = { healthy: "bg-ok", rate_limited: "bg-warn", invalid: "bg-bad", unknown: "bg-muted" };
const STATUS_WORD: Record<string, string> = { healthy: "ready", rate_limited: "resting", invalid: "key problem", unknown: "not checked yet" };

function time(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function FuelTank({ status, loaded, loading, onRefresh }: { status: FreeLLMAPIStatus | null; loaded: boolean; loading: boolean; onRefresh: () => void }) {
  const answers = useAppStore((s) => s.burn.answers);
  const [focus, setFocus] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const budget = status?.budget ?? null;
  const left = useCountUp(budget?.remaining ?? 0, 900);

  const header = (
    <div className="flex items-start justify-between gap-2">
      <h3 id="fuel-h" className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
        <IconGauge className="h-3.5 w-3.5 text-ember" /> FreeLLMAPI fuel tank
      </h3>
      <button type="button" onClick={onRefresh} aria-label="Refresh FreeLLMAPI reading" className="rounded p-0.5 text-muted transition hover:text-text">
        <IconRefresh className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );

  let body: React.ReactNode;
  if (!loaded) body = <Explain>Checking…</Explain>;
  else if (!status)
    body = (
      <Explain>
        Not connected. FreeLLMAPI runs on your own PC, so it works when FlameScope runs there too (<code className="font-mono">npm run dev</code>). Add <code className="font-mono">FREELLMAPI_API_KEY</code> to <code className="font-mono">.env.local</code> and restart.
      </Explain>
    );
  else if (!status.connected)
    body = (
      <Explain>
        {status.problem === "key_rejected"
          ? "FreeLLMAPI is running but rejected the key. Copy the unified API key again from its Keys page."
          : "Can't reach FreeLLMAPI. Is the desktop app running? VESTA will use the next engine meanwhile."}
      </Explain>
    );
  else {
    const pct = budget ? remainingPct(budget.remaining, budget.total) : null;
    const avg = averagePerAnswer(answers);
    const more = answersLeft(budget?.remaining, avg);
    const models = budget ? [...budget.models].sort((a, b) => b.remaining - a.remaining) : [];
    const legend = all ? models : models.slice(0, LEGEND_SHORT);
    const f = focus !== null && budget ? budget.models[focus] : null;
    body = (
      <>
        {budget && pct !== null ? (
          <>
            <div className="mt-1 flex items-center gap-3">
              <Gauge pct={pct} />
              <div className="min-w-0">
                <p className="font-mono text-xl font-semibold leading-none" style={{ color: levelColor(pct) }}>
                  {formatTokens(left)}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-muted">
                  left of {formatTokens(budget.total)} · {pct}%
                </p>
                <p className="font-mono text-[10px] text-muted">used this month {formatTokens(budget.used)}</p>
                {more !== null && <p className="mt-0.5 font-mono text-[10px] text-ember-soft">≈ {more.toLocaleString("en-US")} more answers at your average</p>}
              </div>
            </div>
            <div className="mt-2 flex h-2.5 gap-px overflow-hidden rounded-full bg-raised" onMouseLeave={() => setFocus(null)}>
              {budget.models.map((m, i) => (
                <button
                  key={`${m.platform}-${m.name}-${i}`}
                  type="button"
                  aria-label={`${m.name} (${m.platform}): ${formatTokens(m.remaining)} of ${formatTokens(m.budget)} left`}
                  onMouseEnter={() => setFocus(i)}
                  onFocus={() => setFocus(i)}
                  onBlur={() => setFocus(null)}
                  onClick={() => setFocus(i === focus ? null : i)}
                  className="relative h-full transition-opacity focus:outline-none"
                  style={{ width: `${(m.budget / budget.total) * 100}%`, background: platformColor(m.platform), opacity: focus === null || focus === i ? 1 : 0.35 }}
                >
                  {m.used > 0 && <span className="absolute inset-y-0 right-0 bg-bg/70" style={{ width: `${Math.min(100, (m.used / m.budget) * 100)}%` }} />}
                </button>
              ))}
            </div>
            <p className="mt-1 min-h-[14px] truncate font-mono text-[10px] text-muted" aria-live="polite">
              {f ? `${f.name} · ${formatTokens(f.remaining)} / ${formatTokens(f.budget)} left` : "Point at the bar to see each model."}
            </p>
            <ul className="mt-1 space-y-0.5">
              {legend.map((m) => (
                <li key={`${m.platform}-${m.name}`} className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: platformColor(m.platform) }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-text/85">{m.name}</span>
                  <span className="text-muted">
                    {formatTokens(m.remaining)} / {formatTokens(m.budget)}
                  </span>
                </li>
              ))}
            </ul>
            {(models.length > LEGEND_SHORT || budget.unpublished > 0) && (
              <p className="mt-1 flex items-center justify-between gap-2 font-mono text-[10px] text-muted">
                {models.length > LEGEND_SHORT ? (
                  <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="text-ember-soft hover:text-ember">
                    {all ? "show fewer" : `show all ${models.length} models`}
                  </button>
                ) : (
                  <span />
                )}
                {budget.unpublished > 0 && <span>+{budget.unpublished} with no published quota</span>}
              </p>
            )}
          </>
        ) : (
          <Explain>Connected. The monthly budget can only be read when FreeLLMAPI runs on this same PC.</Explain>
        )}
        {status.providers.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="FreeLLMAPI providers">
            {status.providers.map((p) => {
              const until = p.status === "rate_limited" ? time(p.resume_at) : null;
              return (
                <li key={p.name} className="flex items-center gap-1 rounded-full border border-line bg-raised px-2 py-0.5 font-mono text-[10px] text-muted" title={STATUS_WORD[p.status]}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[p.status]} ${p.status === "healthy" ? "animate-pulse" : ""}`} aria-hidden />
                  <span className="text-text/85">{p.name}</span>
                  {until ? <span>· back {until}</span> : p.requests_remaining_pct !== null ? <span>· {p.requests_remaining_pct}% req</span> : <span className="sr-only">{STATUS_WORD[p.status]}</span>}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-1.5 text-[10px] leading-snug text-muted/80">
          Budget is FreeLLMAPI&apos;s own estimate from published free-tier quotas. The limits that bite first are per minute and per day.
        </p>
      </>
    );
  }

  return (
    <section aria-labelledby="fuel-h" className="rounded-lg border border-line bg-bg/60 p-2.5">
      {header}
      {body}
    </section>
  );
}
