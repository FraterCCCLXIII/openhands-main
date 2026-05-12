from __future__ import annotations

import json
import os
import urllib.parse
from typing import TYPE_CHECKING

import httpx
from fastapi.testclient import TestClient

from backend.app import main as backend_main
from backend.app import oauth_flow
from backend.app.config import reset_config
from backend.app.main import app
from backend.app.models import AccessRequest, ManagedConnector, ManagedConnectorTool, ToolSpec
from backend.app.repository import repository

if TYPE_CHECKING:
    from conftest import ConfigEnvFixture


def setup_function() -> None:
    repository.integrations.clear()
    repository.access_requests.clear()
    repository.managed_connectors.clear()
    repository.agent_keys.clear()
    repository.user_keys.clear()
    repository.admin_keys.clear()
    repository.connections.clear()
    os.environ["APP_ADMIN_EMAILS"] = "dev@localhost,admin@example.com"
    os.environ["CREDENTIAL_ENCRYPTION_KEY"] = "test-encryption-key-for-tests"
    # Reset config cache to pick up env var changes
    reset_config()

    repository.oauth_states.clear()
    repository.policies.clear()
    repository.temporary_grants.clear()
    repository.tool_invocations.clear()


def test_register_integration_and_invoke_mock_tool(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    integration = {
        "key": "crm",
        "name": "CRM",
        "kind": "api",
        "provider": "mock",
        "authStrategy": "none",
        "enabled": True,
        "fineGrainedPermissions": True,
        "config": {},
        "credentials": {"apiKey": "secret"},
        "tools": {
            "lookup": {
                "name": "lookup",
                "description": "Lookup a record",
                "enabled": True,
                "accessMode": "enabled",
                "fineGrainedPermissions": True,
                "defaultScopes": ["crm.read"],
                "executionMode": "mock",
                "config": {},
                "mockResponse": {"ok": True},
            }
        },
    }

    created = client.post("/api/integrations", json=integration).json()
    assert created["credentials"] == {}
    agent_key = client.get("/api/user/agent-key").json()["apiKey"]

    result = client.post(
        "/api/context/crm/lookup",
        headers={"Authorization": f"Bearer {agent_key}"},
        json={"scopes": ["crm.read"], "payload": {"id": "123"}},
    )
    assert result.status_code == 200
    assert result.json()["data"] == {"ok": True}


def test_managed_connector_discovery_and_user_key_flow(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)

    admin_key = client.post("/api/admin/key").json()["apiKey"]
    connector_response = client.post(
        "/api/managed-connectors",
        headers={"Authorization": f"Bearer {admin_key}"},
        json={
            "slug": "linear",
            "name": "Linear",
            "description": "Linear MCP",
            "categories": ["product"],
            "authModes": ["bearer"],
            "authStrategy": "bearer",
            "provider": "mcp",
            "serverUrl": "https://mcp.linear.app/mcp",
            "credentialLabel": "Linear token",
            "credentialPlaceholder": "Paste token",
            "credentialHelp": "Linear API token",
            "tools": [
                {
                    "name": "list_issues",
                    "description": "List issues",
                    "defaultScopes": ["issues.read"],
                }
            ],
            "enabled": True,
        },
    )
    assert connector_response.status_code == 200

    discovered = client.post(
        "/api/integrations/discover",
        json={"managedConnectorSlug": "linear", "credentials": {"accessToken": "linear-token"}},
    ).json()
    assert discovered["tools"]["list_issues"]["defaultScopes"] == ["issues.read"]

    user_key = client.post("/api/user/key").json()["apiKey"]
    assert client.get("/api/user/integrations", headers={"Authorization": f"Bearer {user_key}"}).status_code == 200


def test_managed_oauth_mcp_discovery_uses_saved_connection(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("CREDENTIAL_ENCRYPTION_KEY", "test-credential-key")
    client = TestClient(app)

    admin_key = client.post("/api/admin/key").json()["apiKey"]
    connector_response = client.post(
        "/api/managed-connectors",
        headers={"Authorization": f"Bearer {admin_key}"},
        json={
            "slug": "linear",
            "name": "Linear",
            "description": "Linear MCP",
            "categories": ["product"],
            "authModes": ["oauth2"],
            "authStrategy": "oauth2",
            "provider": "mcp",
            "serverUrl": "https://mcp.linear.app/mcp",
            "oauthConfigured": True,
            "oauthClientId": "linear-client-id",
            "oauthClientSecret": "linear-client-secret",
            "oauthConfig": {
                "authorizationUrl": "https://linear.app/oauth/authorize",
                "tokenUrl": "https://api.linear.app/oauth/token",
                "scopes": ["read"],
            },
            "credentialLabel": "Connect Linear",
            "credentialPlaceholder": "Connect Linear",
            "credentialHelp": "Use OAuth to connect Linear.",
            "tools": [],
            "enabled": True,
        },
    )
    assert connector_response.status_code == 200
    repository.save_connection(
        "dev@localhost",
        "linear",
        "mcp",
        "oauth2",
        {"accessToken": "saved-linear-token"},
        {"scopes": ["read"]},
    )

    seen: dict[str, object] = {}

    def fake_discover_mcp_tools(server_url: str, headers: dict[str, str]) -> dict[str, ToolSpec]:
        seen["serverUrl"] = server_url
        seen["headers"] = headers
        return {
            "list_issues": ToolSpec(
                name="list_issues",
                description="List Linear issues",
                config={"toolName": "list_issues", "inputSchema": {"type": "object"}},
            )
        }

    monkeypatch.setattr(backend_main, "discover_mcp_tools", fake_discover_mcp_tools)

    discovered = client.post(
        "/api/integrations/discover",
        json={
            "key": "linear",
            "kind": "managed",
            "config": {"managedConnectorSlug": "linear"},
            "credentials": {"accessToken": "submitted-token-should-not-be-used"},
        },
    )

    assert discovered.status_code == 200
    body = discovered.json()
    assert body["credentials"] == {}
    assert body["tools"]["list_issues"]["description"] == "List Linear issues"
    assert seen == {
        "serverUrl": "https://mcp.linear.app/mcp",
        "headers": {"Authorization": "Bearer saved-linear-token"},
    }


def test_mcp_discovery_honors_streamable_transport_order(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    attempted: list[str] = []

    def fake_discover(server_url, _headers):
        attempted.append(server_url)
        if server_url == "https://first.example/mcp":
            raise backend_main.HTTPException(status_code=502, detail="first failed")
        return {"list": ToolSpec(name="list", description="List things")}

    monkeypatch.setattr(backend_main, "discover_mcp_tools", fake_discover)
    response = client.post(
        "/api/integrations/discover",
        json={
            "key": "fallback",
            "name": "Fallback",
            "kind": "mcp",
            "config": {
                "serverUrl": "https://fallback.example/mcp",
                "mcpTransportOrder": [
                    {"transport": "streamable_http", "url": "https://first.example/mcp"},
                    {"transport": "sse", "url": "https://ignored.example/sse"},
                    {"transport": "streamable_http", "url": "https://second.example/mcp"},
                ],
            },
            "credentials": {},
        },
    )
    assert response.status_code == 200
    assert attempted == ["https://first.example/mcp", "https://second.example/mcp"]
    assert response.json()["tools"]["list"]["description"] == "List things"


def test_oauth_invocation_requires_connection_and_refreshes_expired_tokens(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    import threading
    from http.server import BaseHTTPRequestHandler, HTTPServer

    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("CREDENTIAL_ENCRYPTION_KEY", "test-credential-key")
    client = TestClient(app)

    seen: dict[str, object] = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):  # noqa: N802 - http.server API
            seen["authorization"] = self.headers.get("authorization")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode())

        def log_message(self, *_args):
            return

    server = HTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        base_url = f"http://127.0.0.1:{server.server_port}"
        integration = {
            "key": "refresh-provider",
            "name": "Refresh Provider",
            "kind": "api",
            "provider": "http",
            "authStrategy": "oauth2",
            "config": {"apiBaseUrl": base_url},
            "tools": {
                "me": {
                    "name": "me",
                    "description": "Fetch me",
                    "config": {"request": {"method": "GET", "path": "/me"}},
                }
            },
        }
        assert client.post("/api/integrations", json=integration).status_code == 200
        agent_key = client.get("/api/user/agent-key").json()["apiKey"]

        missing = client.post(
            "/api/context/refresh-provider/me",
            headers={"Authorization": f"Bearer {agent_key}"},
            json={"payload": {}, "scopes": []},
        )
        assert missing.status_code == 403
        assert "Connect Refresh Provider" in missing.json()["detail"]

        admin_key = client.post("/api/admin/key").json()["apiKey"]
        assert client.post(
            "/api/managed-connectors",
            headers={"Authorization": f"Bearer {admin_key}"},
            json={
                "slug": "refresh-provider",
                "name": "Refresh Provider",
                "description": "Refresh Provider",
                "authModes": ["oauth2"],
                "authStrategy": "oauth2",
                "provider": "http",
                "apiBaseUrl": base_url,
                "oauthClientId": "client-id",
                "oauthClientSecret": "client-secret",
                "oauthConfig": {"authorizationUrl": "https://auth.example/authorize", "tokenUrl": "https://auth.example/token", "scopes": ["read"]},
            },
        ).status_code == 200
        repository.save_connection(
            "dev@localhost",
            "refresh-provider",
            "refresh-provider",
            "oauth2",
            {"accessToken": "expired-token", "refreshToken": "refresh-token"},
            {"scopes": ["read"], "expiresAt": "2000-01-01T00:00:00Z"},
        )

        token_requests: list[tuple[dict[str, str], dict[str, str]]] = []

        def fake_fetch_oauth_token(_connector, body, headers):
            token_requests.append((body, headers))
            return {"access_token": "refreshed-token", "refresh_token": "next-refresh", "expires_in": 3600, "scope": "read"}

        monkeypatch.setattr(oauth_flow, "fetch_oauth_token", fake_fetch_oauth_token)
        refreshed = client.post(
            "/api/context/refresh-provider/me",
            headers={"Authorization": f"Bearer {agent_key}"},
            json={"payload": {}, "scopes": []},
        )
        assert refreshed.status_code == 200
        assert seen["authorization"] == "Bearer refreshed-token"
        assert token_requests[0][0]["grant_type"] == "refresh_token"
        assert token_requests[0][0]["refresh_token"] == "refresh-token"
        assert token_requests[0][1]["Authorization"].startswith("Basic ")
    finally:
        server.shutdown()
        thread.join(timeout=2)


def test_oauth_start_uses_proxy_scopes_and_additional_params(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("AUTH_REDIRECT_PROXY_URL", "https://stable.example.dev/api/auth")
    client = TestClient(app)
    admin_key = client.post("/api/admin/key").json()["apiKey"]
    response = client.post(
        "/api/managed-connectors",
        headers={"Authorization": f"Bearer {admin_key}"},
        json={
            "slug": "oauth-params",
            "name": "OAuth Params",
            "description": "OAuth Params",
            "authModes": ["oauth2"],
            "authStrategy": "oauth2",
            "provider": "mcp",
            "serverUrl": "https://mcp.example/mcp",
            "oauthClientId": "client-id",
            "oauthClientSecret": "client-secret",
            "oauthConfig": {
                "authorizationUrl": "https://auth.example/authorize",
                "tokenUrl": "https://auth.example/token",
                "scopes": ["read", "write"],
                "optionalScopes": ["extra"],
                "scopeSeparator": "comma",
                "additionalAuthorizationParams": {"audience": "api", "optional_scope": "legacy"},
            },
        },
    )
    assert response.status_code == 200

    start = client.get("/api/oauth/oauth-params/start", follow_redirects=False)
    assert start.status_code == 307
    location = start.headers["location"]
    parsed = urllib.parse.urlparse(location)
    query = urllib.parse.parse_qs(parsed.query)
    assert query["redirect_uri"] == ["https://stable.example.dev/api/oauth/oauth-params/callback"]
    assert query["scope"] == ["read,write"]
    assert query["optional_scope"] == ["extra,legacy"]
    assert query["audience"] == ["api"]


def test_dynamic_oauth_client_registration_for_public_clients(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    import threading
    from http.server import BaseHTTPRequestHandler, HTTPServer

    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    registrations: list[dict[str, object]] = []

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):  # noqa: N802 - http.server API
            length = int(self.headers.get("content-length", "0"))
            registrations.append(json.loads(self.rfile.read(length).decode()))
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"client_id": "dynamic-client"}).encode())

        def log_message(self, *_args):
            return

    server = HTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        admin_key = client.post("/api/admin/key").json()["apiKey"]
        response = client.post(
            "/api/managed-connectors",
            headers={"Authorization": f"Bearer {admin_key}"},
            json={
                "slug": "dynamic-oauth",
                "name": "Dynamic OAuth",
                "description": "Dynamic OAuth",
                "authModes": ["oauth2"],
                "authStrategy": "oauth2",
                "provider": "mcp",
                "serverUrl": "https://mcp.example/mcp",
                "oauthConfig": {
                    "authorizationUrl": "https://auth.example/authorize",
                    "tokenUrl": "https://auth.example/token",
                    "registrationUrl": f"http://127.0.0.1:{server.server_port}/register",
                    "clientAuthentication": "none",
                    "scopes": [],
                },
            },
        )
        assert response.status_code == 200
        assert response.json()["oauthConfigured"] is True
        assert registrations[0]["token_endpoint_auth_method"] == "none"
        connector = repository.get_managed_connector("dynamic-oauth")
        assert connector is not None
        assert connector.oauthClientId == "dynamic-client"
    finally:
        server.shutdown()
        thread.join(timeout=2)


