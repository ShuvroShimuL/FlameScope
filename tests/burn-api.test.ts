import { describe, expect, it } from "vitest";
import { GET as askGET } from "@/app/api/burn/ask/route";
import { GET as dataGET } from "@/app/api/burn/data/route";
import { allTests } from "@/lib/data";
import { askBurn, BURN_MISSIONS, BURN_PARAM_KEYS, BURN_TESTED_MATERIALS, BurnInputError, burnData, type BurnAnswer } from "@/lib/burn";

const ask = (query: string) => askGET(new Request(`http://localhost/api/burn/ask${query}`));
const answer = async (query: string) => (await (await ask(query)).json()) as BurnAnswer;
const failed = (a: BurnAnswer) => a.checks.filter((c) => !c.ok).map((c) => c.key);

describe("GET /api/burn/ask", () => {
  it("answers a question from the matching source rows", async () => {
    const res = await ask(`?q=${encodeURIComponent("Will acrylic burn on the ISS?")}`);
    expect(res.status).toBe(200);
    const a = (await res.json()) as BurnAnswer;
    expect(a.verdict.state).toBe("burned");
    expect(a.verdict.stamp).toBe("Burned");
    expect(a.evidence?.ids).toHaveLength(20);
    expect(a.applicability.matched).toEqual(a.evidence?.ids);
    expect(a.sources[0].url).toBe("https://ntrs.nasa.gov/citations/20210011385");
  });

  it("says No data, names each gap and cites it, instead of predicting", async () => {
    const a = await answer(`?q=${encodeURIComponent("Will it burn on a Moon base at 34% oxygen?")}`);
    expect(a.verdict.state).toBe("no-data");
    expect(a.evidence).toBeNull();
    expect(failed(a)).toEqual(["gravity", "oxygen", "pressure"]);
    expect(a.gaps.length).toBeGreaterThan(0);
    for (const g of a.gaps) expect(g.source.url).toMatch(/^https:\/\//);
    expect(a.nearest?.label).toBeTruthy();
  });

  it("counts a test only when one row records every condition together", async () => {
    // 1 mm sheets exist, and 10 cm/s readings exist, and some tests have both: those match.
    const both = await answer("?material=pmma&thickness=1&airflow=10");
    expect(both.verdict.state).toBe("burned");
    for (const id of both.applicability.matched) {
      const row = burnData().records.find((r) => r.id === id)!;
      expect(row.thicknessMm).toBe(1);
      expect(row.velocity).toContain(10);
    }
    // An oxygen level can't be tied to one airflow reading in Table 5.1, so the pair is never a match.
    const untied = await answer("?material=pmma&o2=19&airflow=10");
    expect(untied.verdict.state).toBe("no-data");
    expect(failed(untied)).toContain("together");
    expect(untied.closest?.tests.length).toBeGreaterThan(0);
  });

  it("returns Unclear with the reason when a condition can't be read, and never a default in its place", async () => {
    const a = await answer(`?q=${encodeURIComponent("Will acrylic burn at 150% oxygen?")}`);
    expect(a.verdict.state).toBe("unresolved");
    expect(a.unresolved[0].reason).toMatch(/between 0% and 100%/);
    expect(a.evidence).toBeNull();
    expect(a.understood.some((u) => u.from === "unresolved")).toBe(true);
  });

  it("answers Mixed and No flame held from recorded outcomes, without a safety rating", async () => {
    const fabric = await answer("?material=sibal");
    expect(fabric.verdict.state).toBe("mixed");
    const nomex = await answer(`?q=${encodeURIComponent("Is Nomex safe on the ISS?")}`);
    expect(nomex.verdict.state).toBe("no-burn");
    expect(nomex.verdict.sub).toMatch(/isn’t a safety rating/);
    expect(JSON.stringify(nomex.verdict)).not.toMatch(/\bis safe\b|certified/i);
  });

  it("rejects bad requests with a 400 and a plain message", async () => {
    expect((await ask("?mission=pluto")).status).toBe(400);
    expect((await ask("?o2=101")).status).toBe(400);
    expect((await ask("?material=other")).status).toBe(400);
    const unknown = await ask("?colour=red");
    expect(unknown.status).toBe(400);
    expect(((await unknown.json()) as { error: string }).error).toMatch(/unknown parameter: colour/);
    const long = await ask(`?q=${"x".repeat(501)}`);
    expect(long.status).toBe(400);
    expect((await ask(`?material=${"x".repeat(600)}`)).status).toBe(400);
    for (const res of [await ask("?mission=pluto"), unknown]) expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("accepts every documented parameter and nothing that looks like markup comes back unescaped as code", async () => {
    const query = new URLSearchParams({ q: "<script>alert(1)</script> acrylic", mission: "iss", air: "earth", material: "pmma", thickness: "1", width: "22", airflow: "10" });
    const res = await ask(`?${query}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    for (const key of query.keys()) expect(BURN_PARAM_KEYS).toContain(key);
  });
});

describe("GET /api/burn/data", () => {
  it("serves the acrylic rows, ranked findings and NASA's fire-response steps with their sources", async () => {
    const d = (await dataGET().json()) as ReturnType<typeof burnData>;
    expect(d.records).toHaveLength(20);
    expect(d.records.map((r) => r.id)).toEqual(Array.from({ length: 20 }, (_, i) => `M${i + 1}`));
    for (const r of d.records) expect(r.sourceLocation).toMatch(/^Table 5\.1, printed p\. 57, row M\d+$/);
    expect(d.findings.ranked.map((f) => f.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(d.fireResponse.steps.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(d.fireResponse.source.url).toMatch(/^https:\/\//);
    expect(d.policy).toMatch(/own row records every condition/);
  });

  it("keeps a spread the report did not track as missing, never zero", () => {
    const untracked = burnData().records.filter((r) => r.spread === null);
    expect(untracked.map((r) => r.id)).toEqual(["M6", "M12"]);
    for (const r of untracked) expect(r.missing).toContain("spread rate (not tracked)");
    for (const r of burnData().records) expect(r.spread === null || r.spread.every((s) => s > 0)).toBe(true);
  });
});

describe("the solid-material rows stay a separate evidence set", () => {
  it("none of them is in the ACME / CFI / SPICE table, and that table still has no solid tests", () => {
    const ids = new Set(allTests().map((t) => t.test_id));
    for (const r of burnData().records) expect(ids.has(r.id)).toBe(false);
    expect(allTests().filter((t) => t.fuel_phase === "solid")).toHaveLength(0);
    expect(new Set(allTests().map((t) => t.investigation))).toEqual(new Set(["ACME", "CFI", "SPICE"]));
  });

  it("exposes which missions and materials the engine knows, and which materials have tests", () => {
    expect(BURN_MISSIONS).toEqual(["iss", "moon", "transit", "mars"]);
    expect(BURN_TESTED_MATERIALS).toEqual(["pmma", "sibal", "nomex"]);
  });

  it("turns an engine input error into its own error type, and lets nothing else through as one", () => {
    expect(() => askBurn({ mission: "pluto" })).toThrow(BurnInputError);
    expect(() => askBurn({ q: "Will acrylic burn at 150% oxygen?" })).not.toThrow();
  });
});
