from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.main import app

ROOT = Path(__file__).resolve().parents[2]


def test_root_vercel_preview_routes_non_auth_api_to_fastapi_entrypoint() -> None:
    config = json.loads((ROOT / "vercel.json").read_text())
    assert {"source": "/api/:path((?!auth).*)", "destination": "/api/index.py"} in config["rewrites"]
    assert {"source": "/api/:path*", "destination": "/api/index.py"} not in config["rewrites"]
    assert (ROOT / "api" / "index.py").read_text().strip() == "from backend.app.main import app"


def test_nextauth_route_is_available_for_interactive_github_sign_in() -> None:
    route = ROOT / "app" / "api" / "auth" / "[...nextauth]" / "route.ts"
    assert route.exists()
    assert "handlers" in route.read_text()


def test_fastapi_auth_session_compatibility_remains_available_for_direct_backend_calls() -> None:
    response = TestClient(app).get("/api/auth/session", headers={"x-owner-id": "user@example.com"})
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "user@example.com"
