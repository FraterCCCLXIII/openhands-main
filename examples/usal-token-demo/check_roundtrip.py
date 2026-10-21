"""Round-trip check for the TypeScript-to-USAL converter.

For each function the converter supports: convert it to graph text, regenerate it from the
graph (a rename to its own name forces regeneration), and compare the regenerated function
with the original on random inputs. Functions the converter cannot lower are listed, not skipped silently.

Usage: python3 check_roundtrip.py physics.ts
"""
import json
import pathlib
import re
import subprocess
import sys
import tempfile

import usal_exec

HERE = pathlib.Path(__file__).parent
ARG_TYPES = {"kineticEnergy": ["Body"], "updatePosition": ["Body", "number"]}  # inputs for the diff check


def main(source_path):
    source = pathlib.Path(source_path).read_text()
    converted = subprocess.run(["node", str(HERE / "ts_to_usal.mjs"), source_path],
                               capture_output=True, text=True, check=True)
    unsupported = [line for line in converted.stderr.splitlines() if line.startswith("unsupported")]
    blocks = [b for b in converted.stdout.strip().split("\n\n") if b]
    failures = 0
    with tempfile.TemporaryDirectory() as d:
        d = pathlib.Path(d)
        for block in blocks:
            fid, name = re.match(r"F(\d+) (\w+)\(", block).groups()
            patch = f"PATCH F{fid}\n~ F{fid}.name = {name}\nCOMMIT"
            regenerated = usal_exec.apply(source, block, patch)
            regen_path = d / f"{name}_regen.ts"
            regen_path.write_text(regenerated)
            check = subprocess.run(
                ["node", str(HERE / "diff_check.mjs"), source_path, str(regen_path), name,
                 json.dumps(ARG_TYPES[name])],
                capture_output=True, text=True,
            )
            status = "PASS" if check.returncode == 0 else "FAIL"
            failures += check.returncode != 0
            print(f"{status} {name}: {check.stdout.strip() or check.stderr.strip().splitlines()[-1]}")
    for line in unsupported:
        print(line)
    print(f"\n{len(blocks)} converted, {len(unsupported)} unsupported, {failures} round-trip failures")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
