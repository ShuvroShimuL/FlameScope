---
name: offline-demo
description: Verify that FlameScope works with no API keys and no network — Offline mode for VESTA, the Will it burn? page, and the Offline evals. Use before any demo or recording, or when VESTA's tools or the evidence engine change.
---

# Offline demo

The app reads committed data only, so it needs no network at run time. VESTA's Offline mode answers when no key is set. (The build is the one step that needs the network, for the fonts.)

1. **Build once, online:** `npm run build`. Stop any dev server first.
2. **Start with no keys** and a local eval token:
   ```bash
   env -u ANTHROPIC_API_KEY -u OPENAI_API_KEY -u FREELLMAPI_API_KEY -u OPENROUTER_API_KEY -u GROQ_API_KEY -u GEMINI_API_KEY \
     VESTA_EVAL_TOKEN=<16+ random chars> npx next start -p 3000
   ```
3. **Check the engines:** `GET /api/vesta/engines` must show only `auto` and `offline` as available.
4. **Walk the pages** with the network tab open: every request goes to the local server. On `/burn`, click all six suggested questions and one of each material.
5. **Ask VESTA** a gas question ("Is 34% O2 at 8.2 psi tested?") and a solid one ("Will acrylic burn on the ISS?"). The badge must say Offline mode, and the solid answer must open `/burn`.
6. **Run the Offline evals:** `VESTA_EVAL_TOKEN=<same> npx tsx scripts/run-evals.ts --base http://localhost:3000 --engines offline --out evals/report-offline.md`.
7. **Tests:** `npm test` and `npm run evaluate`.
8. **Report** what was run and its numbers. Never say "ready" without running steps 3 to 7.

Never set `VESTA_EVAL_TOKEN` on a public host: it skips the rate limit.
