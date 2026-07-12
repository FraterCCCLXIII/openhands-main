"""Focused checks for required fields in typed runtime contracts."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.models import (
    AgentApiKeyRecord,
    ConnectionSummary,
    OAuthAuthorizationServerMetadata,
    OAuthTokenResponse,
    ToolUsageSummary,
)


@pytest.mark.parametrize(
    ("model", "payload", "required_field"),
    [
        (OAuthTokenResponse, {}, "access_token"),
        (OAuthAuthorizationServerMetadata, {}, "authorization_endpoint"),
        (
            AgentApiKeyRecord,
            {"ownerId": "owner", "apiKey": "key"},
            "createdAt",
        ),
        (
            ConnectionSummary,
            {
                "integrationKey": "github",
                "provider": "http",
                "authStrategy": "oauth2",
                "createdAt": "2026-01-01T00:00:00Z",
                "updatedAt": "2026-01-01T00:00:00Z",
            },
            "ownerId",
        ),
        (
            ToolUsageSummary,
            {
                "integrationKey": "github",
                "toolName": "list_issues",
                "lastInvokedAt": "2026-01-01T00:00:00Z",
            },
            "lastInvocationOutcome",
        ),
    ],
)
def test_runtime_records_reject_missing_required_fields(
    model: type,
    payload: dict[str, str],
    required_field: str,
) -> None:
    with pytest.raises(ValidationError, match=required_field):
        model.model_validate(payload)


def test_connection_summary_retains_optional_provider_metadata() -> None:
    summary = ConnectionSummary.model_validate(
        {
            "ownerId": "owner",
            "connectionId": "conn_github",
            "integrationKey": "github",
            "provider": "http",
            "authStrategy": "oauth2",
            "createdAt": "2026-01-01T00:00:00Z",
            "updatedAt": "2026-01-01T00:00:00Z",
        }
    )

    assert summary.tokenType is None
    assert summary.expiresAt is None
