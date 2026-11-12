"use client";
import { useMemo } from "react";
import { EChart } from "@/components/charts/EChart";
import type { BurnAnswer, BurnRecord, Check, ClosestTest, Gap, OutcomeEvidence, SourceRef, SpreadEvidence } from "@/lib/evidence/types";

/**
 * The evidence half of the Will it burn? page. Everything here only lays out what the server computed:
 * no number is calculated in the browser, and a missing value is shown as missing.
 */

/** One colour and one shape per sheet thickness, so the chart never relies on colour alone. */
export const THICKNESS_MARK: Record<number, { color: string; symbol: string; shape: string }> = {
  1: { color: "#ffd166", symbol: "circle", shape: "●" },
  2: { color: "#ff9f43", symbol: "rect", shape: "■" },
  3: { color: "#ff6b6b", symbol: "triangle", shape: "▲" },
  4: { color: "#c77dff", symbol: "diamond", shape: "◆" },
  5: { color: "#4cc9f0", symbol: "roundRect", shape: "▬" },
};
const OTHER_TEST = "#4a5878";

export function SourceLink({ source, children }: { source: SourceRef; children?: React.ReactNode }) {
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-ember-soft underline underline-offset-2 hover:text-ember">
      {children ?? source.label ?? source.name}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** A table that can scroll sideways on a narrow screen, and that a keyboard can scroll too. */
export function ScrollTable({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="max-w-full overflow-x-auto rounded-lg border border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember">
      <table className="w-full min-w-[520px] border-collapse text-left text-xs">{children}</table>
    </div>
  );
}
const TH = "border-b border-line bg-raised px-2.5 py-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted";
const TD = "border-b border-line/60 px-2.5 py-2 align-top";

// ------------------------------------------------------------------ condition checks
function checkPill(c: Check): { text: string; cls: string } {
  if (!c.ok) return { text: `✕ ${c.statusLabel}`, cls: "border-bad/50 bg-bad/10 text-bad" };
  if (c.status === "match") return { text: `✓ ${c.statusLabel}`, cls: "border-ok/50 bg-ok/10 text-ok" };
  if (c.status === "separately") return { text: c.statusLabel, cls: "border-warn/50 bg-warn/10 text-warn" };
  if (c.status === "context") return { text: c.statusLabel, cls: "border-star/40 bg-star/5 text-star" };
  return { text: c.statusLabel, cls: "border-line bg-raised text-muted" };
}

export function ChecksList({ checks, policy }: { checks: Check[]; policy: string }) {
  return (
    <section aria-labelledby="burn-checks" className="hud-panel p-4">
      <h3 id="burn-checks" className="font-head text-sm font-semibold uppercase tracking-wider text-muted">
        Your cabin against NASA&apos;s tests
      </h3>
      <ul className="mt-3 divide-y divide-line/60">
        {checks.map((c) => {
          const pill = checkPill(c);
          return (
            <li key={c.key} className="grid gap-x-3 gap-y-1 py-2.5 text-sm sm:grid-cols-[7rem_9.5rem_1fr]">
              <span className="font-medium text-text">{c.label}</span>
              <span>
                <span className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${pill.cls}`}>{pill.text}</span>
              </span>
              <span className="min-w-0 text-xs text-muted">
                <span className="mr-3 inline-block">
                  Your cabin: <b className="font-medium text-text">{c.yours}</b>
                </span>
                <span className="inline-block">
                  NASA&apos;s tests: <b className="font-medium text-text">{c.tested}</b>
                </span>
                {c.note && <span className="mt-1 block">{c.note}</span>}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 border-t border-line/60 pt-3 text-xs text-muted">
        <b className="font-medium text-text">The rule:</b> {policy}
      </p>
    </section>
  );
}

// ------------------------------------------------------------------ key numbers
function Kpi({ label, value, unit, sub }: { label: string; value: React.ReactNode; unit?: string; sub: string }) {
  return (
    <div className="hud-panel kpi-tile min-w-0 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-mono text-xl font-medium text-text">
        {value}
        {unit && <span className="ml-1 text-xs text-muted">{unit}</span>}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted">{sub}</p>
    </div>
  );
}

export function KeyNumbers({ evidence }: { evidence: SpreadEvidence | OutcomeEvidence }) {
  if (evidence.kind === "outcomes") {
    const c = evidence.counts;
    const at = evidence.airflow === null ? "" : ` to ${evidence.airflow} cm/s`;
    const parts: [string, number, string][] = [
      ["bg-ember", c.burned, evidence.airflow === null ? "burned" : `burning at ${evidence.airflow} cm/s`],
      ["bg-warn", c.quenched, `burned, then went out as the airflow was turned down${at}`],
      ["bg-cfi", c.blowoff, `burned, then blew out as the airflow was turned up${at}`],
      ["bg-star", c.noIgnition, evidence.set === "nomex" ? "held no flame" : "didn’t ignite"],
    ];
    const shown = parts.filter((p) => p[1] > 0);
    return (
      <div className="grid gap-3 sm:grid-cols-[minmax(0,10rem)_1fr]">
        <Kpi label="Tests" value={c.tests} sub={evidence.label} />
        <div className="hud-panel min-w-0 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">What happened</p>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-raised" aria-hidden>
            {shown.map(([cls, n]) => (
              <span key={cls} className={cls} style={{ flexGrow: n }} />
            ))}
          </div>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {shown.map(([cls, n, text]) => (
              <li key={cls} className="flex items-start gap-2">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-sm ${cls}`} aria-hidden />
                <span>
                  <b className="font-mono font-medium text-text">{n}</b> {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  const st = evidence.stats;
  const spread = (label: string, p: typeof st.fastest) =>
    p ? (
      <Kpi label={label} value={p.spread} unit="mm/s" sub={`${p.id}, ${p.thicknessMm} mm sheet, ${p.velocity} cm/s air`} />
    ) : (
      <Kpi label={label} value="Not tracked" sub="No spread was tracked at these conditions" />
    );
  return (
    <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
      <Kpi label="Tests" value={st.tests} sub={st.notTracked ? `${st.notTracked} with spread not tracked` : "All with spread tracked"} />
      <Kpi label="Burned for" value={st.burnMin === st.burnMax ? st.burnMin : `${st.burnMin}–${st.burnMax}`} unit="min" sub="per test" />
      {spread("Fastest spread", st.fastest)}
      {spread("Slowest spread", st.slowest)}
    </div>
  );
}

// ------------------------------------------------------------------ acrylic: chart and rows
function SpreadChart({ evidence, records }: { evidence: SpreadEvidence; records: BurnRecord[] }) {
  const option = useMemo(() => {
    const on = new Set(evidence.ids);
    const tracked = records.filter((r) => r.spread);
    // Matching tests are drawn last, on top of the others.
    const ordered = [...tracked.filter((r) => !on.has(r.id)), ...tracked.filter((r) => on.has(r.id))];
    const xMax = Math.ceil(Math.max(...records.flatMap((r) => r.velocity), 1)) + 1;
    const axis = { axisLine: { lineStyle: { color: "#2c3b5e" } }, axisLabel: { color: "#97a3bc", fontSize: 11 }, splitLine: { lineStyle: { color: "#1f2a44" } }, nameTextStyle: { color: "#97a3bc", fontSize: 11 } };
    return {
      backgroundColor: "transparent",
      grid: { left: 54, right: 18, top: 18, bottom: 46 },
      xAxis: { type: "value", min: 0, max: xMax, name: "Airflow against the flame (cm/s)", nameLocation: "middle", nameGap: 28, ...axis },
      yAxis: { type: "value", min: 0, name: "Flame spread (mm/s)", nameLocation: "middle", nameGap: 40, ...axis },
      tooltip: {
        trigger: "item",
        backgroundColor: "#131b2e",
        borderColor: "#2c3b5e",
        textStyle: { color: "#e8ecf6", fontSize: 12 },
        // Built from numbers and the test's own id only; rendered as text, never as markup.
        renderMode: "richText",
        formatter: (p: unknown) => {
          const { seriesName, value } = p as { seriesName: string; value: [number, number, number] };
          return `${seriesName}, ${value[2]} mm sheet\nAirflow ${value[0]} cm/s, spread ${value[1]} mm/s`;
        },
      },
      series: ordered.map((r, i) => {
        const match = on.has(r.id);
        const mark = THICKNESS_MARK[r.thicknessMm];
        const color = match && mark ? mark.color : OTHER_TEST;
        const points = r.velocity.map((v, k) => [v, (r.spread as number[])[k], r.thicknessMm]).sort((a, b) => a[0] - b[0]);
        return {
          type: "line",
          name: r.id,
          data: points,
          symbol: mark?.symbol ?? "circle",
          symbolSize: match ? 10 : 7,
          itemStyle: { color },
          lineStyle: { color, width: match ? 2 : 1.5, opacity: match ? 0.65 : 0.8 },
          z: match ? 3 : 1,
          emphasis: { focus: "series" },
          animationDuration: 400,
          ...(i === ordered.length - 1 && evidence.airflow !== null && evidence.airflow <= xMax
            ? { markLine: { silent: true, symbol: "none", lineStyle: { type: "dashed", color: "#cfe6ff" }, label: { formatter: "your airflow", color: "#cfe6ff", fontSize: 11 }, data: [{ xAxis: evidence.airflow }] } }
            : {}),
        };
      }),
    };
  }, [evidence, records]);

  const thicknesses = [...new Set(records.map((r) => r.thicknessMm))].sort((a, b) => a - b);
  const untracked = records.filter((r) => !r.spread).map((r) => r.id);
  return (
    <figure className="min-w-0">
      <EChart
        option={option}
        height={300}
        ariaLabel={`Flame spread against airflow for the BASS-II acrylic sheet tests. ${evidence.ids.length} matching tests are highlighted. The same values are in the source rows table below.`}
      />
      <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        {thicknesses.map((t) => (
          <span key={t} className="inline-flex items-center gap-1">
            <span style={{ color: THICKNESS_MARK[t]?.color }} aria-hidden>
              {THICKNESS_MARK[t]?.shape}
            </span>
            {t} mm
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span style={{ color: OTHER_TEST }} aria-hidden>
            ●
          </span>
          tests that don&apos;t match
        </span>
        <span>
          Lines join readings from one test, in airflow order, not time order; oxygen fell during each test.
          {untracked.length > 0 && ` ${untracked.join(" and ")} had no tracked spread and ${untracked.length === 1 ? "is" : "are"} not drawn.`}
        </span>
      </figcaption>
    </figure>
  );
}

/** Acrylic rows exactly as transcribed from Table 5.1. A spread that was not tracked says so. */
export function AcrylicRows({ rows, caption }: { rows: BurnRecord[]; caption: string }) {
  return (
    <ScrollTable label={caption}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {["Test", "Sheet", "Width", "Sides", "Airflow → spread", "Burned", "O₂ start → end", "Source row"].map((h) => (
            <th key={h} scope="col" className={TH}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <th scope="row" className={`${TD} font-mono font-medium text-text`}>
              {r.id}
            </th>
            <td className={`${TD} font-mono`}>{r.thicknessMm} mm</td>
            <td className={`${TD} font-mono`}>{r.widthMm} mm</td>
            <td className={`${TD} font-mono`}>{r.burningSides}</td>
            <td className={`${TD} font-mono`}>
              {r.spread ? (
                r.velocity.map((v, i) => (
                  <span key={i} className="block whitespace-nowrap">
                    {v} cm/s → {(r.spread as number[])[i]} mm/s
                  </span>
                ))
              ) : (
                <span>
                  <span className="rounded border border-warn/50 bg-warn/10 px-1 text-warn">Not tracked</span> at {r.velocity.join(", ")} cm/s
                </span>
              )}
            </td>
            <td className={`${TD} whitespace-nowrap font-mono`}>{r.burnMin} min</td>
            <td className={`${TD} whitespace-nowrap font-mono`}>
              {r.oxygenInitial}% → {r.oxygenFinal}%
            </td>
            <td className={`${TD} text-muted`}>{r.sourceLocation}</td>
          </tr>
        ))}
      </tbody>
    </ScrollTable>
  );
}

function OutcomeRows({ evidence }: { evidence: OutcomeEvidence }) {
  const nomex = evidence.set === "nomex";
  const at = evidence.airflow !== null;
  const heads = ["Test", ...(nomex ? ["Date"] : ["Study", "Width"]), "Airflow", "O₂", "What happened", ...(at ? [`At ${evidence.airflow} cm/s`] : []), "Source row"];
  const caption = `${evidence.label}: every matching test, as the report lists it`;
  return (
    <ScrollTable label={caption}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {heads.map((h) => (
            <th key={h} scope="col" className={TH}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {evidence.tests.map((t) => (
          <tr key={t.id}>
            <th scope="row" className={`${TD} whitespace-nowrap font-mono font-medium text-text`}>
              {t.id}
            </th>
            {nomex ? (
              <td className={`${TD} whitespace-nowrap font-mono`}>{t.date}</td>
            ) : (
              <>
                <td className={`${TD} whitespace-nowrap font-mono`}>{t.study}</td>
                <td className={`${TD} whitespace-nowrap font-mono`}>{t.width}</td>
              </>
            )}
            <td className={`${TD} whitespace-nowrap font-mono`}>{t.flowText}</td>
            <td className={`${TD} whitespace-nowrap font-mono`}>{t.oxygenText}</td>
            <td className={TD}>{t.happened}</td>
            {at && <td className={TD}>{t.atYourAirflow}</td>}
            <td className={`${TD} text-muted`}>{t.sourceLocation}</td>
          </tr>
        ))}
      </tbody>
    </ScrollTable>
  );
}

// ------------------------------------------------------------------ no data: gaps and closest tests
function GapCards({ gaps }: { gaps: Gap[] }) {
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {gaps.map((g, i) => (
        <li key={i} className="rounded-lg border border-dashed border-muted/50 bg-panel/70 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-warn">{g.topic}</p>
          <p className="mt-1 text-sm text-text">{g.text}</p>
          <p className="mt-2 text-xs">
            <SourceLink source={g.source}>{g.source.name}</SourceLink>
          </p>
        </li>
      ))}
    </ul>
  );
}

function ClosestTests({ tests }: { tests: ClosestTest[] }) {
  const caption = "Closest tests, and what each one recorded";
  return (
    <div>
      <h4 className="font-head text-sm font-semibold text-text">{caption}</h4>
      <p className="mb-2 mt-0.5 text-xs text-muted">Each of these recorded some of your conditions, but not all of them together, so none counts as a match.</p>
      <ScrollTable label={caption}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Test
            </th>
            {tests[0].conditions.map((c) => (
              <th key={c.key} scope="col" className={TH}>
                {c.label}
              </th>
            ))}
            <th scope="col" className={TH}>
              Source row
            </th>
          </tr>
        </thead>
        <tbody>
          {tests.map((t) => (
            <tr key={t.id}>
              <th scope="row" className={`${TD} whitespace-nowrap font-mono font-medium text-text`}>
                {t.id}
              </th>
              {t.conditions.map((c) => (
                <td key={c.key} className={`${TD} font-mono ${c.ok ? "text-ok" : "text-bad"}`}>
                  <span aria-hidden>{c.ok ? "✓ " : "✕ "}</span>
                  <span className="sr-only">{c.ok ? "recorded: " : "not recorded: "}</span>
                  <span className="text-text">{c.recorded}</span>
                </td>
              ))}
              <td className={`${TD} text-muted`}>
                {t.sourceLocation}
                {t.untied && <span className="mt-1 block">The table can&apos;t tie this test&apos;s oxygen to one airflow reading.</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </ScrollTable>
    </div>
  );
}

// ------------------------------------------------------------------ the panel
const CHIP = "rounded-full border px-3 py-1 text-xs transition";
const chipCls = (on: boolean) => `${CHIP} ${on ? "border-ember bg-ember/15 text-ember-soft" : "border-line bg-panel text-muted hover:border-muted hover:text-text"}`;

/** Thickness chips. `selected` is null for all sheets, a number, or undefined when none is chosen yet. */
export function ThicknessChips({ values, selected, onPick }: { values: number[]; selected: number | null | undefined; onPick: (t: number | "all") => void }) {
  return (
    <div role="group" aria-label="Sheet thickness" className="flex flex-wrap gap-1.5">
      <button type="button" aria-pressed={selected === null} onClick={() => selected !== null && onPick("all")} className={chipCls(selected === null)}>
        All
      </button>
      {values.map((t) => (
        <button key={t} type="button" aria-pressed={selected === t} onClick={() => selected !== t && onPick(t)} className={chipCls(selected === t)}>
          <span style={{ color: THICKNESS_MARK[t]?.color }} aria-hidden>
            {THICKNESS_MARK[t]?.shape}{" "}
          </span>
          {t} mm
        </button>
      ))}
    </div>
  );
}

function Related({ related }: { related: BurnAnswer["related"] }) {
  if (!related) return null;
  return (
    <p className="rounded-lg border border-line bg-raised/60 p-3 text-xs text-muted">
      <b className="font-medium text-text">Also seen in another experiment.</b> {related.text} <SourceLink source={related.source} />
    </p>
  );
}

export function EvidencePanel({
  answer,
  records,
  onChange,
}: {
  answer: BurnAnswer;
  records: BurnRecord[];
  onChange: (patch: Record<string, string | number>) => void;
}) {
  const ev = answer.evidence;
  const thicknesses = useMemo(() => [...new Set(records.map((r) => r.thicknessMm))].sort((a, b) => a - b), [records]);
  const pickThickness = (t: number | "all") => onChange({ thickness: t });

  if (answer.verdict.state === "unresolved") {
    const pickSize = answer.scenario.material.id === "pmma" && answer.unresolved.some((u) => u.key === "thickness");
    return (
      <section aria-labelledby="burn-evidence" className="hud-panel space-y-3 p-4">
        <h3 id="burn-evidence" className="font-head text-sm font-semibold uppercase tracking-wider text-muted">
          What couldn&apos;t be read
        </h3>
        <p className="text-xs text-muted">Nothing is answered until every condition is clear. No value is guessed in its place.</p>
        <ul className="grid gap-3 lg:grid-cols-2">
          {answer.unresolved.map((u, i) => (
            <li key={i} className="rounded-lg border border-dashed border-bad/50 bg-panel/70 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-bad">{u.label}</p>
              <p className="mt-1 text-sm text-text">{u.reason}</p>
            </li>
          ))}
        </ul>
        {pickSize && (
          <div>
            <p className="mb-1.5 text-xs text-muted">Pick a tested thickness. It replaces the one that couldn&apos;t be read.</p>
            <ThicknessChips values={thicknesses} selected={undefined} onPick={pickThickness} />
          </div>
        )}
      </section>
    );
  }

  if (!ev) {
    return (
      <section aria-labelledby="burn-evidence" className="hud-panel space-y-4 p-4">
        <div>
          <h3 id="burn-evidence" className="font-head text-sm font-semibold uppercase tracking-wider text-muted">
            What would close this gap?
          </h3>
          <p className="mt-0.5 text-xs text-muted">Each card says what is missing and links to its source.</p>
        </div>
        <GapCards gaps={answer.gaps} />
        {answer.closest && answer.closest.tests.length > 0 && <ClosestTests tests={answer.closest.tests} />}
        {answer.nearest && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line/60 pt-3">
            <button type="button" className="btn-ghost" onClick={() => onChange(answer.nearest!.params)}>
              {answer.nearest.label}
            </button>
            <span className="text-xs text-muted">{answer.nearest.changes}</span>
          </div>
        )}
      </section>
    );
  }

  if (ev.kind === "outcomes") {
    return (
      <section aria-labelledby="burn-evidence" className="hud-panel space-y-3 p-4">
        <div>
          <h3 id="burn-evidence" className="font-head text-sm font-semibold uppercase tracking-wider text-muted">
            What NASA saw
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            <b className="font-medium text-text">{ev.label}.</b> Every matching test, as the report lists it. <SourceLink source={ev.source}>{ev.source.name}</SourceLink>
          </p>
        </div>
        <OutcomeRows evidence={ev} />
        <p className="text-sm text-text">
          <b>{ev.finding.lead}</b> {ev.finding.text}
        </p>
        <p className="text-xs text-muted">{ev.caveat}</p>
        <Related related={answer.related} />
      </section>
    );
  }

  const matched = records.filter((r) => ev.ids.includes(r.id));
  return (
    <section aria-labelledby="burn-evidence" className="hud-panel space-y-3 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="burn-evidence" className="font-head text-sm font-semibold uppercase tracking-wider text-muted">
            What&apos;s burning?
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            <b className="font-medium text-text">{answer.scenario.material.name}.</b> Pick a thickness to narrow the tests.
          </p>
        </div>
        <ThicknessChips values={thicknesses} selected={ev.thickness} onPick={pickThickness} />
      </div>
      <SpreadChart evidence={ev} records={records} />
      <p className="text-sm text-text">
        <b>{ev.finding.lead}</b> {ev.finding.text}
      </p>
      <p className="text-xs text-muted">{ev.caveat}</p>
      <Related related={answer.related} />
      <details className="rounded-lg border border-line bg-panel/60">
        <summary className="cursor-pointer px-3 py-2 text-sm text-text">
          The {matched.length} source {matched.length === 1 ? "row" : "rows"} behind this answer
        </summary>
        <div className="space-y-2 p-3 pt-0">
          <AcrylicRows rows={matched} caption={`The ${matched.length} BASS-II acrylic tests that match, from Table 5.1 of the report`} />
          <p className="text-xs text-muted">A blank spread cell in the report means the spread was not tracked, not zero. Oxygen values are the start and end of each test, not a constant level.</p>
        </div>
      </details>
    </section>
  );
}
