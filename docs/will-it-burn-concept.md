# Will It Burn? — the concept

A question-first view on NASA's microgravity fire data, built for the Flame in Freefall challenge. You ask whether something would burn in a spacecraft cabin. The page tells you what NASA's tests actually saw, or says plainly that no test has been run there yet.

Run it with `node src/api/server.mjs`, then open <http://127.0.0.1:3000/>. The technical walkthrough is in [will-it-burn-technical.md](will-it-burn-technical.md).

## Who it is for

- **Spacecraft fire-safety engineers and mission designers.** They need to know whether existing evidence covers the cabin they are designing.
- **Judges and the public.** The same screen explains, in plain words, why fire in space is different.

## What the user inputs, and how

There are three ways in. All three end up at the same answer.

| Input | How | Example |
|---|---|---|
| **Type a question** | Plain English in the search box, then press Enter or **Ask** | `Will a 1 mm acrylic panel burn on a Moon base?` |
| **Tap a suggested question** | One tap fills the box and answers it | `Is Nomex safe on a Mars base?` |
| **Tap a control** | A mission tile, the cabin-air switch, or a thickness chip | Tap **Mars transit**, then **Exploration** |

### What the search box understands

| You can mention | Words it recognises | Becomes |
|---|---|---|
| A place | ISS, space station, orbit, microgravity · Moon, lunar, Artemis · Mars transit, on the way to Mars, deep space · Mars, Martian | One of four missions |
| Cabin air | exploration, high oxygen, low pressure · Earth-normal, sea level, normal air | Earth-normal or Exploration air |
| Oxygen | `34% oxygen`, `30% O2`, `oxygen at 25%` | A custom oxygen share |
| Pressure | `8.2 psi`, `56.5 kPa`, `1 atm` | A custom cabin pressure |
| Material | acrylic, PMMA, plexiglass · Nomex, cotton, fabric, wire insulation, Kapton, Teflon and more | The material to check |
| Sheet thickness | `1 mm`, `5 mm`, thin, thick | One thickness, or all of them when you compare two |
| Airflow | `10 cm/s`, still air, no ventilation, fans off | An airflow to check |

Anything it can't place falls back to a default. The **Read as** row shows every field, so you can see exactly what it understood:

- **Blue chip:** taken from your question.
- **Dark chip:** set by a tap.
- **Dashed chip:** a default you can change.

It also adds a short notice when it has to make a call. That covers two places in one question, "thin" read as 1 mm, and a safety word like "safe" that it can't certify.

### Suggested questions and what each one shows

| Suggestion | What it demonstrates |
|---|---|
| Will acrylic burn on the ISS? | Full evidence. All 20 NASA tests match. |
| Will it burn on a Moon base at 34% oxygen? | A gravity gap and an atmosphere gap together |
| What about Mars transit in exploration air? | Same microgravity as the ISS, but the new cabin air breaks the match |
| Does a 1 mm sheet burn faster than 5 mm? | A comparison: thin sheets spread about three times faster |
| Will a 1 mm acrylic sheet burn in still air? | Still air is a regime these tests never covered |
| Is Nomex safe on a Mars base? | An untested material, plus a safety word it refuses to certify |

The keyword chips add words to the box without submitting it. That lets you build your own question: ISS, Moon base, Mars transit, Mars base, 34% oxygen, 8.2 psi, 1 mm, 5 mm, still air, 10 cm/s, acrylic and Nomex.

## The three taps

1. **Ask, or pick where you're flying.** A suggestion or a mission tile gives an answer straight away.
2. **What's burning?** Tap a thickness, or flip the cabin air, to refine it.
3. **Show me the proof.** Tap any number, chart dot or card to open the NASA row or source behind it.

## What comes back

