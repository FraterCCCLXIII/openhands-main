from __future__ import annotations

from typing import Any

from psycopg.types.json import Jsonb

from backend.app.crypto import decrypt_credentials, encrypt_credentials
from backend.app.models import IntegrationSpec
from backend.app.repository import Repository


class ConfigEnvFixtureProtocol:
    def __call__(self, key: str, value: str | None) -> None: ...


def integration_with_credentials(credentials: dict[str, Any]) -> IntegrationSpec:
    return IntegrationSpec(
        key="private-api",
        name="Private API",
        kind="api",
        provider="http",
        authStrategy="api_key",
        config={"apiBaseUrl": "https://api.example.com"},
        credentials=credentials,
        tools={},
    )


def database_row(
    *, credentials: dict[str, Any], encrypted: str | None
) -> dict[str, Any]:
    return {
        "owner_id": "owner@example.com",
        "key": "private-api",
        "name": "Private API",
        "kind": "api",
        "provider": "http",
        "auth_strategy": "api_key",
        "enabled": True,
        "fine_grained_permissions": True,
        "config": {"apiBaseUrl": "https://api.example.com"},
        "credentials": credentials,
        "encrypted_credentials": encrypted,
        "functions": {},
    }


def test_save_integration_encrypts_static_credentials_for_database_storage(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-encryption-key")
    repo = Repository()
    writes: list[tuple[str, tuple[object, ...]]] = []
    credentials = {"headerName": "X-API-Key", "secret": "super-secret"}

    monkeypatch.setattr(
        repo,
        "execute_db",
        lambda query, params=(): writes.append((query, params)),
    )

    saved = repo.save_integration(
        "owner@example.com", integration_with_credentials(credentials)
    )

    assert saved.credentials == {}
    assert len(writes) == 1
    query, params = writes[0]
    assert "encrypted_credentials" in query
    assert isinstance(params[9], Jsonb)
    assert params[9].obj == {}
    assert decrypt_credentials(str(params[10])) == credentials
    assert "super-secret" not in query


def test_get_integration_decrypts_static_credentials_from_database(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-encryption-key")
    repo = Repository()
    credentials = {"secret": "stored-encrypted-secret"}

    monkeypatch.setattr(
        repo,
        "db_rows",
        lambda *_args, **_kwargs: [
            database_row(credentials={}, encrypted=encrypt_credentials(credentials))
        ],
    )

    integration = repo.get_integration("owner@example.com", "private-api")

    assert integration is not None
    assert integration.credentials == credentials


def test_list_integrations_does_not_decrypt_or_return_credentials(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", None)
    repo = Repository()

    monkeypatch.setattr(
        repo,
        "db_rows",
        lambda *_args, **_kwargs: [
            database_row(credentials={}, encrypted="not-a-valid-ciphertext")
        ],
    )

    integrations = repo.list_integrations("owner@example.com")

    assert len(integrations) == 1
    assert integrations[0].credentials == {}


def test_get_integration_backfills_legacy_plaintext_credentials(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-encryption-key")
    repo = Repository()
    credentials = {"secret": "legacy-plaintext-secret"}
    writes: list[tuple[str, tuple[object, ...]]] = []

    monkeypatch.setattr(
        repo,
        "db_rows",
        lambda *_args, **_kwargs: [
            database_row(credentials=credentials, encrypted=None)
        ],
    )
    monkeypatch.setattr(
        repo,
        "execute_db",
        lambda query, params=(): writes.append((query, params)),
    )

    integration = repo.get_integration("owner@example.com", "private-api")

    assert integration is not None
    assert integration.credentials == credentials
    assert len(writes) == 1
    query, params = writes[0]
    assert "SET credentials = %s, encrypted_credentials = %s" in query
    assert isinstance(params[0], Jsonb)
    assert params[0].obj == {}
    assert decrypt_credentials(str(params[1])) == credentials


def _oauth_state_row(
    *, code_verifier: str | None, encrypted_verifier: str | None
) -> dict[str, Any]:
    return {
        "state": "state-123",
        "owner_id": "dev@localhost",
        "integration_key": "gh",
        "provider": "gh",
        "code_verifier": code_verifier,
        "encrypted_code_verifier": encrypted_verifier,
        "redirect_to": "/integrations",
        "redirect_uri": "https://testserver/api/oauth/gh/callback",
        "callback_url": None,
        "created_at": "2026-01-01T00:00:00Z",
        "expires_at": "2099-01-01T00:00:00Z",
    }


def test_save_oauth_state_encrypts_pkce_verifier_for_database_storage(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-encryption-key")
    repo = Repository()
    writes: list[tuple[str, tuple[object, ...]]] = []
    verifier = "pkce-verifier-secret-value"

    monkeypatch.setattr(
        repo, "execute_db", lambda query, params=(): writes.append((query, params))
    )

    repo.save_oauth_state(
        state="state-123",
        owner_id="dev@localhost",
        integration_key="gh",
        provider="gh",
        code_verifier=verifier,
        redirect_to="/integrations",
        redirect_uri="https://testserver/api/oauth/gh/callback",
        callback_url=None,
        expires_at="2099-01-01T00:00:00Z",
    )

    assert len(writes) == 1
    query, params = writes[0]
    assert "encrypted_code_verifier" in query
    assert "code_verifier = NULL" in query
    encrypted_verifier = params[4]
    assert decrypt_credentials(str(encrypted_verifier)) == {"code_verifier": verifier}
    assert verifier not in query


def test_save_oauth_state_stores_null_verifier_when_absent(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-encryption-key")
    repo = Repository()
    writes: list[tuple[str, tuple[object, ...]]] = []

    monkeypatch.setattr(
        repo, "execute_db", lambda query, params=(): writes.append((query, params))
    )

    repo.save_oauth_state(
        state="state-456",
        owner_id="dev@localhost",
        integration_key="gh",
        provider="gh",
        code_verifier=None,
        redirect_to="/integrations",
        redirect_uri="https://testserver/api/oauth/gh/callback",
        callback_url=None,
        expires_at="2099-01-01T00:00:00Z",
    )

    assert len(writes) == 1
    _, params = writes[0]
    assert params[4] is None


def test_consume_oauth_state_decrypts_pkce_verifier_from_database(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-encryption-key")
    repo = Repository()
    verifier = "stored-pkce-verifier"

    monkeypatch.setattr(
        repo,
        "db_rows",
        lambda *_args, **_kwargs: [
            _oauth_state_row(
                code_verifier=None,
                encrypted_verifier=encrypt_credentials({"code_verifier": verifier}),
            )
        ],
    )

    record = repo.consume_oauth_state("state-123", "gh")

    assert record is not None
    assert record.codeVerifier == verifier


def test_consume_oauth_state_returns_none_verifier_when_no_encrypted_value(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-encryption-key")
    repo = Repository()

    monkeypatch.setattr(
        repo,
        "db_rows",
        lambda *_args, **_kwargs: [
            _oauth_state_row(code_verifier=None, encrypted_verifier=None)
        ],
    )

    record = repo.consume_oauth_state("state-123", "gh")

    assert record is not None
    assert record.codeVerifier is None
