"""Ensure versions stay in sync across package.json, pyproject.toml, and the
@openhands/extensions dependency (frontend npm + backend pip)."""

from __future__ import annotations

import json
import re
import tomllib
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


def _npm_extensions_version() -> str:
    """Return the @openhands/extensions version from package.json dependencies."""
    package_json = json.loads((ROOT / "package.json").read_text())
    deps = package_json.get("dependencies", {})
    spec = deps.get("@openhands/extensions", "")
    # Accept "^0.8.0", "~0.8.0", "0.8.0", etc.
    match = re.match(r"[^0-9]*([0-9]+\.[0-9]+\.[0-9]+)", spec)
    assert match, (
        f"@openhands/extensions not found or unparseable in package.json: {spec!r}"
    )
    return match.group(1)


def _pip_extensions_version() -> str:
    """Return the openhands-extensions version from backend/pyproject.toml."""
    with open(ROOT / "backend" / "pyproject.toml", "rb") as f:
        data = tomllib.load(f)
    deps = data["project"]["dependencies"]
    for dep in deps:
        match = re.match(r"openhands-extensions==([0-9]+\.[0-9]+\.[0-9]+)", dep.strip())
        if match:
            return match.group(1)
    raise AssertionError(
        "openhands-extensions not found in backend/pyproject.toml dependencies"
    )


def test_frontend_and_backend_extensions_versions_match() -> None:
    """The npm @openhands/extensions and pip openhands-extensions packages must
    be the same version. A mismatch causes subtle bugs — e.g. the backend
    catalog (pip) serves connectionOptions[0] for unregistered connectors, so
    if the pip package lags behind the npm package, the admin UI shows stale
    defaults that don't match what the frontend expects."""
    npm_version = _npm_extensions_version()
    pip_version = _pip_extensions_version()
    assert npm_version == pip_version, (
        f"@openhands/extensions (npm) is {npm_version} but openhands-extensions "
        f"(pip) is {pip_version}. Bump both to the same version in package.json "
        f"and backend/pyproject.toml."
    )
