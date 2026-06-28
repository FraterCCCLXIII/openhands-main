from __future__ import annotations

import json
import os
import urllib.parse
from typing import TYPE_CHECKING, Any

import httpx
from fastapi.testclient import TestClient

from backend.app import auth as backend_auth, main as backend_main, oauth_flow
from backend.app.config import reset_config
from backend.app.main import app
from backend.app.models import (
    AccessRequest,
    IntegrationSpec,
    ManagedConnector,
    ManagedConnectorTool,
    ToolSpec,
)
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
    os.environ["INTHUB_APP_ADMIN_EMAILS"] = "dev@localhost,admin@example.com"
    os.environ["INTHUB_CREDENTIAL_ENCRYPTION_KEY"] = "test-encryption-key-for-tests"
    # Reset config cache to pick up env var changes
    reset_config()

    repository.oauth_states.clear()
    repository.temporary_grants.clear()
    repository.tool_invocations.clear()
    repository.permission_profiles.clear()
    repository.profile_agent_keys.clear()


def test_register_integration_and_invoke_mock_tool(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
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


def test_permission_profiles_save_load_and_update_current_settings(
    config_env: ConfigEnvFixture,
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    integration = {
        "key": "docs",
        "name": "Docs",
        "kind": "api",
        "provider": "mock",
        "authStrategy": "none",
        "enabled": True,
        "fineGrainedPermissions": True,
        "config": {},
        "credentials": {},
        "tools": {
            "read": {
                "name": "read",
                "enabled": True,
                "accessMode": "enabled",
                "fineGrainedPermissions": True,
                "defaultScopes": [],
                "executionMode": "mock",
                "config": {},
            },
            "write": {
                "name": "write",
                "enabled": True,
                "accessMode": "approval_required",
                "fineGrainedPermissions": True,
                "defaultScopes": [],
                "executionMode": "mock",
                "config": {},
            },
        },
    }
    assert client.post("/api/integrations", json=integration).status_code == 200

    created = client.post("/api/permission-profiles", json={"name": "Research"})
    assert created.status_code == 200
    created_body = created.json()
    profile_id = created_body["id"]
    assert created_body["agentApiKey"].startswith("cla_")

    repository.profile_agent_keys.pop(profile_id)
    saved_profile = repository.permission_profiles["dev@localhost"][profile_id]
    repository.permission_profiles["dev@localhost"][profile_id] = (
        saved_profile.model_copy(update={"agentApiKey": ""})
    )
    missing_key_profiles = client.get("/api/permission-profiles").json()
    missing_key_profile = next(
        profile for profile in missing_key_profiles if profile["id"] == profile_id
    )
    assert missing_key_profile["agentApiKey"] == ""

    provisioned = client.post(f"/api/permission-profiles/{profile_id}/agent-key")
    assert provisioned.status_code == 200
    provisioned_key = provisioned.json()["agentApiKey"]
    assert provisioned_key.startswith("cla_")
    assert provisioned_key != created_body["agentApiKey"]

    rotated = client.post(f"/api/permission-profiles/{profile_id}/agent-key")
    assert rotated.status_code == 200
    rotated_key = rotated.json()["agentApiKey"]
    assert rotated_key.startswith("cla_")
    assert rotated_key != provisioned_key

    duplicate = client.post("/api/permission-profiles", json={"name": "research"})
    assert duplicate.status_code == 409
    assert (
        duplicate.json()["detail"]
        == "A permission profile named 'research' already exists."
    )

    profiles = client.get("/api/permission-profiles").json()
    default_profiles = [profile for profile in profiles if profile["name"] is None]
    assert len(default_profiles) == 1
    assert default_profiles[0]["agentApiKey"].startswith("cla_")
    assert default_profiles[0]["agentApiKey"] != created_body["agentApiKey"]

    client.patch(
        "/api/integrations/docs/tools/read",
        json={"accessMode": "disabled"},
    )
    client.patch(
        "/api/integrations/docs/tools/write",
        json={"accessMode": "enabled"},
    )

    refreshed_profiles = client.get("/api/permission-profiles").json()
    refreshed_default_profiles = [
        profile for profile in refreshed_profiles if profile["name"] is None
    ]
    assert len(refreshed_default_profiles) == 1
    assert (
        refreshed_default_profiles[0]["snapshot"]["integrations"]["docs"]["tools"][
            "read"
        ]
        == "disabled"
    )

    named_profile_result = client.post(
        "/api/context/docs/read",
        headers={"Authorization": f"Bearer {rotated_key}"},
        json={"scopes": [], "payload": {}},
    )
    assert named_profile_result.status_code == 200

    default_profile_result = client.post(
        "/api/context/docs/read",
        headers={
            "Authorization": f"Bearer {refreshed_default_profiles[0]['agentApiKey']}"
        },
        json={"scopes": [], "payload": {}},
    )
    assert default_profile_result.status_code == 403

    client.post("/api/integrations/docs/toggle", json={"enabled": False})

    loaded = client.post(f"/api/permission-profiles/{profile_id}/load")
    assert loaded.status_code == 200
    assert loaded.json()["appliedTools"] == 2

    [restored] = client.get("/api/integrations").json()
    assert restored["enabled"] is True
    assert restored["tools"]["read"]["accessMode"] == "enabled"
    assert restored["tools"]["write"]["accessMode"] == "approval_required"

    client.patch(
        "/api/integrations/docs/tools/read",
        json={"accessMode": "disabled"},
    )
    updated = client.post(f"/api/permission-profiles/{profile_id}/update")
    assert updated.status_code == 200
    assert (
        updated.json()["snapshot"]["integrations"]["docs"]["tools"]["read"]
        == "disabled"
    )


def test_managed_connector_discovery_and_user_key_flow(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
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
        json={
            "managedConnectorSlug": "linear",
            "credentials": {"accessToken": "linear-token"},
        },
    ).json()
    assert discovered["tools"]["list_issues"]["defaultScopes"] == ["issues.read"]

    user_key = client.post("/api/user/key").json()["apiKey"]
    assert (
        client.get(
            "/api/user/integrations", headers={"Authorization": f"Bearer {user_key}"}
        ).status_code
        == 200
    )


def test_managed_oauth_mcp_discovery_uses_saved_connection(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-credential-key")
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

    def fake_discover_mcp_tools(
        server_url: str, headers: dict[str, str], **_: Any
    ) -> dict[str, ToolSpec]:
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


def test_oauth_callback_backfills_mcp_tools_for_saved_integration(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-credential-key")
    client = TestClient(app)

    admin_key = client.post("/api/admin/key").json()["apiKey"]
    connector_response = client.post(
        "/api/managed-connectors",
        headers={"Authorization": f"Bearer {admin_key}"},
        json={
            "slug": "gh",
            "name": "GitHub",
            "description": "GitHub MCP",
            "categories": ["dev"],
            "authModes": ["oauth2"],
            "authStrategy": "oauth2",
            "provider": "mcp",
            "serverUrl": "https://mcp.github.com/mcp",
            "oauthConfigured": True,
            "oauthClientId": "gh-client-id",
            "oauthClientSecret": "gh-client-secret",
            "oauthConfig": {
                "authorizationUrl": "https://github.com/login/oauth/authorize",
                "tokenUrl": "https://github.com/login/oauth/access_token",
                "scopes": ["repo"],
            },
            "credentialLabel": "Connect GitHub",
            "credentialPlaceholder": "Connect GitHub",
            "credentialHelp": "Use OAuth to connect GitHub.",
            "tools": [],
            "enabled": True,
        },
    )
    assert connector_response.status_code == 200

    # User saved an integration for the connector with no tools yet (the
    # state the wizard leaves things in before OAuth completes).
    repository.save_integration(
        "dev@localhost",
        IntegrationSpec(
            key="gh",
            name="GitHub",
            kind="mcp",
            provider="mcp",
            authStrategy="oauth2",
            enabled=True,
            fineGrainedPermissions=True,
            config={"managedConnectorSlug": "gh"},
            tools={},
        ),
    )

    def fake_discover_mcp_tools(
        server_url: str, headers: dict[str, str], **_: Any
    ) -> dict[str, ToolSpec]:
        assert server_url == "https://mcp.github.com/mcp"
        assert headers == {"Authorization": "Bearer gh-fresh-token"}
        return {
            "search_repos": ToolSpec(
                name="search_repos",
                description="Search repositories",
                config={"toolName": "search_repos", "inputSchema": {"type": "object"}},
            ),
            "get_repo": ToolSpec(
                name="get_repo",
                description="Get a repository",
                config={"toolName": "get_repo", "inputSchema": {"type": "object"}},
            ),
        }

    monkeypatch.setattr(backend_main, "discover_mcp_tools", fake_discover_mcp_tools)

    # Seed an OAuth state and stub the token exchange so the callback can run
    # end-to-end without hitting the network.
    repository.save_oauth_state(
        state="test-state-123",
        owner_id="dev@localhost",
        integration_key="gh",
        provider="gh",
        code_verifier=None,
        redirect_to="/integrations",
        redirect_uri="https://testserver/api/oauth/gh/callback",
        callback_url=None,
        expires_at="2099-01-01T00:00:00Z",
    )
    monkeypatch.setattr(
        oauth_flow,
        "fetch_oauth_token",
        lambda connector, body, headers: {"access_token": "gh-fresh-token"},
    )

    response = client.get(
        "/api/oauth/gh/callback?state=test-state-123&code=fake-code",
        follow_redirects=False,
    )
    assert response.status_code in (302, 307)

    saved = repository.get_integration("dev@localhost", "gh")
    assert saved is not None
    tool_names = set(saved.tools.keys())
    assert {"search_repos", "get_repo"}.issubset(tool_names)


def _seed_oauth_connector_and_state(
    client: TestClient, *, redirect_to: str, state: str = "test-state-redirect"
) -> None:
    admin_key = client.post("/api/admin/key").json()["apiKey"]
    connector_response = client.post(
        "/api/managed-connectors",
        headers={"Authorization": f"Bearer {admin_key}"},
        json={
            "slug": "gh",
            "name": "GitHub",
            "description": "GitHub MCP",
            "categories": ["dev"],
            "authModes": ["oauth2"],
            "authStrategy": "oauth2",
            "provider": "mcp",
            "serverUrl": "https://mcp.github.com/mcp",
            "oauthConfigured": True,
            "oauthClientId": "gh-client-id",
            "oauthClientSecret": "gh-client-secret",
            "oauthConfig": {
                "authorizationUrl": "https://github.com/login/oauth/authorize",
                "tokenUrl": "https://github.com/login/oauth/access_token",
                "scopes": ["repo"],
            },
            "credentialLabel": "Connect GitHub",
            "credentialPlaceholder": "Connect GitHub",
            "credentialHelp": "Use OAuth to connect GitHub.",
            "tools": [],
            "enabled": True,
        },
    )
    assert connector_response.status_code == 200
    repository.save_oauth_state(
        state=state,
        owner_id="dev@localhost",
        integration_key="gh",
        provider="gh",
        code_verifier=None,
        redirect_to=redirect_to,
        redirect_uri="https://testserver/api/oauth/gh/callback",
        callback_url=None,
        expires_at="2099-01-01T00:00:00Z",
    )


def test_oauth_callback_preserves_wizard_redirect_target(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-credential-key")
    client = TestClient(app)

    redirect_to = "/integrations?showIntegrationWizard=1&managedConnector=gh"
    _seed_oauth_connector_and_state(client, redirect_to=redirect_to)
    monkeypatch.setattr(
        oauth_flow,
        "fetch_oauth_token",
        lambda connector, body, headers: {"access_token": "gh-fresh-token"},
    )

    response = client.get(
        "/api/oauth/gh/callback?state=test-state-redirect&code=fake-code",
        follow_redirects=False,
    )
    assert response.status_code in (302, 307)
    location = response.headers["location"]
    # The wizard return target is preserved so the user lands back inside the
    # wizard they started OAuth from, with the success banner appended.
    assert "showIntegrationWizard=1" in location
    assert "managedConnector=gh" in location
    assert "oauth_status=connected" in location
    assert "oauth_provider=gh" in location
    assert "integrationKey=gh" in location


def test_oauth_callback_preserves_redirect_target_on_error(
    config_env: ConfigEnvFixture,
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-credential-key")
    client = TestClient(app)

    redirect_to = "/integrations?showIntegrationWizard=1&managedConnector=gh"
    _seed_oauth_connector_and_state(client, redirect_to=redirect_to)

    response = client.get(
        "/api/oauth/gh/callback?state=test-state-redirect&error=access_denied",
        follow_redirects=False,
    )
    assert response.status_code in (302, 307)
    location = response.headers["location"]
    assert "showIntegrationWizard=1" in location
    assert "managedConnector=gh" in location
    assert "oauth_status=error" in location
    assert "oauth_provider=gh" in location
    assert "oauth_error=access_denied" in location


def test_oauth_callback_falls_back_to_integrations_without_redirect_target(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-credential-key")
    client = TestClient(app)

    _seed_oauth_connector_and_state(client, redirect_to="", state="test-state-fallback")
    monkeypatch.setattr(
        oauth_flow,
        "fetch_oauth_token",
        lambda connector, body, headers: {"access_token": "gh-fresh-token"},
    )

    response = client.get(
        "/api/oauth/gh/callback?state=test-state-fallback&code=fake-code",
        follow_redirects=False,
    )
    assert response.status_code in (302, 307)
    location = response.headers["location"]
    assert location.startswith("/integrations")
    assert "oauth_status=connected" in location
    # No wizard params when no redirect_to was saved.
    assert "showIntegrationWizard" not in location


def test_oauth_callback_rejects_external_redirect_target(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    """An attacker-crafted redirectTo=https://evil.example/... must not
    produce an off-origin 302 — the callback must fall back to /integrations.
    """
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-credential-key")
    client = TestClient(app)

    _seed_oauth_connector_and_state(
        client,
        redirect_to="https://evil.example/phish",
        state="test-state-evil",
    )
    monkeypatch.setattr(
        oauth_flow,
        "fetch_oauth_token",
        lambda connector, body, headers: {"access_token": "gh-fresh-token"},
    )

    response = client.get(
        "/api/oauth/gh/callback?state=test-state-evil&code=fake-code",
        follow_redirects=False,
    )
    assert response.status_code in (302, 307)
    location = response.headers["location"]
    # Must not redirect off-origin.
    assert location.startswith("/integrations")
    assert "evil.example" not in location
    assert "oauth_status=connected" in location


def test_oauth_callback_rejects_protocol_relative_redirect_target(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    """A protocol-relative //evil.example/ redirect target must also be
    rejected.
    """
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-credential-key")
    client = TestClient(app)

    _seed_oauth_connector_and_state(
        client,
        redirect_to="//evil.example/phish",
        state="test-state-proto-rel",
    )
    monkeypatch.setattr(
        oauth_flow,
        "fetch_oauth_token",
        lambda connector, body, headers: {"access_token": "gh-fresh-token"},
    )

    response = client.get(
        "/api/oauth/gh/callback?state=test-state-proto-rel&code=fake-code",
        follow_redirects=False,
    )
    assert response.status_code in (302, 307)
    location = response.headers["location"]
    assert location.startswith("/integrations")
    assert "evil.example" not in location


def test_mcp_discovery_honors_streamable_transport_order(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
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
                    {
                        "transport": "streamable_http",
                        "url": "https://first.example/mcp",
                    },
                    {"transport": "sse", "url": "https://ignored.example/sse"},
                    {
                        "transport": "streamable_http",
                        "url": "https://second.example/mcp",
                    },
                ],
            },
            "credentials": {},
        },
    )
    assert response.status_code == 200
    assert attempted == ["https://first.example/mcp", "https://second.example/mcp"]
    assert response.json()["tools"]["list"]["description"] == "List things"


def test_oauth_invocation_requires_connection_and_refreshes_expired_tokens(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    import threading
    from http.server import BaseHTTPRequestHandler, HTTPServer

    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-credential-key")
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
        assert (
            client.post(
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
                    "oauthConfig": {
                        "authorizationUrl": "https://auth.example/authorize",
                        "tokenUrl": "https://auth.example/token",
                        "scopes": ["read"],
                    },
                },
            ).status_code
            == 200
        )
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
            return {
                "access_token": "refreshed-token",
                "refresh_token": "next-refresh",
                "expires_in": 3600,
                "scope": "read",
            }

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


def test_oauth_start_uses_proxy_scopes_and_additional_params(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_OAUTH_REDIRECT_PROXY_URL", "https://stable.example.dev")
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
                "additionalAuthorizationParams": {
                    "audience": "api",
                    "optional_scope": "legacy",
                },
            },
        },
    )
    assert response.status_code == 200

    start = client.get("/api/oauth/oauth-params/start", follow_redirects=False)
    assert start.status_code == 307
    location = start.headers["location"]
    parsed = urllib.parse.urlparse(location)
    query = urllib.parse.parse_qs(parsed.query)
    assert query["redirect_uri"] == [
        "https://stable.example.dev/api/oauth/oauth-params/callback"
    ]
    assert query["scope"] == ["read,write"]
    assert query["optional_scope"] == ["extra,legacy"]
    assert query["audience"] == ["api"]

    json_start = client.get(
        "/api/oauth/oauth-params/start",
        headers={"Accept": "application/json"},
    )
    assert json_start.status_code == 200
    json_location = json_start.json()["redirectUrl"]
    assert urllib.parse.urlparse(json_location).netloc == "auth.example"
    json_query = urllib.parse.parse_qs(urllib.parse.urlparse(json_location).query)
    assert json_query["redirect_uri"] == [
        "https://stable.example.dev/api/oauth/oauth-params/callback"
    ]
    assert json_query["scope"] == ["read,write"]


def test_dynamic_oauth_client_registration_for_public_clients(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
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


def test_approval_required_requests_are_deduplicated(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
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
            }
        },
    }
    assert client.post("/api/integrations", json=integration).status_code == 200
    agent_key = client.get("/api/user/agent-key").json()["apiKey"]

    denial_messages = []
    for _ in range(2):
        response = client.post(
            "/api/context/approval-api/needs_approval",
            headers={"Authorization": f"Bearer {agent_key}"},
            json={
                "agentId": "agent-1",
                "agentClass": "developer",
                "payload": {},
                "scopes": [],
            },
        )
        assert response.status_code == 403
        detail = response.json()["detail"]
        denial_messages.append(detail)
        assert "http://testserver/case-by-case-approvals" in detail
    requests = client.get("/api/case-by-case-approvals").json()
    assert len(requests) == 1
    assert requests[0]["toolName"] == "needs_approval"
    assert all(requests[0]["id"] in message for message in denial_messages)


def test_temporary_grants_are_owner_scoped(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_APP_ADMIN_EMAILS", "owner-a@example.com,owner-b@example.com")
    client = TestClient(app)
    integration = {
        "key": "grant-api",
        "name": "Grant API",
        "kind": "api",
        "provider": "mock",
        "authStrategy": "none",
        "tools": {
            "call": {
                "name": "call",
                "description": "Call",
                "accessMode": "approval_required",
                "executionMode": "mock",
                "mockResponse": {"ok": True},
            }
        },
    }
    owner_a = {"X-Owner-Id": "owner-a@example.com"}
    owner_b = {"X-Owner-Id": "owner-b@example.com"}
    assert (
        client.post("/api/integrations", headers=owner_a, json=integration).status_code
        == 200
    )
    assert (
        client.post("/api/integrations", headers=owner_b, json=integration).status_code
        == 200
    )
    key_a = client.get("/api/user/agent-key", headers=owner_a).json()["apiKey"]
    key_b = client.get("/api/user/agent-key", headers=owner_b).json()["apiKey"]
    payload = {
        "agentId": "agent-1",
        "agentClass": "developer",
        "payload": {},
        "scopes": [],
    }

    denied_a = client.post(
        "/api/context/grant-api/call",
        headers={"Authorization": f"Bearer {key_a}"},
        json=payload,
    )
    assert denied_a.status_code == 403
    request_id = client.get("/api/case-by-case-approvals", headers=owner_a).json()[0][
        "id"
    ]
    assert (
        client.post(
            f"/api/case-by-case-approvals/{request_id}/approve", headers=owner_a
        ).status_code
        == 200
    )

    allowed_a = client.post(
        "/api/context/grant-api/call",
        headers={"Authorization": f"Bearer {key_a}"},
        json=payload,
    )
    denied_b = client.post(
        "/api/context/grant-api/call",
        headers={"Authorization": f"Bearer {key_b}"},
        json=payload,
    )

    assert allowed_a.status_code == 200
    assert denied_b.status_code == 403


def test_repository_uses_owner_header_identity(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    repository.save_managed_connector(
        ManagedConnector(
            slug="ordinal",
            name="Ordinal",
            description="Ordinal",
            authStrategy="bearer",
            provider="mcp",
            serverUrl="https://app.tryordinal.com/mcp",
        )
    )
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

    assert (
        client.post(
            "/api/integrations",
            headers={"X-Owner-Id": "User@Example.com"},
            json=integration,
        ).status_code
        == 200
    )

    owned_response = client.get(
        "/api/integrations", headers={"X-Owner-Id": "user@example.com"}
    )
    other_response = client.get(
        "/api/integrations", headers={"X-Owner-Id": "other@example.com"}
    )

    assert [item["key"] for item in owned_response.json()] == ["owned"]
    assert other_response.json() == []


def test_http_provider_invocation_uses_request_template_and_auth(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
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
            self.wfile.write(
                json.dumps({"received": seen["body"], "path": self.path}).encode()
            )

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
                    "config": {
                        "request": {
                            "method": "POST",
                            "path": "/items/{{id}}",
                            "body": "{{body}}",
                        }
                    },
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


class _AuthResponse:
    def __init__(self, status_code: int, payload: object | None = None) -> None:
        self.status_code = status_code
        self._payload = payload

    @property
    def is_success(self) -> bool:
        return 200 <= self.status_code < 300

    def json(self) -> object:
        return self._payload


class _AuthClient:
    def __init__(self, response: _AuthResponse, calls: list[dict[str, object]]) -> None:
        self._response = response
        self._calls = calls

    def __enter__(self) -> _AuthClient:
        return self

    def __exit__(self, *_exc: object) -> None:
        return None

    def get(self, url: str, headers: dict[str, str]) -> _AuthResponse:
        self._calls.append({"url": url, "headers": dict(headers)})
        return self._response


def _patch_openhands_user_me(
    monkeypatch,
    payload: object,
    status_code: int = 200,
) -> list[dict[str, object]]:
    calls: list[dict[str, object]] = []
    response = _AuthResponse(status_code, payload)
    monkeypatch.setattr(
        backend_auth.httpx,
        "Client",
        lambda *_args, **_kwargs: _AuthClient(response, calls),
    )
    backend_auth.reset_auth_cache()
    return calls


class _RaisingAuthClient:
    def __init__(self, exc: Exception, calls: list[dict[str, object]]) -> None:
        self._exc = exc
        self._calls = calls

    def __enter__(self) -> _RaisingAuthClient:
        return self

    def __exit__(self, *_exc: object) -> None:
        return None

    def get(self, url: str, headers: dict[str, str]) -> object:
        self._calls.append({"url": url, "headers": dict(headers)})
        raise self._exc


def _patch_openhands_user_me_request_error(
    monkeypatch, exc: Exception
) -> list[dict[str, object]]:
    calls: list[dict[str, object]] = []
    monkeypatch.setattr(
        backend_auth.httpx,
        "Client",
        lambda *_args, **_kwargs: _RaisingAuthClient(exc, calls),
    )
    backend_auth.reset_auth_cache()
    return calls


def test_dashboard_key_routes_reject_spoofed_owner_without_token(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH")

    client = TestClient(app)
    response = client.get(
        "/api/user/key", headers={"X-Owner-Id": "attacker@example.com"}
    )

    assert response.status_code == 401
    assert "Sign in" in response.json()["detail"]


def test_dashboard_key_routes_accept_openhands_bearer_token(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("INTHUB_OPENHANDS_BASE_URL", "https://staging.all-hands.dev")
    calls = _patch_openhands_user_me(
        monkeypatch,
        {
            "id": "user-1",
            "org_id": "org-1",
            "email": "User@Example.com",
            "role": "member",
            "permissions": [],
        },
    )

    client = TestClient(app)
    response = client.get(
        "/api/user/agent-key",
        headers={"Authorization": "Bearer valid-openhands-token"},
    )

    assert response.status_code == 200
    assert response.json()["ownerId"] == "user-1:org-1"
    assert calls == [
        {
            "url": "https://staging.all-hands.dev/api/v1/users/me",
            "headers": {"Authorization": "Bearer valid-openhands-token"},
        }
    ]


def test_auth_session_reports_openhands_admin_flag(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("INTHUB_OPENHANDS_BASE_URL", "https://staging.all-hands.dev")
    config_env("INTHUB_APP_ADMIN_EMAILS", "admin@example.com")
    _patch_openhands_user_me(
        monkeypatch,
        {
            "id": "admin-1",
            "org_id": "org-1",
            "email": "Admin@Example.com",
            "role": "owner",
            "permissions": ["manage_items"],
        },
    )

    client = TestClient(app)
    response = client.get(
        "/api/auth/session",
        headers={"Authorization": "Bearer admin-openhands-token"},
    )

    assert response.status_code == 200
    assert response.json()["user"] == {
        "id": "admin-1",
        "name": "admin@example.com",
        "email": "admin@example.com",
        "ownerId": "admin-1:org-1",
        "orgId": "org-1",
        "orgName": None,
        "role": "owner",
        "permissions": ["manage_items"],
        "isAdmin": True,
    }


def test_personal_org_normalizes_to_null_and_uses_env_admins(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("INTHUB_OPENHANDS_BASE_URL", "https://staging.all-hands.dev")
    config_env("INTHUB_APP_ADMIN_EMAILS", "personal@example.com")
    _patch_openhands_user_me(
        monkeypatch,
        {
            "id": "user-personal",
            "org_id": "user-personal",
            "email": "Personal@Example.com",
            "role": "owner",
            "permissions": ["manage_items"],
        },
    )

    response = TestClient(app).get(
        "/api/auth/session", headers={"Authorization": "Bearer personal-token"}
    )

    assert response.status_code == 200
    assert response.json()["user"]["ownerId"] == "user-personal:null"
    assert response.json()["user"]["orgId"] is None
    assert response.json()["user"]["isAdmin"] is True


def test_personal_org_owner_is_not_admin_without_env_allowlist(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("INTHUB_OPENHANDS_BASE_URL", "https://staging.all-hands.dev")
    config_env("INTHUB_APP_ADMIN_EMAILS")
    _patch_openhands_user_me(
        monkeypatch,
        {
            "id": "user-personal",
            "org_id": "user-personal",
            "email": "Personal@Example.com",
            "role": "owner",
            "permissions": ["manage_items"],
        },
    )

    response = TestClient(app).get(
        "/api/admin/overview", headers={"Authorization": "Bearer personal-token"}
    )

    assert response.status_code == 403


def test_non_null_org_member_is_not_admin(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("INTHUB_OPENHANDS_BASE_URL", "https://staging.all-hands.dev")
    _patch_openhands_user_me(
        monkeypatch,
        {
            "id": "user-1",
            "org_id": "org-1",
            "email": "User@Example.com",
            "role": "member",
            "permissions": [],
        },
    )

    response = TestClient(app).get(
        "/api/admin/overview", headers={"Authorization": "Bearer member-token"}
    )

    assert response.status_code == 403


def test_x_org_id_is_forwarded_and_varies_auth_cache(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("INTHUB_OPENHANDS_BASE_URL", "https://staging.all-hands.dev")
    calls = _patch_openhands_user_me(
        monkeypatch,
        {
            "id": "user-1",
            "org_id": "org-1",
            "email": "User@Example.com",
            "role": "admin",
            "permissions": [],
        },
    )
    client = TestClient(app)

    first = client.get(
        "/api/auth/session",
        headers={"Authorization": "Bearer token", "X-Org-Id": "org-1"},
    )
    second = client.get(
        "/api/auth/session",
        headers={"Authorization": "Bearer token", "X-Org-Id": "org-2"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert calls == [
        {
            "url": "https://staging.all-hands.dev/api/v1/users/me",
            "headers": {"Authorization": "Bearer token", "X-Org-Id": "org-1"},
        },
        {
            "url": "https://staging.all-hands.dev/api/v1/users/me",
            "headers": {"Authorization": "Bearer token", "X-Org-Id": "org-2"},
        },
    ]


def test_auth_session_returns_503_on_transient_network_error(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    """A network blip reaching OpenHands Cloud must surface 503, not 401.

    Regression for #295: previously a transient RequestError collapsed to
    None and the dashboard returned 401, which made the frontend delete the
    stored long-lived API key and force a re-login.
    """
    config_env("INTHUB_DISABLE_AUTH")
    config_env("INTHUB_OPENHANDS_BASE_URL", "https://staging.all-hands.dev")
    _patch_openhands_user_me_request_error(
        monkeypatch, httpx.ConnectError("DNS not ready")
    )

    response = TestClient(app).get(
        "/api/auth/session", headers={"Authorization": "Bearer still-valid-token"}
    )

    assert response.status_code == 503
    assert "temporarily unavailable" in response.json()["detail"].lower()


def test_dashboard_route_returns_503_on_openhands_5xx(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    """A 5xx from OpenHands Cloud is infra, not an invalid token -> 503."""
    config_env("INTHUB_DISABLE_AUTH")
    config_env("INTHUB_OPENHANDS_BASE_URL", "https://staging.all-hands.dev")
    _patch_openhands_user_me(
        monkeypatch,
        {"id": "user-1", "email": "user@example.com"},
        status_code=503,
    )

    response = TestClient(app).get(
        "/api/user/key", headers={"Authorization": "Bearer still-valid-token"}
    )

    assert response.status_code == 503


def test_auth_session_returns_401_on_invalid_token(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    """A genuine 401/403 from OpenHands Cloud must still clear the session (401)."""
    config_env("INTHUB_DISABLE_AUTH")
    config_env("INTHUB_OPENHANDS_BASE_URL", "https://staging.all-hands.dev")
    _patch_openhands_user_me(monkeypatch, {"error": "invalid_token"}, status_code=401)

    response = TestClient(app).get(
        "/api/auth/session", headers={"Authorization": "Bearer revoked-token"}
    )

    assert response.status_code == 401


def test_auth_config_reports_openhands_base_url(config_env: ConfigEnvFixture) -> None:
    config_env("INTHUB_OPENHANDS_BASE_URL", "https://staging.all-hands.dev")

    response = TestClient(app).get("/api/auth/config")

    assert response.status_code == 200
    assert response.json() == {"openhandsBaseUrl": "https://staging.all-hands.dev"}


def test_auth_disabled_rejects_non_loopback_hosts(config_env: ConfigEnvFixture) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")

    response = TestClient(app).get(
        "/api/auth/session",
        headers={"host": "integrations.example.com", "x-owner-id": "user@example.com"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "INTHUB_DISABLE_AUTH is only allowed for localhost development."
    )


def test_user_key_reveal_returns_metadata_when_stored_key_cannot_be_decrypted(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_POSTGRES_URL", "postgres://test")

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


def test_admin_privileges_fail_closed_without_allowlist(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_APP_ADMIN_EMAILS")
    client = TestClient(app)

    response = client.post(
        "/api/admin/key",
        headers={
            "X-Owner-Id": "admin@example.com",
        },
    )

    assert response.status_code == 403


def test_admin_api_routes_accept_auth_disabled_admin_owner(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_APP_ADMIN_EMAILS", "admin@example.com")
    client = TestClient(app)

    response = client.get(
        "/api/admin/overview",
        headers={
            "X-Owner-Id": "Admin@Example.com",
        },
    )

    assert response.status_code == 200
    assert "duplicateExternalAccounts" in response.json()


def test_admin_api_routes_reject_auth_disabled_non_admin_owner(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_APP_ADMIN_EMAILS", "admin@example.com")
    client = TestClient(app)

    response = client.get(
        "/api/admin/overview",
        headers={
            "X-Owner-Id": "user@example.com",
        },
    )

    assert response.status_code == 403
    assert (
        response.json()["detail"] == "Only app administrators can use admin API routes."
    )


def test_admin_api_key_authorizes_admin_routes(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_APP_ADMIN_EMAILS", "admin@example.com")
    client = TestClient(app)
    repository.save_key("admin@example.com", "admin", "clad_test_admin_key")

    response = client.get(
        "/api/admin/overview",
        headers={"Authorization": "Bearer clad_test_admin_key"},
    )

    assert response.status_code == 200
    assert "duplicateExternalAccounts" in response.json()


def test_non_admin_dashboard_routes_reject_privileged_api_calls_in_dev_mode(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_APP_ADMIN_EMAILS", "admin@example.com")
    client = TestClient(app)
    user_headers = {
        "X-Owner-Id": "user@example.com",
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
    assert (
        client.post(
            "/api/integrations", headers=user_headers, json=raw_integration
        ).status_code
        == 403
    )

    default_managed_save = client.post(
        "/api/integrations",
        headers=user_headers,
        json={
            "key": "ordinal",
            "name": "Ordinal",
            "kind": "mcp",
            "provider": "mcp",
            "authStrategy": "bearer",
            "config": {"managedConnectorSlug": "ordinal"},
            "credentials": {"accessToken": "ordinal-token"},
            "tools": {},
        },
    )
    assert default_managed_save.status_code == 404
    assert "admin must" in default_managed_save.json()["detail"].lower()

    admin_added_managed_save = client.post(
        "/api/integrations",
        headers=user_headers,
        json={
            "key": "sample",
            "name": "Sample",
            "kind": "api",
            "provider": "http",
            "authStrategy": "none",
            "config": {"managedConnectorSlug": "sample"},
            "credentials": {},
            "tools": {},
        },
    )
    assert admin_added_managed_save.status_code == 200

    raw_discovery = client.post(
        "/api/integrations/discover",
        headers=user_headers,
        json={
            "kind": "mcp",
            "key": "raw",
            "config": {"serverUrl": "https://mcp.example.com/mcp"},
        },
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
    assert (
        client.post(
            "/api/managed-connectors/sample/functions", headers=user_headers, json=[]
        ).status_code
        == 403
    )
    assert (
        client.delete(
            "/api/managed-connectors/sample", headers=user_headers
        ).status_code
        == 403
    )


def test_admin_dashboard_routes_allow_privileged_api_calls_in_dev_mode(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_APP_ADMIN_EMAILS", "admin@example.com")
    client = TestClient(app)
    admin_headers = {
        "X-Owner-Id": "admin@example.com",
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
        lambda _url, _auth_strategy: [
            ManagedConnectorTool(name="lookup", description="Lookup")
        ],
    )

    assert client.post("/api/admin/key", headers=admin_headers).status_code == 200
    assert (
        client.post(
            "/api/managed-connectors", headers=admin_headers, json=connector
        ).status_code
        == 200
    )
    functions_response = client.post(
        "/api/managed-connectors/sample/functions",
        headers=admin_headers,
    )
    assert functions_response.status_code == 200
    assert functions_response.json()["tools"][0]["name"] == "lookup"
    assert (
        client.delete(
            "/api/managed-connectors/sample", headers=admin_headers
        ).status_code
        == 200
    )


def test_default_managed_connectors_are_listed_and_require_credentials(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)

    # User-facing list: only connectors an admin has explicitly registered are
    # available to users. With no admin-added connectors, the user list is
    # empty — catalog defaults (including API-token/bearer/none MCP servers)
    # are NOT surfaced to users until an admin adds them.
    connectors = client.get("/api/integrations/managed-connectors").json()
    assert connectors == []

    # The catalog still lists every entry so an admin can browse and add any
    # provider (OAuth or MCP).
    catalog = client.get("/api/integrations/catalog").json()
    catalog_by_slug = {entry["slug"]: entry for entry in catalog}
    assert len(catalog_by_slug) > 13
    assert (
        catalog_by_slug["cloudflare-docs"]["logoUrl"]
        == "https://cdn.simpleicons.org/cloudflare/FFFFFF"
    )
    # Linear is MCP/bearer in 0.7.0; it is in the catalog but not in the user
    # list until an admin adds it.
    assert "linear" in catalog_by_slug
    assert catalog_by_slug["linear"]["connectionDefaults"]["authStrategy"] == "bearer"

    # An admin adding a bearer MCP connector (ordinal) makes it available to
    # users with its credential requirements.
    repository.save_managed_connector(
        ManagedConnector(
            slug="ordinal",
            name="Ordinal",
            description="Ordinal",
            authStrategy="bearer",
            provider="mcp",
            serverUrl="https://app.tryordinal.com/mcp",
            credentialLabel="Ordinal API key",
            credentialPlaceholder="Paste your Ordinal API key",
            credentialHelp="API key for Ordinal.",
        )
    )
    listed = client.get("/api/integrations/managed-connectors").json()
    by_slug = {connector["slug"]: connector for connector in listed}
    assert "ordinal" in by_slug
    assert by_slug["ordinal"]["authStrategy"] == "bearer"

    # A disabled admin-added connector is not surfaced to users.
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
        json={
            "kind": "managed",
            "key": "ordinal",
            "credentials": {"accessToken": "token"},
        },
    )
    assert disabled_discovery.status_code == 404
    repository.managed_connectors.clear()

    # A user cannot discover a catalog-default managed connector that an admin
    # has not added — the gate returns 404 before credential validation.
    missing_credential = client.post(
        "/api/integrations/discover",
        json={"kind": "managed", "key": "ordinal", "credentials": {}},
    )
    assert missing_credential.status_code == 404
    assert "admin must" in missing_credential.json()["detail"].lower()

    not_added_oauth = client.post(
        "/api/integrations/discover",
        json={"kind": "managed", "key": "datadog", "credentials": {}},
    )
    assert not_added_oauth.status_code == 404
    assert "admin must" in not_added_oauth.json()["detail"].lower()

    # After an admin adds datadog WITHOUT configuring OAuth, discovery reaches
    # the OAuth-config check and returns 403 (not the 404 admin-added gate).
    repository.save_managed_connector(
        ManagedConnector(
            slug="datadog",
            name="Datadog",
            description="Datadog",
            authStrategy="oauth2",
            provider="mcp",
        )
    )
    unconfigured_oauth = client.post(
        "/api/integrations/discover",
        json={"kind": "managed", "key": "datadog", "credentials": {}},
    )
    assert unconfigured_oauth.status_code == 403
    assert (
        "Datadog needs an admin to configure OAuth"
        in unconfigured_oauth.json()["detail"]
    )


def test_managed_connector_function_indexing_generates_tools_and_preserves_access(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
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
            tools=[
                ManagedConnectorTool(name="list_items", accessMode="approval_required")
            ],
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


def test_managed_http_openapi_discovery_and_multipart_invocation(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
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
                                {
                                    "name": "fileId",
                                    "in": "path",
                                    "required": True,
                                    "schema": {"type": "string"},
                                },
                                {
                                    "name": "purpose",
                                    "in": "query",
                                    "schema": {"type": "string"},
                                },
                            ],
                            "requestBody": {
                                "required": True,
                                "content": {
                                    "multipart/form-data": {
                                        "schema": {"type": "object"}
                                    }
                                },
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
            json={
                "kind": "managed",
                "key": "upload-api",
                "credentials": {"secret": "secret-token"},
            },
        )
        assert discovered.status_code == 200
        integration = discovered.json()
        assert integration["credentials"] == {
            "headerName": "x-test-key",
            "secret": "secret-token",
        }
        assert (
            integration["tools"]["upload_file"]["config"]["request"]["contentType"]
            == "multipart_form_data"
        )

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


def test_generated_openapi_documents_include_route_details(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)

    user_key = client.post("/api/user/key").json()["apiKey"]
    user_doc = client.get(
        "/api/user/openapi", headers={"Authorization": f"Bearer {user_key}"}
    ).json()
    managed_doc = client.get("/api/managed-connectors/openapi").json()

    assert user_doc["security"] == [{"UserApiKey": []}]
    assert (
        user_doc["paths"]["/api/user/integrations"]["post"]["summary"]
        == "Install an owner integration"
    )
    functions_doc = managed_doc["paths"]["/api/managed-connectors/{slug}/functions"][
        "post"
    ]
    assert functions_doc["summary"] == "Index connector tool definitions"
    assert "requestBody" not in functions_doc


def test_mcp_tools_expose_input_schema_and_strip_context_arguments(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
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
                    "request": {
                        "path": "/records/{{recordId}}",
                        "query": {"expand": "{{expand}}"},
                    },
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
    assert "scopes" in tool_schema["properties"]
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
                    "scopes": ["schema.read"],
                    "agentId": "agent-1",
                },
            },
        },
    )

    assert call_response.status_code == 200
    text = call_response.json()["result"]["content"][0]["text"]
    assert json.loads(text) == {"payload": {"recordId": "abc", "expand": True}}


def test_mcp_approval_required_error_includes_approval_link_and_request_id(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    integration = {
        "key": "approval-mcp",
        "name": "Approval MCP",
        "kind": "api",
        "provider": "mock",
        "authStrategy": "none",
        "tools": {
            "write": {
                "name": "write",
                "description": "Write data",
                "accessMode": "approval_required",
                "executionMode": "mock",
                "mockResponse": {"ok": True},
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
            "params": {
                "name": "approval-mcp__write",
                "arguments": {
                    "contextAgentId": "agent-1",
                    "contextAgentClass": "developer",
                },
            },
        },
    )

    assert response.status_code == 200
    message = response.json()["error"]["message"]
    assert "Human approval is required before calling this tool." in message
    assert "http://testserver/case-by-case-approvals" in message
    requests = client.get("/api/case-by-case-approvals").json()
    assert len(requests) == 1
    assert requests[0]["id"] in message
    assert requests[0]["toolName"] == "write"


def test_mcp_tool_call_returns_downstream_result(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    calls: list[dict[str, object]] = []

    class FakeMcpClient:
        def __init__(self, **_: object) -> None:
            pass

        def __enter__(self) -> FakeMcpClient:
            return self

        def __exit__(self, *_: object) -> None:
            return None

        def post(
            self, url: str, headers: dict[str, str], json: dict[str, object]
        ) -> httpx.Response:
            calls.append({"url": url, "headers": headers, "json": json})
            method = json.get("method")
            if method == "initialize":
                return httpx.Response(
                    200,
                    headers={
                        "content-type": "application/json",
                        "mcp-session-id": "session-1",
                    },
                    json={
                        "jsonrpc": "2.0",
                        "id": 1,
                        "result": {"protocolVersion": "2025-11-25"},
                    },
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
                        "content": [
                            {"type": "text", "text": "actual downstream result"}
                        ],
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
    assert [call["json"]["method"] for call in calls] == [
        "initialize",
        "notifications/initialized",
        "tools/call",
    ]
    tool_call = calls[-1]
    assert tool_call["url"] == "https://downstream.example/mcp"
    assert tool_call["headers"]["Authorization"] == "Bearer provider-token"
    assert tool_call["headers"]["mcp-session-id"] == "session-1"
    assert tool_call["json"]["params"] == {
        "name": "remote_lookup",
        "arguments": {"query": "hello"},
    }


def test_approval_creates_temporary_grant_that_allows_invocation(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
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
        json={
            "agentId": "agent-1",
            "agentClass": "reviewer",
            "scopes": [],
            "payload": {},
        },
    )
    assert denied.status_code == 403
    requests = client.get("/api/case-by-case-approvals").json()
    assert len(requests) == 1
    assert requests[0]["status"] == "pending"
    assert requests[0]["channels"] == ["in_app"]
    assert requests[0]["notificationTargets"] == {"in_app": "dev@localhost"}
    request_id = requests[0]["id"]

    grant = client.post(
        f"/api/case-by-case-approvals/{request_id}/approve",
        json={"durationMinutes": 30},
    )
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
        json={
            "agentId": "agent-1",
            "agentClass": "reviewer",
            "scopes": [],
            "payload": {},
        },
    )
    assert allowed.status_code == 200
    assert allowed.json()["data"] == {"ok": True}


def test_case_by_case_approvals_are_scoped_by_in_app_notification_target(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
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
    repository.access_requests.setdefault("all", {})["req-agent-data-owner"] = (
        AccessRequest(
            id="req-agent-data-owner",
            integrationKey="approval-demo",
            toolName="lookup",
            agentData={"ownerId": "dev@localhost"},
            status="pending",
        )
    )

    requests = client.get("/api/case-by-case-approvals").json()

    assert [request["id"] for request in requests] == ["req-approved"]
    assert requests[0]["status"] == "approved"


def test_case_by_case_approvals_accept_user_api_key(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_APP_ADMIN_EMAILS", "owner-a@example.com")
    client = TestClient(app)
    owner_a = {"X-Owner-Id": "owner-a@example.com"}
    user_key = client.post("/api/user/key", headers=owner_a).json()["apiKey"]

    repository.access_requests.setdefault("owner-a@example.com", {})["req-key"] = (
        AccessRequest(
            id="req-key",
            agentId="agent-1",
            agentClass="reviewer",
            integrationKey="approval-demo",
            toolName="lookup",
            channels=["in_app"],
            notificationTargets={"in_app": "owner-a@example.com"},
            status="pending",
        )
    )

    key_headers = {"Authorization": f"Bearer {user_key}"}
    listed = client.get("/api/case-by-case-approvals", headers=key_headers).json()
    assert [request["id"] for request in listed] == ["req-key"]

    assert (
        client.post(
            "/api/case-by-case-approvals/req-key/approve", headers=key_headers
        ).status_code
        == 200
    )

    invalid = client.get(
        "/api/case-by-case-approvals",
        headers={"Authorization": "Bearer not-a-real-user-key"},
    )
    assert invalid.status_code == 401


def test_case_by_case_approvals_accept_openhands_cloud_bearer_token(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH")
    config_env("INTHUB_OPENHANDS_BASE_URL", "https://staging.all-hands.dev")
    _patch_openhands_user_me(
        monkeypatch,
        {
            "id": "user-1",
            "org_id": "org-1",
            "email": "User@Example.com",
            "role": "member",
            "permissions": [],
        },
    )
    client = TestClient(app)
    owner = "user-1:org-1"
    repository.access_requests.setdefault(owner, {})["req-cloud"] = AccessRequest(
        id="req-cloud",
        agentId="agent-1",
        agentClass="reviewer",
        integrationKey="approval-demo",
        toolName="lookup",
        channels=["in_app"],
        notificationTargets={"in_app": owner},
        status="pending",
    )

    cloud_headers = {"Authorization": "Bearer valid-openhands-token"}
    listed = client.get("/api/case-by-case-approvals", headers=cloud_headers).json()
    assert [request["id"] for request in listed] == ["req-cloud"]

    assert (
        client.post(
            "/api/case-by-case-approvals/req-cloud/approve",
            headers=cloud_headers,
        ).status_code
        == 200
    )


def test_disable_unused_tools_uses_invocation_history(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    client = TestClient(app)
    integration = {
        "key": "usage-demo",
        "name": "Usage demo",
        "kind": "api",
        "provider": "mock",
        "authStrategy": "none",
        "tools": {
            "old": {
                "name": "old",
                "executionMode": "mock",
                "mockResponse": {"old": True},
            },
            "never": {
                "name": "never",
                "executionMode": "mock",
                "mockResponse": {"never": True},
            },
        },
    }
    assert client.post("/api/integrations", json=integration).status_code == 200
    saved = repository.get_integration("dev@localhost", "usage-demo")
    assert saved is not None
    repository.tool_invocations.append(
        {
            "ownerId": "dev@localhost",
            "integrationKey": "usage-demo",
            "toolName": "old",
            "outcome": "success",
            "invokedAt": "2020-01-01T00:00:00Z",
        }
    )

    response = client.post(
        "/api/integrations/disable-unused",
        json={"thresholdValue": 1, "thresholdUnit": "days"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["disabledCount"] == 1
    assert body["disabledTools"] == [
        {
            "integrationKey": "usage-demo",
            "toolName": "old",
            "lastInvokedAt": "2020-01-01T00:00:00Z",
        }
    ]
    updated = repository.get_integration("dev@localhost", "usage-demo")
    assert updated is not None
    assert updated.tools["old"].accessMode == "disabled"
    assert updated.tools["never"].accessMode == "enabled"


def test_raw_mcp_discovery_lists_remote_tools(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    calls: list[dict[str, object]] = []

    class FakeMcpDiscoveryClient:
        def __init__(self, **_: object) -> None:
            pass

        def __enter__(self) -> FakeMcpDiscoveryClient:
            return self

        def __exit__(self, *_: object) -> None:
            return None

        def post(
            self, url: str, headers: dict[str, str], json: dict[str, object]
        ) -> httpx.Response:
            calls.append({"url": url, "headers": headers, "json": json})
            method = json.get("method")
            if method == "initialize":
                return httpx.Response(
                    200,
                    headers={
                        "content-type": "application/json",
                        "mcp-session-id": "session-1",
                    },
                    json={
                        "jsonrpc": "2.0",
                        "id": 1,
                        "result": {"protocolVersion": "2025-11-25"},
                    },
                )
            if method == "notifications/initialized":
                return httpx.Response(202)
            assert method == "tools/list"
            return httpx.Response(
                200,
                headers={"content-type": "application/json"},
                json={
                    "jsonrpc": "2.0",
                    "id": 2,
                    "result": {
                        "tools": [
                            {
                                "name": "remote_tool",
                                "description": "Remote",
                                "inputSchema": {
                                    "type": "object",
                                    "properties": {"id": {"type": "string"}},
                                },
                            }
                        ]
                    },
                },
            )

    from backend.app import main as backend_main

    monkeypatch.setattr(backend_main.httpx, "Client", FakeMcpDiscoveryClient)
    client = TestClient(app)
    response = client.post(
        "/api/integrations/discover",
        json={
            "kind": "mcp",
            "key": "remote",
            "name": "Remote",
            "config": {"serverUrl": "https://remote.example/mcp"},
            "credentials": {"accessToken": "token"},
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["authStrategy"] == "bearer"
    assert (
        body["tools"]["remote_tool"]["config"]["inputSchema"]["properties"]["id"][
            "type"
        ]
        == "string"
    )
    assert calls[-1]["headers"]["Authorization"] == "Bearer token"


def test_oauth_catalog_and_admin_overview_are_data_driven(
    config_env: ConfigEnvFixture, monkeypatch
) -> None:
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-credential-key")
    client = TestClient(app)
    catalog = client.get("/api/integrations/catalog").json()
    assert {item["slug"] for item in catalog} >= {
        "github",
        "slack",
        "notion",
        "hubspot",
        "elevenlabs",
        "ordinal",
    }

    repository.save_connection(
        "owner-a@example.com",
        "slack-a",
        "slack",
        "oauth2",
        {"accessToken": "a"},
        {"externalAccountId": "same", "displayName": "A"},
    )
    repository.save_connection(
        "owner-b@example.com",
        "slack-b",
        "Slack",
        "oauth2",
        {"accessToken": "b"},
        {"externalAccountId": "SAME", "displayName": "B"},
    )
    admin_key = client.post(
        "/api/admin/key", headers={"X-Owner-Id": "admin@example.com"}
    ).json()["apiKey"]
    overview = client.get(
        "/api/admin/overview", headers={"Authorization": f"Bearer {admin_key}"}
    )
    assert overview.status_code == 200
    duplicates = overview.json()["duplicateExternalAccounts"]
    assert len(duplicates) == 1
    assert duplicates[0]["provider"] == "slack"
    assert sorted(duplicates[0]["owners"]) == [
        "owner-a@example.com",
        "owner-b@example.com",
    ]
