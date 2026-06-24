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
