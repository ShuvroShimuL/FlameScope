/**
 * Shapes of what the evidence engine returns. Types only: this file imports nothing, so pages and
 * components can use it without pulling the engine (which reads files) into the browser bundle.
 * The engine itself is plain JavaScript in this folder; lib/burn.ts is its typed front door.
 */

/** burned, mixed and no-burn are observations in matching rows. no-data and unresolved are not answers about fire. */
export type VerdictState = "burned" | "mixed" | "no-burn" | "no-data" | "unresolved";

export interface SourceRef {
  name: string;
  url: string;
  label?: string;
}

/** One "Read as" chip: how a condition was understood, and where that reading came from. */
export interface Understood {
  field: string;
  value: string;
  from: "picked" | "question" | "default" | "unresolved";
}

export type CheckStatus = "match" | "context" | "unrecorded" | "separately" | "mismatch";

/** One condition compared with what the tests recorded. `ok` is false when it blocks an answer. */
export interface Check {
  key: string;
  label: string;
  yours: string;
  tested: string;
  status: CheckStatus;
  statusLabel: string;
  ok: boolean;
  note: string | null;
}

export interface MissionTile {
  id: string;
  name: string;
  sub: string;
  gText: string;
  home: string;
  /** Where the tile's cabin air comes from: the station's own, a NASA concept, or an assumption. */
  note: string;
  /** The cabin air this tile stands for when tapped. */
  air: { name: string; psi: number; o2: number };
  matches: number;
  selected: boolean;
}

export interface Scenario {
  mission: { id: string; name: string; sub: string; g: number | null; gText: string; gName: string; home: string; air: string; phrase: string; note: string; supported: boolean };
  air: { key: string; name: string; preset: string; explicitO2: boolean; explicitPsi: boolean; psi: number; o2: number; kpa: number; po2: number };
  material: { id: string; name: string; inline: string; supported: boolean };
  thickness: number | null;
  width: number | null;
  airflow: number | null;
}

/** One airflow setting of one acrylic test. `spread` is null when the report did not track it: never zero. */
export interface Reading {
  id: string;
  thicknessMm: number;
  velocity: number;
  spread: number | null;
}

export interface SpreadEvidence {
  kind: "spread";
  thickness: number | null;
  airflow: number | null;
  ids: string[];
  readings: Reading[];
  stats: { tests: number; notTracked: number; burnMin: number; burnMax: number; fastest: Reading | null; slowest: Reading | null };
  finding: { lead: string; text: string };
  caveat: string;
}

export interface OutcomeRow {
  id: string;
  /** Fabric rows only: Table 7.1 lists four tests from the earlier BASS investigation beside the BASS-II ones. */
  study?: "BASS" | "BASS-II";
  width?: string;
  date?: string;
  flowText: string;
  oxygenText: string;
  happened: string;
  atYourAirflow?: string | null;
  sourceLocation: string;
  oxygen?: number;
  outcome?: string;
}

export interface OutcomeEvidence {
  kind: "outcomes";
  set: "sibal" | "nomex";
  label: string;
  airflow: number | null;
  ids: string[];
  tests: OutcomeRow[];
  counts: { tests: number; ignited: number; burned: number; quenched: number; blowoff: number; noIgnition: number };
  studies: { "BASS-II": number; BASS: number } | null;
  finding: { lead: string; text: string };
  caveat: string;
  source: SourceRef;
}

export type Evidence = SpreadEvidence | OutcomeEvidence;

export interface Gap {
  topic: string;
  text: string;
  source: SourceRef;
}

/** A test that recorded some of the conditions but not all: shown, never counted as a match. */
export interface ClosestTest {
  id: string;
  conditions: { key: string; label: string; ok: boolean; recorded: string }[];
  untied: boolean;
  sourceLocation: string;
}

export interface Envelope {
  gravity: number;
  psi: number;
  pressureNote: string;
  o2Min: number;
  o2Max: number;
  po2Min: number;
  po2Max: number;
  flowMin: number | null;
  flowMax: number | null;
  flows: number[] | null;
  thicknesses: number[] | null;
  widths: number[] | null;
  summary: string;
}

export type FindingTier = "consistent" | "suggestive" | "mixed" | "too-few";

/** One ranked finding over the acrylic rows. Tiers are this app's display rule, not a statistical test. */
export interface Finding {
  rank: number;
  key: string;
  tier: FindingTier;
  tierLabel: string;
  lead: string;
  text: string;
  caveat: string;
  comparisons: number;
  agree: number;
  tests: number;
  ids: string[];
  matchedOn: string[];
  notMatched: string[];
  exceptions: string[];
}

export interface Findings {
  tests: number;
  method: string;
  rule: string;
  caveat: string;
  ranked: Finding[];
}

export interface FireResponseStep {
  n: number;
  step: string;
  detail: string | null;
  status: "one" | "some" | "mixed" | "reason" | "related" | "none";
  statusLabel: string;
  evidence: { text: string; source: SourceRef | null }[];
  differs: { text: string; source: SourceRef | null } | null;
}

/** NASA's quoted fire-response steps, in NASA's order, with the microgravity evidence found for each. */
export interface FireResponse {
  title: string;
  source: { name: string; url: string; date: string; location: string; intro: string; caveat: string };
  method: string;
  verification: string;
  limitations: string[];
  steps: FireResponseStep[];
}

/** One acrylic (PMMA) sheet test, as transcribed from Table 5.1 of the BASS-II report. */
export interface BurnRecord {
  id: string;
  studyId: string;
  material: string;
  geometry: string;
  flowDirection: string;
  thicknessMm: number;
  widthMm: number;
  burningSides: number;
  velocity: number[];
  /** Null when the report did not track the spread. Never zero. */
  spread: number[] | null;
  burnMin: number;
  oxygenInitial: number;
  oxygenFinal: number;
  sourceLocation: string;
  source: string;
  missing: string[];
}

export interface BurnAnswer {
  question: string;
  /** The question restated from what was read, or the original text when it could not be read. */
  canonical: string;
  notices: string[];
  unresolved: { key: string; label: string; reason: string }[];
  understood: Understood[];
  scenario: Scenario;
  missions: MissionTile[];
  checks: Check[];
  verdict: { state: VerdictState; stamp: string; count: string; headline: string; sub: string };
  why: { lead: string; text: string; source: SourceRef } | null;
  evidence: Evidence | null;
  findings: Findings | null;
  /** A separate experiment (Saffire-II), shown beside an answer and never inside it. */
  related: { text: string; source: SourceRef } | null;
  closest: { set: string; tests: ClosestTest[] } | null;
  gaps: Gap[];
  nearest: { label: string; changes: string; params: Record<string, string | number> } | null;
  applicability: { policy: string; matched: string[]; given: string[] };
  envelope: Envelope;
  sources: SourceRef[];
}

/** Request parameters for one answer. Everything is optional: a question alone is enough. */
export type BurnParams = Partial<Record<(typeof BURN_PARAM_KEYS)[number], string | number>>;

export const BURN_PARAM_KEYS = ["q", "mission", "place", "g", "air", "o2", "psi", "material", "materialName", "thickness", "width", "airflow"] as const;

/** The tables the page loads once: every acrylic row, the ranked findings and NASA's fire-response steps. */
export interface BurnData {
  records: BurnRecord[];
  findings: Findings;
  fireResponse: FireResponse;
  policy: string;
  provenance: { acrylic: Record<string, unknown>; tables: Record<string, unknown>; related: Record<string, unknown>[] };
}
