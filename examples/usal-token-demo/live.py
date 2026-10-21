"""Live benchmark: three arms against a local model served by Ollama.

    python3 live.py --model llama3.2:latest --repeats 3

For each task, arm and repeat it asks the model for an edit, applies the edit, runs the
behaviour test, and records the model's own prompt and output token counts. Nothing is
estimated: the counts come from Ollama's prompt_eval_count and eval_count.

Arms:
  A   full file in, full edited file out
  A2  target function in, unified diff out (applied with patch(1))
  B   USAL graph in, graph patch out (applied by usal_exec.py)
"""
import argparse
import json
import pathlib
import re
import shutil
import subprocess
import tempfile
import urllib.request

import usal_exec
from tasks import LEGEND, MODULE, TASKS, function_block

HERE = pathlib.Path(__file__).parent
OLLAMA_CHAT = "http://127.0.0.1:11434/api/chat"

# Format example only. It is not one of the tasks, so it does not leak an answer.
USAL_FORMAT_EXAMPLE = """PATCH F7
+ N9 = MUL(N8, P1)
~ N8.right = N9
COMMIT"""


def function_line(name):
    start = MODULE.index(f"export function {name}(")
    return MODULE[:start].count("\n") + 1


def build_prompt(arm, task):
    if arm == "A":
        return (
            f"{task.instruction}\n\nFile physics.ts:\n```ts\n{MODULE}```\n"
            "Return the complete edited file in one ```ts code block and nothing else."
        )
    if arm == "A2":
        return (
            f"{task.instruction}\n\nFunction from physics.ts (it begins at line {function_line(task.target)} of the file):\n"
            f"```ts\n{function_block(MODULE, task.target)}```\n"
            "Return only a unified diff against physics.ts (headers a/physics.ts and b/physics.ts) "
            "in one ```diff code block and nothing else."
        )
    return (
        f"{task.instruction}\n\n{LEGEND}\n\nFormat example (not one of the tasks):\n"
        f"```usal\n{USAL_FORMAT_EXAMPLE}\n```\n\nGraph of the target:\n```\n{task.usal_context}\n```\n"
        "Return only the patch in one ```usal code block and nothing else."
    )


def extract(text, lang):
    blocks = re.findall(rf"```{lang}\n(.*?)```", text, re.S)
    if not blocks:
        blocks = re.findall(r"```[\w-]*\n(.*?)```", text, re.S)
    return blocks[-1] if blocks else None


def chat(model, content, seed):
    body = json.dumps(
        {
            "model": model,
            "messages": [{"role": "user", "content": content}],
            "stream": False,
            "options": {"temperature": 0.2, "seed": seed, "num_ctx": 8192},
        }
    ).encode()
    request = urllib.request.Request(OLLAMA_CHAT, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=900) as response:
        return json.load(response)


def apply_diff(module, diff):
    with tempfile.TemporaryDirectory() as d:
        d = pathlib.Path(d)
        (d / "physics.ts").write_text(module)
        (d / "edit.diff").write_text(diff)
        result = subprocess.run(
            ["patch", "-s", "--no-backup-if-mismatch", "-i", "edit.diff", "physics.ts"],
            cwd=d, capture_output=True, text=True,
        )
        if result.returncode != 0:
            raise usal_exec.ExecError(f"patch failed: {(result.stdout + result.stderr).strip()[-200:]}")
        return (d / "physics.ts").read_text()


def run_check(module, check):
    with tempfile.TemporaryDirectory() as d:
        d = pathlib.Path(d)
        shutil.copy(HERE / "physics.test.ts", d / "physics.test.ts")
        (d / "physics.ts").write_text(module)
        result = subprocess.run(
            ["node", "--experimental-strip-types", "physics.test.ts", check],
            cwd=d, capture_output=True, text=True, timeout=60,
        )
        detail = (result.stderr or result.stdout).strip().splitlines()
        return result.returncode == 0, detail[-1] if detail else ""


def attempt(arm, task, model, seed):
    reply = chat(model, build_prompt(arm, task), seed)
    row = {
        "task": task.name,
        "arm": arm,
        "seed": seed,
        "prompt_tokens": reply.get("prompt_eval_count", 0),
        "output_tokens": reply.get("eval_count", 0),
        "pass": False,
        "error": None,
    }
    text = reply["message"]["content"]
    try:
        if arm == "A":
            module = extract(text, "ts")
            if module is None:
                raise usal_exec.ExecError("no code block")
        elif arm == "A2":
            diff = extract(text, "diff")
            if diff is None:
                raise usal_exec.ExecError("no diff block")
            module = apply_diff(MODULE, diff)
        else:
            usal = extract(text, "usal")
            if usal is None:
                raise usal_exec.ExecError("no usal block")
            module = usal_exec.apply(MODULE, task.usal_context, usal)
        row["pass"], row["error"] = run_check(module, task.name)
        if not row["pass"]:
            row["error"] = row["error"] or "check failed"
    except usal_exec.ExecError as error:
        row["error"] = str(error)
    except Exception as error:  # any unexpected parse problem is a failed attempt, not a crash
        row["error"] = f"{type(error).__name__}: {error}"
    return row


def summarise(rows):
    print(f"{'arm':<5}{'attempts':>9}{'passed':>8}{'pass %':>8}{'in tok':>9}{'out tok':>9}{'tok / pass':>12}")
    for arm in ("A", "A2", "B"):
        group = [r for r in rows if r["arm"] == arm]
        passed = sum(r["pass"] for r in group)
        total = sum(r["prompt_tokens"] + r["output_tokens"] for r in group)
        tokens_in = sum(r["prompt_tokens"] for r in group)
        tokens_out = sum(r["output_tokens"] for r in group)
        per_pass = f"{total / passed:,.0f}" if passed else "n/a"
        print(
            f"{arm:<5}{len(group):>9}{passed:>8}{passed / len(group):>8.0%}"
            f"{tokens_in:>9,}{tokens_out:>9,}{per_pass:>12}"
        )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--repeats", type=int, default=3)
    parser.add_argument("--out", default=None)
    args = parser.parse_args()

    rows = []
    for task in TASKS:
        for arm in ("A", "A2", "B"):
            for seed in range(args.repeats):
                row = attempt(arm, task, args.model, seed)
                rows.append(row)
                status = "PASS" if row["pass"] else "fail"
                print(
                    f"{task.name:<16}{arm:<4} seed {seed}  {status}  "
                    f"in {row['prompt_tokens']:>5}  out {row['output_tokens']:>5}  {row['error'] or ''}",
                    flush=True,
                )

    out = pathlib.Path(args.out or HERE / "results" / f"{args.model.replace(':', '_').replace('/', '_')}.json")
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(rows, indent=2))
    print()
    summarise(rows)
    print(f"\nwrote {out}")


if __name__ == "__main__":
    main()
