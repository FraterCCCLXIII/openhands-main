"""Three edit tasks on physics.ts, each with a reference result and two ways to ask for it.

Arm A  (conventional): the instruction plus the whole file in; the whole edited file out.
Arm A' (diff baseline): same input as A; a unified diff out. The fairer comparison.
Arm A'' (snippet diff): only the target function in; a unified diff out. Fairest baseline.
Arm B  (USAL-style):   the instruction, a symbol legend and only the target's graph in;
                       a graph patch out. The patch notation is a hand-written prototype
                       and is NOT part of SPEC.md. Nothing here executes it.
"""
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

HERE = Path(__file__).parent
MODULE = (HERE / "physics.ts").read_text()

LEGEND = """Legend: F=function P=parameter N=node TYPE=type.
Ops: FIELD(x.f) MUL ADD CLAMP REDUCE RET. '+' adds, '~' rewires or sets, INSERT_AFTER places, COMMIT applies."""


def function_block(src: str, name: str) -> str:
    """Return the exported function `name` including its closing brace line."""
    match = re.search(rf"export function {re.escape(name)}\(.*?\n\}}\n", src, re.S)
    assert match, f"no function {name}"
    return match.group(0)


def _replace_once(src: str, old: str, new: str) -> str:
    assert src.count(old) == 1, f"expected exactly one match for {old[:40]!r}"
    return src.replace(old, new)


def _clamp(src: str) -> str:
    return _replace_once(
        src,
        """export function updatePosition(body: Body, dt: number): number {
  return body.position + body.velocity * dt;
}""",
        """export function updatePosition(body: Body, dt: number, maxSpeed = 10): number {
  const v = clampToRange(body.velocity, -maxSpeed, maxSpeed);
  return body.position + v * dt;
}""",
    )


def _rename(src: str) -> str:
    return _replace_once(src, "export function totalEnergy(", "export function sumKineticEnergy(")


def _momentum(src: str) -> str:
    anchor = """  return bodies.reduce((sum, b) => sum + kineticEnergy(b), 0);
}
"""
    addition = """
export function momentum(bodies: Body[]): number {
  return bodies.reduce((sum, b) => sum + b.mass * b.velocity, 0);
}
"""
    return _replace_once(src, anchor, anchor + addition)


@dataclass
class Task:
    name: str
    instruction: str
    apply: Callable[[str], str]
    target: str
    usal_context: str
    usal_patch: str


TASKS = [
    Task(
        name="clamp_velocity",
        instruction=(
            "In updatePosition, clamp the velocity to [-maxSpeed, maxSpeed] before integrating. "
            "Add a maxSpeed parameter defaulting to 10. Return the full edited file."
        ),
        apply=_clamp,
        target="updatePosition",
        usal_context="""F1 updatePosition(P0:Body, P1:number) -> number
N0 FIELD(P0.position)
N1 FIELD(P0.velocity)
N2 MUL(N1, P1)
N3 ADD(N0, N2)
RET N3""",
        usal_patch="""PATCH F1
+ P2 maxSpeed:number = 10
+ N4 = CLAMP(N1, -P2, P2)
~ N2.left = N4
COMMIT""",
    ),
    Task(
        name="rename_export",
        instruction=(
            "Rename the exported function totalEnergy to sumKineticEnergy. "
            "Return the full edited file."
        ),
        apply=_rename,
        target="totalEnergy",
        usal_context="""F5 totalEnergy(P0:Body[]) -> number   [exported, 0 internal references]""",
        usal_patch="""PATCH F5
~ F5.name = sumKineticEnergy
COMMIT""",
    ),
    Task(
        name="add_momentum",
        instruction=(
            "Add an exported function momentum(bodies: Body[]): number that returns the sum of "
            "mass * velocity, placed after totalEnergy. Return the full edited file."
        ),
        apply=_momentum,
        target="totalEnergy",
        usal_context="""TYPE Body {id, mass, position, velocity}
F5 totalEnergy(P0:Body[]) -> number   [pattern: REDUCE over bodies with ADD]""",
        usal_patch="""PATCH F9
+ F9 momentum(P0:Body[]) -> number
+ N10 = REDUCE(P0, ADD, 0, MUL(FIELD(b.mass), FIELD(b.velocity)))
+ RET N10
+ INSERT_AFTER F5
COMMIT""",
    ),
]
