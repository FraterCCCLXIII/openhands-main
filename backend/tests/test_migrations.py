from __future__ import annotations

import importlib


class CapturingOp:
    def __init__(self) -> None:
        self.statements: list[str] = []

    def execute(self, statement: str) -> None:
        self.statements.append(" ".join(statement.split()))


def test_0002_adds_permission_profiles_and_backfills_agent_key_profiles(
    monkeypatch,
) -> None:
    migration = importlib.import_module(
        "backend.alembic.versions.20260609_0002_permission_profiles"
    )
    capture = CapturingOp()
    monkeypatch.setattr(migration, "op", capture)

    migration.upgrade()

    joined = "\n".join(capture.statements)
    assert migration.revision == "0002"
    assert migration.down_revision == "0001"
    assert "CREATE TABLE IF NOT EXISTS permission_profiles" in joined
    assert "ALTER TABLE permission_profiles ALTER COLUMN name DROP NOT NULL" in joined
    assert (
        "ALTER TABLE agent_api_keys ADD COLUMN IF NOT EXISTS profile_id TEXT" in joined
    )
    assert (
        "INSERT INTO permission_profiles (id, owner_id, name, snapshot, created_at, updated_at)"
        in joined
    )
    assert "UPDATE agent_api_keys AS keys SET profile_id = profiles.id" in joined
    assert (
        "ALTER TABLE agent_api_keys DROP CONSTRAINT IF EXISTS agent_api_keys_pkey"
        in joined
    )
    assert "ALTER TABLE agent_api_keys ALTER COLUMN profile_id SET NOT NULL" in joined
    assert "CREATE UNIQUE INDEX IF NOT EXISTS agent_api_keys_profile_id_idx" in joined

    add_column_index = joined.index(
        "ALTER TABLE agent_api_keys ADD COLUMN IF NOT EXISTS profile_id TEXT"
    )
    drop_name_not_null_index = joined.index(
        "ALTER TABLE permission_profiles ALTER COLUMN name DROP NOT NULL"
    )
    insert_default_profile_index = joined.index(
        "INSERT INTO permission_profiles (id, owner_id, name, snapshot, created_at, updated_at)"
    )
    backfill_index = joined.index(
        "UPDATE agent_api_keys AS keys SET profile_id = profiles.id"
    )
    not_null_index = joined.index(
        "ALTER TABLE agent_api_keys ALTER COLUMN profile_id SET NOT NULL"
    )
    assert add_column_index < backfill_index < not_null_index
    assert drop_name_not_null_index < insert_default_profile_index

    capture.statements.clear()
    migration.downgrade()

    joined = "\n".join(capture.statements)
    assert "DROP INDEX IF EXISTS agent_api_keys_profile_id_idx" in joined
    assert "ALTER TABLE agent_api_keys DROP COLUMN IF EXISTS profile_id" in joined
    assert "DROP TABLE IF EXISTS permission_profiles" in joined


def test_0003_keeps_existing_permission_profile_history_compatible(
    monkeypatch,
) -> None:
    migration = importlib.import_module(
        "backend.alembic.versions.20260611_0003_permission_profiles_compat"
    )
    capture = CapturingOp()
    monkeypatch.setattr(migration, "op", capture, raising=False)

    migration.upgrade()
    migration.downgrade()

    assert migration.revision == "0003"
    assert migration.down_revision == "0002"
    assert capture.statements == []


def test_0004_adds_icon_columns_to_managed_connectors(monkeypatch) -> None:
    migration = importlib.import_module(
        "backend.alembic.versions.20260624_0004_managed_connectors_icon_columns"
    )
    capture = CapturingOp()
    monkeypatch.setattr(migration, "op", capture)

    migration.upgrade()

    joined = "\n".join(capture.statements)
    assert migration.revision == "0004"
    assert migration.down_revision == "0003"
    assert "ALTER TABLE managed_connectors" in joined
    assert "ADD COLUMN IF NOT EXISTS icon_bg TEXT" in joined
    assert "ADD COLUMN IF NOT EXISTS icon_color TEXT" in joined

    capture.statements.clear()
    migration.downgrade()

    joined = "\n".join(capture.statements)
    assert "DROP COLUMN IF EXISTS icon_color" in joined
    assert "DROP COLUMN IF EXISTS icon_bg" in joined


def test_0008_adds_connection_resources_and_backfills_bindings(monkeypatch) -> None:
    migration = importlib.import_module(
        "backend.alembic.versions.20260710_0008_multi_connection_resources"
    )
    capture = CapturingOp()
    monkeypatch.setattr(migration, "op", capture)

    migration.upgrade()

    joined = "\n".join(capture.statements)
    assert migration.revision == "0008"
    assert migration.down_revision == "0007"
    assert (
        "ALTER TABLE integration_connections ADD COLUMN IF NOT EXISTS connection_id TEXT"
        in joined
    )
    assert "CREATE TABLE IF NOT EXISTS connection_resources" in joined
    assert (
        "ALTER TABLE tool_invocations ADD COLUMN IF NOT EXISTS connection_id TEXT"
        in joined
    )
    assert "jsonb_build_object('connectionId', connection.connection_id)" in joined
    assert "jsonb_build_object('resourceId', resource.id)" in joined

    capture.statements.clear()
    migration.downgrade()

    joined = "\n".join(capture.statements)
    assert "DROP TABLE IF EXISTS connection_resources" in joined
    assert (
        "ALTER TABLE integration_connections DROP COLUMN IF EXISTS connection_id"
        in joined
    )
    assert (
        "ALTER TABLE managed_connectors DROP COLUMN IF EXISTS connection_model"
        in joined
    )


