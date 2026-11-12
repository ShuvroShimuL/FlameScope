import { z } from "zod";
import { askBurn, BURN_MATERIALS, BurnInputError, type BurnAnswer, type BurnParams, type VerdictState } from "@/lib/burn";
import type { Confidence, Source } from "@/lib/types";
import { defineTool, fail } from "./types";

/**
 * Solid materials. The answer is computed by the evidence engine (lib/evidence) from NASA's BASS-II source
 * rows, by fixed rules. This tool only passes it on: it adds no number, and the model is told to quote it.
 */

// Gas and liquid fuels are the other tools' ground (ACME, CFI, SPICE), so they are not offered here.
const SOLIDS = BURN_MATERIALS.filter((m) => m !== "fuel" && m !== "wax") as [string, ...string[]];
const MISSIONS = ["iss", "moon", "transit", "mars", "earth"] as const;

/**
 * An observation in matching rows is "supported": it is what NASA's table records. It says nothing beyond those
 * rows. No matching row, or a question that could not be read, is "no_data".
 */
const CONFIDENCE: Record<VerdictState, Confidence> = { burned: "supported", mixed: "supported", "no-burn": "supported", "no-data": "no_data", unresolved: "no_data" };

/** Where each evidence set is printed in the BASS-II report. */
const TABLE: Record<string, { file: string; page: number }> = {
  pmma: { file: "BASS-II report TM-20210011385, Table 5.1", page: 57 },
  sibal: { file: "BASS-II report TM-20210011385, Table 7.1", page: 96 },
  nomex: { file: "BASS-II report TM-20210011385, Table A.2", page: 105 },
};

const idList = (ids: string[], max = 25) => (ids.length > max ? `${ids.slice(0, max).join(", ")} and ${ids.length - max} more` : ids.join(", "));

/** The table an answer was checked against. An untested material is shown against the acrylic set. */
function tableFor(a: BurnAnswer) {
  const set = a.evidence?.kind === "outcomes" ? a.evidence.set : a.scenario.material.supported ? a.scenario.material.id : "pmma";
  return TABLE[set] ?? TABLE.pmma;
}

