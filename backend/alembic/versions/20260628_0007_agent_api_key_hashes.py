"""Add hash/encrypted metadata for agent API keys.

Revision ID: 0007
Revises: 0006
Create Date: 2026-06-28
"""

from __future__ import annotations

from alembic import op


revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | None = None
depends_on: str | None = None


def _assert_no_existing_agent_keys() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM agent_api_keys LIMIT 1) THEN
                RAISE EXCEPTION 'agent_api_keys must be empty before migration 0007; rotate/delete existing agent keys before applying hashed storage';
            END IF;
        END $$;
    """)


def upgrade() -> None:
    _assert_no_existing_agent_keys()

    op.execute("ALTER TABLE agent_api_keys ADD COLUMN IF NOT EXISTS api_key_hash TEXT")
    op.execute("ALTER TABLE agent_api_keys ADD COLUMN IF NOT EXISTS key_prefix TEXT")
    op.execute("ALTER TABLE agent_api_keys ADD COLUMN IF NOT EXISTS key_suffix TEXT")
    op.execute(
        "ALTER TABLE agent_api_keys ADD COLUMN IF NOT EXISTS encrypted_api_key TEXT"
    )
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS agent_api_keys_api_key_hash_idx
        ON agent_api_keys (api_key_hash)
        WHERE api_key_hash IS NOT NULL
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS agent_api_keys_api_key_hash_idx")
    op.execute("ALTER TABLE agent_api_keys DROP COLUMN IF EXISTS encrypted_api_key")
    op.execute("ALTER TABLE agent_api_keys DROP COLUMN IF EXISTS key_suffix")
    op.execute("ALTER TABLE agent_api_keys DROP COLUMN IF EXISTS key_prefix")
    op.execute("ALTER TABLE agent_api_keys DROP COLUMN IF EXISTS api_key_hash")
