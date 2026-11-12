# Planning docs

> **2026-11-12.** FlameScope is now one app on the HEARTH Next.js baseline (ADR-017). These documents were written for
> FlameScope v1 and are kept as its design record. Where they name files, read `src/compute/` as `lib/evidence/`,
> `data/` as `data/evidence/`, `test/` as `tests/evidence/`, `/api/ask` as `/api/burn/ask` and the home page
> as `/burn`. The v1 server, `web/`, `src/acquire/` and `src/agents/` no longer exist. What changed and why is in
> [docs/integration/](../integration/).

The living design record for FlameScope / Will It Burn?, built for **NASA Space Apps 2026: Flame in Freefall**. Read them in this order:

| Doc | What it answers |
|---|---|
| [vision-and-scope.md](vision-and-scope.md) | Why this exists, who it's for, what's in and out, the Bangladesh framing, success measures |
| [features.md](features.md) | **Will It Burn? feature list**: what the product does today, and the ideas backlog. Update it with every feature change. |
| [requirements.md](requirements.md) | FR and NFR IDs with status and how each one is verified |
| [architecture.md](architecture.md) | Layers, boundaries, request flow, offline design |
| [data-model.md](data-model.md) | Sources and agencies, CSV schema, record type, envelope, fixtures |
| [datasets.md](datasets.md) | Candidate NASA and partner datasets, scored on data access, scientific validity and novelty. Also a fact-check of the sources shown today. |
| [psi-ingestion-review.md](psi-ingestion-review.md) | Dated ACME/Saffire-I briefing validation and proposed simple frontend/ingestion plan; not implemented evidence |
| [agentic-design.md](agentic-design.md) | Where AI is allowed, the evidence selector, the orchestrator plan, threats |
| [mcp-server.md](mcp-server.md) | The MCP tools, how to run and test them, the demo moment |
| [decisions.md](decisions.md) | ADR log and open questions |
| [roadmap.md](roadmap.md) | Milestones, backlog, roles, risks |
| [offline-demo.md](offline-demo.md) | The five-step offline safety net and the pre-flight checklist |
| [demo-script.md](demo-script.md) | The 240-second pitch, beat by beat |
| [scorecard.md](scorecard.md) | Each judging criterion, mapped to our evidence |

Related: [../will-it-burn-concept.md](../will-it-burn-concept.md), [../will-it-burn-technical.md](../will-it-burn-technical.md), [../reviewer-protocol.md](../reviewer-protocol.md), [../AI_USE.md](../AI_USE.md).

**Keep these docs true.** When code changes behaviour, update the matching requirement row and, if a boundary moved, add an ADR.
