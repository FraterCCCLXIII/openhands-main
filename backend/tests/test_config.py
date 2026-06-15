from __future__ import annotations

from backend.app.config import get_default_config


def test_prefixed_admin_emails_accept_comma_separated_values(config_env) -> None:
    config_env("APP_ADMIN_EMAILS", "legacy@example.com")
    config_env("INTHUB_APP_ADMIN_EMAILS", "Admin@Example.com, ops@example.com")

    config = get_default_config()

    assert config.app_admin_emails == ["admin@example.com", "ops@example.com"]


def test_prefixed_admin_emails_accept_json_arrays(config_env) -> None:
    config_env("INTHUB_APP_ADMIN_EMAILS", '["Admin@Example.com", "ops@example.com"]')

    config = get_default_config()

    assert config.app_admin_emails == ["admin@example.com", "ops@example.com"]


def test_prefixed_secret_and_database_values_override_legacy(config_env) -> None:
    config_env("POSTGRES_URL", "postgres://legacy")
    config_env("INTHUB_POSTGRES_URL", "postgres://prefixed")
    config_env("AUTH_SECRET", "legacy-secret")
    config_env("INTHUB_INTERNAL_AUTH_SECRET", "prefixed-secret")
    config_env("CREDENTIAL_ENCRYPTION_KEY", "legacy-encryption-key")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "prefixed-encryption-key")
    config_env("INTHUB_DISABLE_AUTH", "true")

    config = get_default_config()

    assert config.postgres_url == "postgres://prefixed"
    assert config.disable_auth is True
    assert config.internal_auth_secret is not None
    assert config.internal_auth_secret.get_secret_value() == "prefixed-secret"
    assert config.credential_encryption_key is not None
    assert (
        config.credential_encryption_key.get_secret_value() == "prefixed-encryption-key"
    )
