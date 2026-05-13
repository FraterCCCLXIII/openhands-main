from __future__ import annotations

from .models import ManagedConnector
from .repository import repository


CONFIGURED_API_KEY_HEADERS = {"elevenlabs": "xi-api-key"}

DEFAULT_MANAGED_CONNECTORS = [
    ManagedConnector(
        slug="elevenlabs",
        name="ElevenLabs",
        description="Voice generation, text-to-speech, speech-to-text, and audio tools.",
        appUrl="https://elevenlabs.io",
        categories=["AI", "Audio"],
        authModes=["api_key"],
        authStrategy="api_key",
        provider="http",
        credentialLabel="ElevenLabs API key",
        credentialPlaceholder="Paste your ElevenLabs API key",
        credentialHelp="Personal or workspace ElevenLabs API key sent in the xi-api-key header.",
        apiKeyHeaderName="xi-api-key",
        apiBaseUrl="https://api.elevenlabs.io",
        openApiUrl="https://api.elevenlabs.io/openapi.json",
        oauthConfigured=True,
    ),
    ManagedConnector(
        slug="ordinal",
        name="Ordinal",
        description="Social media management through Ordinal's hosted MCP server.",
        appUrl="https://app.tryordinal.com",
        categories=["Social media", "Marketing"],
        authModes=["bearer"],
        authStrategy="bearer",
        provider="mcp",
        credentialLabel="Ordinal API key",
        credentialPlaceholder="Paste your Ordinal API key",
        credentialHelp="API key from your Ordinal workspace settings, sent as a Bearer token in the Authorization header.",
        serverUrl="https://app.tryordinal.com/api/mcp",
        oauthConfigured=True,
    ),
]


def default_managed_connector(slug: str) -> ManagedConnector | None:
    return next(
        (
            connector
            for connector in DEFAULT_MANAGED_CONNECTORS
            if connector.slug == slug
        ),
        None,
    )


def with_configured_connector_defaults(connector: ManagedConnector) -> ManagedConnector:
    header_name = connector.apiKeyHeaderName or CONFIGURED_API_KEY_HEADERS.get(
        connector.slug
    )
    if header_name and header_name != connector.apiKeyHeaderName:
        return connector.model_copy(update={"apiKeyHeaderName": header_name})
    return connector


def get_managed_connector(slug: str) -> ManagedConnector | None:
    connector = repository.get_managed_connector(slug) or default_managed_connector(
        slug
    )
    return with_configured_connector_defaults(connector) if connector else None


def list_managed_connectors(include_defaults: bool = True) -> list[ManagedConnector]:
    connectors = [
        with_configured_connector_defaults(connector)
        for connector in repository.list_managed_connectors()
    ]
    if include_defaults:
        registered = {connector.slug for connector in connectors}
        connectors = [
            *connectors,
            *[
                connector
                for connector in DEFAULT_MANAGED_CONNECTORS
                if connector.slug not in registered
            ],
        ]
    return sorted(connectors, key=lambda connector: connector.name.lower())
