from __future__ import annotations

from functools import lru_cache
from typing import Any

from openhands_extensions import list_integration_catalog

from .integration_catalog import first_connection_defaults
from .models import ManagedConnector
from .repository import repository


def _is_default_managed_connector(entry: dict[str, Any]) -> bool:
    # The catalog's `defaultTool` field is intentionally ignored; tools come
    # from MCP `tools/list` (live) or HTTP OpenAPI (regenerated on save). An
    # HTTP connector without an openApiUrl has no tool source, so we skip it
    # rather than surface a zero-tool default.
    defaults = first_connection_defaults(entry)
    if not defaults or not defaults.get("authStrategy"):
        return False
    if defaults.get("provider") == "http" and defaults.get("apiBaseUrl"):
        return bool(defaults.get("openApiUrl"))
    if defaults.get("provider") == "mcp" and defaults.get("serverUrl"):
        return True
    return False


def _to_default_managed_connector(entry: dict[str, Any]) -> dict[str, Any]:
    defaults = first_connection_defaults(entry)
    assert defaults is not None
    auth_modes = defaults.get("authModes")
    if auth_modes and all(auth_modes):
        resolved_auth_modes = auth_modes
    else:
        resolved_auth_modes = [defaults["authStrategy"]]
    return {
        "slug": entry["id"],
        "name": entry["name"],
        "description": entry["description"],
        "logoUrl": entry.get("logoUrl"),
        "iconBg": entry.get("iconBg"),
        "iconColor": entry.get("iconColor"),
        "appUrl": entry.get("appUrl"),
        "docsUrl": entry.get("docsUrl"),
        "categories": entry.get("categories", []),
        "authModes": resolved_auth_modes,
        "authStrategy": defaults["authStrategy"],
        "provider": defaults.get("provider"),
        "credentialLabel": defaults.get("credentialLabel")
        or f"{entry['name']} credential",
        "credentialPlaceholder": defaults.get("credentialPlaceholder")
        or f"Paste your {entry['name']} credential",
        "credentialHelp": defaults.get("credentialHelp")
        or f"Credential required by {entry['name']}.",
        "apiKeyHeaderName": (defaults.get("apiKeyHeaderName") or "").strip() or None,
        "apiBaseUrl": defaults.get("apiBaseUrl"),
        "openApiUrl": defaults.get("openApiUrl"),
        "serverUrl": defaults.get("serverUrl"),
        "oauthConfig": {
            key: defaults.get(key)
            for key in [
                "authorizationUrl",
                "tokenUrl",
                "scopes",
                "optionalScopes",
                "scopeSeparator",
                "pkce",
                "clientAuthentication",
                "registrationUrl",
                "additionalAuthorizationParams",
                "additionalTokenParams",
            ]
            if defaults.get(key) is not None
        }
        or None,
        # Default connectors ship with no tools; tools are discovered (MCP) or
        # generated from openApiUrl (HTTP) on connect/save/index.
        "tools": [],
        "oauthConfigured": defaults["authStrategy"] != "oauth2",
    }


@lru_cache(maxsize=1)
def default_managed_connectors() -> tuple[ManagedConnector, ...]:
    return tuple(
        ManagedConnector(**_to_default_managed_connector(entry))
        for entry in list_integration_catalog()
        if _is_default_managed_connector(entry)
    )


def default_managed_connector(slug: str) -> ManagedConnector | None:
    return next(
        (
            connector
            for connector in default_managed_connectors()
            if connector.slug == slug
        ),
        None,
    )


def get_managed_connector(slug: str) -> ManagedConnector | None:
    return repository.get_managed_connector(slug) or default_managed_connector(slug)


def list_managed_connectors(include_defaults: bool = True) -> list[ManagedConnector]:
    connectors = repository.list_managed_connectors()
    if include_defaults:
        registered = {connector.slug for connector in connectors}
        connectors = [
            *connectors,
            *[
                connector
                for connector in default_managed_connectors()
                if connector.slug not in registered
            ],
        ]
    return sorted(connectors, key=lambda connector: connector.name.lower())
