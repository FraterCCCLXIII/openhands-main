from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import secrets
import urllib.parse
import urllib.request
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException, Request
from fastapi.responses import RedirectResponse

from .managed_connectors import get_managed_connector
from .models import IntegrationSpec, ManagedConnector
from .repository import repository


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def oauth_expiry(seconds: int = 600) -> str:
    return (
        (datetime.now(UTC) + timedelta(seconds=seconds))
        .isoformat()
        .replace("+00:00", "Z")
    )


def split_oauth_scopes(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str):
        return [part for part in re.split(r"[ ,]+", value) if part]
    return []


def join_oauth_scopes(scopes: list[str], separator: str | None = None) -> str:
    return ("," if separator == "comma" else " ").join(scopes)


def oauth_callback_base_url(request: Request) -> str:
    proxy = (os.getenv("INTHUB_OAUTH_REDIRECT_PROXY_URL") or "").strip().rstrip("/")
    if proxy:
        return f"{urllib.parse.urlparse(proxy).scheme}://{urllib.parse.urlparse(proxy).netloc}/api/oauth"
    return f"{request.url.scheme}://{request.url.netloc}/api/oauth"


def requested_oauth_scopes(oauth_config: dict[str, Any]) -> list[str]:
    scopes = split_oauth_scopes(oauth_config.get("scopes") or [])
    optional = split_oauth_scopes(oauth_config.get("optionalScopes") or [])
    optional.extend(
        split_oauth_scopes(
            (oauth_config.get("additionalAuthorizationParams") or {}).get(
                "optional_scope"
            )
        )
    )
    seen: set[str] = set()
    result: list[str] = []
    for scope in [*scopes, *optional]:
        if scope not in seen:
            seen.add(scope)
            result.append(scope)
    return result


def token_request_body(
    connector: ManagedConnector, client: dict[str, str], values: dict[str, str]
) -> tuple[dict[str, str], dict[str, str]]:
    auth_mode = (connector.oauthConfig or {}).get("clientAuthentication")
    body = dict(values)
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    if auth_mode == "body":
        body["client_id"] = client["clientId"]
        body["client_secret"] = client.get("clientSecret", "")
    elif auth_mode == "none":
        body["client_id"] = client["clientId"]
    else:
        token = base64.b64encode(
            f"{client['clientId']}:{client.get('clientSecret', '')}".encode()
        ).decode()
        headers["Authorization"] = f"Basic {token}"
    for key, value in (
        (connector.oauthConfig or {}).get("additionalTokenParams") or {}
    ).items():
        body[str(key)] = str(value)
    return body, headers


def fetch_oauth_token(
    connector: ManagedConnector, body: dict[str, str], headers: dict[str, str]
) -> dict[str, Any]:
    request = urllib.request.Request(
        connector.oauthConfig["tokenUrl"],
        data=urllib.parse.urlencode(body).encode(),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode() or "{}")
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"OAuth token exchange failed: {exc}"
        ) from exc
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=502, detail="OAuth token exchange returned an invalid response."
        )
    return payload


def oauth_metadata(
    connector: ManagedConnector,
    payload: dict[str, Any],
    existing: dict[str, Any] | None = None,
) -> dict[str, Any]:
    expires_at = None
    if isinstance(payload.get("expires_in"), int):
        expires_at = oauth_expiry(int(payload["expires_in"]))
    scopes = (
        split_oauth_scopes(payload.get("scope"))
        or split_oauth_scopes((existing or {}).get("scopes"))
        or requested_oauth_scopes(connector.oauthConfig or {})
    )
    metadata = dict((existing or {}).get("metadata") or {})
    return {
        "tokenType": payload.get("token_type") or (existing or {}).get("tokenType"),
        "scopes": scopes,
        "expiresAt": expires_at,
        "externalAccountId": payload.get("externalAccountId")
        or (existing or {}).get("externalAccountId"),
        "externalWorkspaceId": payload.get("externalWorkspaceId")
        or (existing or {}).get("externalWorkspaceId"),
        "displayName": payload.get("displayName")
        or (existing or {}).get("displayName"),
        "metadata": metadata,
    }


def is_expired(expires_at: str | None) -> bool:
    if not expires_at:
        return False
    try:
        value = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
    except ValueError:
        return False
    return value <= datetime.now(UTC)


