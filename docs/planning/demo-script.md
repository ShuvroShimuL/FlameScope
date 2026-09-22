# 240-second demo script

Written for a global audience in plain English: one idea per beat, and the dataset named on camera. Record it with wifi off ([offline-demo.md](offline-demo.md)).

| Time | Beat | On screen | Say (roughly) |
|---|---|---|---|
| 0:00–0:25 | **Hook** | Title, then the Will It Burn? page | "Fire behaves differently in space. Before astronauts live on the Moon, someone has to ask: will this burn *there*? Today we'll ask NASA's own data." |
| 0:25–0:50 | **The data** | Provenance drawer | "We use NASA's BASS-II experiment: 20 acrylic fire tests flown on the International Space Station, from NASA technical memo 2021-0011385, Table 5.1. Every number you'll see opens the exact row it came from." |
| 0:50–1:20 | **Beginning: an answer** | Page opens on the ISS. Stamp: **Burned** | "On the Space Station, yes: NASA watched it burn. All 20 tests match. Tap a number…" (the row opens) "…that's the source." |
| 1:20–2:05 | **Middle: the surprise** | Tap **Exploration air** → **No data**. Tap **Moon base** → the flame turns into a dashed question mark. | "Now switch to the air NASA plans for Moon habitats, 34% oxygen. The answer flips to *No data*. The tests stopped at 22%. On the Moon, gravity is a gap too. Most tools would quietly reuse ISS results here. We show the gap, because a gap is an answer: it tells NASA which test to fly next." |
| 2:05–2:30 | **Where data may exist** | Gap card, then **Show the nearest evidence** | "Each gap names where the missing data may exist: Saffire, SoFIE. One tap takes you to the closest evidence we do have." |
| 2:30–3:05 | **Why you can trust it** | Split view: `src/compute` folder, then the MCP call in Claude Code | "No AI writes a number here. The science is plain, tested code. We even let an AI agent use it through MCP. It can ask the questions, but it can't invent the answers." |
| 3:05–3:35 | **Impact: Bangladesh** | Bangladesh panel (verified numbers only) | "At home in Bangladesh, fire decisions are also made on evidence that never covered local conditions. *[one verified number with its source]*. The same check, 'did the evidence cover my conditions?', scales from spacecraft to buildings." |
| 3:35–4:00 | **End** | Challenge name, team, repo URL | "FlameScope, for NASA Space Apps 2026: Flame in Freefall. Open source, runs offline, and every number is traceable. Thank you." |

## Rules

- Name **BASS-II** and **NASA** aloud before 0:50.
- One idea per beat. No jargon without a one-line definition.
- Never say "safe." Say "burned" or "no data."
- Only verified Bangladesh numbers (ADR-007).
- Captions on, for a global audience.
