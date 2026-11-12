import { beforeEach, describe, expect, it } from "vitest";
import { burnCoverage } from "@/lib/burn";
import { TOOL_RESULT_MAX_CHARS, withAutoView } from "@/lib/vesta/agent";
import type { VestaEvent } from "@/lib/vesta/events";
import { checkGrounding } from "@/lib/vesta/grounding";
import { detectIntent, runOffline } from "@/lib/vesta/offline";
import type { ChatSession, Provider, ProviderReply, ToolResultMessage } from "@/lib/vesta/providers/types";
import { clearVestaCache, runVesta } from "@/lib/vesta/router";
import { DATA_TOOLS, runTool, VESTA_TOOLS } from "@/lib/vesta/tools";
import { toolSpecs } from "@/lib/vesta/tools/schemas";
import { VIEW_PATHS, VIEWS } from "@/lib/vesta/tools/ui_action";
import type { WillItBurnData } from "@/lib/vesta/tools/will_it_burn";
import { followUps, toolLabel } from "@/components/vesta/suggest";

const burn = async (args: unknown, missionId?: string) => {
  const r = await runTool("will_it_burn", args, { missionId });
  return { r, d: r.data as WillItBurnData };
};

beforeEach(() => clearVestaCache());

describe("will_it_burn tool", () => {
  it("is one of VESTA's data tools, with a schema every provider accepts", () => {
    expect(DATA_TOOLS.map((t) => t.name)).toContain("will_it_burn");
    const spec = toolSpecs(VESTA_TOOLS).find((t) => t.name === "will_it_burn")!;
    const json = JSON.stringify(spec.parameters);
    // Plain properties only: some engines reject unions in tool schemas.
    expect(json).not.toMatch(/anyOf|oneOf|\$ref/);
    expect(spec.description).toMatch(/never a prediction and never a safety rating/);
    expect(toolLabel("will_it_burn")).toBe("Checking the solid-material tests");
  });

  it("returns the observation with its matching rows and table, as supported", async () => {
    const { r, d } = await burn({ question: "Will acrylic burn on the ISS?" });
    expect(r.ok).toBe(true);
    expect(r.confidence).toBe("supported");
    expect(d.verdict).toMatchObject({ state: "burned", stamp: "Burned", count: "20 of 20 tests" });
    expect(d.matched_tests).toHaveLength(20);
    expect(r.sources[0]).toMatchObject({ file: "BASS-II report TM-20210011385, Table 5.1", page: 57 });
    expect(r.sources[0].note).toMatch(/^matching tests: M1, M2/);
    expect(d.not_a_safety_rating).toBe(true);
    expect(r.summary).toBe("Burned: 20 of 20 tests");
  });

  it("says no_data and names sourced gaps when no single row records the conditions", async () => {
    const moon = await burn({ question: "Will it burn on a Moon base at 34% oxygen?" });
    expect(moon.r.confidence).toBe("no_data");
    expect(moon.d.verdict.state).toBe("no-data");
    expect(moon.d.matched_tests).toEqual([]);
    expect(moon.d.evidence).toBeNull();
    expect(moon.d.gaps.length).toBeGreaterThan(0);
    expect(moon.d.checks.filter((c) => c.blocks_a_match).map((c) => c.condition)).toEqual(["Gravity", "Oxygen", "Pressure"]);

    const joint = await burn({ material: "pmma", o2_pct: 19, airflow_cm_s: 10 });
    expect(joint.d.verdict.state).toBe("no-data");
    expect(joint.d.closest_tests.length).toBeGreaterThan(0);
    expect(joint.r.sources[0].note).toMatch(/^closest tests, none of which matches/);
  });

  it("returns unresolved, with the reason, when a condition can't be read", async () => {
    const { r, d } = await burn({ question: "Will acrylic burn at 150% oxygen?" });
    expect(r.ok).toBe(true);
    expect(r.confidence).toBe("no_data");
    expect(d.verdict.state).toBe("unresolved");
    expect(d.could_not_read[0]).toMatch(/between 0% and 100%/);
    expect(d.matched_tests).toEqual([]);
  });

  it("keeps recorded outcomes and study labels, and never turns them into a rating", async () => {
    const fabric = await burn({ material: "sibal", o2_pct: 21 });
    expect(fabric.d.verdict.state).toBe("burned");
    expect(fabric.d.evidence).toMatchObject({ studies: { "BASS-II": 0, BASS: 4 } });
    expect(fabric.d.caveat).toMatch(/All 4 of these tests are from the earlier BASS investigation/);
    expect(fabric.r.sources[0]).toMatchObject({ file: "BASS-II report TM-20210011385, Table 7.1", page: 96 });

    const nomex = await burn({ question: "Is Nomex safe on the ISS?" });
    expect(nomex.d.verdict.state).toBe("no-burn");
    expect(nomex.d.verdict.detail).toMatch(/isn’t a safety rating/);
    expect(nomex.r.sources[0]).toMatchObject({ page: 105 });
    expect(JSON.stringify(nomex.d)).not.toMatch(/\bis safe\b|certified|safe to use/i);
  });

  it("never borrows a condition from the active mission", async () => {
    // The dashboard's active mission is the lunar rover (34% O2, 8.2 psi). The question names neither.
    const { d } = await burn({ question: "Will acrylic burn?" }, "lunar-rover");
    expect(d.verdict.state).toBe("burned");
    expect(d.read_as).toContain("Mission: ISS (default, not stated)");
    expect(d.read_as.some((x) => /Cabin air: Earth-normal .* \(default, not stated\)/.test(x))).toBe(true);
    expect(JSON.stringify(d)).not.toMatch(/34%|8\.2 psi/);
  });

  it("rejects an empty call, an unknown place and a gas fuel without throwing", async () => {
    expect((await burn({})).r.ok).toBe(false);
    expect((await burn({ mission: "pluto" })).r.error).toBe("invalid_arguments");
    expect((await burn({ material: "fuel" })).r.error).toBe("invalid_arguments");
    expect((await burn({ o2_pct: 101 })).r.error).toBe("invalid_arguments");
    expect((await burn({ question: "x".repeat(501) })).r.error).toBe("invalid_arguments");
  });

  it("fits inside what the agent passes back to a model, so nothing is cut off", async () => {
    for (const question of [
      "Will acrylic burn on the ISS?",
      "Will it burn on a Moon base at 34% oxygen?",
      "Will a 1 mm acrylic sheet burn at 19% oxygen with 10 cm/s airflow?",
      "Will SIBAL fabric burn at 21% oxygen?",
      "Is Nomex safe on a Mars base?",
      "Will kapton burn in still air on Mars at 40% oxygen and 5 psi?",
    ]) {
      const r = await runTool("will_it_burn", { question });
      const payload = JSON.stringify({ ok: r.ok, data: r.data, sources: r.sources, confidence: r.confidence, error: r.error });
      expect(payload.length, question).toBeLessThanOrEqual(TOOL_RESULT_MAX_CHARS);
    }
  });

  it("opens the Will it burn? page with the question as the engine read it", () => {
    expect(VIEWS).toContain("burn");
    expect(VIEW_PATHS.burn).toBe("/burn");
    expect(withAutoView([], ["will_it_burn"], undefined, "Will acrylic burn on the ISS in Earth-normal air?")).toEqual([
      { action: "go_view", view: "burn", path: "/burn", question: "Will acrylic burn on the ISS in Earth-normal air?" },
    ]);
    // A view the model chose itself is never overridden.
    expect(withAutoView([{ action: "go_view", view: "overview", path: "/" }], ["will_it_burn"], undefined, "x")).toHaveLength(1);
  });
});

