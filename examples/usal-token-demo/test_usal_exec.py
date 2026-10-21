"""Conformance tests for usal_exec against USAL spec section 9.

Run with: python3 -m unittest test_usal_exec -v
"""
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

import usal_exec
from tasks import MODULE, TASKS

HERE = Path(__file__).parent
CLAMP = TASKS[0]


def run_check(module, check):
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        shutil.copy(HERE / "physics.test.ts", d / "physics.test.ts")
        (d / "physics.ts").write_text(module)
        r = subprocess.run(["node", "--experimental-strip-types", "physics.test.ts", check],
                           cwd=d, capture_output=True, text=True, timeout=60)
        return r.returncode == 0


class ReferencePatches(unittest.TestCase):
    """Every task's reference patch applies and passes its behaviour test."""

    def test_each_reference_patch_passes(self):
        for task in TASKS:
            with self.subTest(task=task.name):
                out = usal_exec.apply(MODULE, task.usal_context, task.usal_patch)
                self.assertTrue(run_check(out, task.name))


class SpecForms(unittest.TestCase):
    """One test per patch form in spec section 9.3."""

    def apply(self, patch, context=CLAMP.usal_context):
        return usal_exec.apply(MODULE, context, patch)

    def test_add_parameter_with_default(self):
        out = self.apply("PATCH F1\n+ P2 maxSpeed:number = 10\nCOMMIT")
        self.assertIn("updatePosition(body: Body, dt: number, maxSpeed: number = 10)", out)

    def test_add_node_and_rewire_named_side(self):
        out = self.apply("PATCH F1\n+ N4 = CLAMP(N1, -10, 10)\n~ N2.left = N4\nCOMMIT")
        self.assertIn("clampToRange(n1, -10, 10)", out)

    def test_rewire_by_index(self):
        out = self.apply("PATCH F1\n+ N4 = CLAMP(N1, -10, 10)\n~ N2.arg0 = N4\nCOMMIT")
        self.assertIn("clampToRange(n1, -10, 10)", out)

    def test_rename_function(self):
        out = self.apply("PATCH F5\n~ F5.name = sumKineticEnergy\nCOMMIT",
                         context="F5 totalEnergy(P0:Body[]) -> number")
        self.assertIn("export function sumKineticEnergy(", out)
        self.assertNotIn("function totalEnergy(", out)

    def test_insert_new_function_after_anchor(self):
        patch = ("PATCH F9\n+ F9 momentum(P0:Body[]) -> number\n"
                 "+ N10 = REDUCE(P0, ADD, 0, MUL(FIELD(b.mass), FIELD(b.velocity)))\n"
                 "+ RET N10\n+ INSERT_AFTER F5\nCOMMIT")
        out = self.apply(patch, context="F5 totalEnergy(P0:Body[]) -> number")
        self.assertLess(out.index("function totalEnergy("), out.index("function momentum("))


class RejectedPatches(unittest.TestCase):
    """Anything outside spec section 9.3 is rejected as a whole."""

    def assert_rejected(self, patch, context=CLAMP.usal_context):
        with self.assertRaises(usal_exec.ExecError):
            usal_exec.apply(MODULE, context, patch)

    def test_unknown_line(self):
        self.assert_rejected("PATCH F1\nplease clamp the velocity\nCOMMIT")

    def test_parameter_without_name(self):
        self.assert_rejected("PATCH F1\n+ P2:number = 10\nCOMMIT")

    def test_parameter_index_not_contiguous(self):
        self.assert_rejected("PATCH F1\n+ P5 maxSpeed:number = 10\nCOMMIT")

    def test_node_without_function(self):
        self.assert_rejected("+ N4 = CLAMP(N1, -10, 10)\nCOMMIT")

    def test_unsupported_operation(self):
        self.assert_rejected("PATCH F1\n+ N4 = SQRT(N1)\n~ N2.left = N4\nCOMMIT")

    def test_new_function_without_insert_after(self):
        self.assert_rejected("PATCH F9\n+ F9 momentum(P0:Body[]) -> number\n+ N10 = FIELD(P0.mass)\n+ RET N10\nCOMMIT",
                             context="F5 totalEnergy(P0:Body[]) -> number")

    def test_unknown_function_header(self):
        self.assert_rejected("PATCH F9\n+ F6 = exported momentum(P1:Body[]) -> number\nCOMMIT")

    def test_rewire_missing_node(self):
        self.assert_rejected("PATCH F1\n~ N9.left = N1\nCOMMIT")


if __name__ == "__main__":
    unittest.main()
