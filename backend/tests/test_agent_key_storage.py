from __future__ import annotations

from backend.app.crypto import encrypt_api_key
from backend.app.repository import Repository


class ConfigEnvFixtureProtocol:
    def __call__(self, key: str, value: str | None) -> None: ...


def test_agent_key_storage_marker_does_not_contain_secret() -> None:
    secret = "cla_super_secret_agent_key"

    marker = Repository.agent_key_storage_marker(secret)

    assert marker.startswith("hashed:")
    assert secret not in marker
    assert marker != secret


def test_stored_agent_key_value_prefers_encrypted_recoverable_key(
    config_env: ConfigEnvFixtureProtocol,
) -> None:
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-encryption-key")
    secret = "cla_recoverable_agent_key"
    row = {
        "api_key": Repository.agent_key_storage_marker(secret),
        "encrypted_api_key": encrypt_api_key(secret),
    }

    assert Repository.stored_agent_key_value(row) == secret


def test_stored_agent_key_value_returns_empty_on_decryption_failure() -> None:
    row = {"encrypted_api_key": "not-a-valid-ciphertext"}

    assert Repository.stored_agent_key_value(row) == ""


def test_stored_agent_key_value_does_not_recover_plaintext_rows() -> None:
    secret = "cla_legacy_plaintext_agent_key"

    assert Repository.stored_agent_key_value({"api_key": secret}) == ""


def test_find_agent_api_key_uses_hash_lookup_for_database_rows(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    secret = "cla_hash_lookup_key"
    repo = Repository()
    updates: list[tuple[str, tuple[object, ...]]] = []

    def fake_db_rows(query: str, params: tuple[object, ...] = ()):
        assert "k.api_key_hash = %s" in query
        assert params == (Repository.hash_key(secret),)
        return [
            {
                "owner_id": "owner@example.com",
                "api_key": Repository.agent_key_storage_marker(secret),
                "api_key_hash": Repository.hash_key(secret),
                "profile_id": "profile-1",
                "permission_profile_id": "profile-1",
                "permission_profile_name": "Default",
                "created_at": "2026-01-01T00:00:00Z",
                "updated_at": "2026-01-02T00:00:00Z",
            }
        ]

    monkeypatch.setattr(repo, "db_rows", fake_db_rows)
    monkeypatch.setattr(
        repo, "execute_db", lambda query, params=(): updates.append((query, params))
    )

    found = repo.find_agent_api_key(secret)

    assert found == {
        "ownerId": "owner@example.com",
        "apiKey": secret,
        "permissionProfileId": "profile-1",
        "permissionProfileName": "Default",
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-01-02T00:00:00Z",
    }
    assert updates == []


def test_ensure_permission_profile_api_key_returns_existing_key_on_conflict(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    config_env("INTHUB_CREDENTIAL_ENCRYPTION_KEY", "test-encryption-key")
    generated = "cla_freshly_generated_agent_key"
    existing = "cla_existing_agent_key"
    repo = Repository()
    calls: list[str] = []

    def fake_create_agent_key_value() -> str:
        return generated

    def fake_db_rows(query: str, params: tuple[object, ...] = ()):
        calls.append(query)
        if "INSERT INTO agent_api_keys" in query:
            assert "ON CONFLICT (profile_id) DO NOTHING" in query
            assert params[2] == Repository.agent_key_storage_marker(generated)
            return []
        assert "WHERE profile_id = %s" in query
        return [
            {
                "profile_id": "profile-1",
                "owner_id": "owner@example.com",
                "api_key": Repository.agent_key_storage_marker(existing),
                "api_key_hash": Repository.hash_key(existing),
                "encrypted_api_key": encrypt_api_key(existing),
                "key_prefix": existing[:12],
                "key_suffix": existing[-4:],
                "created_at": "2026-01-01T00:00:00Z",
                "updated_at": "2026-01-02T00:00:00Z",
            }
        ]

    monkeypatch.setattr(repo, "create_agent_key_value", fake_create_agent_key_value)
    monkeypatch.setattr(repo, "db_rows", fake_db_rows)

    row = repo.ensure_permission_profile_api_key("owner@example.com", "profile-1")

    assert row["api_key"] == existing
    assert len(calls) == 2


def test_find_agent_api_key_does_not_accept_plaintext_rows(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    secret = "cla_plaintext_agent_key"
    repo = Repository()

    def fake_db_rows(query: str, params: tuple[object, ...] = ()):
        assert "k.api_key_hash = %s" in query
        assert "k.api_key = %s" not in query
        assert params == (Repository.hash_key(secret),)
        return []

    monkeypatch.setattr(repo, "db_rows", fake_db_rows)
    monkeypatch.setattr(
        repo,
        "execute_db",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("plaintext fallback must not write back")
        ),
    )

    assert repo.find_agent_api_key(secret) is None