describe("Offline mode and solid materials", () => {
  it("sends named solid materials and 'will it burn' to the evidence engine", () => {
    for (const q of [
      "Will acrylic burn on the ISS?",
      "Will SIBAL fabric burn at 21% oxygen?",
      "Is Nomex safe on a Mars base?",
      "Will it burn on a Moon base at 34% oxygen?",
      "Predict the flame spread rate of cotton fabric at 40% O2 and 5 psi.",
      "Does kapton catch fire in still air?",
      ...followUps(["will_it_burn"]).slice(0, 2),
    ])
      expect(detectIntent(q), q).toBe("burn");
  });

  it("leaves every gas and droplet question where it was", () => {
    expect(detectIntent("Is 34% O2 at 8.2 psi tested?")).toBe("assess");
    expect(detectIntent("Run a safety audit for the rover")).toBe("safety");
    expect(detectIntent("What data is missing for the lunar rover?")).toBe("gaps");
    expect(detectIntent("Compare ACME and SPICE")).toBe("compare");
    expect(detectIntent("Which investigation is most relevant for the Moon base?")).toBe("rank");
    expect(detectIntent("What is a cool flame?")).toBe("explain_topic");
    expect(detectIntent("What is pO2 at 30% and 10.2 psi?")).toBe("calc");
    expect(detectIntent("Explain ACME-CFIG-128")).toBe("explain_test");
    expect(detectIntent("Are methane flames tested at 21% O2?")).toBe("assess");
  });

  for (const [question, state, confidence] of [
    ["Will acrylic burn on the ISS?", "Burned", "supported"],
    ["Will SIBAL fabric burn at 21% oxygen?", "Burned", "supported"],
    ["Is Nomex safe on the ISS?", "No flame held", "supported"],
    ["Will it burn on a Moon base at 34% oxygen?", "No data", "no_data"],
    ["Will a 1 mm acrylic sheet burn at 19% oxygen with 10 cm/s airflow?", "No data", "no_data"],
    ["Will acrylic burn at 150% oxygen?", "Unclear", "no_data"],
  ] as const) {
    it(`answers "${question}" as ${state}, in the engine's words, with only grounded numbers`, async () => {
      const events: VestaEvent[] = [];
      const out = await runOffline({ message: question, missionId: "lunar-rover", level: "researcher", emit: (e) => events.push(e) });
      expect(out.intent).toBe("burn");
      expect(out.toolsUsed).toEqual(["will_it_burn"]);
      expect(out.text.startsWith(`${state} (`)).toBe(true);
      expect(out.confidence).toBe(confidence);
      expect(out.sources[0].file).toMatch(/^BASS-II report TM-20210011385, Table/);
      expect(out.text).toMatch(/not a prediction, and not a safety rating/);
      // No number of its own: every figure is in the tool result or the question.
      expect(checkGrounding(out.text, out.known).unverified, out.text).toEqual([]);
      // The dashboard follows, but the active mission is left alone.
      expect(out.ui).toEqual([expect.objectContaining({ action: "go_view", view: "burn", path: "/burn" })]);
      expect(out.ui[0].question).toBeTruthy();
      expect(events.some((e) => e.type === "step" && e.tool === "will_it_burn" && e.status === "done")).toBe(true);
    });
  }
});

