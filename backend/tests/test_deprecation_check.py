from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


def _load_checker():
    path = Path(__file__).resolve().parents[2] / ".github/scripts/check_deprecations.py"
    spec = importlib.util.spec_from_file_location("check_deprecations", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


checker = _load_checker()


def test_deprecation_checker_discovers_auth_url_schedule() -> None:
    records = checker._collect_records()

    auth_url = next(record for record in records if record.feature == "AUTH_URL")
    assert auth_url.deprecated_in == "0.7.1"
    assert auth_url.removed_in == "0.12.0"


def test_deprecation_checker_enforces_five_minor_releases() -> None:
    record = checker.DeprecationRecord(
        feature="AUTH_URL",
        deprecated_in="0.7.1",
        removed_in="0.11.0",
        path=Path("oauth_flow.py"),
        line=1,
    )

    errors = checker._validate_record(record, checker.Version("0.7.1"))

    assert len(errors) == 1
    assert "minimum 0.12.0" in errors[0]


def test_deprecation_checker_fails_at_removal_release() -> None:
    record = checker.DeprecationRecord(
        feature="AUTH_URL",
        deprecated_in="0.7.1",
        removed_in="0.12.0",
        path=Path("oauth_flow.py"),
        line=1,
    )

    assert checker._validate_record(record, checker.Version("0.11.9")) == []
    errors = checker._validate_record(record, checker.Version("0.12.0"))
    assert len(errors) == 1
    assert "remove the compatibility code" in errors[0]
