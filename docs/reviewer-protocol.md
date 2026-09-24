# Independent review and novelty test

Status: **Not performed**. Do not count automated checks or agent self-review as three independent reviewers.

## Scientific review

Review the original PDF's printed pages 56–57. Check every CSV cell, pair order, units, missing values, and sheet/opposed-flow context. Record reviewer, date, discrepancies and corrections. Independently reproduce at least two published findings using the original analysis or raw source data. Current arithmetic checks alone do not satisfy this gate. The 40 O₂ values are also checked automatically against NASA's PSI-25 experimental table (`test/psi.test.mjs`), but that doesn't replace checking the other cells against the PDF.

## Three-person usability session

Give each reviewer five minutes without guidance: find relevant evidence for PMMA airflow/spread, inspect its source, compare two tests and explain a limitation. Target: at least two of three complete all tasks. Capture completion, time, interpretation errors and source-support correctness.

## Novelty comparison

Run the same five tasks against manual NASA PSI/report search, a basic document chatbot with the same corpus, and FlameScope. Rotate task/tool order to reduce learning effects. Record time, correctness, citations that actually support claims, and invalid comparisons detected. Do not claim novelty or speed improvements until results exist.

1. Find M7/M8 spread observations and explain limits to comparing them.
2. Find tests with untracked spread data.
3. Determine whether O₂ is constant throughout M2.
4. Find a reported flow/spread pair and its exact source row.
5. Determine whether the evidence establishes the safest spacecraft material.

| Reviewer | Tool | Task | Time | Correct | Citation supports claim | Comparison limitation found |
|---|---|---|---|---|---|---|

## AI evaluation

With a configured provider, replay `data/evaluation.json` against `/api/brief` with `ai:true`; log model/version and whether a fallback occurred. Review every scientific statement against its source. Target ≥18/20 grounded answers/appropriate abstentions, zero unsupported safety claims. An offline fallback is not a passed live-model trial. Extend this set with paraphrases and adversarial/mixed questions; the keyword guard is not a general language understanding guarantee.