describe("an AI engine and solid materials", () => {
  const reply = (text: string): ProviderReply => ({ text, toolCalls: [], stop: "end" });
  const call = (name: string, args: unknown): ProviderReply => ({ text: "", toolCalls: [{ id: `c-${name}`, name, args }], stop: "tool_use" });

  function scripted(script: ProviderReply[]) {
    const results: ToolResultMessage[][] = [];
    let i = 0;
    const provider: Provider = {
      id: "claude",
      model: "test-model",
      startSession(): ChatSession {
        return {
          async send() {
            return script[Math.min(i++, script.length - 1)];
          },
          addToolResults(r) {
            results.push(r);
          },
          addUserText() {},
        };
      },
    };
    return { provider, results };
  }

  async function run(script: ProviderReply[], message: string) {
    const { provider, results } = scripted(script);
    const events: VestaEvent[] = [];
    await runVesta({ messages: [{ role: "user", content: message }], missionId: "lunar-rover", level: "researcher", engine: "auto" }, (e) => events.push(e), {
      providers: { claude: provider },
      chunkDelayMs: 0,
      useCache: false,
      timeoutMs: 500,
      log: () => {},
    });
    const of = <T extends VestaEvent["type"]>(type: T) => events.filter((e) => e.type === type) as Extract<VestaEvent, { type: T }>[];
    return { events, results, of, answer: of("text").map((e) => e.delta).join("") };
  }

  it("gets the engine's answer back as the tool result, cites its table and moves to the page", async () => {
    const r = await run(
      [call("will_it_burn", { question: "Will acrylic burn on the ISS?" }), reply("Burned: 20 of 20 tests. NASA watched it burn (BASS-II report, Table 5.1, p. 57).\nConfidence: supported")],
      "Will acrylic burn on the ISS?",
    );
    expect(r.results[0][0].content).toContain('"stamp":"Burned"');
    expect(r.results[0][0].content).not.toContain("…[truncated]");
    expect(r.answer).toContain("Burned: 20 of 20 tests");
    expect(r.answer).not.toMatch(/could not be verified/);
    expect(r.of("confidence")[0].confidence).toBe("supported");
    expect(r.of("sources")[0].sources[0]).toMatchObject({ file: "BASS-II report TM-20210011385, Table 5.1", page: 57 });
    expect(r.of("ui").map((e) => e.ui)).toEqual([expect.objectContaining({ action: "go_view", view: "burn", path: "/burn", question: expect.stringMatching(/^Will acrylic burn on the ISS/) })]);
  });

  it("cannot claim more confidence than the engine returned, and an invented number is flagged", async () => {
    const r = await run(
      [call("will_it_burn", { question: "Will it burn on a Moon base at 34% oxygen?" }), reply("It will burn 73% faster on the Moon.\nConfidence: supported"), reply("It will burn 73% faster on the Moon.\nConfidence: supported")],
      "Will it burn on a Moon base at 34% oxygen?",
    );
    expect(r.of("confidence")[0].confidence).not.toBe("supported");
    expect(r.answer).toMatch(/could not be verified/i);
  });
});

describe("what the rest of the app may say about solid evidence", () => {
  it("is counted from the rows, and does not say untested or unignited samples burned", () => {
    const c = burnCoverage();
    expect([c.acrylic, c.fabric, c.nomex]).toEqual([20, 23, 3]);
    expect(c.o2Min).toBeLessThan(c.o2Max);
    expect(c.text).toContain(`${c.acrylic} acrylic sheet tests, ${c.fabric} SIBAL fabric tests and ${c.nomex} Nomex tests`);
    expect(c.text).toContain(`${c.o2Min}–${c.o2Max}% O2`);
    expect(c.text).not.toMatch(/burned/i);
  });
});