function sourcesFor(a: BurnAnswer): Source[] {
  const table = tableFor(a);
  const ids = a.evidence?.ids ?? a.closest?.tests.map((t) => t.id) ?? [];
  const rows = ids.length ? `${a.evidence ? "matching tests" : "closest tests, none of which matches"}: ${idList(ids)}` : "no test in this table matches";
  // A slash in a name would be read as a folder by the source chips, so cited names are flattened.
  const cited = a.gaps.map((g) => ({ file: g.source.name.replace(/\//g, " "), note: g.source.url }));
  return [{ ...table, note: rows }, ...cited].filter((s, i, all) => all.findIndex((x) => x.file === s.file) === i).slice(0, 6);
}

/** A compact copy of the answer: everything VESTA may say, in the engine's own words. */
function dataFor(a: BurnAnswer) {
  const ev = a.evidence;
  const table = tableFor(a);
  return {
    asked: a.question || a.canonical,
    source: `${table.file}, p. ${table.page}`,
    read_as: a.understood.map((u) => `${u.field}: ${u.value} (${u.from === "default" ? "default, not stated" : u.from === "unresolved" ? "could not be read" : u.from})`),
    verdict: { state: a.verdict.state, stamp: a.verdict.stamp, count: a.verdict.count, headline: a.verdict.headline, detail: a.verdict.sub },
    matched_tests: ev ? ev.ids.slice(0, 25) : [],
    checks: a.checks.map((c) => ({ condition: c.label, yours: c.yours, tested: c.tested, result: c.statusLabel, blocks_a_match: !c.ok })),
    evidence: !ev
      ? null
      : ev.kind === "spread"
        ? { tests: ev.stats.tests, spread_not_tracked_in: ev.stats.notTracked, burned_minutes: [ev.stats.burnMin, ev.stats.burnMax], fastest_spread: ev.stats.fastest, slowest_spread: ev.stats.slowest, units: "spread mm/s, airflow cm/s", finding: `${ev.finding.lead} ${ev.finding.text}` }
        : { counts: ev.counts, studies: ev.studies, finding: `${ev.finding.lead} ${ev.finding.text}` },
    caveat: ev?.caveat ?? null,
    closest_tests: a.closest?.tests.slice(0, 3).map((t) => ({ id: t.id, recorded: t.conditions.map((c) => `${c.label} ${c.ok ? "yes" : "no"}: ${c.recorded}`) })) ?? [],
    gaps: a.gaps.slice(0, 3).map((g) => ({ topic: g.topic, text: g.text, source: g.source.name })),
    could_not_read: a.unresolved.map((u) => u.reason),
    notices: a.notices,
    canonical_question: a.canonical,
    not_a_safety_rating: true,
  };
}

export type WillItBurnData = ReturnType<typeof dataFor>;

export const willItBurnTool = defineTool({
  name: "will_it_burn",
  description:
    "Check a SOLID material in a cabin against NASA's BASS-II microgravity tests: acrylic (PMMA) sheets, SIBAL cotton-fibreglass fabric and Nomex, burned in the ISS glovebox. A test counts only if its own row records every condition given, together; nothing is interpolated or extrapolated. Returns the verdict (burned, mixed, no-burn = no flame held, no-data, unresolved = unclear), the matching test ids, each condition check, the closest tests and sourced gaps. It reports what NASA observed in those rows. It is never a prediction and never a safety rating. Use it for any question about a solid material or fabric, or 'will it burn'. Pass the user's own question, and add explicit conditions only when the user gave them.",
  input: z.object({
    question: z.string().max(500).optional().describe("The user's question in their own words, e.g. 'Will a 1 mm acrylic sheet burn on the ISS with 10 cm/s airflow?'"),
    mission: z.enum(MISSIONS).optional().describe("Where: iss, moon (surface base), transit (cruise to Mars), mars (surface base) or earth"),
    material: z.enum(SOLIDS).optional().describe("pmma (acrylic), sibal (cotton-fibreglass fabric) and nomex have tests; the others return a sourced gap"),
    o2_pct: z.number().min(0).max(100).optional().describe("Oxygen share, percent by volume"),
    pressure_psi: z.number().positive().max(1000).optional().describe("Cabin pressure, psi"),
    thickness_mm: z.number().positive().max(1000).optional().describe("Sheet thickness, mm (acrylic only)"),
    width_mm: z.number().positive().max(10000).optional().describe("Sample width, mm"),
    airflow_cm_s: z.number().min(0).max(100000).optional().describe("Airflow, cm/s; 0 is still air"),
  }),
  run(input) {
    const params: BurnParams = {};
    if (input.question?.trim()) params.q = input.question.trim();
    if (input.mission) params.mission = input.mission;
    if (input.material) params.material = input.material;
    if (input.o2_pct !== undefined) params.o2 = input.o2_pct;
    if (input.pressure_psi !== undefined) params.psi = input.pressure_psi;
    if (input.thickness_mm !== undefined) params.thickness = input.thickness_mm;
    if (input.width_mm !== undefined) params.width = input.width_mm;
    if (input.airflow_cm_s !== undefined) params.airflow = input.airflow_cm_s;
    if (!Object.keys(params).length) return fail("will_it_burn needs the question or at least one condition");

    let answer: BurnAnswer;
    try {
      answer = askBurn(params);
    } catch (e) {
      if (e instanceof BurnInputError) return fail(e.message);
      throw e;
    }
    return {
      ok: true,
      data: dataFor(answer),
      sources: sourcesFor(answer),
      confidence: CONFIDENCE[answer.verdict.state],
      summary: `${answer.verdict.stamp}: ${answer.verdict.count}`,
    };
  },
});
