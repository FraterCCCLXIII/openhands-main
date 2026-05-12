from __future__ import annotations

import os

from fastapi.testclient import TestClient

os.environ["APP_ADMIN_EMAILS"] = "admin@example.com"

os.environ["DISABLE_AUTH"] = "true"

from backend.app.main import app
from backend.app.models import ManagedConnector, ManagedConnectorTool
from backend.app.repository import repository
from backend.app.route_manifest import ROUTES

client = TestClient(app, raise_server_exceptions=False)
OWNER = "admin@example.com"
AGENT_KEY = "cla_test_agent_key"
USER_KEY = "clu_test_user_key"
ADMIN_KEY = "clad_test_admin_key"


def sample_path(path: str) -> str:
    return (
        path.replace("{integrationKey}", "sample")
        .replace("{toolName}", "sample_tool")
        .replace("{requestId}", "req-sample")
        .replace("{slug}", "sample-connector")
        .replace("{provider}", "sample")
        .replace("{agentClass}", "developer")
    )


def seed_state() -> None:
    repository.save_key(OWNER, "agent", AGENT_KEY)
    repository.save_key(OWNER, "user", USER_KEY)
    repository.save_key(OWNER, "admin", ADMIN_KEY)
    repository.save_managed_connector(
        ManagedConnector(
            slug="sample-connector",
            name="Sample connector",
            description="Sample connector",
            provider="http",
            authStrategy="none",
            credentialLabel="Credential",
            credentialPlaceholder="Credential",
            credentialHelp="Help",
            tools=[
                ManagedConnectorTool(
                    name="sample_tool",
                    description="Sample tool",
                    accessMode="enabled",
                )
            ],
        )
    )
    client.post(
        "/api/integrations",
        headers={"X-Owner-Id": OWNER, "Authorization": f"Bearer {AGENT_KEY}"},
        json={
            "key": "sample",
            "name": "Sample",
            "kind": "api",
            "provider": "mock",
            "authStrategy": "none",
            "tools": {
                "sample_tool": {
                    "name": "sample_tool",
                    "description": "Sample tool",
                    "executionMode": "mock",
                    "mockResponse": {"ok": True},
                }
            },
        },
    )
    client.post(
        "/api/context/sample/sample_tool",
        headers={"Authorization": f"Bearer {AGENT_KEY}", "X-Owner-Id": OWNER},
        json={"agentId": "req-owner", "scopes": [], "payload": {}},
    )


def headers_for(route_path: str) -> dict[str, str]:
    if route_path.startswith("/api/admin/") and route_path != "/api/admin/key":
        return {"X-Owner-Id": OWNER, "Authorization": f"Bearer {ADMIN_KEY}"}
    if route_path.startswith("/api/user/") and route_path not in {"/api/user/key", "/api/user/agent-key"}:
        return {"X-Owner-Id": OWNER, "Authorization": f"Bearer {USER_KEY}"}
    if route_path.startswith("/api/context") or route_path == "/api/mcp":
        return {"X-Owner-Id": OWNER, "Authorization": f"Bearer {AGENT_KEY}"}
    return {"X-Owner-Id": OWNER}


def body_for(path: str) -> object:
    if path.endswith("/functions"):
        return [{"name": "sample_tool", "description": "Sample tool", "accessMode": "enabled"}]
    if path in {"/api/managed-connectors", "/api/admin/managed-connectors"}:
        return {
            "slug": "sample-connector",
            "name": "Sample connector",
            "description": "Sample connector",
            "provider": "http",
            "authStrategy": "none",
            "credentialLabel": "Credential",
            "credentialPlaceholder": "Credential",
            "credentialHelp": "Help",
            "tools": [],
        }
    if path.endswith("/tools") or "/tools/" in path:
        return {"name": "sample_tool", "description": "Sample tool", "accessMode": "enabled"}
    if path.endswith("/discover"):
        return {"kind": "managed", "key": "sample", "name": "Sample", "managedConnectorSlug": "sample-connector"}
    if path.endswith("/toggle"):
        return {"enabled": False}
    if path.endswith("/approve"):
        return {"durationMinutes": 60}
    if path.endswith("/reject"):
        return {}
    if path == "/api/agent-classes/{agentClass}":
        return {"rules": []}
    if path in {"/api/integrations", "/api/user/integrations", "/api/admin/integrations"}:
        return {"key": "sample", "name": "Sample", "kind": "api", "provider": "mock", "authStrategy": "none", "tools": {}}
    if path == "/api/context/{integrationKey}/{toolName}":
        return {"payload": {}, "scopes": []}
    if path == "/api/mcp":
        return {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
    return {}


def test_all_original_manifest_routes_are_implemented_without_server_errors() -> None:
    failures: list[tuple[str, str, int, str]] = []
    for method, route_path in ROUTES:
        seed_state()
        response = client.request(
            method,
            sample_path(route_path),
            headers=headers_for(route_path),
            json=body_for(route_path) if method in {"POST", "PATCH", "PUT"} else None,
        )
        if response.status_code in {500, 501}:
            failures.append((method, route_path, response.status_code, response.text))

    assert failures == []


def test_mcp_endpoint_lists_and_calls_enabled_tools() -> None:
    seed_state()

    tools_response = client.post(
        "/api/mcp",
        headers={"X-Owner-Id": OWNER, "Authorization": f"Bearer {AGENT_KEY}"},
        json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"},
    )
    assert tools_response.status_code == 200
    assert tools_response.json()["result"]["tools"][0]["name"] == "sample__sample_tool"

    call_response = client.post(
        "/api/mcp",
        headers={"X-Owner-Id": OWNER, "Authorization": f"Bearer {AGENT_KEY}"},
        json={
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": "sample__sample_tool", "arguments": {"value": 1}},
        },
    )
    assert call_response.status_code == 200
    assert call_response.json()["result"]["content"][0]["type"] == "text"


def test_auth_compatibility_routes_are_available() -> None:
    for method in ("GET", "POST"):
        response = client.request(method, "/api/auth/session", headers={"X-Owner-Id": OWNER})
        assert response.status_code == 200
        assert response.json()["user"]["email"] == OWNER


def test_context_and_mcp_require_valid_agent_api_key() -> None:
    repository.agent_keys.clear()
    response = client.post("/api/context/sample/sample_tool", json={"payload": {}, "scopes": []})
    assert response.status_code == 503

    repository.save_key(OWNER, "agent", AGENT_KEY)
    repository.save_key(OWNER, "user", USER_KEY)
    repository.save_key(OWNER, "admin", ADMIN_KEY)
    bad_response = client.post(
        "/api/mcp",
        headers={"Authorization": "Bearer wrong"},
        json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"},
    )
    assert bad_response.status_code == 401
    assert bad_response.headers["www-authenticate"].startswith("Bearer")
