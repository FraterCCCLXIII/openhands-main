"""Centralized configuration for the Integrations Hub backend.

This module provides a single source of truth for all environment-based
configuration. Access via `get_default_config()`.

Pattern follows the agent server config shape from the OpenHands SDK while
parsing this app's documented environment variables directly.
"""

from __future__ import annotations

import json
import os
from typing import ClassVar

from pydantic import BaseModel, ConfigDict, Field, SecretStr


# Environment variable prefix for all config fields.
ENVIRONMENT_VARIABLE_PREFIX = "INTHUB"


def _default_postgres_url() -> str | None:
    """Get database URL from environment with fallback.

    Checks INTHUB_POSTGRES_URL first, then falls back to legacy POSTGRES_URL
    and DATABASE_URL environment variables.
    """
    return (
        _optional_env("INTHUB_POSTGRES_URL")
        or os.getenv("POSTGRES_URL")
        or os.getenv("DATABASE_URL")
        or None
    )


def _default_cron_secret() -> SecretStr | None:
    """Get cron secret for scheduled job authentication."""
    secret = (
        _optional_env("INTHUB_CRON_SECRET") or os.getenv("CRON_SECRET") or ""
    ).strip()
    return SecretStr(secret) if secret else None


def _default_app_admin_emails() -> list[str]:
    """Parse admin emails from comma-separated environment variable."""
    raw = os.getenv("INTHUB_APP_ADMIN_EMAILS")
    if raw is None:
        raw = os.getenv("APP_ADMIN_EMAILS", "")
    return _parse_email_list(raw)


def _default_credential_encryption_key() -> SecretStr | None:
    """Get credential encryption key for encrypting stored secrets."""
    key = (
        _optional_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY")
        or os.getenv("CREDENTIAL_ENCRYPTION_KEY")
        or ""
    ).strip()
    return SecretStr(key) if key else None


def _optional_env(key: str) -> str | None:
    value = os.getenv(key)
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _parse_bool(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _parse_email_list(value: str) -> list[str]:
    raw = value.strip()
    if not raw:
        return []
    if raw.startswith("["):
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = []
        if isinstance(parsed, list):
            return [
                str(email).strip().lower() for email in parsed if str(email).strip()
            ]
    return [email.strip().lower() for email in raw.split(",") if email.strip()]


def _default_static_dir() -> str | None:
    return _optional_env("INTHUB_STATIC_DIR") or _optional_env("STATIC_DIR")


def _default_openhands_base_url() -> str | None:
    return _optional_env("INTHUB_OPENHANDS_BASE_URL") or _optional_env(
        "OPENHANDS_BASE_URL"
    )


class Config(BaseModel):
    """Immutable configuration for the Integrations Hub backend.

    All settings are loaded from environment variables with prefix INTHUB.
    Legacy environment variable names are supported via default_factory
    fallbacks.

    Environment variables:
        INTHUB_POSTGRES_URL: Database connection URL
        INTHUB_DISABLE_AUTH: Set to "true" to bypass auth (default: false)
        INTHUB_OPENHANDS_BASE_URL: OpenHands base URL for session validation
        INTHUB_CRON_SECRET: Secret for cron job authentication
        INTHUB_APP_ADMIN_EMAILS: Comma-separated admin email addresses
        INTHUB_CREDENTIAL_ENCRYPTION_KEY: Key for encrypting stored credentials
        INTHUB_STATIC_DIR: Directory for pre-built SPA files (K8s mode only)
    """

    # Database
    postgres_url: str | None = Field(
        default_factory=_default_postgres_url,
        description=(
            "Primary Postgres connection URL. Reads from INTHUB_POSTGRES_URL, "
            "with fallback to POSTGRES_URL or DATABASE_URL."
        ),
    )

    # Authentication
    disable_auth: bool = Field(
        default_factory=lambda: _parse_bool(os.getenv("INTHUB_DISABLE_AUTH")),
        description=(
            "Bypass authentication for local development. Set INTHUB_DISABLE_AUTH=true "
            "to enable."
        ),
    )
    openhands_base_url: str | None = Field(
        default_factory=_default_openhands_base_url,
        description=(
            "OpenHands base URL used to validate session cookies and API keys. "
            "Reads from INTHUB_OPENHANDS_BASE_URL with fallback to OPENHANDS_BASE_URL."
        ),
    )
    cron_secret: SecretStr | None = Field(
        default_factory=_default_cron_secret,
        description=(
            "Secret for authenticating cron job requests. Reads from INTHUB_CRON_SECRET "
            "with fallback to CRON_SECRET."
        ),
    )

    # Admin
    app_admin_emails: list[str] = Field(
        default_factory=_default_app_admin_emails,
        description=(
            "List of admin email addresses (comma-separated). Reads from "
            "INTHUB_APP_ADMIN_EMAILS with fallback to APP_ADMIN_EMAILS."
        ),
    )

    # Encryption
    credential_encryption_key: SecretStr | None = Field(
        default_factory=_default_credential_encryption_key,
        description=(
            "Key for encrypting stored provider credentials. Reads from "
            "INTHUB_CREDENTIAL_ENCRYPTION_KEY with fallback to CREDENTIAL_ENCRYPTION_KEY. "
            "Required for OAuth and credential storage."
        ),
    )

    # Static file serving (K8s mode)
    static_dir: str | None = Field(
        default_factory=_default_static_dir,
        description=(
            "Directory containing pre-built Next.js SPA static files. When set, "
            "FastAPI serves the SPA directly (for K8s/Docker deployments). "
            "Leave unset on Vercel where CDN handles static files."
        ),
    )

    model_config: ClassVar[ConfigDict] = ConfigDict(frozen=True)

    def is_admin_email(self, email: str | None) -> bool:
        """Check if an email address belongs to an admin."""
        if not email:
            return False
        return email.strip().lower() in self.app_admin_emails

    @property
    def openhands_user_me_url(self) -> str:
        if not self.openhands_base_url:
            return ""
        return f"{self.openhands_base_url.rstrip('/')}/api/v1/users/me"

    def require_credential_encryption_key(self) -> str:
        """Get the credential encryption key or raise an error if not configured."""
        if not self.credential_encryption_key:
            raise RuntimeError(
                "INTHUB_CREDENTIAL_ENCRYPTION_KEY (or CREDENTIAL_ENCRYPTION_KEY) must be "
                "configured to encrypt stored provider credentials."
            )
        return self.credential_encryption_key.get_secret_value()

    def require_cron_secret(self) -> str:
        """Get the cron secret or raise an error if not configured."""
        if not self.cron_secret:
            raise RuntimeError(
                "INTHUB_CRON_SECRET (or CRON_SECRET) must be configured for the "
                "expire-grants cron route."
            )
        return self.cron_secret.get_secret_value()


# Singleton config instance
_default_config: Config | None = None


def get_default_config() -> Config:
    """Get the default config shared across the application.

    The config is created once from environment variables, then cached.
    Legacy environment variable names (without prefix) are supported via
    default_factory fallbacks.

    Use reset_config() to clear the cache (useful for testing).
    """
    global _default_config
    if _default_config is None:
        _default_config = Config()
    return _default_config


def reset_config() -> None:
    """Clear the cached config. Useful for testing."""
    global _default_config
    _default_config = None


# Backwards compatibility aliases
IntegrationsHubConfig = Config
get_config = get_default_config
