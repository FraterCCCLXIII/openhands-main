"""Ensure the JS package and Python backend versions stay in sync."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def _package_json_version() -> str:
    package_json = json.loads((ROOT / "package.json").read_text())
    version = package_json.get("version")
    assert isinstance(version, str) and version
    return version


def _pyproject_version() -> str:
    text = (ROOT / "backend" / "pyproject.toml").read_text()
    match = re.search(r'^version\s*=\s*"([^"]+)"', text, re.MULTILINE)
    assert match, "backend/pyproject.toml has no [project].version"
    return match.group(1)


def test_package_json_and_backend_pyproject_versions_match() -> None:
    assert _package_json_version() == _pyproject_version(), (
        "package.json and backend/pyproject.toml versions differ. "
        "release-please should bump both together; check release-please-config.json."
    )
