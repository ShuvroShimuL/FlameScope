"use client";
import { useMemo, useState } from "react";
import { IconTrash } from "@/components/ui/Icons";
import type { SavedQuestion } from "@/lib/evidence/client";
import type { BurnAnswer, BurnData, BurnRecord, Finding, FindingTier } from "@/lib/evidence/types";
import { AcrylicRows, SourceLink } from "./BurnEvidence";

/** The reference sections of the Will it burn? page: they are the same whatever was asked. */

export function SectionTitle({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ember-soft">{eyebrow}</p>
      <h2 id={id} tabIndex={-1} className="font-head text-xl font-bold tracking-wide text-text outline-none">
        {title}
      </h2>
      {children && <div className="mt-1 max-w-3xl text-sm text-muted">{children}</div>}
    </header>
  );
}

// ------------------------------------------------------------------ ranked findings
const TIER: Record<FindingTier, string> = {
  consistent: "border-ok/50 bg-ok/10 text-ok",
  suggestive: "border-star/40 bg-star/5 text-star",
  mixed: "border-warn/50 bg-warn/10 text-warn",
  "too-few": "border-line bg-raised text-muted",
};
const agreeText = (f: Finding) => `${f.agree} of ${f.comparisons} reading pair${f.comparisons === 1 ? "" : "s"} agree, from ${f.tests} test${f.tests === 1 ? "" : "s"}`;

