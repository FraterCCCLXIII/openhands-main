"""Alembic environment configuration for integrations-hub migrations.

This module configures Alembic to run migrations using SQLAlchemy's
connection management with psycopg as the underlying driver.
"""

from __future__ import annotations

import os
from logging.config import fileConfig

from sqlalchemy import create_engine, pool

from alembic import context


# Alembic Config object for access to .ini file values
config = context.config

# Set up Python logging from the config file
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def get_database_url() -> str:
    """Get the database URL from environment variables.

    Follows the same fallback chain as the application config.
    Converts to postgresql+psycopg:// for SQLAlchemy with psycopg3 driver.
    """
    url = (
        os.getenv("INTHUB_POSTGRES_URL")
        or os.getenv("POSTGRES_URL")
        or os.getenv("DATABASE_URL")
    )
    if not url:
        raise RuntimeError(
            "Database URL not configured. Set INTHUB_POSTGRES_URL, POSTGRES_URL, "
            "or DATABASE_URL environment variable."
        )
    # Convert to SQLAlchemy URL with psycopg3 driver
    # postgres:// or postgresql:// -> postgresql+psycopg://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This generates SQL scripts without connecting to the database.
    """
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=None,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Creates a connection to the database and runs migrations.
    """
    url = get_database_url()

    # Create engine with NullPool for serverless compatibility
    connectable = create_engine(url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=None,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
