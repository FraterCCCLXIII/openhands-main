#!/usr/bin/env python3
"""Fail CI when a versioned compatibility path reaches its removal release."""

from __future__ import annotations

import ast
import tomllib
from dataclasses import dataclass
from pathlib import Path

from packaging.version import InvalidVersion, Version


DEPRECATION_RUNWAY_MINOR_RELEASES = 5
REPO_ROOT = Path(__file__).resolve().parents[2]
PYPROJECT = REPO_ROOT / "backend" / "pyproject.toml"
SOURCE_ROOT = REPO_ROOT / "backend" / "app"


@dataclass(frozen=True, slots=True)
class DeprecationRecord:
    feature: str
    deprecated_in: str
    removed_in: str
    path: Path
    line: int


def _string_keyword(call: ast.Call, name: str, *, path: Path) -> str:
    node = next((item.value for item in call.keywords if item.arg == name), None)
    if not isinstance(node, ast.Constant) or not isinstance(node.value, str):
        raise SystemExit(
            f"warn_deprecated at {path}:{call.lineno} must provide a literal {name}"
        )
    return node.value


def _collect_records() -> list[DeprecationRecord]:
    records: list[DeprecationRecord] = []
    for path in SOURCE_ROOT.rglob("*.py"):
        tree = ast.parse(path.read_text())
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            target = node.func
            name = (
                target.id
                if isinstance(target, ast.Name)
                else target.attr
                if isinstance(target, ast.Attribute)
                else None
            )
            if name != "warn_deprecated":
                continue
            feature_node = node.args[0] if node.args else None
            if not isinstance(feature_node, ast.Constant) or not isinstance(
                feature_node.value, str
            ):
                raise SystemExit(
                    f"warn_deprecated at {path}:{node.lineno} must name a "
                    "literal feature"
                )
            records.append(
                DeprecationRecord(
                    feature=feature_node.value,
                    deprecated_in=_string_keyword(
                        node, "deprecated_in", path=path
                    ),
                    removed_in=_string_keyword(node, "removed_in", path=path),
                    path=path,
                    line=node.lineno,
                )
            )
    return records


def _minimum_removed_in(deprecated_in: str) -> Version:
    deprecated = Version(deprecated_in)
    return Version(
        f"{deprecated.major}."
        f"{deprecated.minor + DEPRECATION_RUNWAY_MINOR_RELEASES}.0"
    )


def _validate_record(record: DeprecationRecord, current: Version) -> list[str]:
    try:
        deprecated = Version(record.deprecated_in)
        removed = Version(record.removed_in)
    except InvalidVersion as exc:
        raise SystemExit(
            f"Invalid deprecation version at {record.path}:{record.line}: {exc}"
        ) from exc
    minimum_removed = _minimum_removed_in(record.deprecated_in)
    errors: list[str] = []
    if removed < minimum_removed:
        errors.append(
            f"{record.feature} has less than "
            f"{DEPRECATION_RUNWAY_MINOR_RELEASES} minor releases of runway "
            f"(deprecated {deprecated}, removal {removed}, minimum "
            f"{minimum_removed})."
        )
    if current >= removed:
        errors.append(
            f"{record.feature} reached its removal release {removed}; remove "
            f"the compatibility code before releasing {current}."
        )
    return errors


def main() -> int:
    project = tomllib.loads(PYPROJECT.read_text())
    current = Version(str(project["project"]["version"]))
    records = _collect_records()
    errors = [
        f"{record.path.relative_to(REPO_ROOT)}:{record.line}: {error}"
        for record in records
        for error in _validate_record(record, current)
    ]
    if errors:
        print("Deprecation deadline check failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print(
        f"Checked {len(records)} deprecation schedule(s) against version {current}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
