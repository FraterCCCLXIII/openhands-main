from datetime import timedelta

from fastapi.testclient import TestClient

from agent_context_layer.app import create_app
from agent_context_layer.auth import GoogleOAuthClient, GoogleOAuthConfig
from agent_context_layer.models import AccessRequest, FunctionSpec, IntegrationSpec, NotificationChannel, PolicyRule, utcnow
from agent_context_layer.services import ContextLayerService, InMemoryStore


def make_client() -> tuple[TestClient, ContextLayerService]:
    service = ContextLayerService(InMemoryStore())
    app = create_app(service)
    return TestClient(app), service


def test_context_endpoint_allows_access_via_agent_class_policy() -> None:
    client, service = make_client()
    service.register_integration(IntegrationSpec(key="salesforce", name="Salesforce", kind="api", auth_strategy="oauth2"))
    service.add_function(
        "salesforce",
        FunctionSpec(name="accounts", default_scopes={"accounts.read"}, mock_response={"accounts": [{"id": "1"}]}),
    )
    service.upsert_agent_policy(
        "assistant",
        [PolicyRule(integration_key="salesforce", function_names={"accounts"}, scopes={"accounts.read"})],
    )

    response = client.post(
        "/api/context/salesforce/accounts",
        json={"agent_id": "agent-1", "agent_class": "assistant", "scopes": ["accounts.read"], "payload": {"limit": 5}},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["integration"] == "salesforce"
    assert payload["decision"]["allowed"] is True
    assert payload["data"]["accounts"][0]["id"] == "1"


def test_disabled_function_blocks_context_access() -> None:
    client, service = make_client()
    service.register_integration(IntegrationSpec(key="drive", name="Drive", kind="api", auth_strategy="bearer"))
    service.add_function("drive", FunctionSpec(name="files", enabled=False, default_scopes={"files.read"}))
    service.upsert_agent_policy("assistant", [PolicyRule(integration_key="drive", function_names={"files"}, scopes={"files.read"})])

    response = client.post(
        "/api/context/drive/files",
        json={"agent_id": "agent-2", "agent_class": "assistant", "scopes": ["files.read"], "payload": {}},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Function disabled"


def test_access_request_creates_notifications_for_multiple_channels() -> None:
    client, service = make_client()
    service.register_integration(IntegrationSpec(key="github", name="GitHub", kind="api", auth_strategy="oauth2"))
    service.add_function("github", FunctionSpec(name="list_prs", default_scopes={"pulls.read"}))

    response = client.post(
        "/api/access-requests",
        json={
            "agent_id": "agent-3",
            "agent_class": "reviewer",
            "integration_key": "github",
            "function_name": "list_prs",
            "scopes": ["pulls.read"],
            "requested_minutes": 45,
            "channels": ["email", "sms", "in_app"],
            "notification_targets": {
                "email": "owner@example.com",
                "sms": "+15551234567",
                "in_app": "ops-inbox",
            },
            "justification": "Need temporary repo access",
        },
    )

    assert response.status_code == 200
    notifications = service.list_notifications()
    assert [item.channel for item in notifications] == [
        NotificationChannel.IN_APP,
        NotificationChannel.SMS,
        NotificationChannel.EMAIL,
    ]
    assert {item.recipient for item in notifications} == {"owner@example.com", "+15551234567", "ops-inbox"}


def test_approval_grants_temporary_access_until_expiry() -> None:
    client, service = make_client()
    service.register_integration(IntegrationSpec(key="notion", name="Notion", kind="api", auth_strategy="oauth2"))
    service.add_function("notion", FunctionSpec(name="search", default_scopes={"search.read"}))
    access_request = service.create_access_request(
        AccessRequest(
            agent_id="agent-4",
            agent_class="writer",
            integration_key="notion",
            function_name="search",
            scopes={"search.read"},
            requested_minutes=15,
        )
    )

    approve_response = client.post(
        f"/api/access-requests/{access_request.id}/approve",
        json={"approver": "human-1", "duration_minutes": 15},
    )
    assert approve_response.status_code == 200

    allowed_response = client.post(
        "/api/context/notion/search",
        json={"agent_id": "agent-4", "agent_class": "writer", "scopes": ["search.read"], "payload": {}},
    )
    assert allowed_response.status_code == 200

    grant = next(iter(service.store.temporary_grants.values()))
    grant.expires_at = utcnow() - timedelta(minutes=1)

    denied_response = client.post(
        "/api/context/notion/search",
        json={"agent_id": "agent-4", "agent_class": "writer", "scopes": ["search.read"], "payload": {}},
    )
    assert denied_response.status_code == 403
    assert denied_response.json()["detail"] == "Permission required"


def test_auth_provider_metadata_exposes_google_configuration() -> None:
    client, _ = make_client()
    client.app.state.google_oauth = GoogleOAuthClient(GoogleOAuthConfig(client_id="id", client_secret="secret"))

    response = client.get("/api/auth/providers")

    assert response.status_code == 200
    assert response.json() == {"google": True, "dev_login": True}