def configured_oauth_callback_url(provider: str) -> str:
    proxy = (os.getenv("INTHUB_OAUTH_REDIRECT_PROXY_URL") or "").strip().rstrip("/")
    if proxy:
        parsed = urllib.parse.urlparse(proxy)
        return f"{parsed.scheme}://{parsed.netloc}/api/oauth/{provider}/callback"
    explicit = (os.getenv("AUTH_URL") or "").strip().rstrip("/")
    if explicit:
        return f"{explicit}/api/oauth/{provider}/callback"
    vercel_url = (os.getenv("VERCEL_URL") or "").strip().rstrip("/")
    if vercel_url:
        host = re.sub(r"^https?://", "", vercel_url)
        return f"https://{host}/api/oauth/{provider}/callback"
    return f"http://localhost:3000/api/oauth/{provider}/callback"


def register_dynamic_oauth_client(connector: ManagedConnector) -> ManagedConnector:
    oauth_config = connector.oauthConfig or {}
    if oauth_config.get("clientAuthentication") != "none" or not oauth_config.get(
        "registrationUrl"
    ):
        return connector
    callback_url = configured_oauth_callback_url(connector.slug)
    data = json.dumps(
        {
            "client_name": f"OpenHands Integrations Hub ({connector.name})",
            "redirect_uris": [callback_url],
            "grant_types": ["authorization_code", "refresh_token"],
            "response_types": ["code"],
            "token_endpoint_auth_method": oauth_config.get("clientAuthentication"),
        }
    ).encode()
    request = urllib.request.Request(
        str(oauth_config["registrationUrl"]),
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode() or "{}")
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"{connector.name} OAuth client registration failed: {exc}",
        ) from exc
    client_id = str(payload.get("client_id") or "").strip()
    if not client_id:
        raise HTTPException(
            status_code=502,
            detail=f"{connector.name} OAuth client registration did not return a client_id.",
        )
    client_secret = str(payload.get("client_secret") or "").strip() or None
    return connector.model_copy(
        update={
            "oauthClientId": client_id,
            "oauthClientSecret": client_secret,
            "oauthConfigured": True,
        }
    )


def ensure_managed_oauth_client(connector: ManagedConnector) -> ManagedConnector:
    if connector.authStrategy != "oauth2":
        return connector
    if not connector.oauthConfig:
        raise HTTPException(
            status_code=400, detail="OAuth-managed connectors require an oauthConfig."
        )
    if connector.oauthClientId:
        if (
            connector.oauthConfig.get("clientAuthentication") != "none"
            and not connector.oauthClientSecret
        ):
            raise HTTPException(
                status_code=400,
                detail="New OAuth-managed connectors require both oauthClientId and oauthClientSecret.",
            )
        return connector.model_copy(update={"oauthConfigured": True})
    existing_connector = repository.get_managed_connector(connector.slug)
    existing = (
        repository.read_oauth_client(existing_connector) if existing_connector else None
    )
    if existing:
        return connector.model_copy(
            update={
                "oauthClientId": existing["clientId"],
                "oauthClientSecret": existing.get("clientSecret"),
                "oauthConfigured": True,
            }
        )
    if connector.oauthConfig.get(
        "clientAuthentication"
    ) == "none" and connector.oauthConfig.get("registrationUrl"):
        return register_dynamic_oauth_client(connector)
    raise HTTPException(
        status_code=400,
        detail="New OAuth-managed connectors require OAuth client credentials.",
    )


def start_oauth_redirect(
    request: Request, provider: str, owner: str, *, response_as_json: bool = False
) -> RedirectResponse | dict[str, str]:
    connector = get_managed_connector(provider)
    if not connector or not connector.oauthConfig:
        raise HTTPException(
            status_code=404, detail=f"Unknown OAuth provider '{provider}'."
        )
    client = repository.read_oauth_client(connector)
    if not client:
        raise HTTPException(
            status_code=500,
            detail=f"{connector.name} is missing stored OAuth client credentials.",
        )
    state = secrets.token_urlsafe(24)
    verifier = secrets.token_urlsafe(48) if connector.oauthConfig.get("pkce") else None
    redirect_to = (
        request.query_params.get("redirectTo")
        or f"/integrations?showIntegrationWizard=1&managedConnector={provider}"
    )
    integration_key = request.query_params.get("integrationKey") or provider
    redirect_uri = f"{oauth_callback_base_url(request)}/{provider}/callback"
    query = {
        "response_type": "code",
        "client_id": client["clientId"],
        "redirect_uri": redirect_uri,
        "state": state,
    }
    scope_separator = connector.oauthConfig.get("scopeSeparator")
    scopes = split_oauth_scopes(connector.oauthConfig.get("scopes") or [])
    if scopes:
        query["scope"] = join_oauth_scopes(scopes, scope_separator)
    optional_scopes = split_oauth_scopes(
        connector.oauthConfig.get("optionalScopes") or []
    )
    optional_scopes.extend(
        split_oauth_scopes(
            (connector.oauthConfig.get("additionalAuthorizationParams") or {}).get(
                "optional_scope"
            )
        )
    )
    if optional_scopes:
        query["optional_scope"] = join_oauth_scopes(optional_scopes, scope_separator)
    if verifier:
        query["code_challenge"] = b64url(hashlib.sha256(verifier.encode()).digest())
        query["code_challenge_method"] = "S256"
    for key, value in (
        connector.oauthConfig.get("additionalAuthorizationParams") or {}
    ).items():
        if key == "scope" and scopes:
            continue
        if key == "optional_scope" and optional_scopes:
            continue
        query[str(key)] = str(value)
    repository.save_oauth_state(
        state,
        owner,
        integration_key,
        provider,
        verifier,
        redirect_to,
        redirect_uri,
        None,
        oauth_expiry(),
    )
    redirect_url = (
        f"{connector.oauthConfig['authorizationUrl']}?{urllib.parse.urlencode(query)}"
    )
    if response_as_json:
        return {"redirectUrl": redirect_url}
    return RedirectResponse(redirect_url)


