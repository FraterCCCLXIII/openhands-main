"""Count tokens each arm would send and receive for the same three edits.

Arms: A = full file in, full file out. A2 = target function in, diff out. B = USAL graph in, graph patch out.

Usage: python3 run.py            (needs: pip install tiktoken)
Counts use tiktoken's o200k_base as a proxy. They are not Claude token counts.
"""
import difflib

import tiktoken

from tasks import LEGEND, MODULE, TASKS, function_block

ENC = tiktoken.get_encoding("o200k_base")


def count(text: str) -> int:
    return len(ENC.encode(text))


def unified_diff(before: str, after: str, name: str) -> str:
    return "".join(
        difflib.unified_diff(
            before.splitlines(keepends=True),
            after.splitlines(keepends=True),
            fromfile=f"a/{name}.ts",
            tofile=f"b/{name}.ts",
        )
    )


def main() -> None:
    header = (
        f"{'task':<16}{'A in':>7}{'A out':>7}{'A tot':>7}{'A2 in':>7}{'A2 tot':>8}"
        f"{'B in':>6}{'B out':>6}{'B tot':>7}{'B/A':>7}{'B/A2':>7}"
    )
    print(header)
    print("-" * len(header))
    totals = {"a": 0, "a2": 0, "b": 0}
    for task in TASKS:
        after = task.apply(MODULE)
        a_in = count(task.instruction + "\n\n" + MODULE)
        a_out = count(after)
        patch = unified_diff(MODULE, after, "physics")
        a2_in = count(task.instruction + "\n\n" + function_block(MODULE, task.target))
        a2_total = a2_in + count(patch)
        b_in = count(task.instruction + "\n\n" + LEGEND + "\n" + task.usal_context)
        b_out = count(task.usal_patch)
        a_total, b_total = a_in + a_out, b_in + b_out
        totals["a"] += a_total
        totals["a2"] += a2_total
        totals["b"] += b_total
        print(
            f"{task.name:<16}{a_in:>7}{a_out:>7}{a_total:>7}{a2_in:>7}{a2_total:>8}"
            f"{b_in:>6}{b_out:>6}{b_total:>7}"
            f"{1 - b_total / a_total:>7.0%}{1 - b_total / a2_total:>7.0%}"
        )
    print("-" * len(header))
    print(
        f"{'total':<16}{'':>7}{'':>7}{totals['a']:>7}{'':>7}{totals['a2']:>8}{'':>6}{'':>6}{totals['b']:>7}"
        f"{1 - totals['b'] / totals['a']:>7.0%}{1 - totals['b'] / totals['a2']:>7.0%}"
    )


if __name__ == "__main__":
    main()
