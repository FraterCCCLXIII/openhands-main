# USAL token demo

An offline token-count comparison for three small edits to `physics.ts`. It measures what each approach would send to and receive from a model. It does **not** run an agent, call a model, or measure task success. Those are the next steps and are not built yet.

## Arms

| Arm | Input to the model | Output from the model |
|---|---|---|
| **A** full-file | instruction + whole file | whole edited file |
| **A2** snippet + diff | instruction + the target function only | unified diff |
| **B** USAL-style | instruction + symbol legend + target's graph | graph patch |

A2 is the fair baseline. A is included to show what a naive rewrite costs.

## Run it

```bash
pip install tiktoken
python3 run.py
```

Counts use tiktoken's `o200k_base` as a proxy. They are **not** Claude token counts.

## Result (offline, o200k_base)

```
task               A in  A out  A tot  A2 in  A2 tot   B in B out  B tot    B/A   B/A2
clamp_velocity      378    365    743     60     193    131    40    171    77%    11%
rename_export       361    345    706     49     141     84    16    100    86%    29%
add_momentum        374    375    749     62     177    109    53    162    78%     8%
total                            2198            511                433    80%    15%
```

Read the last two columns as "how many tokens the B arm uses, relative to the baseline". The B arm uses roughly 15% fewer tokens than the snippet-and-diff baseline.

## Caveats

- **The B arm is hand-written.** Its graphs and patches are authored for these three tasks. The notation (`PATCH`, `CLAMP`, `REDUCE`, `INSERT_AFTER`, …) is a prototype and is not in the USAL spec. Nothing executes the patches.
- **The B arm's input excludes the code it refers to.** The graph is a summary of the function, so the B arm is not forced to show the full function. This may flatter B or hurt it; the harness does not check.
- **No success measure.** Token counts say nothing about whether the edit is correct, compiles, or passes tests.
- **Three tasks on one 60-line file** is far too small to generalise from.

## Not yet built

1. Live runs in OpenHands. Blocked on Docker and an LLM API key.
2. A USAL MCP server exposing `inspect`, `edit`, and `validate`. Blocked on the TypeScript-to-graph converter (Milestone 4), which does not exist.
3. Repeated runs per arm with pass/fail and cost per successful task.
