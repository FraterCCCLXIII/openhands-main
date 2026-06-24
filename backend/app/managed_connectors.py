from __future__ import annotations

from functools import lru_cache
from typing import Any

from openhands_extensions import list_integration_catalog

from .integration_catalog import first_connection_defaults
from .models import ManagedConnector, ManagedConnectorTool
from .repository import repository


def _has_default_http_tool(defaults: dict[str, Any]) -> bool:
    return bool(
        defaults.get("toolName")
        and defaults.get("toolDescription")
        and defaults.get("requestMethod")
        and defaults.get("requestPath")
    )


def _is_default_managed_connector(entry: dict[str, Any]) -> bool:
    defaults = first_connection_defaults(entry)
    if not defaults or not defaults.get("authStrategy"):
        return False
    if defaults.get("provider") == "http" and defaults.get("apiBaseUrl"):
        return bool(defaults.get("openApiUrl") or _has_default_http_tool(defaults))
    if defaults.get("provider") == "mcp" and defaults.get("serverUrl"):
        return True
    return False


def _default_tools(defaults: dict[str, Any]) -> list[ManagedConnectorTool]:
    if defaults.get("provider") != "http" or not _has_default_http_tool(defaults):
        return []
    return [
        ManagedConnectorTool(
            name=defaults["toolName"],
            description=defaults["toolDescription"],
            defaultScopes=defaults.get("toolScopes") or defaults.get("scopes") or [],
            request={
                "method": defaults["requestMethod"],
                "path": defaults["requestPath"],
            },
        )
    ]


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
        "credentialLabel": defaults.get("credentialLabel") or f"{entry['name']} credential",
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
                "toolScopes",
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
        "tools": _default_tools(defaults),
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
