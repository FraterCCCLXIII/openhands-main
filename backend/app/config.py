"""Centralized configuration for the Integrations Hub backend.

This module provides a single source of truth for all environment-based
configuration. Access via `get_default_config()`.

Pattern follows the agent server config from the OpenHands SDK:
https://github.com/OpenHands/software-agent-sdk/blob/main/openhands-agent-server/openhands/agent_server/config.py
"""

from __future__ import annotations

import os
from typing import ClassVar

from openhands.agent_server.env_parser import from_env
from pydantic import BaseModel, ConfigDict, Field, SecretStr


# Environment variable prefix for all config fields
ENVIRONMENT_VARIABLE_PREFIX = "INTHUB"

# HTTP header for internal service-to-service auth
INTERNAL_AUTH_HEADER = "x-integrations-hub-internal-secret"


def _default_postgres_url() -> str | None:
    """Get database URL from environment with fallback.

    Checks INTHUB_POSTGRES_URL first (via from_env), then falls back to
    legacy POSTGRES_URL and DATABASE_URL environment variables.
    """
    return os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL") or None


def _default_internal_auth_secret() -> SecretStr | None:
    """Get internal auth secret with fallbacks to Auth.js secrets.

    Checks INTHUB_INTERNAL_AUTH_SECRET first (via from_env), then falls back
    to legacy environment variables.
    """
    secret = (
        os.getenv("INTEGRATIONS_HUB_INTERNAL_SECRET")
        or os.getenv("AUTH_SECRET")
        or os.getenv("NEXTAUTH_SECRET")
        or ""
    ).strip()
    return SecretStr(secret) if secret else None


def _default_cron_secret() -> SecretStr | None:
    """Get cron secret for scheduled job authentication."""
    secret = (os.getenv("CRON_SECRET") or "").strip()
    return SecretStr(secret) if secret else None


def _default_app_admin_emails() -> list[str]:
    """Parse admin emails from comma-separated environment variable."""
    raw = os.getenv("APP_ADMIN_EMAILS", "")
    return [email.strip().lower() for email in raw.split(",") if email.strip()]


def _default_credential_encryption_key() -> SecretStr | None:
    """Get credential encryption key for encrypting stored secrets."""
    key = (os.getenv("CREDENTIAL_ENCRYPTION_KEY") or "").strip()
    return SecretStr(key) if key else None


class Config(BaseModel):
    """Immutable configuration for the Integrations Hub backend.

    All settings are loaded from environment variables using the SDK's
    from_env() parser with prefix INTHUB. Legacy environment variable
    names are supported via default_factory fallbacks.

    Environment variables:
        INTHUB_POSTGRES_URL: Database connection URL
        INTHUB_DISABLE_AUTH: Set to "true" to bypass auth (default: false)
        INTHUB_INTERNAL_AUTH_SECRET: Service-to-service auth secret
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
        default=False,
        description=(
            "Bypass authentication for local development. Set INTHUB_DISABLE_AUTH=true "
            "to enable."
        ),
    )
    internal_auth_secret: SecretStr | None = Field(
        default_factory=_default_internal_auth_secret,
        description=(
            "Internal service-to-service authentication secret. Reads from "
            "INTHUB_INTERNAL_AUTH_SECRET with fallback to AUTH_SECRET "
            "or NEXTAUTH_SECRET."
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
        default=None,
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

    The config is created once from environment variables using the SDK's
    from_env() parser with prefix INTHUB, then cached. Legacy environment
    variable names (without prefix) are supported via default_factory fallbacks.

    Use reset_config() to clear the cache (useful for testing).
    """
    global _default_config
    if _default_config is None:
        _default_config = from_env(Config, ENVIRONMENT_VARIABLE_PREFIX)
    return _default_config


def reset_config() -> None:
    """Clear the cached config. Useful for testing."""
    global _default_config
    _default_config = None


# Backwards compatibility aliases
IntegrationsHubConfig = Config
get_config = get_default_config
