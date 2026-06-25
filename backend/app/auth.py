from __future__ import annotations

import logging
import time
from dataclasses import dataclass

import httpx

from .config import get_default_config


DEFAULT_OWNER = "dev@localhost"
_AUTH_CACHE_TTL_SECONDS = 20.0
_AUTH_CACHE_MAX_ENTRIES = 1024
_AUTH_CACHE: dict[str, tuple[float, OpenHandsUser | None]] = {}
_MISS = object()
_logger = logging.getLogger("integrations_hub.auth")


@dataclass(frozen=True)
class OpenHandsUser:
    id: str
    org_id: str
    email: str
    role: str
    permissions: tuple[str, ...]


_DEV_USER = OpenHandsUser(
    id="dev-user-id",
    org_id="dev-org-id",
    email=DEFAULT_OWNER,
    role="owner",
    permissions=("manage_items",),
)


def admin_email_set() -> frozenset[str]:
    """Return the set of admin email addresses from config."""
    return frozenset(get_default_config().app_admin_emails)


def is_admin_owner(owner_id: str) -> bool:
    """Check if the given owner ID is an admin."""
    return get_default_config().is_admin_email(owner_id)


def reset_auth_cache() -> None:
    _AUTH_CACHE.clear()


def _cache_lookup(key: str) -> OpenHandsUser | None | object:
    entry = _AUTH_CACHE.get(key)
    if entry is None:
        return _MISS
    expires_at, user = entry
    if expires_at <= time.monotonic():
        _AUTH_CACHE.pop(key, None)
        return _MISS
    return user


def _cache_store(key: str, value: OpenHandsUser | None) -> None:
    if len(_AUTH_CACHE) >= _AUTH_CACHE_MAX_ENTRIES:
        try:
            _AUTH_CACHE.pop(next(iter(_AUTH_CACHE)), None)
        except StopIteration:
            pass
    _AUTH_CACHE[key] = (time.monotonic() + _AUTH_CACHE_TTL_SECONDS, value)


def _parse_user(payload: object) -> OpenHandsUser | None:
    if not isinstance(payload, dict):
        return None
    user_id = payload.get("id")
    org_id = payload.get("org_id")
    email = payload.get("email")
    if not isinstance(user_id, str) or not user_id:
        return None
    if not isinstance(org_id, str) or not org_id:
        return None
    if not isinstance(email, str) or not email:
        return None
    role = payload.get("role")
    permissions = payload.get("permissions")
    return OpenHandsUser(
        id=user_id,
        org_id=org_id,
        email=email,
        role=role if isinstance(role, str) else "",
        permissions=tuple(
            item for item in (permissions or []) if isinstance(item, str)
        ),
    )


def _call_openhands_users_me(token: str) -> OpenHandsUser | None:
    cfg = get_default_config()
    if cfg.disable_auth:
        return _DEV_USER
    if not cfg.openhands_base_url:
        _logger.warning(
            "OpenHands auth requested but INTHUB_OPENHANDS_BASE_URL is unset"
        )
        return None
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                cfg.openhands_user_me_url,
                headers={"Authorization": f"Bearer {token}"},
            )
    except httpx.RequestError as exc:
        _logger.warning("OpenHands auth request failed: %s", exc)
        return None
    if response.status_code in {401, 403}:
        return None
    if not response.is_success:
        _logger.warning("OpenHands auth returned status %s", response.status_code)
        return None
    try:
        return _parse_user(response.json())
    except ValueError:
        return None


def authenticate_token(token: str) -> OpenHandsUser | None:
    token = token.strip()
    if not token:
        return None
    cached = _cache_lookup(token)
    if cached is not _MISS:
        return cached if isinstance(cached, OpenHandsUser) else None
    user = _call_openhands_users_me(token)
    _cache_store(token, user)
    return user