def test_approval_required_requests_are_deduplicated_and_policy_denials_do_not_create_requests(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    integration = {
        "key": "approval-api",
        "name": "Approval API",
        "kind": "api",
        "provider": "mock",
        "authStrategy": "none",
        "tools": {
            "needs_approval": {
                "name": "needs_approval",
                "description": "Needs approval",
                "accessMode": "approval_required",
                "executionMode": "mock",
                "mockResponse": {"ok": True},
            },
            "policy_limited": {
                "name": "policy_limited",
                "description": "Policy limited",
                "executionMode": "mock",
                "mockResponse": {"ok": True},
            },
        },
    }
    assert client.post("/api/integrations", json=integration).status_code == 200
    agent_key = client.get("/api/user/agent-key").json()["apiKey"]

    for _ in range(2):
        response = client.post(
            "/api/context/approval-api/needs_approval",
            headers={"Authorization": f"Bearer {agent_key}"},
            json={"agentId": "agent-1", "agentClass": "developer", "payload": {}, "scopes": []},
        )
        assert response.status_code == 403
    requests = client.get("/api/case-by-case-approvals").json()
    assert len(requests) == 1
    assert requests[0]["toolName"] == "needs_approval"

    assert client.put("/api/agent-classes/developer", json={"rules": []}).status_code == 200
    denied = client.post(
        "/api/context/approval-api/policy_limited",
        headers={"Authorization": f"Bearer {agent_key}"},
        json={"agentId": "agent-1", "agentClass": "developer", "payload": {}, "scopes": []},
    )
    assert denied.status_code == 403
    assert len(client.get("/api/case-by-case-approvals").json()) == 1


def test_repository_uses_owner_header_identity(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    integration = {
        "key": "owned",
        "name": "Owned",
        "kind": "mcp",
        "provider": "mcp",
        "authStrategy": "bearer",
        "config": {"managedConnectorSlug": "ordinal"},
        "credentials": {"accessToken": "ordinal-token"},
        "tools": {},
    }

    assert client.post("/api/integrations", headers={"X-Owner-Id": "User@Example.com"}, json=integration).status_code == 200

    owned_response = client.get("/api/integrations", headers={"X-Owner-Id": "user@example.com"})
    other_response = client.get("/api/integrations", headers={"X-Owner-Id": "other@example.com"})

    assert [item["key"] for item in owned_response.json()] == ["owned"]
    assert other_response.json() == []


def test_http_provider_invocation_uses_request_template_and_auth(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    import json
    import threading
    from http.server import BaseHTTPRequestHandler, HTTPServer

    seen: dict[str, object] = {}

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):  # noqa: N802 - http.server API
            length = int(self.headers.get("content-length", "0"))
            seen["path"] = self.path
            seen["authorization"] = self.headers.get("authorization")
            seen["body"] = json.loads(self.rfile.read(length).decode())
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"received": seen["body"], "path": self.path}).encode())

        def log_message(self, *_args):
            return

    server = HTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        config_env("INTHUB_DISABLE_AUTH", "true")
        client = TestClient(app)
        base_url = f"http://127.0.0.1:{server.server_port}"
        integration = {
            "key": "httpbin",
            "name": "HTTP Bin",
            "kind": "api",
            "provider": "http",
            "authStrategy": "bearer",
            "credentials": {"accessToken": "provider-token"},
            "config": {"apiBaseUrl": base_url},
            "tools": {
                "create": {
                    "name": "create",
                    "description": "Create item",
                    "executionMode": "provider",
                    "config": {"request": {"method": "POST", "path": "/items/{{id}}", "body": "{{body}}"}},
                }
            },
        }
        assert client.post("/api/integrations", json=integration).status_code == 200
        agent_key = client.get("/api/user/agent-key").json()["apiKey"]
        response = client.post(
            "/api/context/httpbin/create",
            headers={"Authorization": f"Bearer {agent_key}"},
            json={"payload": {"id": "abc 123", "body": {"name": "Ada"}}, "scopes": []},
        )
        assert response.status_code == 200
        assert response.json()["data"]["received"] == {"name": "Ada"}
        assert seen["path"] == "/items/abc%20123"
        assert seen["authorization"] == "Bearer provider-token"

        mcp_response = client.post(
            "/api/mcp",
            headers={"Authorization": f"Bearer {agent_key}"},
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "httpbin__create",
                    "arguments": {"id": "mcp item", "body": {"name": "Grace"}},
                },
            },
        )
        assert mcp_response.status_code == 200
        content = mcp_response.json()["result"]["content"][0]["text"]
        assert json.loads(content)["received"] == {"name": "Grace"}
        assert seen["path"] == "/items/mcp%20item"
        assert seen["authorization"] == "Bearer provider-token"
    finally:
        server.shutdown()
        thread.join(timeout=2)