- **A stamp.** "Burned" means NASA watched it burn under matching conditions. "No data" means no test in the set matches your cabin.
- **A plain headline.** For example, "Yes. NASA watched it burn." or "Unknown. None of these tests felt lunar gravity."
- **Evidence match.** Your cabin next to what the tests covered, row by row: material, gravity, oxygen, pressure, and airflow or thickness when you gave them.
- **Chamber view.** An animated illustration. In orbit the flame is a blue sphere. At Moon or Mars gravity it is a dashed outline, because that shape isn't in the data.
- **Step 2 with evidence.** A chart of every test, your selection highlighted, four tappable readouts, one plain finding, and five findings from all 20 tests ranked by how consistently they agree.
- **Step 2 with a gap.** Cards that explain what is missing, where that data may exist, and a button that jumps to the nearest evidence we do have.
- **Step 3.** The exact table rows or the source list.
- **NASA’s fire response.** Below the proof, NASA’s own ISS fire-response steps, quoted in NASA’s order, each with what microgravity tests say about it. The app never reorders or ranks them, and the section looks the same for every answer.

## Why it is designed this way

This section replaces the old "Why this design?" pop-up.

- **Question first.** There is no sidebar and no menu to learn. The first thing on screen is the question an engineer or astronaut would actually ask.
- **Evidence match before the answer.** Before saying anything, it checks whether NASA's tests share your cabin's gravity, pressure and oxygen. Most dashboards skip this step and quietly apply ISS data to Moon and Mars cabins.
- **A gap is an answer.** For the Moon and Mars the honest answer is "no data." The page treats that as a result: it names what is missing and where it may exist. That tells NASA what its own tests haven't covered, which the team briefing calls the strongest possible closing point.
- **Nothing is generated.** Every number comes from the NASA table or a cited source, and every number opens the row it came from. The app never invents a safety number.
- **Labels are honest.** The flame animation says "Illustration." Findings say "Descriptive, not a safety rating." Safety questions get a notice that the tool can't certify materials.
- **It follows the three-click rule.** You get an answer in one tap, a refined answer in two, and the proof in three.

### Pitfalls it avoids

| Common pitfall in this challenge | What Will It Burn? does instead |
|---|---|
| A chatbot with a NASA logo | A structured check against real test conditions |
| Invented or unsourced numbers | Only table values or cited sources, each one tappable |
| ISS results assumed to hold on the Moon or Mars | The evidence match shows the gravity and atmosphere gap |
| Mixing up oxygen share and oxygen pressure | Shows both, and explains that the exploration cabin has similar oxygen pressure but less than half the nitrogen |
| A fire dashboard with no fire in it | An animated chamber view, clearly labelled as an illustration |

## How it answers the challenge

The challenge asks for a dashboard that **summarizes, ranks and interprets** NASA's fire research.

| Challenge verb | Where it happens | Honest status |
|---|---|---|
| Summarizes | The verdict, readouts and one-line finding | Done, for one NASA table |
| Ranks | Five findings from the 20 tests, ranked by how consistently matched comparisons agree, each with its count, a caveat and its rows. The mission tiles also show which destinations the evidence covers. | Done for one NASA table. Ranking materials needs more materials in the data. |
| Interprets | The evidence match and gap cards turn test conditions into design meaning | Done, with every claim sourced |

## A 30-second demo

1. The page opens on the ISS. The stamp reads **Burned**: all 20 NASA tests match.
2. Tap **Exploration** air. The stamp flips to **No data**, because the tests stopped at 22.2% oxygen.
3. Tap **Moon base**. Gravity turns into a gap too, and the flame becomes a dashed question mark.
4. Read one gap card aloud: for acrylic rods, lunar gravity looks like the worst case for fire.
5. Tap **Show the nearest evidence**, then tap a chart dot. The exact NASA table row opens.

## What's real, what's illustration, what's next

- **Real:** the 20 BASS-II acrylic sheet tests from NASA/TM-20210011385, the gravity levels, both cabin atmospheres and every cited finding.
- **Illustration:** the chamber flame animation.
- **Next:** more tables from the same BASS-II report, then the Saffire IV–VI and SoFIE results ([planning/datasets.md](planning/datasets.md)). Saffire VI reached about 8 psi and 29–31% oxygen, so it would turn some reduced-pressure "No data" answers into real ones. A 34% oxygen cabin would still be a gap.

## How it relates to FlameScope

Both views read the same NASA table through `src/compute/evidence.mjs`, so no data work is duplicated. FlameScope at `/research/` stays the research view for comparing tests and exporting briefs. Will It Burn? at `/` (the home page) is the front door that answers one question fast.
