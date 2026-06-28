from __future__ import annotations

import pytest

from backend.app.config import get_default_config, reset_config


def test_config_reads_only_prefixed_environment(monkeypatch) -> None:
    monkeypatch.setenv("INTHUB_POSTGRES_URL", "postgres://prefixed-db")
    monkeypatch.setenv("INTHUB_CRON_SECRET", "prefixed-cron-secret")
    monkeypatch.setenv(
        "INTHUB_APP_ADMIN_EMAILS",
        "Admin@Example.com, second-admin@example.com ",
    )
    monkeypatch.setenv("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "prefixed-key")
    reset_config()

    config = get_default_config()

    assert config.postgres_url == "postgres://prefixed-db"
    assert config.cron_secret
    assert config.cron_secret.get_secret_value() == "prefixed-cron-secret"
    assert config.admin_email_list == ["admin@example.com", "second-admin@example.com"]
    assert config.is_admin_email("ADMIN@example.com")
    assert config.require_credential_encryption_key() == "prefixed-key"
    assert config.require_cron_secret() == "prefixed-cron-secret"


def test_config_ignores_unprefixed_legacy_env_names(monkeypatch) -> None:
    """Unprefixed legacy env names must never populate backend config."""
    monkeypatch.delenv("INTHUB_POSTGRES_URL", raising=False)
    monkeypatch.delenv("INTHUB_CRON_SECRET", raising=False)
    monkeypatch.delenv("INTHUB_APP_ADMIN_EMAILS", raising=False)
    monkeypatch.delenv("INTHUB_CREDENTIAL_ENCRYPTION_KEY", raising=False)
    monkeypatch.setenv("POSTGRES_URL", "postgres://legacy-db")
    monkeypatch.setenv("DATABASE_URL", "postgres://legacy-database-url")
    monkeypatch.setenv("CRON_SECRET", "legacy-cron-secret")
    monkeypatch.setenv("APP_ADMIN_EMAILS", "admin@example.com")
    monkeypatch.setenv("CREDENTIAL_ENCRYPTION_KEY", "legacy-key")
    monkeypatch.setenv("OPENHANDS_BASE_URL", "https://legacy.example.com")
    reset_config()

    config = get_default_config()

    assert config.postgres_url is None
    assert config.openhands_base_url is None
    assert config.admin_email_list == []
    assert not config.is_admin_email("admin@example.com")
    assert config.cron_secret is None
    assert config.credential_encryption_key is None
    with pytest.raises(RuntimeError, match="INTHUB_CREDENTIAL_ENCRYPTION_KEY"):
        config.require_credential_encryption_key()
    with pytest.raises(RuntimeError, match="INTHUB_CRON_SECRET"):
        config.require_cron_secret()


def test_config_raises_when_sensitive_secrets_are_not_configured(monkeypatch) -> None:
    monkeypatch.delenv("INTHUB_CREDENTIAL_ENCRYPTION_KEY", raising=False)
    monkeypatch.delenv("INTHUB_CRON_SECRET", raising=False)
    reset_config()

    config = get_default_config()

    with pytest.raises(RuntimeError, match="INTHUB_CREDENTIAL_ENCRYPTION_KEY"):
        config.require_credential_encryption_key()
    with pytest.raises(RuntimeError, match="INTHUB_CRON_SECRET"):
        config.require_cron_secret()


def test_prefixed_admin_emails_accept_comma_separated_values(config_env) -> None:
    config_env("INTHUB_APP_ADMIN_EMAILS", "Admin@Example.com, ops@example.com")

    config = get_default_config()

    assert config.admin_email_list == ["admin@example.com", "ops@example.com"]


def test_prefixed_admin_emails_accept_json_arrays(config_env) -> None:
    config_env("INTHUB_APP_ADMIN_EMAILS", '["Admin@Example.com", "ops@example.com"]')

    config = get_default_config()

    assert config.admin_email_list == ["admin@example.com", "ops@example.com"]


def test_blank_prefixed_secret_is_unconfigured(config_env) -> None:
    """A blank/whitespace INTHUB_* secret resolves to None, not an empty secret.

    Operators who copy `.env.example` (which ships blank `INTHUB_*=` lines) to
    `.env` must not silently configure empty secrets.
    """
    config_env("INTHUB_CRON_SECRET", "  ")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "")

    config = get_default_config()

    assert config.cron_secret is None
    assert config.credential_encryption_key is None
    with pytest.raises(RuntimeError, match="INTHUB_CREDENTIAL_ENCRYPTION_KEY"):
        config.require_credential_encryption_key()
    with pytest.raises(RuntimeError, match="INTHUB_CRON_SECRET"):
        config.require_cron_secret()


def test_nonempty_prefixed_secret_is_used_verbatim(config_env) -> None:
    """A real prefixed secret value is used as-is (not blank-stripped away)."""
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "real-key")

    config = get_default_config()

    assert config.require_credential_encryption_key() == "real-key"