def exchange_oauth_code(provider: str, state: str, code: str) -> dict[str, Any]:
    record = repository.consume_oauth_state(state, provider)
    if not record:
        raise HTTPException(
            status_code=400, detail="OAuth state not found or already used."
        )
    connector = get_managed_connector(provider)
    if not connector or not connector.oauthConfig:
        raise HTTPException(
            status_code=404, detail=f"Unknown OAuth provider '{provider}'."
        )
    client = repository.read_oauth_client(connector)
    if not client:
        raise HTTPException(
            status_code=500,
            detail=f"{connector.name} is missing stored OAuth client credentials.",
        )
    body = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": str(record.get("redirect_uri") or ""),
    }
    if record.get("code_verifier"):
        body["code_verifier"] = str(record.get("code_verifier"))
    body, headers = token_request_body(connector, client, body)
    payload = fetch_oauth_token(connector, body, headers)
    access_token = payload.get("access_token")
    if not isinstance(access_token, str) or not access_token:
        raise HTTPException(
            status_code=502,
            detail="OAuth token exchange did not return an access token.",
        )
    return repository.save_connection(
        str(record["owner_id"]),
        str(record["integration_key"]),
        provider,
        "oauth2",
        {
            "accessToken": access_token,
            **(
                {"refreshToken": payload.get("refresh_token")}
                if payload.get("refresh_token")
                else {}
            ),
        },
        oauth_metadata(connector, payload),
    )


def refresh_oauth_connection(record: dict[str, Any]) -> dict[str, Any]:
    connector = get_managed_connector(str(record.get("provider") or ""))
    if not connector or not connector.oauthConfig:
        raise HTTPException(
            status_code=500,
            detail=f"OAuth provider '{record.get('provider')}' is not configured.",
        )
    client = repository.read_oauth_client(connector)
    if not client:
        raise HTTPException(
            status_code=500,
            detail=f"{connector.name} is missing stored OAuth client credentials.",
        )
    credentials = (
        record.get("credentials") if isinstance(record.get("credentials"), dict) else {}
    )
    refresh_token = str(credentials.get("refreshToken") or "").strip()
    if not refresh_token:
        raise HTTPException(
            status_code=403,
            detail=f"Reconnect {record.get('provider')} to refresh the expired access token.",
        )
    body, headers = token_request_body(
        connector,
        client,
        {"grant_type": "refresh_token", "refresh_token": refresh_token},
    )
    payload = fetch_oauth_token(connector, body, headers)
    access_token = payload.get("access_token")
    if not isinstance(access_token, str) or not access_token:
        raise HTTPException(
            status_code=502,
            detail="OAuth token refresh did not return an access token.",
        )
    return repository.save_connection(
        str(record["ownerId"]),
        str(record["integrationKey"]),
        str(record["provider"]),
        "oauth2",
        {
            "accessToken": access_token,
            "refreshToken": payload.get("refresh_token") or refresh_token,
        },
        oauth_metadata(connector, payload, record),
    ) | {
        "credentials": {
            "accessToken": access_token,
            "refreshToken": payload.get("refresh_token") or refresh_token,
        }
    }


def credentials_for(owner: str, integration: IntegrationSpec) -> dict[str, Any]:
    """Return provider credentials, refreshing expired OAuth tokens as a side effect."""
    if integration.authStrategy == "oauth2":
        record = repository.get_connection(owner, integration.key)
        if not record:
            raise HTTPException(
                status_code=403,
                detail=f"Connect {integration.name} for this user before invoking '{integration.key}'.",
            )
        if record.get("authStrategy") == "oauth2" and is_expired(
            record.get("expiresAt")
        ):
            record = refresh_oauth_connection(record)
        credentials = record.get("credentials")
        return credentials if isinstance(credentials, dict) else {}
    return integration.credentials
