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
from .url_security import urlopen_no_redirect, validate_external_url


def is_dynamic_oauth(connector: ManagedConnector) -> bool:
    """An OAuth2 connector whose OAuth endpoints are discovered at runtime.

    These connectors (e.g. Superhuman Mail) advertise RFC 9728 protected-resource
    metadata from their MCP URL. That metadata identifies the authorization server,
    whose RFC 8414 metadata supplies the authorization/token endpoints. The hub
    discovers those endpoints at runtime instead of reading them from the catalog,
    and no admin pre-configuration (client credentials or registration URL) is
    needed.

    A connector is dynamic if either (a) its catalog entry has no
    ``authorizationUrl`` (pre-discovery), or (b) it was previously enriched
    with discovered endpoints and flagged with ``dynamicOAuth: true`` in its
    ``oauthConfig`` (post-discovery, e.g. loaded from the DB).
    """
    if connector.authStrategy != "oauth2":
        return False
    oauth_config = connector.oauthConfig or {}
    if oauth_config.get("dynamicOAuth"):
        return True
    return not oauth_config.get("authorizationUrl")


def well_known_metadata_url(identifier: str, document: str) -> str:
    """Insert a well-known metadata path before an identifier's path.

    RFC 9728 and RFC 8414 both derive metadata URLs by inserting the
    ``/.well-known/<document>`` segment between the origin and the identifier's
    path. Appending the segment to an MCP endpoint path produces a different,
    invalid URL (for example, ``/mcp/.well-known/...``).
    """
    validated = validate_external_url(identifier, purpose=f"{document} identifier")
    parsed = urllib.parse.urlsplit(validated)
    path = parsed.path or ""
    return urllib.parse.urlunsplit(
        parsed._replace(path=f"/.well-known/{document}{path}", fragment="")
    )


def fetch_oauth_metadata_document(url: str, purpose: str) -> dict[str, Any]:
    validated = validate_external_url(url, purpose=purpose)
    request = urllib.request.Request(validated, headers={"Accept": "application/json"})
    try:
        with urlopen_no_redirect(request, timeout=10) as response:
            payload = json.loads(response.read().decode() or "{}")
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"{purpose} discovery failed: {exc}"
        ) from exc
    if not isinstance(payload, dict):
        raise HTTPException(status_code=502, detail=f"{purpose} returned invalid JSON.")
    return payload


def discover_oauth_metadata(server_url: str) -> dict[str, Any]:
    """Discover an MCP resource's OAuth authorization-server metadata.

    Returns a dict with keys mapped to the hub's ``oauthConfig`` shape:
    ``authorizationUrl``, ``tokenUrl``, and optionally ``registrationUrl``.
    """
    protected_resource = fetch_oauth_metadata_document(
        well_known_metadata_url(server_url, "oauth-protected-resource"),
        "OAuth protected-resource metadata",
    )
    authorization_servers = protected_resource.get("authorization_servers")
    if not isinstance(authorization_servers, list):
        raise HTTPException(
            status_code=502,
            detail="OAuth protected-resource metadata is missing authorization_servers.",
        )
    authorization_server = next(
        (
            value.strip()
            for value in authorization_servers
            if isinstance(value, str) and value.strip()
        ),
        None,
    )
    if not authorization_server:
        raise HTTPException(
            status_code=502,
            detail="OAuth protected-resource metadata has no usable authorization server.",
        )
    payload = fetch_oauth_metadata_document(
        well_known_metadata_url(authorization_server, "oauth-authorization-server"),
        "OAuth authorization-server metadata",
    )
    authorization_url = payload.get("authorization_endpoint")
    token_url = payload.get("token_endpoint")
    if not authorization_url or not token_url:
        raise HTTPException(
            status_code=502,
            detail="OAuth metadata is missing authorization_endpoint or token_endpoint.",
        )
    return {
        "authorizationUrl": str(authorization_url),
        "tokenUrl": str(token_url),
        "registrationUrl": str(payload["registration_endpoint"])
        if payload.get("registration_endpoint")
        else None,
    }


