from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.models import ManagedConnector, ManagedConnectorTool
from backend.app.repository import repository
from backend.app.route_manifest import ROUTES


if TYPE_CHECKING:
    from conftest import ConfigEnvFixture

OWNER = "admin@example.com"
AGENT_KEY = "cla_test_agent_key"
USER_KEY = "clu_test_user_key"
ADMIN_KEY = "clad_test_admin_key"


@pytest.fixture(autouse=True)
def setup_test_env(config_env: ConfigEnvFixture):
    """Set up test environment before each test."""
    config_env("INTHUB_APP_ADMIN_EMAILS", OWNER)
    config_env("INTHUB_DISABLE_AUTH", "true")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-encryption-key-for-coverage")
    repository.integrations.clear()
    repository.access_requests.clear()
    repository.managed_connectors.clear()
    repository.agent_keys.clear()
    repository.user_keys.clear()
    repository.admin_keys.clear()
    repository.connections.clear()
    repository.oauth_states.clear()
    repository.temporary_grants.clear()
    repository.tool_invocations.clear()
    repository.profile_agent_keys.clear()

    repository.permission_profiles.clear()
    yield


def get_client() -> TestClient:
    """Get a fresh test client after config is set up."""
    return TestClient(app, raise_server_exceptions=False)


def sample_path(path: str) -> str:
    return (
        path.replace("{integrationKey}", "sample")
        .replace("{toolName}", "sample_tool")
        .replace("{requestId}", "req-sample")
        .replace("{slug}", "sample-connector")
        .replace("{provider}", "sample")
        .replace("{profileId}", "profile-sample")
        .replace("{agentClass}", "developer")
    )


def seed_state(client: TestClient) -> None:
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
    if route_path.startswith("/api/user/") and route_path not in {
        "/api/user/key",
        "/api/user/agent-key",
    }:
        return {"X-Owner-Id": OWNER, "Authorization": f"Bearer {USER_KEY}"}
    if (
        route_path.startswith("/api/context")
        or route_path.startswith("/api/agent")
        or route_path == "/api/mcp"
    ):
        return {"X-Owner-Id": OWNER, "Authorization": f"Bearer {AGENT_KEY}"}
    return {"X-Owner-Id": OWNER}


