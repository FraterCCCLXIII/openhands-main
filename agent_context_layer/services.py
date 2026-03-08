from __future__ import annotations

from datetime import timedelta
from typing import Any
from urllib.parse import urljoin

import httpx

from agent_context_layer.models import (
    AccessDecision,
    AccessRequest,
    AccessRequestStatus,
    AgentClassPolicy,
    AuthStrategy,
    FunctionSpec,
    IntegrationSpec,
    Notification,
    PolicyRule,
    TemporaryGrant,
    utcnow,
)


class ContextLayerError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class InMemoryStore:
    def __init__(self) -> None:
        self.integrations: dict[str, IntegrationSpec] = {}
        self.policies: dict[str, AgentClassPolicy] = {}
        self.access_requests: dict[str, AccessRequest] = {}
        self.temporary_grants: dict[str, TemporaryGrant] = {}
        self.notifications: list[Notification] = []


class ContextLayerService:
    def __init__(self, store: InMemoryStore | None = None) -> None:
        self.store = store or InMemoryStore()

    def register_integration(self, spec: IntegrationSpec) -> IntegrationSpec:
        self.store.integrations[spec.key] = spec
        return spec

    def add_function(self, integration_key: str, function: FunctionSpec) -> FunctionSpec:
        integration = self.get_integration(integration_key)
        integration.functions[function.name] = function
        return function

    def set_integration_enabled(self, integration_key: str, enabled: bool) -> IntegrationSpec:
        integration = self.get_integration(integration_key)
        integration.enabled = enabled
        return integration

    def set_function_enabled(self, integration_key: str, function_name: str, enabled: bool) -> FunctionSpec:
        function = self.get_function(integration_key, function_name)
        function.enabled = enabled
        return function

    def upsert_agent_policy(self, agent_class: str, rules: list[PolicyRule]) -> AgentClassPolicy:
        policy = AgentClassPolicy(agent_class=agent_class, rules=rules)
        self.store.policies[agent_class] = policy
        return policy

    def get_integration(self, integration_key: str) -> IntegrationSpec:
        integration = self.store.integrations.get(integration_key)
        if not integration:
            raise ContextLayerError(f"Unknown integration '{integration_key}'", status_code=404)
        return integration

    def get_function(self, integration_key: str, function_name: str) -> FunctionSpec:
        integration = self.get_integration(integration_key)
        function = integration.functions.get(function_name)
        if not function:
            raise ContextLayerError(
                f"Unknown function '{function_name}' for integration '{integration_key}'",
                status_code=404,
            )
        return function

    def list_integrations(self) -> list[IntegrationSpec]:
        return sorted(self.store.integrations.values(), key=lambda item: item.key)

    def list_access_requests(self) -> list[AccessRequest]:
        return sorted(self.store.access_requests.values(), key=lambda item: item.created_at, reverse=True)

    def list_notifications(self) -> list[Notification]:
        return sorted(self.store.notifications, key=lambda item: item.created_at, reverse=True)

    def evaluate_access(
        self,
        agent_id: str,
        agent_class: str,
        integration_key: str,
        function_name: str,
        requested_scopes: set[str] | None = None,
    ) -> AccessDecision:
        integration = self.get_integration(integration_key)
        function = self.get_function(integration_key, function_name)
        effective_scopes = set(requested_scopes or function.default_scopes)
        if not integration.enabled:
            return AccessDecision(allowed=False, reason="Integration disabled", effective_scopes=effective_scopes)
        if not function.enabled:
            return AccessDecision(allowed=False, reason="Function disabled", effective_scopes=effective_scopes)

        policy = self.store.policies.get(agent_class)
        if policy:
            for rule in policy.rules:
                if rule.integration_key != integration_key:
                    continue
                fine_grained = integration.fine_grained_permissions and function.fine_grained_permissions
                if rule.permits(function_name, effective_scopes, fine_grained=fine_grained):
                    return AccessDecision(
                        allowed=True,
                        reason="Allowed by agent class policy",
                        effective_scopes=effective_scopes,
                    )

        now = utcnow()
        for grant in self.store.temporary_grants.values():
            if (
                grant.agent_id == agent_id
                and grant.agent_class == agent_class
                and grant.integration_key == integration_key
                and grant.function_name == function_name
                and grant.is_active(now)
                and (not grant.scopes or effective_scopes.issubset(grant.scopes))
            ):
                return AccessDecision(
                    allowed=True,
                    reason="Allowed by temporary approval",
                    effective_scopes=effective_scopes,
                )

        return AccessDecision(allowed=False, reason="Permission required", effective_scopes=effective_scopes)

    def create_access_request(self, request: AccessRequest) -> AccessRequest:
        self.store.access_requests[request.id] = request
        self._fan_out_notifications(request)
        return request

    def approve_access_request(self, request_id: str, approver: str, duration_minutes: int | None = None) -> TemporaryGrant:
        access_request = self._get_access_request(request_id)
        access_request.status = AccessRequestStatus.APPROVED
        access_request.decided_at = utcnow()
        access_request.decided_by = approver
        grant = TemporaryGrant(
            agent_id=access_request.agent_id,
            agent_class=access_request.agent_class,
            integration_key=access_request.integration_key,
            function_name=access_request.function_name,
            scopes=access_request.scopes,
            granted_by=approver,
            expires_at=utcnow() + timedelta(minutes=duration_minutes or access_request.requested_minutes),
        )
        self.store.temporary_grants[grant.id] = grant
        return grant

    def reject_access_request(self, request_id: str, approver: str) -> AccessRequest:
        access_request = self._get_access_request(request_id)
        access_request.status = AccessRequestStatus.REJECTED
        access_request.decided_at = utcnow()
        access_request.decided_by = approver
        return access_request

    async def invoke_context(
        self,
        agent_id: str,
        agent_class: str,
        integration_key: str,
        function_name: str,
        payload: dict[str, Any] | None = None,
        requested_scopes: set[str] | None = None,
    ) -> dict[str, Any]:
        decision = self.evaluate_access(agent_id, agent_class, integration_key, function_name, requested_scopes)
        if not decision.allowed:
            raise ContextLayerError(decision.reason, status_code=403)
        integration = self.get_integration(integration_key)
        function = self.get_function(integration_key, function_name)
        data = await self._execute(integration, function, payload or {})
        return {
            "integration": integration.key,
            "function": function.name,
            "kind": integration.kind,
            "auth_strategy": integration.auth_strategy,
            "decision": decision.model_dump(mode="json"),
            "data": data,
        }

    def seed_demo_data(self) -> None:
        if self.store.integrations:
            return
        self.register_integration(
            IntegrationSpec(
                key="crm",
                name="CRM API",
                kind="api",
                auth_strategy="oauth2",
                config={"base_url": "https://example-crm.invalid"},
            )
        )
        self.add_function(
            "crm",
            FunctionSpec(
                name="list_accounts",
                description="List CRM accounts",
                default_scopes={"crm.accounts.read"},
                mock_response={"accounts": [{"id": "acct_1", "name": "Acme"}]},
            ),
        )
        self.register_integration(
            IntegrationSpec(
                key="docs-mcp",
                name="Documents MCP",
                kind="mcp",
                auth_strategy="mcp_session",
                config={"server_url": "mcp://documents"},
            )
        )
        self.add_function(
            "docs-mcp",
            FunctionSpec(
                name="semantic_search",
                description="Search documents through an MCP server",
                default_scopes={"docs.search"},
                execution_mode="mcp",
                mock_response={"matches": [{"title": "Policy", "score": 0.98}]},
            ),
        )
        self.upsert_agent_policy(
            "researcher",
            [PolicyRule(integration_key="docs-mcp", function_names={"semantic_search"}, scopes={"docs.search"})],
        )

    def _get_access_request(self, request_id: str) -> AccessRequest:
        access_request = self.store.access_requests.get(request_id)
        if not access_request:
            raise ContextLayerError(f"Unknown access request '{request_id}'", status_code=404)
        return access_request

    def _fan_out_notifications(self, request: AccessRequest) -> None:
        for channel in request.channels:
            recipient = request.notification_targets.get(channel.value, f"default-{channel.value}-recipient")
            self.store.notifications.append(
                Notification(
                    channel=channel,
                    recipient=recipient,
                    subject=f"Approval requested for {request.integration_key}.{request.function_name}",
                    body=(
                        f"Agent '{request.agent_id}' requested {sorted(request.scopes)} for "
                        f"{request.integration_key}.{request.function_name} for {request.requested_minutes} minutes."
                    ),
                    metadata={"request_id": request.id, "agent_class": request.agent_class},
                )
            )

    async def _execute(self, integration: IntegrationSpec, function: FunctionSpec, payload: dict[str, Any]) -> dict[str, Any]:
        if function.execution_mode == "simulated":
            response = dict(function.mock_response)
            if payload:
                response["payload"] = payload
            response.setdefault("message", f"Simulated {integration.key}.{function.name} invocation")
            return response
        if function.execution_mode == "mcp":
            response = dict(function.mock_response)
            response.setdefault("server_url", integration.config.get("server_url", "mcp://unknown"))
            response.setdefault("payload", payload)
            return response
        if function.execution_mode == "http":
            return await self._invoke_http(integration, function, payload)
        raise ContextLayerError(f"Unsupported execution mode '{function.execution_mode}'", status_code=400)

    async def _invoke_http(self, integration: IntegrationSpec, function: FunctionSpec, payload: dict[str, Any]) -> dict[str, Any]:
        target_url = function.config.get("target_url")
        if not target_url:
            base_url = integration.config.get("base_url")
            path = function.config.get("path", "")
            if not base_url:
                raise ContextLayerError("HTTP integrations require a base_url or target_url", status_code=400)
            target_url = urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))
        method = function.config.get("method", "GET").upper()
        headers: dict[str, str] = {}
        auth: tuple[str, str] | None = None

        if integration.auth_strategy == AuthStrategy.API_KEY:
            headers[integration.credentials.get("header_name", "X-API-Key")] = integration.credentials["secret"]
        elif integration.auth_strategy in {AuthStrategy.BEARER, AuthStrategy.OAUTH2}:
            headers["Authorization"] = f"Bearer {integration.credentials['access_token']}"
        elif integration.auth_strategy == AuthStrategy.BASIC:
            auth = (integration.credentials["username"], integration.credentials["password"])

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.request(method, target_url, headers=headers, auth=auth, json=payload)
            response.raise_for_status()
        if "json" in response.headers.get("content-type", ""):
            body: Any = response.json()
        else:
            body = response.text
        return {"status_code": response.status_code, "body": body}
