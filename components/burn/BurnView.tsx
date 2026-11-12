"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveFile } from "@/components/dataset/shared";
import { BRAND } from "@/lib/brand";
import { askedFor, briefFileName, briefMarkdown, createController, createQuestionLibrary, LIBRARY_KEY, type Controller, type QuestionLibrary, type SavedQuestion } from "@/lib/evidence/client";
import type { BurnAnswer, BurnData, BurnParams, Understood, VerdictState } from "@/lib/evidence/types";
import { MISSIONS } from "@/lib/missions";
import { useAppStore } from "@/lib/store";
import { ChecksList, EvidencePanel, KeyNumbers } from "./BurnEvidence";
import { FireResponsePanel, RankedFindings, SavedQuestions, SourcesPanel } from "./BurnReference";

/**
 * Will it burn? A question about a solid material in a cabin, checked against NASA's BASS-II tests.
 * This component decides nothing scientific. It sends the question or the tapped conditions to
 * /api/burn/ask and lays out the JSON. Request ordering lives in lib/evidence/client/state.mjs and the
 * saved-question list in library.mjs; both are plain modules that the tests run directly.
 */

const SUGGESTIONS = [
  "Will acrylic burn on the ISS?",
  "Will it burn on a Moon base at 34% oxygen?",
  "What about Mars transit in exploration air?",
  "Does a 1 mm sheet burn faster than 5 mm?",
  "Will a 1 mm acrylic sheet burn in still air?",
  "Is Nomex safe on a Mars base?",
];
const MATERIAL_BUTTONS = [
  { id: "pmma", label: "Acrylic sheet" },
  { id: "sibal", label: "SIBAL fabric" },
  { id: "nomex", label: "Nomex" },
];
const AIR_BUTTONS = [
  { id: "earth", label: "Earth-normal air" },
  { id: "exploration", label: "Exploration air" },
];
const SECTIONS: [string, string][] = [
  ["answer", "Answer"],
  ["findings", "Ranked findings"],
  ["response", "Fire response"],
  ["saved", "Saved questions"],
  ["sources", "Sources"],
];

const STAMP: Record<VerdictState, string> = {
  burned: "border-ember/60 bg-ember/10 text-ember",
  mixed: "border-warn/60 bg-warn/10 text-warn",
  "no-burn": "border-star/50 bg-star/5 text-star",
  "no-data": "border-dashed border-muted/70 bg-panel text-text",
  unresolved: "border-dashed border-bad/60 bg-bad/5 text-bad",
};

/** How each "Read as" chip is drawn. The border style carries the meaning as well as the colour. */
const READ: Record<Understood["from"], { cls: string; tag: string }> = {
  question: { cls: "border-star/60 bg-star/5", tag: "from your question" },
  picked: { cls: "border-ember/60 bg-ember/10", tag: "you chose it" },
  default: { cls: "border-dashed border-muted/60", tag: "default" },
  unresolved: { cls: "border-dashed border-bad/70 bg-bad/5", tag: "couldn’t be read" },
};

const chip = (on: boolean) =>
  `rounded-full border px-3 py-1 text-xs transition ${on ? "border-ember bg-ember/15 text-ember-soft" : "border-line bg-panel text-muted hover:border-muted hover:text-text"}`;

async function requestAnswer(params: BurnParams): Promise<BurnAnswer> {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
  const res = await fetch(`/api/burn/ask?${query}`);
  const body = (await res.json()) as BurnAnswer & { error?: string };
  if (!res.ok) throw new Error(body.error || "The request failed.");
  return body;
}