class CapturingResult:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows

    def mappings(self) -> list[dict[str, object]]:
        return self.rows


class CapturingBind:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows
        self.statements: list[str] = []
        self.params: list[dict[str, object] | None] = []

    def execute(
        self, statement: object, params: dict[str, object] | None = None
    ) -> CapturingResult:
        normalized = " ".join(str(statement).split())
        self.statements.append(normalized)
        self.params.append(params)
        if normalized.startswith("SELECT profile_id, api_key"):
            return CapturingResult(self.rows)
        return CapturingResult([])


class CapturingOpWithBind(CapturingOp):
    def __init__(self, bind: CapturingBind) -> None:
        super().__init__()
        self.bind = bind

    def get_bind(self) -> CapturingBind:
        return self.bind


class CapturingCredentialBind(CapturingBind):
    def __init__(
        self,
        rows: list[dict[str, object]],
        encrypted_rows: list[dict[str, object]] | None = None,
        verifier_rows: list[dict[str, object]] | None = None,
        encrypted_verifier_rows: list[dict[str, object]] | None = None,
    ) -> None:
        super().__init__(rows)
        self.encrypted_rows = encrypted_rows or []
        self.verifier_rows = verifier_rows or []
        self.encrypted_verifier_rows = encrypted_verifier_rows or []

    def execute(
        self, statement: object, params: dict[str, object] | None = None
    ) -> CapturingResult:
        normalized = " ".join(str(statement).split())
        self.statements.append(normalized)
        self.params.append(params)
        if "SELECT owner_id, key, credentials FROM owner_integrations" in normalized:
            return CapturingResult(self.rows)
        if (
            "SELECT owner_id, key, encrypted_credentials FROM owner_integrations"
            in normalized
        ):
            return CapturingResult(self.encrypted_rows)
        if "SELECT state, code_verifier FROM oauth_states" in normalized:
            return CapturingResult(self.verifier_rows)
        if "SELECT state, encrypted_code_verifier FROM oauth_states" in normalized:
            return CapturingResult(self.encrypted_verifier_rows)
        return CapturingResult([])


def test_0007_overwrites_existing_agent_keys(monkeypatch) -> None:
    migration = importlib.import_module(
        "backend.alembic.versions.20260628_0007_agent_api_key_hashes"
    )
    legacy_key = "cla_legacy_plaintext_agent_key"
    bind = CapturingBind(
        [
            {"profile_id": "profile-1", "api_key": legacy_key},
        ]
    )
    capture = CapturingOpWithBind(bind)
    monkeypatch.setattr(migration, "op", capture)
    monkeypatch.setattr(
        migration,
        "_try_encrypt_agent_key",
        lambda value: f"encrypted:{value}",
    )

    migration.upgrade()

    joined = "\n".join(capture.statements + bind.statements)
    assert migration.revision == "0007"
    assert migration.down_revision == "0006"
    assert "RAISE EXCEPTION" not in joined
    assert (
        "ALTER TABLE agent_api_keys ADD COLUMN IF NOT EXISTS api_key_hash TEXT"
        in joined
    )
    assert (
        "ALTER TABLE agent_api_keys ADD COLUMN IF NOT EXISTS key_prefix TEXT" in joined
    )
    assert (
        "ALTER TABLE agent_api_keys ADD COLUMN IF NOT EXISTS key_suffix TEXT" in joined
    )
    assert (
        "ALTER TABLE agent_api_keys ADD COLUMN IF NOT EXISTS encrypted_api_key TEXT"
        in joined
    )
    assert "SELECT profile_id, api_key FROM agent_api_keys" in joined
    assert "UPDATE agent_api_keys SET api_key = :api_key" in joined
    assert "CREATE UNIQUE INDEX IF NOT EXISTS agent_api_keys_api_key_hash_idx" in joined

    update_params = next(params for params in bind.params if params)
    expected_hash = migration._hash_key(legacy_key)
    assert update_params == {
        "profile_id": "profile-1",
        "api_key": f"hashed:{expected_hash[:32]}",
        "api_key_hash": expected_hash,
        "key_prefix": legacy_key[:12],
        "key_suffix": legacy_key[-4:],
        "encrypted_api_key": f"encrypted:{legacy_key}",
    }

    capture.statements.clear()
    bind.statements.clear()
    bind.params.clear()
    migration.downgrade()

    joined = "\n".join(capture.statements)
    assert "DROP INDEX IF EXISTS agent_api_keys_api_key_hash_idx" in joined
    assert (
        "ALTER TABLE agent_api_keys DROP COLUMN IF EXISTS encrypted_api_key" in joined
    )
    assert "ALTER TABLE agent_api_keys DROP COLUMN IF EXISTS key_suffix" in joined
    assert "ALTER TABLE agent_api_keys DROP COLUMN IF EXISTS key_prefix" in joined
    assert "ALTER TABLE agent_api_keys DROP COLUMN IF EXISTS api_key_hash" in joined