def enrich_dynamic_oauth_config(
    connector: ManagedConnector, metadata: dict[str, Any]
) -> ManagedConnector:
    """Merge discovered OAuth endpoints into a connector's oauthConfig."""
    oauth_config = dict(connector.oauthConfig or {})
    oauth_config["authorizationUrl"] = metadata["authorizationUrl"]
    oauth_config["tokenUrl"] = metadata["tokenUrl"]
    if metadata.get("registrationUrl") and not oauth_config.get("registrationUrl"):
        oauth_config["registrationUrl"] = metadata["registrationUrl"]
    # Mark the connector as dynamic OAuth so downstream code (e.g.
    # save_managed_connector) knows not to require a client_id.
    oauth_config["dynamicOAuth"] = True
    return connector.model_copy(update={"oauthConfig": oauth_config})


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


_PREVIEW_PROXY_STATE_PREFIX = "oh_preview_v1"


def _https_origin(value: str) -> str | None:
    """Return a normalized HTTPS origin, rejecting non-origin URLs."""
    parsed = urllib.parse.urlparse(value.strip())
    try:
        port = parsed.port
    except ValueError:
        return None
    if (
        parsed.scheme != "https"
        or not parsed.netloc
        or parsed.username
        or parsed.password
        or port not in (None, 443)
        or parsed.path not in ("", "/")
        or parsed.params
        or parsed.query
        or parsed.fragment
    ):
        return None
    return f"https://{parsed.hostname}"


def oauth_state_with_preview_target() -> str:
    """Create OAuth state, carrying the safe return origin for a stable proxy.

    Preview deployments must register a stable OAuth callback URL, but their
    state records live in preview-local databases.  When both proxy and target
    URLs are configured, embed the configured preview origin in the otherwise
    opaque state so the stable callback can route the provider response back to
    the preview that created it.  The stable deployment validates the target
    against its explicit hostname allowlist before redirecting.
    """
    state = secrets.token_urlsafe(24)
    proxy = _https_origin(os.getenv("INTHUB_OAUTH_REDIRECT_PROXY_URL") or "")
    target = _https_origin(os.getenv("AUTH_URL") or "")
    if not proxy or not target or proxy == target:
        return state
    return f"{_PREVIEW_PROXY_STATE_PREFIX}.{b64url(target.encode())}.{state}"


