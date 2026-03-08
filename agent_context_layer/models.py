from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class IntegrationKind(StrEnum):
    API = "api"
    MCP = "mcp"


class AuthStrategy(StrEnum):
    NONE = "none"
    API_KEY = "api_key"
    BEARER = "bearer"
    BASIC = "basic"
    OAUTH2 = "oauth2"
    MCP_SESSION = "mcp_session"


class NotificationChannel(StrEnum):
    EMAIL = "email"
    IN_APP = "in_app"
    SMS = "sms"


class AccessRequestStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class FunctionSpec(BaseModel):
    name: str
    description: str = ""
    enabled: bool = True
    fine_grained_permissions: bool = True
    default_scopes: set[str] = Field(default_factory=set)
    execution_mode: str = "simulated"
    config: dict[str, Any] = Field(default_factory=dict)
    mock_response: dict[str, Any] = Field(default_factory=dict)


class IntegrationSpec(BaseModel):
    key: str
    name: str
    kind: IntegrationKind
    auth_strategy: AuthStrategy
    enabled: bool = True
    fine_grained_permissions: bool = True
    config: dict[str, Any] = Field(default_factory=dict)
    credentials: dict[str, Any] = Field(default_factory=dict)
    functions: dict[str, FunctionSpec] = Field(default_factory=dict)


class PolicyRule(BaseModel):
    integration_key: str
    function_names: set[str] = Field(default_factory=set)
    scopes: set[str] = Field(default_factory=set)
    enabled: bool = True

    def permits(self, function_name: str, requested_scopes: set[str], fine_grained: bool) -> bool:
        if not self.enabled:
            return False
        if fine_grained and self.function_names and function_name not in self.function_names:
            return False
        if self.scopes and not requested_scopes.issubset(self.scopes):
            return False
        return True


class AgentClassPolicy(BaseModel):
    agent_class: str
    rules: list[PolicyRule] = Field(default_factory=list)


class TemporaryGrant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    agent_id: str
    agent_class: str
    integration_key: str
    function_name: str
    scopes: set[str] = Field(default_factory=set)
    granted_by: str
    created_at: datetime = Field(default_factory=utcnow)
    expires_at: datetime

    def is_active(self, now: datetime | None = None) -> bool:
        current = now or utcnow()
        return self.expires_at > current


class AccessRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    agent_id: str
    agent_class: str
    integration_key: str
    function_name: str
    scopes: set[str] = Field(default_factory=set)
    requested_minutes: int = 30
    channels: list[NotificationChannel] = Field(default_factory=list)
    notification_targets: dict[str, str] = Field(default_factory=dict)
    justification: str = ""
    created_at: datetime = Field(default_factory=utcnow)
    status: AccessRequestStatus = AccessRequestStatus.PENDING
    decided_at: datetime | None = None
    decided_by: str | None = None


class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    channel: NotificationChannel
    recipient: str
    subject: str
    body: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utcnow)


class AccessDecision(BaseModel):
    allowed: bool
    reason: str
    effective_scopes: set[str] = Field(default_factory=set)