def test_0008_encrypts_legacy_static_integration_credentials(monkeypatch) -> None:
    migration = importlib.import_module(
        "backend.alembic.versions.20260710_0008_encrypt_static_integration_credentials"
    )
    bind = CapturingCredentialBind(
        [
            {
                "owner_id": "owner@example.com",
                "key": "private-api",
                "credentials": {"secret": "legacy-secret"},
            }
        ],
        encrypted_rows=[
            {
                "owner_id": "owner@example.com",
                "key": "private-api",
                "encrypted_credentials": "encrypted:legacy-secret",
            }
        ],
    )
    capture = CapturingOpWithBind(bind)
    monkeypatch.setattr(migration, "op", capture)
    monkeypatch.setattr(
        migration,
        "_encrypt_credentials",
        lambda value: f"encrypted:{value['secret']}",
    )
    monkeypatch.setattr(
        migration,
        "_decrypt_credentials",
        lambda value: {"secret": value.removeprefix("encrypted:")},
    )

    migration.upgrade()

    joined = "\n".join(capture.statements + bind.statements)
    assert migration.revision == "0008"
    assert migration.down_revision == "0007"
    assert (
        "ALTER TABLE owner_integrations ADD COLUMN IF NOT EXISTS encrypted_credentials TEXT"
        in joined
    )
    assert "SELECT owner_id, key, credentials FROM owner_integrations" in joined
    assert "SET credentials = '{}'::jsonb" in joined
    credential_params = [params for params in bind.params if params is not None]
    assert credential_params[-1] == {
        "owner_id": "owner@example.com",
        "key": "private-api",
        "encrypted_credentials": "encrypted:legacy-secret",
    }

    capture.statements.clear()
    bind.statements.clear()
    bind.params.clear()
    migration.downgrade()

    joined = "\n".join(capture.statements + bind.statements)
    assert (
        "SELECT owner_id, key, encrypted_credentials FROM owner_integrations" in joined
    )
    assert "SET credentials = CAST(:credentials AS jsonb)" in joined
    credential_params = [params for params in bind.params if params is not None]
    assert credential_params[-1] == {
        "owner_id": "owner@example.com",
        "key": "private-api",
        "credentials": '{"secret":"legacy-secret"}',
    }
    assert (
        "ALTER TABLE owner_integrations DROP COLUMN IF EXISTS encrypted_credentials"
        in joined
    )


def test_0008_encrypts_legacy_oauth_pkce_verifiers(monkeypatch) -> None:
    migration = importlib.import_module(
        "backend.alembic.versions.20260710_0008_encrypt_static_integration_credentials"
    )
    bind = CapturingCredentialBind(
        [],
        encrypted_rows=[],
        verifier_rows=[
            {"state": "state-abc", "code_verifier": "plaintext-verifier"},
        ],
        encrypted_verifier_rows=[
            {"state": "state-abc", "encrypted_code_verifier": "encrypted-verifier"},
        ],
    )
    capture = CapturingOpWithBind(bind)
    monkeypatch.setattr(migration, "op", capture)
    monkeypatch.setattr(
        migration,
        "_encrypt_verifier",
        lambda value: f"encrypted:{value}",
    )
    monkeypatch.setattr(
        migration,
        "_decrypt_verifier",
        lambda value: value.removeprefix("encrypted:"),
    )

    migration.upgrade()

    joined = "\n".join(capture.statements + bind.statements)
    assert (
        "ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS encrypted_code_verifier TEXT"
        in joined
    )
    assert "SELECT state, code_verifier FROM oauth_states" in joined
    assert "SET code_verifier = NULL" in joined
    verifier_params = [params for params in bind.params if params is not None]
    assert verifier_params[-1] == {
        "state": "state-abc",
        "encrypted_code_verifier": "encrypted:plaintext-verifier",
    }

    capture.statements.clear()
    bind.statements.clear()
    bind.params.clear()
    migration.downgrade()

    joined = "\n".join(capture.statements + bind.statements)
    assert "SELECT state, encrypted_code_verifier FROM oauth_states" in joined
    assert "SET code_verifier = :code_verifier" in joined
    verifier_params = [params for params in bind.params if params is not None]
    assert verifier_params[-1] == {
        "state": "state-abc",
        "code_verifier": "encrypted-verifier",
    }
    assert (
        "ALTER TABLE oauth_states DROP COLUMN IF EXISTS encrypted_code_verifier"
        in joined
    )
    assert (
        "ALTER TABLE owner_integrations DROP COLUMN IF EXISTS encrypted_credentials"
        in joined
    )
