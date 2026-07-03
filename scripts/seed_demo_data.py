#!/usr/bin/env python3
"""Seed a local Integrations Hub database with demo data for styling and QA.

Usage:
  cd integrations-hub
  set -a && source .env.local && set +a
  uv run --directory backend python ../scripts/seed_demo_data.py

Pass --reset to clear the demo owner's existing rows before seeding.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from fastapi.testclient import TestClient

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.config import reset_config
from backend.app.main import app
from backend.app.models import ManagedConnector, ManagedConnectorTool
from backend.app.repository import repository

DEMO_OWNER = os.getenv("FASTAPI_DEFAULT_OWNER", "dev@localhost").strip().lower() or "dev@localhost"


def _require_postgres() -> None:
    postgres_url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")
    if not postgres_url:
        raise SystemExit(
            "POSTGRES_URL or DATABASE_URL must be set. Copy .env.example to .env.local first."
        )


def _reset_demo_owner() -> None:
    statements = [
        ("DELETE FROM tool_invocations WHERE owner_id = %s", (DEMO_OWNER,)),
        (
            "DELETE FROM temporary_grants WHERE integration_key IN "
            "(SELECT key FROM owner_integrations WHERE owner_id = %s)",
            (DEMO_OWNER,),
        ),
        (
            "DELETE FROM access_requests WHERE notification_targets->>'in_app' = %s",
            (DEMO_OWNER,),
        ),
        ("DELETE FROM notifications WHERE recipient = %s", (DEMO_OWNER,)),
        ("DELETE FROM integration_connections WHERE owner_id = %s", (DEMO_OWNER,)),
        ("DELETE FROM oauth_states WHERE owner_id = %s", (DEMO_OWNER,)),
        ("DELETE FROM owner_integrations WHERE owner_id = %s", (DEMO_OWNER,)),
        ("DELETE FROM permission_profiles WHERE owner_id = %s", (DEMO_OWNER,)),
        ("DELETE FROM agent_api_keys WHERE owner_id = %s", (DEMO_OWNER,)),
        ("DELETE FROM user_api_keys WHERE owner_id = %s", (DEMO_OWNER,)),
        ("DELETE FROM admin_api_keys WHERE owner_id = %s", (DEMO_OWNER,)),
        ("DELETE FROM managed_connectors WHERE slug = %s", ("demo-http-connector",)),
    ]
    for query, params in statements:
        repository.execute_db(query, params)


def _seed_integrations(client: TestClient) -> None:
    integrations = [
        {
            "key": "github",
            "name": "GitHub",
            "kind": "api",
            "provider": "mock",
            "authStrategy": "bearer",
            "enabled": True,
            "fineGrainedPermissions": True,
            "config": {},
            "credentials": {"accessToken": "ghp_demo_token"},
            "tools": {
                "create_issue": {
                    "name": "create_issue",
                    "description": "Create a GitHub issue",
                    "enabled": True,
                    "accessMode": "enabled",
                    "fineGrainedPermissions": True,
                    "defaultScopes": ["repo"],
                    "executionMode": "mock",
                    "config": {},
                    "mockResponse": {"number": 42, "url": "https://github.com/demo/issues/42"},
                },
                "list_pull_requests": {
                    "name": "list_pull_requests",
                    "description": "List open pull requests",
                    "enabled": True,
                    "accessMode": "approval_required",
                    "fineGrainedPermissions": True,
                    "defaultScopes": ["repo"],
                    "executionMode": "mock",
                    "config": {},
                    "mockResponse": {"items": [{"id": 1, "title": "Demo PR"}]},
                },
                "create_pull_request": {
                    "name": "create_pull_request",
                    "description": "Open a pull request",
                    "enabled": True,
                    "accessMode": "approval_required",
                    "fineGrainedPermissions": True,
                    "defaultScopes": ["repo"],
                    "executionMode": "mock",
                    "config": {},
                    "mockResponse": {"number": 7, "url": "https://github.com/demo/pull/7"},
                },
                "delete_repository": {
                    "name": "delete_repository",
                    "description": "Delete a repository",
                    "enabled": False,
                    "accessMode": "disabled",
                    "fineGrainedPermissions": True,
                    "defaultScopes": ["admin:repo"],
                    "executionMode": "mock",
                    "config": {},
                },
            },
        },
        {
            "key": "slack",
            "name": "Slack",
            "kind": "mcp",
            "provider": "mock",
            "authStrategy": "oauth2",
            "enabled": True,
            "fineGrainedPermissions": True,
            "config": {"serverUrl": "https://mcp.example.com/slack"},
            "credentials": {},
            "tools": {
                "post_message": {
                    "name": "post_message",
                    "description": "Post a message to a channel",
                    "enabled": True,
                    "accessMode": "approval_required",
                    "fineGrainedPermissions": True,
                    "defaultScopes": ["chat:write"],
                    "executionMode": "mock",
                    "config": {},
                    "mockResponse": {"ok": True, "channel": "C123", "ts": "1710000000.000100"},
                }
            },
        },
        {
            "key": "notion",
            "name": "Notion",
            "kind": "api",
            "provider": "mock",
            "authStrategy": "bearer",
            "enabled": True,
            "fineGrainedPermissions": False,
            "config": {},
            "credentials": {"accessToken": "secret_demo_notion"},
            "tools": {
                "search_pages": {
                    "name": "search_pages",
                    "description": "Search workspace pages",
                    "enabled": True,
                    "accessMode": "enabled",
                    "fineGrainedPermissions": False,
                    "defaultScopes": [],
                    "executionMode": "mock",
                    "config": {},
                    "mockResponse": {"results": []},
                },
                "update_page": {
                    "name": "update_page",
                    "description": "Update a Notion page",
                    "enabled": True,
                    "accessMode": "approval_required",
                    "fineGrainedPermissions": False,
                    "defaultScopes": [],
                    "executionMode": "mock",
                    "config": {},
                    "mockResponse": {"updated": True},
                },
            },
        },
        {
            "key": "linear",
            "name": "Linear",
            "kind": "api",
            "provider": "mock",
            "authStrategy": "bearer",
            "enabled": True,
            "fineGrainedPermissions": True,
            "config": {},
            "credentials": {"accessToken": "lin_demo_token"},
            "tools": {
                "create_issue": {
                    "name": "create_issue",
                    "description": "Create a Linear issue",
                    "enabled": True,
                    "accessMode": "approval_required",
                    "fineGrainedPermissions": True,
                    "defaultScopes": ["issues:write"],
                    "executionMode": "mock",
                    "config": {},
                    "mockResponse": {"id": "LIN-42", "url": "https://linear.app/demo/issue/LIN-42"},
                }
            },
        },
        {
            "key": "custom-mcp",
            "name": "Custom MCP Server",
            "kind": "mcp",
            "provider": "mock",
            "authStrategy": "none",
            "enabled": True,
            "fineGrainedPermissions": False,
            "config": {"serverUrl": "https://mcp.example.com/custom"},
            "credentials": {},
            "tools": {
                "ping": {
                    "name": "ping",
                    "description": "Health check",
                    "enabled": True,
                    "accessMode": "enabled",
                    "fineGrainedPermissions": False,
                    "defaultScopes": [],
                    "executionMode": "mock",
                    "config": {},
                    "mockResponse": {"pong": True},
                }
            },
        },
    ]

    for integration in integrations:
        response = client.post("/api/integrations", json=integration)
        if response.status_code not in {200, 201}:
            raise RuntimeError(
                f"Failed to seed integration '{integration['key']}': "
                f"{response.status_code} {response.text}"
            )


def _seed_permission_profile(client: TestClient) -> None:
    response = client.post("/api/permission-profiles", json={"name": "Research"})
    if response.status_code not in {200, 201}:
        raise RuntimeError(
            f"Failed to seed permission profile: {response.status_code} {response.text}"
        )


def _invoke_approval_required(
    client: TestClient,
    agent_key: str,
    *,
    integration_key: str,
    tool_name: str,
    agent_id: str,
    agent_class: str,
    scopes: list[str],
    payload: dict | None = None,
) -> None:
    response = client.post(
        f"/api/context/{integration_key}/{tool_name}",
        headers={"Authorization": f"Bearer {agent_key}"},
        json={
            "agentId": agent_id,
            "agentClass": agent_class,
            "scopes": scopes,
            "payload": payload or {},
        },
    )
    if response.status_code != 403:
        raise RuntimeError(
            f"Expected approval-required invocation for {integration_key}/{tool_name} "
            f"({agent_id}), got {response.status_code}: {response.text}"
        )


def _seed_access_requests(client: TestClient) -> None:
    agent_key = client.get("/api/user/agent-key").json()["apiKey"]
    invocations = [
        {
            "integration_key": "github",
            "tool_name": "list_pull_requests",
            "agent_id": "research-agent",
            "agent_class": "developer",
            "scopes": ["repo"],
            "payload": {"state": "open"},
        },
        {
            "integration_key": "github",
            "tool_name": "create_pull_request",
            "agent_id": "coding-agent",
            "agent_class": "developer",
            "scopes": ["repo"],
            "payload": {"title": "Update permissions documentation"},
        },
        {
            "integration_key": "slack",
            "tool_name": "post_message",
            "agent_id": "research-agent",
            "agent_class": "assistant",
            "scopes": ["chat:write"],
            "payload": {"channel": "eng-releases", "text": "Deployment summary"},
        },
        {
            "integration_key": "notion",
            "tool_name": "update_page",
            "agent_id": "research-agent",
            "agent_class": "assistant",
            "scopes": [],
            "payload": {"pageId": "runbook", "content": "Audit notes"},
        },
        {
            "integration_key": "linear",
            "tool_name": "create_issue",
            "agent_id": "ops-agent",
            "agent_class": "reviewer",
            "scopes": ["issues:write"],
            "payload": {"title": "Failed connector sync follow-up"},
        },
        {
            "integration_key": "linear",
            "tool_name": "create_issue",
            "agent_id": "cleanup-agent",
            "agent_class": "assistant",
            "scopes": ["issues:write"],
            "payload": {"title": "Archive stale integration credentials"},
        },
        {
            "integration_key": "github",
            "tool_name": "list_pull_requests",
            "agent_id": "ops-agent",
            "agent_class": "reviewer",
            "scopes": ["repo"],
            "payload": {"state": "open"},
        },
        {
            "integration_key": "slack",
            "tool_name": "post_message",
            "agent_id": "voice-agent",
            "agent_class": "assistant",
            "scopes": ["chat:write"],
            "payload": {"channel": "product-demo", "text": "Voiceover clip ready"},
        },
    ]

    for invocation in invocations:
        _invoke_approval_required(client, agent_key, **invocation)

    requests = client.get("/api/case-by-case-approvals").json()
    pending_requests = sorted(
        [request for request in requests if request["status"] == "pending"],
        key=lambda request: request["createdAt"],
    )
    if len(pending_requests) < 8:
        raise RuntimeError(
            f"Expected 8 pending access requests after seeding, got {len(pending_requests)}"
        )

    for request in pending_requests[:2]:
        response = client.post(
            f"/api/case-by-case-approvals/{request['id']}/approve",
            json={"durationMinutes": 240},
        )
        if response.status_code != 200:
            raise RuntimeError(
                f"Failed to approve request {request['id']}: "
                f"{response.status_code} {response.text}"
            )

    for request in pending_requests[2:4]:
        response = client.post(
            f"/api/case-by-case-approvals/{request['id']}/reject",
        )
        if response.status_code != 200:
            raise RuntimeError(
                f"Failed to reject request {request['id']}: "
                f"{response.status_code} {response.text}"
            )


def _seed_managed_connector(_client: TestClient) -> None:
    repository.save_managed_connector(
        ManagedConnector(
            slug="demo-http-connector",
            name="Demo HTTP Connector",
            description="Sample admin-managed connector for styling the catalog.",
            provider="http",
            authStrategy="api_key",
            credentialLabel="API key",
            credentialPlaceholder="Paste API key",
            credentialHelp="Demo connector only.",
            tools=[
                ManagedConnectorTool(
                    name="lookup_customer",
                    description="Look up a customer record",
                    accessMode="enabled",
                )
            ],
        )
    )


def seed_demo_data(*, reset: bool = False) -> dict[str, str]:
    _require_postgres()

    os.environ.setdefault("DISABLE_AUTH", "true")
    os.environ.setdefault("INTHUB_DISABLE_AUTH", "true")
    os.environ.setdefault("APP_ADMIN_EMAILS", DEMO_OWNER)
    reset_config()

    if reset:
        _reset_demo_owner()

    client = TestClient(app)
    _seed_integrations(client)
    _seed_permission_profile(client)
    _seed_managed_connector(client)
    _seed_access_requests(client)

    agent_key = client.get("/api/user/agent-key").json()["apiKey"]
    user_key_response = client.post("/api/user/key").json()
    admin_key_response = client.post("/api/admin/key").json()
    user_key = user_key_response.get("apiKey")
    admin_key = admin_key_response.get("apiKey")

    return {
        "owner": DEMO_OWNER,
        "agentKey": agent_key,
        "userKey": user_key,
        "adminKey": admin_key,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Integrations Hub demo data.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing demo-owner rows before seeding.",
    )
    args = parser.parse_args()

    keys = seed_demo_data(reset=args.reset)
    print("Demo data seeded for owner:", keys["owner"])
    print("Agent key:", keys["agentKey"])
    print("User key:", keys["userKey"])
    print("Admin key:", keys["adminKey"])
    print("")
    print("Open http://localhost:3000/integrations to browse the seeded dashboard.")
    print("Open http://localhost:3000/case-by-case-approvals to review seeded requests.")


if __name__ == "__main__":
    main()