def body_for(path: str) -> object:
    if path.endswith("/functions"):
        return [
            {
                "name": "sample_tool",
                "description": "Sample tool",
                "accessMode": "enabled",
            }
        ]
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
        return {
            "name": "sample_tool",
            "description": "Sample tool",
            "accessMode": "enabled",
        }
    if path.endswith("/discover"):
        return {
            "kind": "managed",
            "key": "sample",
            "name": "Sample",
            "managedConnectorSlug": "sample-connector",
        }
    if path.endswith("/toggle"):
        return {"enabled": False}
    if path.endswith("/approve"):
        return {"durationMinutes": 60}
    if path.endswith("/reject"):
        return {}
    if path in {
        "/api/integrations",
        "/api/user/integrations",
    }:
        return {
            "key": "sample",
            "name": "Sample",
            "kind": "api",
            "provider": "mock",
            "authStrategy": "none",
            "tools": {},
        }
    if path in {
        "/api/agent/{integrationKey}/{toolName}",
        "/api/context/{integrationKey}/{toolName}",
    }:
        return {"payload": {}, "scopes": []}
    if path == "/api/mcp":
        return {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
    return {}


def test_all_original_manifest_routes_are_implemented_without_server_errors() -> None:
    client = get_client()
    failures: list[tuple[str, str, int, str]] = []
    for method, route_path in ROUTES:
        seed_state(client)
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
    client = get_client()
    seed_state(client)

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


def test_mcp_initialized_notification_returns_no_jsonrpc_body() -> None:
    client = get_client()
    seed_state(client)

    response = client.post(
        "/api/mcp",
        headers={"X-Owner-Id": OWNER, "Authorization": f"Bearer {AGENT_KEY}"},
        json={"jsonrpc": "2.0", "method": "notifications/initialized"},
    )

    assert response.status_code == 202
    assert response.content == b""


def test_auth_routes_are_available() -> None:
    client = get_client()
    session_response = client.get("/api/auth/session", headers={"X-Owner-Id": OWNER})
    assert session_response.status_code == 200
    assert session_response.json()["user"]["email"] == OWNER

    config_response = client.get("/api/auth/config")
    assert config_response.status_code == 200
    assert "openhandsBaseUrl" in config_response.json()


def test_context_and_mcp_require_valid_agent_api_key() -> None:
    client = get_client()
    repository.agent_keys.clear()
    response = client.post(
        "/api/context/sample/sample_tool", json={"payload": {}, "scopes": []}
    )
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


def test_admin_api_key_can_reindex_managed_connector_tools(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The admin API key must be able to trigger tool re-indexing, and the
    indexed OpenAPI inputSchema must be persisted so MCP clients know which
    tools require a request body."""
    from backend.app import main as main_module

    slug = "notion-write"
    repository.save_key(OWNER, "admin", ADMIN_KEY)
    repository.save_managed_connector(
        ManagedConnector(
            slug=slug,
            name="Notion (write)",
            description="Notion HTTP connector",
            provider="http",
            authStrategy="bearer",
            openApiUrl="https://example.com/openapi.json",
            credentialLabel="Token",
            credentialPlaceholder="Token",
            credentialHelp="Token",
            tools=[
                ManagedConnectorTool(
                    name="create_page",
                    description="Create a page",
                    accessMode="enabled",
                    request={"method": "POST", "path": "/v1/pages"},
                )
            ],
        )
    )
    before = repository.get_managed_connector(slug)
    assert before is not None
    stale_updated_at = before.updatedAt
    assert not before.tools[0].config.get("inputSchema")

    def fake_generate_openapi_tools(open_api_url: str, auth_strategy: str):
        return [
            ManagedConnectorTool(
                name="create_page",
                description="Create a page",
                accessMode="enabled",
                request={"method": "POST", "path": "/v1/pages", "body": "{{body}}"},
                config={
                    "inputSchema": {
                        "type": "object",
                        "properties": {"body": {"type": "object"}},
                        "required": ["body"],
                    }
                },
            )
        ]

    monkeypatch.setattr(
        main_module, "generate_openapi_tools", fake_generate_openapi_tools
    )

    client = get_client()
    response = client.post(
        f"/api/admin/managed-connectors/{slug}/functions",
        headers={"Authorization": f"Bearer {ADMIN_KEY}", "X-Owner-Id": OWNER},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    tools = body.get("tools", [])
    assert tools, "re-index should return at least one tool"
    create_page = next(tool for tool in tools if tool["name"] == "create_page")
    input_schema = create_page.get("config", {}).get("inputSchema")
    assert input_schema is not None, "inputSchema must be populated by re-index"
    assert "body" in input_schema.get("required", [])

    persisted = repository.get_managed_connector(slug)
    assert persisted is not None
    assert persisted.tools[0].config.get("inputSchema") is not None
    assert persisted.updatedAt != stale_updated_at


def test_admin_api_key_reindex_rejects_non_admin_key() -> None:
    """A non-admin (agent/user) API key must not be able to re-index tools."""
    repository.save_key(OWNER, "agent", AGENT_KEY)
    slug = "notion-write"
    repository.save_managed_connector(
        ManagedConnector(
            slug=slug,
            name="Notion (write)",
            description="Notion HTTP connector",
            provider="http",
            authStrategy="bearer",
            openApiUrl="https://example.com/openapi.json",
            credentialLabel="Token",
            credentialPlaceholder="Token",
            credentialHelp="Token",
            tools=[],
        )
    )
    client = get_client()
    response = client.post(
        f"/api/admin/managed-connectors/{slug}/functions",
        headers={"Authorization": f"Bearer {AGENT_KEY}", "X-Owner-Id": OWNER},
    )
    assert response.status_code in {401, 403}


def test_save_http_oauth_connector_indexes_full_tool_set(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Saving an HTTP OAuth connector with an OpenAPI URL must load every tool
    the schema exposes, not just the catalog's single defaultTool. This is the
    admin-integrations "Save changes" path: previously it persisted whatever
    tools the client sent (often one default tool or an empty list) and the
    OAuth integration only ever exposed that one tool.
    """
    from backend.app import main as main_module

    repository.save_key(OWNER, "admin", ADMIN_KEY)

    def fake_generate_openapi_tools(open_api_url: str, auth_strategy: str):
        return [
            ManagedConnectorTool(
                name="list_pages",
                description="List pages",
                accessMode="enabled",
                request={"method": "GET", "path": "/v1/pages"},
            ),
            ManagedConnectorTool(
                name="create_page",
                description="Create a page",
                accessMode="enabled",
                request={"method": "POST", "path": "/v1/pages"},
            ),
            ManagedConnectorTool(
                name="search",
                description="Search the workspace",
                accessMode="enabled",
                request={"method": "POST", "path": "/v1/search"},
            ),
        ]

    monkeypatch.setattr(
        main_module, "generate_openapi_tools", fake_generate_openapi_tools
    )

    client = get_client()
    response = client.post(
        "/api/managed-connectors",
        headers={"Authorization": f"Bearer {ADMIN_KEY}", "X-Owner-Id": OWNER},
        json={
            "slug": "notion",
            "name": "Notion",
            "description": "Notion HTTP OAuth connector",
            "categories": ["Knowledge base"],
            "authModes": ["oauth2"],
            "authStrategy": "oauth2",
            "provider": "http",
            "apiBaseUrl": "https://api.notion.com",
            "openApiUrl": "https://developers.notion.com/openapi.json",
            "oauthConfigured": True,
            "oauthClientId": "notion-client-id",
            "oauthClientSecret": "notion-client-secret",
            "oauthConfig": {
                "authorizationUrl": "https://api.notion.com/v1/oauth/authorize",
                "tokenUrl": "https://api.notion.com/v1/oauth/token",
                "scopes": [],
            },
            "credentialLabel": "Connect Notion",
            "credentialPlaceholder": "Connect Notion",
            "credentialHelp": "Connect Notion with OAuth.",
            # Client sends only the single defaultTool (the buggy state).
            "tools": [
                {
                    "name": "post_search",
                    "description": "Search pages and databases.",
                    "defaultScopes": [],
                    "accessMode": "enabled",
                    "request": {"method": "POST", "path": "/v1/search"},
                }
            ],
            "enabled": True,
        },
    )

    assert response.status_code == 200, response.text
    tools = response.json().get("tools", [])
    tool_names = sorted(tool["name"] for tool in tools)
    assert tool_names == ["create_page", "list_pages", "search"], tool_names
    persisted = repository.get_managed_connector("notion")
    assert persisted is not None
    assert sorted(tool.name for tool in persisted.tools) == [
        "create_page",
        "list_pages",
        "search",
    ]


def test_save_http_oauth_connector_preserves_existing_access_modes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Re-saving a previously indexed HTTP OAuth connector must keep the
    admin's per-tool access mode choices (by tool name) instead of resetting
    them back to the schema defaults."""
    from backend.app import main as main_module

    repository.save_key(OWNER, "admin", ADMIN_KEY)
    repository.save_managed_connector(
        ManagedConnector(
            slug="notion",
            name="Notion",
            description="Notion HTTP OAuth connector",
            provider="http",
            authStrategy="oauth2",
            apiBaseUrl="https://api.notion.com",
            openApiUrl="https://developers.notion.com/openapi.json",
            oauthConfigured=True,
            credentialLabel="Connect Notion",
            credentialPlaceholder="Connect Notion",
            credentialHelp="Connect Notion with OAuth.",
            oauthConfig={
                "authorizationUrl": "https://api.notion.com/v1/oauth/authorize",
                "tokenUrl": "https://api.notion.com/v1/oauth/token",
                "scopes": [],
            },
            tools=[
                ManagedConnectorTool(
                    name="create_page",
                    description="Create a page",
                    accessMode="approval_required",
                    request={"method": "POST", "path": "/v1/pages"},
                ),
                ManagedConnectorTool(
                    name="list_pages",
                    description="List pages",
                    accessMode="disabled",
                    request={"method": "GET", "path": "/v1/pages"},
                ),
            ],
        )
    )

    def fake_generate_openapi_tools(open_api_url: str, auth_strategy: str):
        return [
            ManagedConnectorTool(
                name="list_pages",
                description="List pages",
                accessMode="enabled",
                request={"method": "GET", "path": "/v1/pages"},
            ),
            ManagedConnectorTool(
                name="create_page",
                description="Create a page",
                accessMode="enabled",
                request={"method": "POST", "path": "/v1/pages"},
            ),
        ]

    monkeypatch.setattr(
        main_module, "generate_openapi_tools", fake_generate_openapi_tools
    )

    client = get_client()
    response = client.post(
        "/api/managed-connectors",
        headers={"Authorization": f"Bearer {ADMIN_KEY}", "X-Owner-Id": OWNER},
        json={
            "slug": "notion",
            "name": "Notion",
            "description": "Notion HTTP OAuth connector",
            "categories": ["Knowledge base"],
            "authModes": ["oauth2"],
            "authStrategy": "oauth2",
            "provider": "http",
            "apiBaseUrl": "https://api.notion.com",
            "openApiUrl": "https://developers.notion.com/openapi.json",
            "oauthConfigured": True,
            "oauthClientId": "notion-client-id",
            "oauthClientSecret": "notion-client-secret",
            "oauthConfig": {
                "authorizationUrl": "https://api.notion.com/v1/oauth/authorize",
                "tokenUrl": "https://api.notion.com/v1/oauth/token",
                "scopes": [],
            },
            "credentialLabel": "Connect Notion",
            "credentialPlaceholder": "Connect Notion",
            "credentialHelp": "Connect Notion with OAuth.",
            "tools": [],
            "enabled": True,
        },
    )

    assert response.status_code == 200, response.text
    tools = {tool["name"]: tool["accessMode"] for tool in response.json()["tools"]}
    assert tools["create_page"] == "approval_required"
    assert tools["list_pages"] == "disabled"


def test_default_http_oauth_connector_with_openapi_has_no_default_tool() -> None:
    """Default managed connectors come from the first connection option.

    In 0.7.0 the catalog is MCP-first:
    - Linear's first option is a hosted shttp MCP server, so it qualifies as a
      default managed MCP connector (tools discovered via tools/list).
    - Notion's first option is a stdio MCP server (local npx), which has no
      serverUrl and so is not a default managed connector.
    - ElevenLabs is HTTP-only with an openApiUrl, so it stays and ships 0 tools.
    """
    from backend.app.managed_connectors import (
        default_managed_connector,
        default_managed_connectors,
    )

    default_slugs = {connector.slug for connector in default_managed_connectors()}

    # Linear (shttp MCP) is a default managed connector.
    linear = default_managed_connector("linear")
    assert linear is not None
    assert linear.provider == "mcp"
    assert linear.serverUrl == "https://mcp.linear.app/mcp"
    assert linear.tools == []
    assert "linear" in default_slugs

    # Notion's first option is stdio MCP (no serverUrl), so it is not surfaced
    # as a default managed connector.
    assert default_managed_connector("notion") is None
    assert "notion" not in default_slugs

    # ElevenLabs is http with an openApiUrl, so it stays and ships 0 tools.
    elevenlabs = default_managed_connector("elevenlabs")
    assert elevenlabs is not None
    assert elevenlabs.provider == "http"
    assert elevenlabs.openApiUrl
    assert elevenlabs.tools == []


def test_sanitized_log_url_strips_query_and_fragment() -> None:
    """Re-index logging must never expose signed query strings or fragments."""
    from backend.app.main import _sanitized_log_url

    assert _sanitized_log_url(None) == "none"
    assert _sanitized_log_url("") == "none"
    assert _sanitized_log_url("not a url") == "private"
    assert (
        _sanitized_log_url("https://api.example.com/v1/openapi.json")
        == "https://api.example.com/v1/openapi.json"
    )
    assert (
        _sanitized_log_url("https://api.example.com/v1/openapi.json?token=secret")
        == "https://api.example.com/v1/openapi.json"
    )
    assert (
        _sanitized_log_url("https://api.example.com/v1/openapi.json#section")
        == "https://api.example.com/v1/openapi.json"
    )
    assert (
        _sanitized_log_url("https://user:pass@example.com/v1/openapi.json?token=secret")
        == "https://example.com/v1/openapi.json"
    )
    assert (
        _sanitized_log_url("https://user:pass@example.com:8080/v1/openapi.json")
        == "https://example.com:8080/v1/openapi.json"
    )
