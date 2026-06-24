from __future__ import annotations

from typing import Any


def defined_values(values: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in values.items() if value is not None}


def connection_defaults_from_option(option: dict[str, Any]) -> dict[str, Any]:
    auth = option.get("auth", {})
    oauth = auth.get("oauth", {})
    http = option.get("http", {})
    tool = http.get("defaultTool", {})
    transport = option.get("transport", {})
    return defined_values(
        {
            "provider": option.get("provider"),
            "authModes": auth.get("authModes"),
            "authStrategy": auth.get("strategy"),
            "credentialLabel": auth.get("credentialLabel"),
            "credentialPlaceholder": auth.get("credentialPlaceholder"),
            "credentialHelp": auth.get("credentialHelp"),
            "apiKeyHeaderName": auth.get("apiKeyHeaderName"),
            "apiKeyOptional": auth.get("apiKeyOptional"),
            "apiBaseUrl": http.get("apiBaseUrl"),
            "serverUrl": transport.get("url"),
            "openApiUrl": http.get("openApiUrl"),
            "authorizationUrl": oauth.get("authorizationUrl"),
            "tokenUrl": oauth.get("tokenUrl"),
            "scopes": oauth.get("scopes"),
            "optionalScopes": oauth.get("optionalScopes"),
            "toolScopes": oauth.get("toolScopes"),
            "scopeSeparator": oauth.get("scopeSeparator"),
            "pkce": oauth.get("pkce"),
            "clientAuthentication": oauth.get("clientAuthentication"),
            "registrationUrl": oauth.get("registrationUrl"),
            "additionalAuthorizationParams": oauth.get("additionalAuthorizationParams"),
            "additionalTokenParams": oauth.get("additionalTokenParams"),
            "toolName": tool.get("name"),
            "toolDescription": tool.get("description"),
            "requestMethod": tool.get("method"),
            "requestPath": tool.get("path"),
        }
    )


def first_connection_defaults(entry: dict[str, Any]) -> dict[str, Any] | None:
    option = (entry.get("connectionOptions") or [None])[0]
    if not option:
        return None
    return connection_defaults_from_option(option)
