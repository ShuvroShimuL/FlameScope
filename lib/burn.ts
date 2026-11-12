/**
 * Will it burn? The typed front door to the evidence engine in lib/evidence/.
 *
 * The engine checks a cabin scenario against NASA's BASS-II solid-material tests (acrylic sheets, SIBAL
 * fabric, Nomex). A test counts only if its own row records every condition given, together: nothing is
 * interpolated or extrapolated. Its answer is an observation or a named gap, never a safety rating.
 *
 * These rows are a separate evidence set. They are never merged into the ACME, CFI and SPICE table in
 * lib/data.ts, because the two record oxygen, pressure and airflow in ways that cannot share one table.
 *
 * Server only: the engine reads its committed source rows from data/evidence/ when it first loads.
 */
import { provenance, records } from "./evidence/evidence.mjs";
import { FINDINGS } from "./evidence/findings.mjs";
import { FIRE_RESPONSE } from "./evidence/response.mjs";
import { ask, InputError, MATERIALS, MISSIONS, POLICY, SETS } from "./evidence/scenario.mjs";
import { flexProvenance } from "./evidence/flex.mjs";
import { saffireProvenance } from "./evidence/saffire.mjs";
import { tablesProvenance } from "./evidence/sets.mjs";
import { BURN_PARAM_KEYS, type BurnAnswer, type BurnData, type BurnParams, type BurnRecord, type FireResponse, type Findings } from "./evidence/types";

export { BURN_PARAM_KEYS };
export type * from "./evidence/types";

/** The applicability rule, in the words shown to users. */
export const BURN_POLICY: string = POLICY;

/** Mission ids the engine has a tile for. Any other place a question names is answered as "not in this data". */
export const BURN_MISSIONS: readonly string[] = MISSIONS.map((m) => m.id);

/** Material ids the engine recognises. Only three have tests behind them: pmma, sibal and nomex. */
export const BURN_MATERIALS: readonly string[] = MATERIALS.map((m) => m.id);
export const BURN_TESTED_MATERIALS: readonly string[] = MATERIALS.filter((m) => m.supported).map((m) => m.id);

/**
 * What solid-material evidence exists, counted from the rows. The rest of the app uses this whenever it has
 * to say how much is known about solids, so that sentence can never drift from the data.
 */
export function burnCoverage() {
  const span = (set: { envelope: { o2Min: number; o2Max: number } }) => `${set.envelope.o2Min}–${set.envelope.o2Max}% O2`;
  const acrylic = SETS.pmma.rows.length;
  const fabric = SETS.sibal.rows.length;
  const nomex = SETS.nomex.rows.length;
  const fabricFromBass = SETS.sibal.rows.filter((t: { study?: string }) => t.study === "BASS").length;
  const o2Max = Math.max(SETS.pmma.envelope.o2Max, SETS.sibal.envelope.o2Max, SETS.nomex.envelope.o2Max);
  return {
    acrylic,
    fabric,
    fabricFromBass,
    nomex,
    o2Max,
    // "lists", not "burned": the Nomex samples never ignited, and some fabric samples did not either. Each set keeps
    // its own oxygen range, and nothing here calls the glovebox atmosphere cabin air: many tests began well below it.
    text: `The BASS-II report lists ${acrylic} acrylic sheet tests (${span(SETS.pmma)}), ${fabric} SIBAL fabric tests (${span(SETS.sibal)}, ${fabricFromBass} of them from the earlier BASS investigation) and ${nomex} Nomex tests (${span(SETS.nomex)}), all in microgravity in the station's glovebox, where the recorded oxygen differed from test to test`,
  };
}

/** A problem with the request itself (an unknown mission, a number out of range), safe to show to the caller. */
export class BurnInputError extends Error {}

/**
 * Answers one scenario. Throws BurnInputError for a bad request; a question that cannot be read is not an
 * error, it comes back as the "unresolved" verdict with the reason.
 */
export function askBurn(params: BurnParams = {}): BurnAnswer {
  try {
    return ask(params) as unknown as BurnAnswer;
  } catch (e) {
    if (e instanceof InputError) throw new BurnInputError(e.message);
    throw e;
  }
}

/** The tables behind the page: every acrylic row, the ranked findings and NASA's quoted fire-response steps. */
export function burnData(): BurnData {
  return {
    records: records as unknown as BurnRecord[],
    findings: FINDINGS as unknown as Findings,
    fireResponse: FIRE_RESPONSE as unknown as FireResponse,
    policy: BURN_POLICY,
    provenance: {
      acrylic: provenance as Record<string, unknown>,
      tables: tablesProvenance as Record<string, unknown>,
      related: [saffireProvenance, flexProvenance] as Record<string, unknown>[],
    },
  };
}