def test_dashboard_key_routes_reject_spoofed_owner_without_internal_auth(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("AUTH_SECRET", "test-internal-secret")

    client = TestClient(app)
    response = client.get("/api/user/key", headers={"X-Owner-Id": "attacker@example.com"})

    assert response.status_code == 401
    assert "Sign in" in response.json()["detail"]


def test_dashboard_key_routes_accept_internal_proxy_owner(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("AUTH_SECRET", "test-internal-secret")

    client = TestClient(app)
    response = client.get(
        "/api/user/key",
        headers={
            "X-Owner-Id": "User@Example.com",
            "X-Integrations-Hub-Internal-Secret": "test-internal-secret",
        },
    )

    assert response.status_code == 200
    assert response.json()["hasKey"] is False

    agent_response = client.get(
        "/api/user/agent-key",
        headers={
            "X-Owner-Id": "User@Example.com",
            "X-Integrations-Hub-Internal-Secret": "test-internal-secret",
        },
    )
    assert agent_response.status_code == 200
    assert agent_response.json()["ownerId"] == "user@example.com"
    assert agent_response.json()["apiKey"].startswith("cla_")
    assert "key" not in agent_response.json()


def test_user_key_reveal_returns_metadata_when_stored_key_cannot_be_decrypted(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("POSTGRES_URL", "postgres://test")

    def fake_db_rows(query: str, _params: object = ()) -> list[dict[str, object]]:
        assert "FROM user_api_keys" in query
        return [
            {
                "owner_id": "dev@localhost",
                "key_prefix": "clu_12345678",
                "key_suffix": "wxyz",
                "encrypted_api_key": "not-valid-ciphertext",
                "created_at": "2026-01-01T00:00:00Z",
                "updated_at": "2026-01-02T00:00:00Z",
            }
        ]

    monkeypatch.setattr(repository, "db_rows", fake_db_rows)
    client = TestClient(app)

    response = client.get("/api/user/key")

    assert response.status_code == 200
    assert response.json() == {
        "hasKey": True,
        "apiKey": None,
        "key": {
            "keyPrefix": "clu_12345678",
            "keySuffix": "wxyz",
            "recoverable": True,
            "createdAt": "2026-01-01T00:00:00Z",
            "updatedAt": "2026-01-02T00:00:00Z",
        },
    }



def test_admin_privileges_fail_closed_without_allowlist(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("AUTH_SECRET", "test-internal-secret")
    config_env("APP_ADMIN_EMAILS")
    client = TestClient(app)

    response = client.post(
        "/api/admin/key",
        headers={
            "X-Owner-Id": "admin@example.com",
            "X-Integrations-Hub-Internal-Secret": "test-internal-secret",
        },
    )

    assert response.status_code == 403


def test_non_admin_dashboard_routes_reject_privileged_api_calls(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("AUTH_SECRET", "test-internal-secret")
    config_env("APP_ADMIN_EMAILS", "admin@example.com")
    client = TestClient(app)
    user_headers = {
        "X-Owner-Id": "user@example.com",
        "X-Integrations-Hub-Internal-Secret": "test-internal-secret",
    }
    repository.save_managed_connector(
        ManagedConnector(
            slug="sample",
            name="Sample",
            description="Sample connector",
            provider="http",
            authStrategy="none",
        )
    )

    raw_integration = {
        "key": "raw",
        "name": "Raw",
        "kind": "api",
        "provider": "http",
        "authStrategy": "none",
        "config": {"apiBaseUrl": "https://api.example.com"},
        "tools": {},
    }
    assert client.post("/api/integrations", headers=user_headers, json=raw_integration).status_code == 403

    raw_discovery = client.post(
        "/api/integrations/discover",
        headers=user_headers,
        json={"kind": "mcp", "key": "raw", "config": {"serverUrl": "https://mcp.example.com/mcp"}},
    )
    assert raw_discovery.status_code == 403

    raw_discovery_with_fake_slug = client.post(
        "/api/integrations/discover",
        headers=user_headers,
        json={
            "kind": "mcp",
            "key": "raw",
            "managedConnectorSlug": "not-registered",
            "config": {"serverUrl": "https://mcp.example.com/mcp"},
        },
    )
    assert raw_discovery_with_fake_slug.status_code == 403

    assert client.post("/api/admin/key", headers=user_headers).status_code == 403
    assert client.get("/api/notifications", headers=user_headers).status_code == 403
    assert client.post("/api/managed-connectors/sample/functions", headers=user_headers, json=[]).status_code == 403
    assert client.delete("/api/managed-connectors/sample", headers=user_headers).status_code == 403


def test_admin_dashboard_routes_allow_privileged_api_calls(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("AUTH_SECRET", "test-internal-secret")
    config_env("APP_ADMIN_EMAILS", "admin@example.com")
    client = TestClient(app)
    admin_headers = {
        "X-Owner-Id": "admin@example.com",
        "X-Integrations-Hub-Internal-Secret": "test-internal-secret",
    }
    connector = {
        "slug": "sample",
        "name": "Sample",
        "description": "Sample connector",
        "provider": "http",
        "authStrategy": "none",
        "openApiUrl": "https://example.com/openapi.json",
    }
    monkeypatch.setattr(
        backend_main,
        "generate_openapi_tools",
        lambda _url, _auth_strategy: [ManagedConnectorTool(name="lookup", description="Lookup")],
    )

    assert client.post("/api/admin/key", headers=admin_headers).status_code == 200
    assert client.post("/api/managed-connectors", headers=admin_headers, json=connector).status_code == 200
    functions_response = client.post(
        "/api/managed-connectors/sample/functions",
        headers=admin_headers,
    )
    assert functions_response.status_code == 200
    assert functions_response.json()["tools"][0]["name"] == "lookup"
    assert client.delete("/api/managed-connectors/sample", headers=admin_headers).status_code == 200


def test_deprecated_admin_oauth_connections_route_returns_410(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("AUTH_SECRET", "test-internal-secret")
    config_env("APP_ADMIN_EMAILS", "admin@example.com")
    client = TestClient(app)
    key_response = client.post(
        "/api/admin/key",
        headers={
            "X-Owner-Id": "admin@example.com",
            "X-Integrations-Hub-Internal-Secret": "test-internal-secret",
        },
    )
    admin_key = key_response.json()["apiKey"]

    response = client.get("/api/admin/oauth/connections", headers={"Authorization": f"Bearer {admin_key}"})

    assert response.status_code == 410
    assert "Use the user API key" in response.json()["detail"]


def test_default_managed_connectors_are_listed_and_require_credentials(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)

    connectors = client.get("/api/integrations/managed-connectors").json()
    by_slug = {connector["slug"]: connector for connector in connectors}

    assert by_slug["elevenlabs"]["apiKeyHeaderName"] == "xi-api-key"
    assert by_slug["ordinal"]["authStrategy"] == "bearer"

    repository.save_managed_connector(
        ManagedConnector(
            slug="ordinal",
            name="Ordinal override",
            description="Disabled override",
            authStrategy="bearer",
            provider="mcp",
            enabled=False,
        )
    )
    suppressed = client.get("/api/integrations/managed-connectors").json()
    assert "ordinal" not in {connector["slug"] for connector in suppressed}
    disabled_discovery = client.post(
        "/api/integrations/discover",
        json={"kind": "managed", "key": "ordinal", "credentials": {"accessToken": "token"}},
    )
    assert disabled_discovery.status_code == 404
    repository.managed_connectors.clear()

    missing_credential = client.post(
        "/api/integrations/discover",
        json={"kind": "managed", "key": "ordinal", "credentials": {}},
    )
    assert missing_credential.status_code == 400
    assert "Ordinal API key" in missing_credential.json()["detail"]



def test_managed_connector_function_indexing_generates_tools_and_preserves_access(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    repository.save_managed_connector(
        ManagedConnector(
            slug="catalog-api",
            name="Catalog API",
            description="Catalog",
            provider="http",
            authStrategy="none",
            openApiUrl="https://example.com/openapi.json",
            tools=[ManagedConnectorTool(name="list_items", accessMode="approval_required")],
        )
    )
    monkeypatch.setattr(
        backend_main,
        "generate_openapi_tools",
        lambda _url, _auth_strategy: [
            ManagedConnectorTool(name="list_items", description="List items"),
            ManagedConnectorTool(name="create_item", description="Create item"),
        ],
    )

    response = client.post("/api/managed-connectors/catalog-api/functions")

    assert response.status_code == 200
    tools = {tool["name"]: tool for tool in response.json()["tools"]}
    assert tools["list_items"]["accessMode"] == "approval_required"
    assert tools["create_item"]["accessMode"] == "enabled"


def test_managed_http_openapi_discovery_and_multipart_invocation(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    import base64
    import threading
    from http.server import BaseHTTPRequestHandler, HTTPServer

    config_env("INTHUB_DISABLE_AUTH", "true")
    seen: dict[str, object] = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):  # noqa: N802 - http.server API
            assert self.path == "/openapi.json"
            schema = {
                "openapi": "3.0.3",
                "paths": {
                    "/v1/files/{fileId}": {
                        "post": {
                            "operationId": "upload_file",
                            "summary": "Upload file",
                            "parameters": [
                                {"name": "fileId", "in": "path", "required": True, "schema": {"type": "string"}},
                                {"name": "purpose", "in": "query", "schema": {"type": "string"}},
                            ],
                            "requestBody": {
                                "required": True,
                                "content": {"multipart/form-data": {"schema": {"type": "object"}}},
                            },
                        }
                    }
                },
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(schema).encode())

        def do_POST(self):  # noqa: N802 - http.server API
            length = int(self.headers.get("content-length", "0"))
            body = self.rfile.read(length)
            seen["path"] = self.path
            seen["api_key"] = self.headers.get("x-test-key")
            seen["content_type"] = self.headers.get("content-type")
            seen["body"] = body
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode())

        def log_message(self, *_args):
            return

    server = HTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        client = TestClient(app)
        base_url = f"http://127.0.0.1:{server.server_port}"
        repository.save_managed_connector(
            ManagedConnector(
                slug="upload-api",
                name="Upload API",
                description="Uploads files",
                provider="http",
                authStrategy="api_key",
                credentialLabel="Upload API key",
                apiKeyHeaderName="x-test-key",
                apiBaseUrl=base_url,
                openApiUrl=f"{base_url}/openapi.json",
            )
        )

        discovered = client.post(
            "/api/integrations/discover",
            json={"kind": "managed", "key": "upload-api", "credentials": {"secret": "secret-token"}},
        )
        assert discovered.status_code == 200
        integration = discovered.json()
        assert integration["credentials"] == {"headerName": "x-test-key", "secret": "secret-token"}
        assert integration["tools"]["upload_file"]["config"]["request"]["contentType"] == "multipart_form_data"

        assert client.post("/api/integrations", json=integration).status_code == 200
        agent_key = client.get("/api/user/agent-key").json()["apiKey"]
        response = client.post(
            "/api/context/upload-api/upload_file",
            headers={"Authorization": f"Bearer {agent_key}"},
            json={
                "payload": {
                    "fileId": "abc 123",
                    "purpose": "voice",
                    "body": {
                        "file": {
                            "filename": "voice.txt",
                            "contentType": "text/plain",
                            "contentBase64": base64.b64encode(b"hello world").decode(),
                        },
                        "note": "demo",
                    },
                },
                "scopes": [],
            },
        )

        assert response.status_code == 200
        assert response.json()["data"] == {"ok": True}
        assert seen["path"] == "/v1/files/abc%20123?purpose=voice"
        assert seen["api_key"] == "secret-token"
        assert str(seen["content_type"]).startswith("multipart/form-data; boundary=")
        assert b'filename="voice.txt"' in seen["body"]
        assert b"hello world" in seen["body"]
        assert b'name="note"' in seen["body"]
        assert b"demo" in seen["body"]
    finally:
        server.shutdown()
        thread.join(timeout=2)


def test_generated_openapi_documents_include_route_details(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)

    user_key = client.post("/api/user/key").json()["apiKey"]
    user_doc = client.get("/api/user/openapi", headers={"Authorization": f"Bearer {user_key}"}).json()
    managed_doc = client.get("/api/managed-connectors/openapi").json()

    assert user_doc["security"] == [{"UserApiKey": []}]
    assert user_doc["paths"]["/api/user/integrations"]["post"]["summary"] == "Install an owner integration"
    functions_doc = managed_doc["paths"]["/api/managed-connectors/{slug}/functions"]["post"]
    assert functions_doc["summary"] == "Index connector tool definitions"
    assert "requestBody" not in functions_doc


def test_mcp_tools_expose_input_schema_and_strip_context_arguments(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    integration = {
        "key": "schemahub",
        "name": "Schema Hub",
        "kind": "api",
        "provider": "mock",
        "authStrategy": "none",
        "tools": {
            "lookup": {
                "name": "lookup",
                "description": "Lookup a record",
                "config": {
                    "inputSchema": {
                        "type": "object",
                        "properties": {"recordId": {"type": "string"}},
                        "required": ["recordId"],
                    },
                    "request": {"path": "/records/{{recordId}}", "query": {"expand": "{{expand}}"}},
                },
                "executionMode": "mock",
            }
        },
    }
    assert client.post("/api/integrations", json=integration).status_code == 200
    agent_key = client.get("/api/user/agent-key").json()["apiKey"]

    tools_response = client.post(
        "/api/mcp",
        headers={"Authorization": f"Bearer {agent_key}"},
        json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"},
    )

    assert tools_response.status_code == 200
    tool_schema = tools_response.json()["result"]["tools"][0]["inputSchema"]
    assert tool_schema["properties"]["recordId"] == {"type": "string"}
    assert "expand" in tool_schema["properties"]
    assert "contextScopes" in tool_schema["properties"]
    assert tool_schema["required"] == ["recordId"]

    call_response = client.post(
        "/api/mcp",
        headers={"Authorization": f"Bearer {agent_key}"},
        json={
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "schemahub__lookup",
                "arguments": {
                    "recordId": "abc",
                    "expand": True,
                    "contextScopes": ["schema.read"],
                    "contextAgentId": "agent-1",
                },
            },
        },
    )

    assert call_response.status_code == 200
    text = call_response.json()["result"]["content"][0]["text"]
    assert json.loads(text) == {"payload": {"recordId": "abc", "expand": True}}


def test_mcp_tool_call_returns_downstream_result(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    calls: list[dict[str, object]] = []

    class FakeMcpClient:
        def __init__(self, **_: object) -> None:
            pass

        def __enter__(self) -> "FakeMcpClient":
            return self

        def __exit__(self, *_: object) -> None:
            return None

        def post(self, url: str, headers: dict[str, str], json: dict[str, object]) -> httpx.Response:
            calls.append({"url": url, "headers": headers, "json": json})
            method = json.get("method")
            if method == "initialize":
                return httpx.Response(
                    200,
                    headers={"content-type": "application/json", "mcp-session-id": "session-1"},
                    json={"jsonrpc": "2.0", "id": 1, "result": {"protocolVersion": "2025-11-25"}},
                )
            if method == "notifications/initialized":
                return httpx.Response(202)
            assert method == "tools/call"
            return httpx.Response(
                200,
                headers={"content-type": "application/json"},
                json={
                    "jsonrpc": "2.0",
                    "id": 2,
                    "result": {
                        "content": [{"type": "text", "text": "actual downstream result"}],
                        "isError": False,
                    },
                },
            )

    from backend.app import main as backend_main

    monkeypatch.setattr(backend_main.httpx, "Client", FakeMcpClient)
    client = TestClient(app)
    integration = {
        "key": "remote",
        "name": "Remote MCP",
        "kind": "mcp",
        "provider": "mcp",
        "authStrategy": "bearer",
        "credentials": {"accessToken": "provider-token"},
        "config": {"serverUrl": "https://downstream.example/mcp"},
        "tools": {
            "lookup": {
                "name": "lookup",
                "description": "Lookup remotely",
                "config": {"toolName": "remote_lookup"},
            }
        },
    }
    assert client.post("/api/integrations", json=integration).status_code == 200
    agent_key = client.get("/api/user/agent-key").json()["apiKey"]

    response = client.post(
        "/api/mcp",
        headers={"Authorization": f"Bearer {agent_key}"},
        json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {"name": "remote__lookup", "arguments": {"query": "hello"}},
        },
    )

    assert response.status_code == 200
    text = response.json()["result"]["content"][0]["text"]
    assert json.loads(text) == {
        "content": [{"type": "text", "text": "actual downstream result"}],
        "isError": False,
    }
    assert [call["json"]["method"] for call in calls] == ["initialize", "notifications/initialized", "tools/call"]
    tool_call = calls[-1]
    assert tool_call["url"] == "https://downstream.example/mcp"
    assert tool_call["headers"]["Authorization"] == "Bearer provider-token"
    assert tool_call["headers"]["mcp-session-id"] == "session-1"
    assert tool_call["json"]["params"] == {"name": "remote_lookup", "arguments": {"query": "hello"}}


def test_approval_creates_temporary_grant_that_allows_invocation(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    integration = {
        "key": "approval-demo",
        "name": "Approval demo",
        "kind": "api",
        "provider": "mock",
        "authStrategy": "none",
        "tools": {
            "lookup": {
                "name": "lookup",
                "description": "Lookup",
                "accessMode": "approval_required",
                "executionMode": "mock",
                "mockResponse": {"ok": True},
            }
        },
    }
    assert client.post("/api/integrations", json=integration).status_code == 200
    agent_key = client.get("/api/user/agent-key").json()["apiKey"]
    denied = client.post(
        "/api/context/approval-demo/lookup",
        headers={"Authorization": f"Bearer {agent_key}"},
        json={"agentId": "agent-1", "agentClass": "reviewer", "scopes": [], "payload": {}},
    )
    assert denied.status_code == 403
    requests = client.get("/api/case-by-case-approvals").json()
    assert len(requests) == 1
    assert requests[0]["status"] == "pending"
    assert requests[0]["channels"] == ["in_app"]
    assert requests[0]["notificationTargets"] == {"in_app": "dev@localhost"}
    request_id = requests[0]["id"]

    grant = client.post(f"/api/case-by-case-approvals/{request_id}/approve", json={"durationMinutes": 30})
    assert grant.status_code == 200
    assert grant.json()["integrationKey"] == "approval-demo"
    assert grant.json()["grantedBy"] == "dev@localhost"
    decided_requests = client.get("/api/case-by-case-approvals").json()
    assert len(decided_requests) == 1
    assert decided_requests[0]["status"] == "approved"
    assert decided_requests[0]["decidedBy"] == "dev@localhost"

    allowed = client.post(
        "/api/context/approval-demo/lookup",
        headers={"Authorization": f"Bearer {agent_key}"},
        json={"agentId": "agent-1", "agentClass": "reviewer", "scopes": [], "payload": {}},
    )
    assert allowed.status_code == 200
    assert allowed.json()["data"] == {"ok": True}


def test_case_by_case_approvals_are_scoped_by_in_app_notification_target(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    repository.access_requests.setdefault("all", {})["req-approved"] = AccessRequest(
        id="req-approved",
        agentId="agent-1",
        agentClass="reviewer",
        integrationKey="approval-demo",
        toolName="lookup",
        channels=["in_app"],
        notificationTargets={"in_app": "dev@localhost"},
        status="approved",
        decidedBy="dev@localhost",
        decidedAt="2026-01-01T00:00:00Z",
    )
    repository.access_requests.setdefault("all", {})["req-other"] = AccessRequest(
        id="req-other",
        integrationKey="approval-demo",
        toolName="lookup",
        channels=["in_app"],
        notificationTargets={"in_app": "other@example.com"},
        status="pending",
    )
    repository.access_requests.setdefault("all", {})["req-agent-data-owner"] = AccessRequest(
        id="req-agent-data-owner",
        integrationKey="approval-demo",
        toolName="lookup",
        agentData={"ownerId": "dev@localhost"},
        status="pending",
    )

    requests = client.get("/api/case-by-case-approvals").json()

    assert [request["id"] for request in requests] == ["req-approved"]
    assert requests[0]["status"] == "approved"


def test_agent_class_policy_is_persisted_and_enforced(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    integration = {
        "key": "policy-demo",
        "name": "Policy demo",
        "kind": "api",
        "provider": "mock",
        "authStrategy": "none",
        "tools": {
            "allowed": {"name": "allowed", "executionMode": "mock", "mockResponse": {"allowed": True}},
            "blocked": {"name": "blocked", "executionMode": "mock", "mockResponse": {"blocked": True}},
        },
    }
    assert client.post("/api/integrations", json=integration).status_code == 200
    policy = client.put(
        "/api/agent-classes/reviewer",
        json={"rules": [{"integrationKey": "policy-demo", "toolNames": ["allowed"], "scopes": [], "enabled": True}]},
    )
    assert policy.status_code == 200
    assert policy.json()["rules"][0]["toolNames"] == ["allowed"]
    agent_key = client.get("/api/user/agent-key").json()["apiKey"]

    allowed = client.post(
        "/api/context/policy-demo/allowed",
        headers={"Authorization": f"Bearer {agent_key}"},
        json={"agentClass": "reviewer", "payload": {}, "scopes": []},
    )
    blocked = client.post(
        "/api/context/policy-demo/blocked",
        headers={"Authorization": f"Bearer {agent_key}"},
        json={"agentClass": "reviewer", "payload": {}, "scopes": []},
    )
    assert allowed.status_code == 200
    assert blocked.status_code == 403
    assert "agent class policy" in blocked.json()["detail"]


def test_disable_unused_tools_uses_invocation_history(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    integration = {
        "key": "usage-demo",
        "name": "Usage demo",
        "kind": "api",
        "provider": "mock",
        "authStrategy": "none",
        "tools": {
            "old": {"name": "old", "executionMode": "mock", "mockResponse": {"old": True}},
            "never": {"name": "never", "executionMode": "mock", "mockResponse": {"never": True}},
        },
    }
    assert client.post("/api/integrations", json=integration).status_code == 200
    saved = repository.get_integration("dev@localhost", "usage-demo")
    assert saved is not None
    repository.tool_invocations.append({
        "ownerId": "dev@localhost",
        "integrationKey": "usage-demo",
        "toolName": "old",
        "outcome": "success",
        "invokedAt": "2020-01-01T00:00:00Z",
    })

    response = client.post("/api/integrations/disable-unused", json={"thresholdValue": 1, "thresholdUnit": "days"})
    assert response.status_code == 200
    body = response.json()
    assert body["disabledCount"] == 1
    assert body["disabledTools"] == [{"integrationKey": "usage-demo", "toolName": "old", "lastInvokedAt": "2020-01-01T00:00:00Z"}]
    updated = repository.get_integration("dev@localhost", "usage-demo")
    assert updated is not None
    assert updated.tools["old"].accessMode == "disabled"
    assert updated.tools["never"].accessMode == "enabled"


def test_raw_mcp_discovery_lists_remote_tools(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    calls: list[dict[str, object]] = []

    class FakeMcpDiscoveryClient:
        def __init__(self, **_: object) -> None:
            pass

        def __enter__(self) -> "FakeMcpDiscoveryClient":
            return self

        def __exit__(self, *_: object) -> None:
            return None

        def post(self, url: str, headers: dict[str, str], json: dict[str, object]) -> httpx.Response:
            calls.append({"url": url, "headers": headers, "json": json})
            method = json.get("method")
            if method == "initialize":
                return httpx.Response(200, headers={"content-type": "application/json", "mcp-session-id": "session-1"}, json={"jsonrpc": "2.0", "id": 1, "result": {"protocolVersion": "2025-11-25"}})
            if method == "notifications/initialized":
                return httpx.Response(202)
            assert method == "tools/list"
            return httpx.Response(200, headers={"content-type": "application/json"}, json={"jsonrpc": "2.0", "id": 2, "result": {"tools": [{"name": "remote_tool", "description": "Remote", "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}}}]}})

    from backend.app import main as backend_main

    monkeypatch.setattr(backend_main.httpx, "Client", FakeMcpDiscoveryClient)
    client = TestClient(app)
    response = client.post(
        "/api/integrations/discover",
        json={"kind": "mcp", "key": "remote", "name": "Remote", "config": {"serverUrl": "https://remote.example/mcp"}, "credentials": {"accessToken": "token"}},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["authStrategy"] == "bearer"
    assert body["tools"]["remote_tool"]["config"]["inputSchema"]["properties"]["id"]["type"] == "string"
    assert calls[-1]["headers"]["Authorization"] == "Bearer token"


def test_oauth_catalog_and_admin_overview_are_data_driven(config_env: "ConfigEnvFixture", monkeypatch) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("CREDENTIAL_ENCRYPTION_KEY", "test-credential-key")
    client = TestClient(app)
    catalog = client.get("/api/integrations/oauth-provider-catalog").json()
    assert {item["slug"] for item in catalog} >= {"github", "slack", "notion", "hubspot", "elevenlabs", "ordinal"}

    repository.save_connection("owner-a@example.com", "slack-a", "slack", "oauth2", {"accessToken": "a"}, {"externalAccountId": "same", "displayName": "A"})
    repository.save_connection("owner-b@example.com", "slack-b", "Slack", "oauth2", {"accessToken": "b"}, {"externalAccountId": "SAME", "displayName": "B"})
    admin_key = client.post("/api/admin/key", headers={"X-Owner-Id": "admin@example.com"}).json()["apiKey"]
    overview = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {admin_key}"})
    assert overview.status_code == 200
    duplicates = overview.json()["duplicateExternalAccounts"]
    assert len(duplicates) == 1
    assert duplicates[0]["provider"] == "slack"
    assert sorted(duplicates[0]["owners"]) == ["owner-a@example.com", "owner-b@example.com"]