export function BurnView() {
  const search = useSearchParams();
  const linkedQuestion = search.get("q")?.trim().slice(0, 500) || "";

  const [data, setData] = useState<BurnData | null>(null);
  const [dataError, setDataError] = useState(false);
  const [answer, setAnswer] = useState<BurnAnswer | null>(null);
  const [asked, setAsked] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedQuestion[]>([]);
  const [storage, setStorage] = useState({ durable: true, canUndo: false });

  const interacted = useRef(false);
  const library = useRef<QuestionLibrary | null>(null);
  const controller = useRef<Controller | null>(null);
  const answerHeading = useRef<HTMLHeadingElement>(null);

  const activeMission = useAppStore((s) => MISSIONS.find((m) => m.id === s.missionId));

  const refreshSaved = useCallback(() => {
    const lib = library.current;
    if (!lib) return;
    setSaved(lib.list());
    setStorage({ durable: lib.durable, canUndo: lib.canUndo });
  }, []);

  // The controller and the saved-question list are created once, in the browser.
  useEffect(() => {
    let store: Storage | null = null;
    try {
      store = window.localStorage;
    } catch {
      /* storage blocked: questions are kept for this visit only */
    }
    library.current = createQuestionLibrary(store);
    controller.current = createController({
      request: requestAnswer,
      onBusy: (on) => setBusy(on),
      onAnswer: (result, meta) => {
        const question = askedFor(result, meta);
        setAnswer(result);
        setAsked(question);
        setFailure(null);
        if (meta.kind !== "question") setInput(result.canonical);
        // Only what the visitor asked is saved, never the suggestion the page opens with, and never an answer.
        if (interacted.current) {
          library.current?.record(meta.kind === "restore" ? (meta.question ?? question) : question, meta.params);
          refreshSaved();
        }
      },
      onError: (error, meta) => {
        setAnswer(null);
        setAsked(meta.kind === "question" ? (meta.question ?? "") : "");
        setFailure(error instanceof TypeError ? "The server couldn’t be reached. Check your connection and try again." : error.message);
      },
    });
    refreshSaved();

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === LIBRARY_KEY || ev.key === null) {
        library.current?.reload();
        refreshSaved();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshSaved]);

  // The tables behind the page, loaded once.
  useEffect(() => {
    let alive = true;
    fetch("/api/burn/data")
      .then((r) => (r.ok ? (r.json() as Promise<BurnData>) : Promise.reject(new Error("unavailable"))))
      .then((d) => alive && setData(d))
      .catch(() => alive && setDataError(true));
    return () => {
      alive = false;
    };
  }, []);

  // The first question: the one in the address (VESTA links here with it), otherwise the first suggestion.
  useEffect(() => {
    const ctl = controller.current;
    if (!ctl) return;
    if (linkedQuestion) {
      interacted.current = true;
      setInput(linkedQuestion);
      void ctl.ask(linkedQuestion);
    } else if (!interacted.current) {
      setInput(SUGGESTIONS[0]);
      void ctl.ask(SUGGESTIONS[0]);
    }
  }, [linkedQuestion]);

  const askQuestion = useCallback((question: string) => {
    interacted.current = true;
    setFormError(null);
    setInput(question);
    void controller.current?.ask(question);
  }, []);

  const change = useCallback((patch: BurnParams) => {
    interacted.current = true;
    void controller.current?.change(patch);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) {
      setFormError("Type a question, or pick one of the suggestions below.");
      return;
    }
    askQuestion(question);
  };

  const openSaved = (entry: SavedQuestion) => {
    interacted.current = true;
    setInput(entry.question);
    void controller.current?.restore(entry.params, entry.question);
    answerHeading.current?.focus();
    answerHeading.current?.scrollIntoView({ block: "start" });
  };
  const removeSaved = (id: string) => {
    if (library.current?.remove(id)) refreshSaved();
  };
  const undoRemove = () => {
    if (library.current?.undo()) refreshSaved();
  };

  const exportBrief = () => {
    if (!answer) return;
    const markdown = briefMarkdown(answer, { asked, records: data?.records ?? [], product: BRAND.name, date: new Date().toISOString().slice(0, 10) });
    saveFile(briefFileName(answer, BRAND.exportPrefix), markdown, "text/markdown;charset=utf-8");
  };

  const s = answer?.scenario;
  const presetAir = s && !s.air.explicitO2 && !s.air.explicitPsi ? s.air.preset : null;

  return (
    <div className="space-y-8">
      <nav aria-label="On this page" className="flex gap-1 overflow-x-auto pb-1">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="shrink-0 rounded-md border border-line bg-panel/90 px-2.5 py-1 text-xs text-muted transition hover:border-muted hover:text-text">
            {label}
          </a>
        ))}
      </nav>

      <section aria-labelledby="answer" className="scroll-mt-28 space-y-4">
        <h2 id="answer" ref={answerHeading} tabIndex={-1} className="sr-only">
          Answer
        </h2>

        {/* ---------- ask ---------- */}
        <form onSubmit={submit} role="search" className="hud-panel space-y-3 p-4" noValidate>
          <label htmlFor="burn-question" className="block font-head text-sm font-semibold text-text">
            Ask about a material in a spacecraft cabin
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="burn-question"
              type="text"
              value={input}
              maxLength={500}
              autoComplete="off"
              spellCheck
              onChange={(e) => setInput(e.target.value)}
              aria-describedby="burn-question-help"
              aria-invalid={formError ? true : undefined}
              placeholder="Will a 1 mm acrylic sheet burn on the ISS with 10 cm/s of airflow?"
              className="min-w-0 flex-1 basis-64 rounded-md border border-line bg-bg px-3 py-2 text-sm text-text placeholder:text-muted focus:border-ember focus:outline-none"
            />
            <button type="submit" className="btn-ember" disabled={busy}>
              {busy ? "Checking…" : "Ask"}
            </button>
          </div>
          {formError && (
            <p role="alert" className="text-xs text-bad">
              {formError}
            </p>
          )}
          <p id="burn-question-help" className="text-xs text-muted">
            Read by fixed rules, not by AI: place, material, oxygen, pressure, thickness, width and airflow, with units. Anything it can&apos;t read is shown as unclear, never guessed. For open questions, ask {BRAND.assistant.name}.
          </p>
          <ul className="flex flex-wrap gap-1.5" aria-label="Suggested questions">
            {SUGGESTIONS.map((q) => (
              <li key={q}>
                <button type="button" onClick={() => askQuestion(q)} className="rounded-full border border-line bg-panel px-3 py-1 text-left text-xs text-muted transition hover:border-ember-soft hover:text-text">
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </form>

        {/* ---------- missions ---------- */}
        {answer && (
          <div className="space-y-2">
            <div role="group" aria-label="Mission" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {answer.missions.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={m.selected}
                  onClick={() => !m.selected && change({ mission: m.id })}
                  className={`hud-panel min-w-0 p-3 text-left transition ${m.selected ? "!border-ember shadow-[0_0_16px_rgba(255,122,47,0.18)]" : "hover:!border-muted"}`}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-head text-base font-semibold text-text">{m.name}</span>
                    <span className="font-mono text-xs text-muted">{m.gText}</span>
                  </span>
                  <span className="block text-xs text-muted">{m.sub}</span>
                  <span className="mt-1 block font-mono text-[11px] text-muted">
                    {m.air.name} air · {m.air.psi} psi · {m.air.o2}% O₂
                  </span>
                  <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${m.matches ? "border-ok/50 bg-ok/10 text-ok" : "border-warn/50 bg-warn/10 text-warn"}`}>
                    <span aria-hidden>{m.matches ? "●" : "○"}</span>
                    {m.matches ? `${m.matches} tests match` : "No tests match"}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">
              Each tile uses the cabin air printed on it. The mission bar at the top of {BRAND.name} uses its own reference atmospheres, which can differ
              {activeMission ? (
                <>
                  : right now it is set to {activeMission.name}, {activeMission.o2_pct}% O₂ at {activeMission.pressure_psi} psi.{" "}
                  <button
                    type="button"
                    className="text-ember-soft underline underline-offset-2 hover:text-ember"
                    onClick={() => change({ o2: activeMission.o2_pct, psi: activeMission.pressure_psi })}
                  >
                    Check that air here
                  </button>
                </>
              ) : (
                "."
              )}
            </p>
          </div>
        )}

        {/* ---------- how it was read ---------- */}
        {answer && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-mono text-[11px] uppercase tracking-wider text-muted">Read as</span>
              {answer.understood.map((u, i) => (
                <span key={i} className={`rounded-md border px-2 py-1 text-xs text-text ${READ[u.from].cls}`}>
                  <b className="mr-1.5 font-medium text-muted">{u.field}</b>
                  {u.value}
                  <span className="sr-only">, {READ[u.from].tag}</span>
                </span>
              ))}
            </div>
            <p className="text-[11px] text-muted">Solid blue border: from your question. Solid orange: you chose it. Dashed: a default you can change. Dashed red: couldn&apos;t be read.</p>
            {answer.notices.map((n, i) => (
              <p key={i} className="rounded-md border border-line bg-raised/60 px-3 py-1.5 text-xs text-muted">
                {n}
              </p>
            ))}
          </div>
        )}

        {/* ---------- verdict ---------- */}
        <p role="status" className="sr-only">
          {busy ? "Checking NASA’s tests." : answer ? `${answer.verdict.stamp}. ${answer.verdict.count}. ${answer.verdict.headline}` : failure ? "This question wasn’t answered." : ""}
        </p>

        {failure && (
          <div role="alert" className="hud-panel border-dashed !border-bad/60 p-5">
            <p className="font-head text-2xl font-bold text-bad">Not answered</p>
            {asked && <p className="mt-1 text-xs text-muted">Asked: “{asked}”</p>}
            <p className="mt-2 text-sm text-text">This question wasn&apos;t answered. {failure}</p>
          </div>
        )}

        {!answer && !failure && (
          <div className="hud-panel p-5" aria-busy="true">
            <div className="h-8 w-40 animate-pulse rounded bg-raised" />
            <p className="mt-3 text-sm text-muted">Checking NASA&apos;s tests…</p>
          </div>
        )}

        {answer && s && (
          <div className={`space-y-4 transition-opacity ${busy ? "opacity-60" : ""}`} aria-busy={busy}>
            <div className="hud-panel grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`inline-block rounded-lg border-2 px-3 py-1 font-head text-3xl font-bold leading-tight ${STAMP[answer.verdict.state]}`}>{answer.verdict.stamp}</span>
                  <span className="font-mono text-sm text-muted">{answer.verdict.count}</span>
                </p>
                {asked && <p className="mt-2 text-xs text-muted">Asked: “{asked}”</p>}
                <p className="mt-2 font-head text-xl font-semibold text-text [text-wrap:balance]">{answer.verdict.headline}</p>
                <p className="mt-1 max-w-3xl text-sm text-muted">{answer.verdict.sub}</p>
                {answer.why && (
                  <p className="mt-3 max-w-3xl rounded-lg border border-line bg-raised/60 p-3 text-xs text-muted">
                    <b className="font-medium text-text">{answer.why.lead}</b> {answer.why.text}{" "}
                    <a href={answer.why.source.url} target="_blank" rel="noopener noreferrer" className="text-ember-soft underline underline-offset-2">
                      Source<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </p>
                )}
                <p className="mt-3 text-[11px] text-muted">What NASA observed in the matching tests, or the gap that stops an answer. Not a prediction, and not a safety rating.</p>
              </div>
              <div className="flex flex-col items-start gap-2 lg:items-end">
                <button type="button" onClick={exportBrief} className="btn-ghost" disabled={busy}>
                  Export evidence brief
                  <span className="font-mono text-[10px] text-muted">.md</span>
                </button>
                <p className="max-w-[16rem] text-[11px] text-muted lg:text-right">Markdown, with every matching row, each gap and its source link.</p>
              </div>
            </div>

            <div className="hud-panel space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div role="group" aria-label="Cabin air" className="flex flex-wrap gap-1.5">
                  {AIR_BUTTONS.map((a) => (
                    <button key={a.id} type="button" aria-pressed={presetAir === a.id} onClick={() => presetAir !== a.id && change({ air: a.id })} className={chip(presetAir === a.id)}>
                      {a.label}
                    </button>
                  ))}
                </div>
                <div role="group" aria-label="Material" className="flex flex-wrap gap-1.5">
                  {MATERIAL_BUTTONS.map((m) => (
                    <button key={m.id} type="button" aria-pressed={s.material.id === m.id} onClick={() => s.material.id !== m.id && change({ material: m.id, thickness: "all" })} className={chip(s.material.id === m.id)}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted">{s.air.key === "custom" ? `Custom air: ${s.air.o2}% O₂ at ${s.air.psi} psi (O₂ partial pressure ${s.air.po2} kPa).` : `${s.mission.note} O₂ partial pressure ${s.air.po2} kPa.`}</p>
            </div>

            {answer.evidence && <KeyNumbers evidence={answer.evidence} />}
            <ChecksList checks={answer.checks} policy={answer.applicability.policy} />
            <EvidencePanel answer={answer} records={data?.records ?? []} onChange={change} />
          </div>
        )}
      </section>

      {dataError && (
        <p role="alert" className="hud-panel p-4 text-sm text-bad">
          The source tables didn&apos;t load, so the ranked findings, fire response and source rows can&apos;t be shown. Reload the page to try again.
        </p>
      )}
      {data && (
        <>
          <RankedFindings data={data} />
          <FireResponsePanel data={data} />
        </>
      )}
      <SavedQuestions entries={saved} durable={storage.durable} canUndo={storage.canUndo} onOpen={openSaved} onRemove={removeSaved} onUndo={undoRemove} />
      {data && <SourcesPanel data={data} answer={answer} records={data.records} />}
    </div>
  );
}
