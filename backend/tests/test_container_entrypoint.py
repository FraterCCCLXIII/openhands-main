from __future__ import annotations

from pathlib import Path


def test_container_starts_fastapi_through_ddtrace() -> None:
    dockerfile = Path(__file__).resolve().parents[2] / "containers" / "Dockerfile"

    assert (
        'CMD ["ddtrace-run", "python", "-m", "backend.app.server"]'
        in dockerfile.read_text()
    )
