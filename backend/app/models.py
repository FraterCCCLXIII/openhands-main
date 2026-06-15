from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field


AuthStrategy = Literal["none", "api_key", "bearer", "basic", "oauth2", "mcp_session"]
IntegrationKind = Literal["api", "mcp"]
IntegrationProvider = Literal["mcp", "mock", "http"]
ToolAccessMode = Literal["enabled", "disabled", "approval_required"]
AccessRequestStatus = Literal["pending", "approved", "rejected", "expired"]


def now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


class ToolSpec(BaseModel):
    name: str
    description: str = ""
    enabled: bool = True
    accessMode: ToolAccessMode = "enabled"
    maxAccessMode: ToolAccessMode | None = None
    fineGrainedPermissions: bool = True
    defaultScopes: list[str] = Field(default_factory=list)
    executionMode: Literal["provider", "mock"] = "provider"
    config: dict[str, Any] = Field(default_factory=dict)
    mockResponse: dict[str, Any] | None = None
    lastInvokedAt: str | None = None
    lastInvocationOutcome: Literal["success", "denied", "error"] | None = None
    invocationCount: int | None = None


class IntegrationSpec(BaseModel):
    key: str
    name: str
    kind: IntegrationKind
    provider: IntegrationProvider
    authStrategy: AuthStrategy
    enabled: bool = True
    fineGrainedPermissions: bool = True
    config: dict[str, Any] = Field(default_factory=dict)
    credentials: dict[str, Any] = Field(default_factory=dict)
    tools: dict[str, ToolSpec] = Field(default_factory=dict)

    def redacted(self) -> IntegrationSpec:
        return self.model_copy(update={"credentials": {}})


class ContextInvocationRequest(BaseModel):
    agentId: str | None = None
    agentClass: str | None = None
    scopes: list[str] = Field(default_factory=list)
    payload: dict[str, Any] = Field(default_factory=dict)


class AccessRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    agentId: str | None = None
    agentClass: str | None = None
    integrationKey: str
    toolName: str
    scopes: list[str] = Field(default_factory=list)
    requestedMinutes: int = 240
    channels: list[str] = Field(default_factory=list)
    notificationTargets: dict[str, str] = Field(default_factory=dict)
    justification: str = ""
    agentData: dict[str, Any] = Field(default_factory=dict)
    createdAt: str = Field(default_factory=now_iso)
    status: AccessRequestStatus = "pending"
    decidedAt: str | None = None
    decidedBy: str | None = None


class PermissionProfileIntegrationSnapshot(BaseModel):
    enabled: bool = True
    tools: dict[str, ToolAccessMode] = Field(default_factory=dict)


class PermissionProfileSnapshot(BaseModel):
    integrations: dict[str, PermissionProfileIntegrationSnapshot] = Field(
        default_factory=dict
    )


class PermissionProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    ownerId: str
    name: str | None = None
    snapshot: PermissionProfileSnapshot = Field(
        default_factory=PermissionProfileSnapshot
    )
    agentApiKey: str = ""
    createdAt: str = Field(default_factory=now_iso)
    updatedAt: str = Field(default_factory=now_iso)


class PermissionProfileApplyResult(BaseModel):
    profile: PermissionProfile
    appliedIntegrations: int
    appliedTools: int
    skippedIntegrations: list[str] = Field(default_factory=list)
    skippedTools: list[str] = Field(default_factory=list)


class ManagedConnectorTool(BaseModel):
    name: str
    description: str = ""
    defaultScopes: list[str] = Field(default_factory=list)
    accessMode: ToolAccessMode = "enabled"
    request: dict[str, Any] | None = None
    config: dict[str, Any] = Field(default_factory=dict)


class ManagedConnector(BaseModel):
    slug: str
    name: str
    description: str
    logoUrl: str | None = None
    appUrl: str | None = None
    docsUrl: str | None = None
    categories: list[str] = Field(default_factory=list)
    authModes: list[AuthStrategy] = Field(default_factory=list)
    authStrategy: AuthStrategy
    provider: Literal["mcp", "http"] = "mcp"
    oauthConfigured: bool = False
    credentialLabel: str = "API key"
    credentialPlaceholder: str = "Paste API key"
    credentialHelp: str = "Credential used by the connector."
    apiKeyHeaderName: str | None = None
    apiBaseUrl: str | None = None
    serverUrl: str | None = None
    openApiUrl: str | None = None
    oauthConfig: dict[str, Any] | None = None
    oauthClientId: str | None = None
    oauthClientSecret: str | None = None
    tools: list[ManagedConnectorTool] = Field(default_factory=list)
    enabled: bool = True
    createdAt: str = Field(default_factory=now_iso)
    updatedAt: str = Field(default_factory=now_iso)

    def option(self) -> dict[str, Any]:
        return {
            "slug": self.slug,
            "name": self.name,
            "description": self.description,
            "logoUrl": self.logoUrl,
            "appUrl": self.appUrl,
            "toolCount": len(self.tools),
            "categories": self.categories,
            "authModes": self.authModes or [self.authStrategy],
            "authStrategy": self.authStrategy,
            "oauthConfigured": self.oauthConfigured,
            "credentialLabel": self.credentialLabel,
            "credentialPlaceholder": self.credentialPlaceholder,
            "credentialHelp": self.credentialHelp,
            "apiKeyHeaderName": self.apiKeyHeaderName,
        }

    def response(self) -> dict[str, Any]:
        data = self.model_dump(exclude={"oauthClientId", "oauthClientSecret"})
        data["oauthConfigured"] = self.oauthConfigured
        data["oauthClientStatus"] = (
            "decryptable" if self.oauthConfigured else "not_applicable"
        )
        return data
