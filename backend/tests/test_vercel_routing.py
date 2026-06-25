from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.config import reset_config
from backend.app.main import app


ROOT = Path(__file__).resolve().parents[2]


def test_root_vercel_routes_api_to_fastapi_entrypoint() -> None:
    """Verify all /api/* routes, including auth, go to FastAPI."""
    config = json.loads((ROOT / "vercel.json").read_text())
    assert {"source": "/api/:path*", "destination": "/api/index.py"} in config[
        "rewrites"
    ]
    # Standard Next.js build (not SPA mode) for Vercel
    assert "build:spa" not in config.get("buildCommand", "")
    assert "npm run build" in config.get("buildCommand", "")
    assert (
        ROOT / "api" / "index.py"
    ).read_text().strip() == "from backend.app.main import app"


def test_fastapi_auth_session_supports_auth_disabled_direct_backend_calls(
    monkeypatch,
) -> None:
    monkeypatch.setenv("INTHUB_DISABLE_AUTH", "true")
    reset_config()

    response = TestClient(app).get(
        "/api/auth/session", headers={"x-owner-id": "user@example.com"}
    )

    assert response.status_code == 200
    assert response.json()["user"]["email"] == "user@example.com"