/** One mark per reading pair, filled when it agrees, so a small sample looks small. */
function PairDots({ f }: { f: Finding }) {
  return (
    <span role="img" aria-label={agreeText(f)} className="flex max-w-[11rem] flex-wrap gap-0.5">
      {Array.from({ length: f.comparisons }, (_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < f.agree ? "bg-ember" : "border border-muted/60"}`} />
      ))}
    </span>
  );
}

export function RankedFindings({ data }: { data: BurnData }) {
  const f = data.findings;
  return (
    <section aria-labelledby="findings" className="scroll-mt-28">
      <SectionTitle id="findings" eyebrow="Acrylic sheets · all rows" title="Ranked findings">
        What the {f.tests} BASS-II acrylic rows show, ordered by how consistently pairs of spread readings agree. Counted from the rows, whatever you asked.
      </SectionTitle>
      <ol className="space-y-3">
        {f.ranked.map((x) => (
          <li key={x.key} className="hud-panel grid gap-3 p-4 md:grid-cols-[2rem_1fr_13rem]">
            <span className="font-mono text-lg text-muted" aria-hidden>
              {x.rank}
            </span>
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm text-text">
                <b>{x.lead}</b> {x.text}
              </p>
              <p className="text-xs text-muted">
                Matched on {x.matchedOn.join(", ")}. Not matched: {x.notMatched.join(", ")}.
              </p>
              <p className="text-xs text-muted">{x.caveat}</p>
              {x.ids.length > 0 && (
                <details className="pt-1">
                  <summary className="cursor-pointer text-xs text-ember-soft">
                    The {x.ids.length} source rows behind finding {x.rank}
                  </summary>
                  <div className="mt-2">
                    <AcrylicRows rows={data.records.filter((r) => x.ids.includes(r.id))} caption={`Source rows behind finding ${x.rank}: ${x.lead}`} />
                  </div>
                </details>
              )}
            </div>
            <div className="space-y-1.5 text-xs text-muted">
              <span className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${TIER[x.tier]}`}>{x.tierLabel}</span>
              <p>{agreeText(x)}</p>
              <PairDots f={x} />
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted">{f.caveat}</p>
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer text-ember-soft">How this ranking works</summary>
        <p className="mt-1 max-w-3xl">
          {f.method} {f.rule}
        </p>
      </details>
    </section>
  );
}

// ------------------------------------------------------------------ NASA's fire response
const STEP_STATUS: Record<string, string> = {
  one: "border-star/40 bg-star/5 text-star",
  some: "border-star/40 bg-star/5 text-star",
  reason: "border-star/40 bg-star/5 text-star",
  related: "border-star/40 bg-star/5 text-star",
  mixed: "border-warn/50 bg-warn/10 text-warn",
  none: "border-line bg-raised text-muted",
};

export function FireResponsePanel({ data }: { data: BurnData }) {
  const fr = data.fireResponse;
  const date = useMemo(() => new Date(fr.source.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }), [fr.source.date]);
  return (
    <section aria-labelledby="response" className="scroll-mt-28">
      <SectionTitle id="response" eyebrow="Quoted from NASA" title="Fire response, step by step">
        NASA&apos;s own steps for a fire on the ISS, in NASA&apos;s order, with what microgravity tests say about each one.
      </SectionTitle>
      <div className="hud-panel space-y-3 p-4">
        <p className="text-sm text-text">
          From <SourceLink source={{ name: fr.source.name, url: fr.source.url }} />, {date}, {fr.source.location}: “{fr.source.intro}”
        </p>
        <p className="text-xs text-muted">
          {fr.source.caveat} The steps are quoted in NASA&apos;s order. They are not chosen, reordered or ranked here, and a Burned answer is not a danger level.
        </p>
        <ol className="divide-y divide-line/60">
          {fr.steps.map((s) => (
            <li key={s.n} className="grid gap-x-3 gap-y-2 py-3 md:grid-cols-[2rem_1fr_9rem]">
              <span className="font-mono text-lg text-muted" aria-hidden>
                {s.n}
              </span>
              <div className="min-w-0 space-y-1.5">
                <p className="text-sm font-medium text-text">“{s.step}”</p>
                {s.detail && <p className="text-xs text-muted">“{s.detail}”</p>}
                {s.evidence.length ? (
                  <ul className="list-disc space-y-1 pl-4 text-xs text-muted">
                    {s.evidence.map((e, i) => (
                      <li key={i}>
                        {e.text} {e.source && <SourceLink source={e.source} />}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic text-muted">No test in the sets mapped here measured this step.</p>
                )}
                {s.differs && (
                  <p className="rounded border border-warn/40 bg-warn/5 p-2 text-xs text-muted">
                    <b className="font-medium text-warn">Sources differ.</b> {s.differs.text} {s.differs.source && <SourceLink source={s.differs.source} />}
                  </p>
                )}
              </div>
              <span>
                <span className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${STEP_STATUS[s.status] ?? STEP_STATUS.none}`}>{s.statusLabel}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted">The label beside each step describes how much microgravity evidence was found for it, never how important the step is. {fr.limitations.join(" ")}</p>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ saved questions
export function SavedQuestions({
  entries,
  durable,
  canUndo,
  onOpen,
  onRemove,
  onUndo,
}: {
  entries: SavedQuestion[];
  durable: boolean;
  canUndo: boolean;
  onOpen: (e: SavedQuestion) => void;
  onRemove: (id: string) => void;
  onUndo: () => void;
}) {
  const [search, setSearch] = useState("");
  const shown = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return entries.filter((e) => e.question.toLocaleLowerCase().includes(q));
  }, [entries, search]);
  const fmt = useMemo(() => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }), []);

  return (
    <section aria-labelledby="saved" className="scroll-mt-28">
      <SectionTitle id="saved" eyebrow="On this device" title="Saved questions">
        {durable
          ? "Your last 50 questions, kept in this browser only. Only the question and its conditions are saved, never an answer: opening one checks it again against the current source rows."
          : "Browser storage is unavailable, so questions are kept for this visit only. Opening one checks it again against the current source rows."}
      </SectionTitle>
      <div className="hud-panel space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="min-w-0 flex-1 basis-56">
            <span className="sr-only">Search saved questions</span>
            <input
              type="search"
              value={search}
              maxLength={500}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your questions"
              className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-text placeholder:text-muted focus:border-ember focus:outline-none"
            />
          </label>
          <p className="text-xs text-muted" role="status">
            {shown.length} saved question{shown.length === 1 ? "" : "s"}
            {shown.length !== entries.length ? ` of ${entries.length}` : ""}
          </p>
        </div>
        {canUndo && (
          <p className="flex flex-wrap items-center gap-3 rounded-md border border-star/30 bg-star/5 px-3 py-2 text-xs text-muted" role="status">
            Question removed.
            <button type="button" onClick={onUndo} className="btn-ghost !px-2.5 !py-1 !text-xs">
              Undo
            </button>
          </p>
        )}
        {shown.length ? (
          <ul className="divide-y divide-line/60">
            {shown.map((e) => (
              <li key={e.id} className="flex items-center gap-2 py-1.5">
                <button type="button" onClick={() => onOpen(e)} className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left transition hover:bg-raised">
                  <span className="block truncate text-sm text-text">{e.question}</span>
                  <time dateTime={new Date(e.savedAt).toISOString()} className="block font-mono text-[10px] text-muted">
                    {fmt.format(e.savedAt)}
                  </time>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(e.id)}
                  aria-label={`Remove question: ${e.question}`}
                  title="Remove question"
                  className="shrink-0 rounded-md border border-line p-2 text-muted transition hover:border-bad/60 hover:text-bad"
                >
                  <IconTrash />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-sm text-muted">{entries.length ? "No questions match your search. Try another word." : "No saved questions yet. Ask a question or choose a mission to start."}</p>
        )}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ sources and provenance
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export function SourcesPanel({ data, answer, records }: { data: BurnData; answer: BurnAnswer | null; records: BurnRecord[] }) {
  const p = data.provenance.acrylic;
  const t = data.provenance.tables;
  const reportUrl = text(p.source);
  return (
    <section aria-labelledby="sources" className="scroll-mt-28">
      <SectionTitle id="sources" eyebrow="Where every number comes from" title="Sources and limits">
        Every number on this page is copied from a NASA table or a cited paper, and every answer is computed from those rows by fixed rules. No AI model writes any of it.
      </SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="hud-panel space-y-2 p-4 text-sm">
          <h3 className="font-head text-sm font-semibold uppercase tracking-wider text-muted">Behind the current answer</h3>
          {answer ? (
            <>
              <p className="text-xs text-muted">{answer.envelope.summary}</p>
              <p className="text-xs text-muted">{answer.envelope.pressureNote}</p>
              <ul className="list-disc space-y-1 pl-4 text-xs">
                {answer.sources.map((s, i) => (
                  <li key={i}>
                    <SourceLink source={s}>{s.name}</SourceLink>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted">Oxygen and nitrogen partial pressures are calculated from each cabin&apos;s total pressure and oxygen share.</p>
            </>
          ) : (
            <p className="text-xs text-muted">Sources appear here once a question is answered.</p>
          )}
        </div>
        <div className="hud-panel space-y-2 p-4 text-sm">
          <h3 className="font-head text-sm font-semibold uppercase tracking-wider text-muted">How the rows were obtained</h3>
          <dl className="space-y-2 text-xs text-muted">
            <div>
              <dt className="font-medium text-text">Acrylic sheets ({records.length} rows)</dt>
              <dd>
                {text(p.title)}
                {text(p.location) ? `, ${text(p.location)}` : ""}. {text(p.method)} {text(p.verification)}{" "}
                {reportUrl && <SourceLink source={{ name: "Open the report on NASA NTRS", url: reportUrl }} />}
              </dd>
            </div>
            {(text(t.method) || text(t.verification)) && (
              <div>
                <dt className="font-medium text-text">SIBAL fabric, Nomex and extinction tables</dt>
                <dd>
                  {text(t.method)} {text(t.verification)}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="hud-panel space-y-2 p-4 text-sm lg:col-span-2">
          <h3 className="font-head text-sm font-semibold uppercase tracking-wider text-muted">What these tests cannot tell you</h3>
          <ul className="list-disc space-y-1 pl-4 text-xs text-muted">
            <li>They are observations from one NASA investigation in microgravity aboard the ISS. They are not a safety rating, and passing or failing here certifies nothing.</li>
            <li>None of them ran in lunar or Martian gravity, so they do not say what happens there.</li>
            <li>These solid-material rows are kept apart from the ACME, CFI and SPICE gas and droplet tests used on the other pages: the two record oxygen, pressure and airflow differently and are never pooled.</li>
            {list(p.limitations).map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