def oauth_proxy_callback_target(request: Request, state: str) -> str | None:
    """Return the validated preview origin for a stable OAuth callback.

    A state is routed only when the request reached the configured stable
    proxy origin and the encoded target hostname fully matches
    ``INTHUB_OAUTH_REDIRECT_PROXY_ALLOWED_TARGET_HOST_REGEX``.  A malformed or
    untrusted state deliberately falls through to normal callback handling,
    where it cannot consume a preview's OAuth state.
    """
    proxy = _https_origin(os.getenv("INTHUB_OAUTH_REDIRECT_PROXY_URL") or "")
    pattern = (
        os.getenv("INTHUB_OAUTH_REDIRECT_PROXY_ALLOWED_TARGET_HOST_REGEX") or ""
    ).strip()
    if not proxy or not pattern:
        return None
    request_origin = _https_origin(str(request.base_url))
    if request_origin != proxy:
        return None

    prefix, separator, remainder = state.partition(".")
    if prefix != _PREVIEW_PROXY_STATE_PREFIX or not separator:
        return None
    encoded_target, separator, _opaque_state = remainder.partition(".")
    if not encoded_target or not separator:
        return None
    try:
        padded_target = encoded_target + "=" * (-len(encoded_target) % 4)
        target_value = base64.urlsafe_b64decode(padded_target).decode("utf-8")
    except (UnicodeDecodeError, ValueError):
        return None
    target = _https_origin(target_value)
    if not target:
        return None
    target_host = urllib.parse.urlparse(target).hostname
    try:
        allowed = bool(target_host and re.fullmatch(pattern, target_host))
    except re.error:
        return None
    return target if allowed else None


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
    token_url = validate_external_url(
        str(connector.oauthConfig["tokenUrl"]), purpose="OAuth token endpoint"
    )
    request = urllib.request.Request(
        token_url,
        data=urllib.parse.urlencode(body).encode(),
        headers=headers,
        method="POST",
    )
    try:
        with urlopen_no_redirect(request, timeout=10) as response:
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
    registration_url = validate_external_url(
        str(oauth_config["registrationUrl"]), purpose="OAuth registration endpoint"
    )
    request = urllib.request.Request(
        registration_url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen_no_redirect(request, timeout=10) as response:
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
    # Dynamic OAuth: the MCP server advertises its own endpoints via
    # .well-known/oauth-authorization-server. Discover them, optionally
    # register a client (RFC 7591) if the server exposes a registration
    # endpoint, then mark the connector as configured. No admin-supplied
    # client credentials or catalog authorizationUrl are needed.
    if is_dynamic_oauth(connector) and connector.serverUrl:
        metadata = discover_oauth_metadata(str(connector.serverUrl))
        enriched = enrich_dynamic_oauth_config(connector, metadata)
        if enriched.oauthConfig.get(
            "clientAuthentication"
        ) == "none" and enriched.oauthConfig.get("registrationUrl"):
            return register_dynamic_oauth_client(enriched)
        return enriched.model_copy(update={"oauthConfigured": True})
    if connector.oauthConfig.get(
        "clientAuthentication"
    ) == "none" and connector.oauthConfig.get("registrationUrl"):
        return register_dynamic_oauth_client(connector)
    if existing_connector:
        # The connector already exists in the database (e.g. its OAuth client
        # credentials were stored previously or it was registered via a path
        # that did not encrypt them). Allow saving other changes (tool access
        # modes, server URL, etc.) without forcing the admin to re-enter OAuth
        # client credentials on every save.
        return connector.model_copy(
            update={"oauthConfigured": existing_connector.oauthConfigured}
        )
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
    # Dynamic OAuth connectors have no catalog authorizationUrl; discover the
    # server's OAuth metadata at runtime so we can redirect the user to the
    # right authorization endpoint. The discovered tokenUrl is stashed in the
    # oauth_state's callback_url field so the callback can exchange the code
    # without re-discovering.
    discovered_token_url: str | None = None
    if is_dynamic_oauth(connector) and connector.serverUrl:
        metadata = discover_oauth_metadata(str(connector.serverUrl))
        connector = enrich_dynamic_oauth_config(connector, metadata)
        discovered_token_url = metadata["tokenUrl"]
    client = repository.read_oauth_client(connector)
    if not client:
        # For dynamic OAuth with a discovered registration endpoint, register
        # a client on the fly so default (non-admin-saved) connectors can
        # start the OAuth flow without a prior admin save.
        if (
            is_dynamic_oauth(connector)
            and connector.oauthConfig.get("clientAuthentication") == "none"
            and connector.oauthConfig.get("registrationUrl")
        ):
            connector = register_dynamic_oauth_client(connector)
            repository.save_managed_connector(connector)
            client = repository.read_oauth_client(connector)
        if not client:
            raise HTTPException(
                status_code=500,
                detail=f"{connector.name} is missing stored OAuth client credentials.",
            )
    state = oauth_state_with_preview_target()
    verifier = secrets.token_urlsafe(48) if connector.oauthConfig.get("pkce") else None
    raw_redirect_to = (
        request.query_params.get("redirectTo")
        or f"/integrations?showIntegrationWizard=1&managedConnector={provider}"
    )
    # Defense-in-depth: reject external/protocol-relative redirect targets at
    # ingest so obviously-bad rows never enter oauth_states. The callback
    # also validates before issuing the 302.
    redirect_to = (
        raw_redirect_to
        if raw_redirect_to.startswith("/") and not raw_redirect_to.startswith("//")
        else f"/integrations?showIntegrationWizard=1&managedConnector={provider}"
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
        discovered_token_url,
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
    # For dynamic OAuth, the token endpoint was discovered at start time and
    # stashed in the state's callback_url field. Enrich the connector so
    # fetch_oauth_token can use it.
    discovered_token_url = record.get("callback_url") or ""
    if discovered_token_url and not connector.oauthConfig.get("tokenUrl"):
        connector = enrich_dynamic_oauth_config(
            connector,
            {"authorizationUrl": "", "tokenUrl": str(discovered_token_url)},
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
    connection = repository.save_connection(
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
    ) | {
        "ownerId": str(record["owner_id"]),
    }
    # Preserve the wizard return target (`redirect_to`) so the callback can
    # send the user back into the integration wizard they started OAuth from,
    # instead of dropping them on /integrations with the wizard closed.
    connection["redirect_to"] = str(record.get("redirect_to") or "")
    return connection


def consume_oauth_redirect_target(provider: str, state: str) -> str:
    """Return the saved `redirect_to` for an OAuth state, consuming the row.

    Used by the OAuth callback error branch, where there is no code to exchange
    but we still want to send the user back to the wizard (or other origin)
    that kicked off the flow instead of a bare /integrations URL. The state is
    consumed so it cannot be replayed.
    """
    record = repository.consume_oauth_state(state, provider)
    return str((record or {}).get("redirect_to") or "")


def build_oauth_callback_redirect(
    base_redirect_to: str,
    *,
    oauth_status: str,
    oauth_provider: str,
    oauth_error: str | None = None,
    integration_key: str | None = None,
) -> str:
    """Merge OAuth status params onto the saved return target.

    The wizard starts OAuth with a `redirectTo` like
    `/integrations?showIntegrationWizard=1&managedConnector=<slug>`. After the
    provider redirects back, we append `oauth_status` / `oauth_provider` /
    `oauth_error` / `integrationKey` so the dashboard can show the result
    banner while keeping the wizard open. Falls back to `/integrations` when
    no return target was saved.

    Security: `base_redirect_to` originates from an untrusted query parameter
    (`redirectTo` on `/api/oauth/{provider}/start`). Validate it is a
    same-origin relative path to prevent open-redirect attacks — reject
    absolute URLs (`https://evil.example/...`) and protocol-relative URLs
    (`//evil.example/...`).
    """
    target = base_redirect_to.strip()
    if not target or not target.startswith("/") or target.startswith("//"):
        target = "/integrations"
    parsed = urllib.parse.urlparse(target)
    params = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
    # Remove any existing integrationKey so we don't duplicate it when the
    # callback appends the resolved key.
    params = [(k, v) for k, v in params if k != "integrationKey"]
    params.append(("oauth_status", oauth_status))
    params.append(("oauth_provider", oauth_provider))
    if oauth_error:
        params.append(("oauth_error", oauth_error))
    if integration_key:
        params.append(("integrationKey", integration_key))
    return urllib.parse.urlunparse(
        parsed._replace(query=urllib.parse.urlencode(params))
    )


def refresh_oauth_connection(record: dict[str, Any]) -> dict[str, Any]:
    connector = get_managed_connector(str(record.get("provider") or ""))
    if not connector or not connector.oauthConfig:
        raise HTTPException(
            status_code=500,
            detail=f"OAuth provider '{record.get('provider')}' is not configured.",
        )
    # Dynamic OAuth: the connector may be a catalog default without a
    # persisted tokenUrl. Re-discover so the refresh can hit the right
    # endpoint.
    if is_dynamic_oauth(connector) and connector.serverUrl:
        connector = enrich_dynamic_oauth_config(
            connector, discover_oauth_metadata(str(connector.serverUrl))
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
