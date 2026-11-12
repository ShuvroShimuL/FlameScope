# VESTA eval report

Generated 2026-11-12T17:04:26.090Z against http://127.0.0.1:3100 by scripts/run-evals.ts.

Checks per question: expected tool used · facts in the answer · sources · confidence tag (and expected value) · grounding · dashboard view. "unavailable" = the engine could not answer (limit or outage) and VESTA fell back; those questions are left out of that engine's score. Offline mode is scored only on the questions marked `offline: true`.

## Summary

| Engine | Passed | Scored | Score | Unavailable |
|---|---|---|---|---|
| offline | 16 | 16 | 100% | 0 |

## offline

| Question | Result | Details | ms |
|---|---|---|---|
| q01-po2-rover | pass | all checks (tools: physics_calc) | 212 |
| q02-iss-reference | pass | all checks (tools: physics_calc) | 165 |
| q03-rover-envelope | pass | all checks (tools: physics_calc, envelope_check, nearest_tests) | 560 |
| q04-spacesuit-gap | pass | all checks (tools: physics_calc, envelope_check, nearest_tests) | 383 |
| q05-rank-moon-base | pass | all checks (tools: rank_investigations, make_chart, ui_action) | 297 |
| q06-compare-acme-spice | pass | all checks (tools: compare, make_chart, ui_action) | 142 |
| q07-gaps-solids | pass | all checks (tools: ui_action, gap_finder) | 538 |
| q08-explain-test | pass | all checks (tools: query_data, physics_calc, ui_action) | 250 |
| q09-cool-flame-topic | pass | all checks (tools: search_docs) | 604 |
| q13-safety-audit-rover | pass | all checks (tools: physics_calc, envelope_check, nearest_tests, safety_audit) | 1709 |
| q14-compare-coverage | pass | all checks (tools: compare, make_chart, ui_action) | 150 |
| q16-gaps-view | pass | all checks (tools: gap_finder, ui_action) | 530 |
| q17-solid-acrylic-iss | pass | all checks (tools: will_it_burn) | 584 |
| q18-solid-moon-base | pass | all checks (tools: will_it_burn) | 904 |
| q19-solid-not-a-rating | pass | all checks (tools: will_it_burn) | 556 |
| q20-solid-unclear | pass | all checks (tools: will_it_burn) | 355 |
