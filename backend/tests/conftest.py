"""Pytest configuration for backend tests."""
from __future__ import annotations

from typing import Protocol

import pytest

from backend.app.config import reset_config


class ConfigEnvFixture(Protocol):
    """Type for the config_env fixture callable."""

    def __call__(self, key: str, value: str | None = ...) -> None:
        """Set or delete an environment variable and reset config.

        Args:
            key: Environment variable name
            value: Value to set, or None to delete the variable
        """
        ...


@pytest.fixture(autouse=True)
def reset_config_after_test():
    """Reset config cache after each test to prevent state leakage."""
    yield
    reset_config()


@pytest.fixture
def config_env(monkeypatch) -> ConfigEnvFixture:
    """Fixture for setting/deleting environment variables that affect config.

    Usage:
        def test_something(config_env):
            config_env("INTHUB_DISABLE_AUTH", "true")  # Set a value
            config_env("INTHUB_APP_ADMIN_EMAILS")      # Delete (value=None)
            # Config is automatically reset after each change
            ...
    """

    def setter(key: str, value: str | None = None) -> None:
        if value is None:
            monkeypatch.delenv(key, raising=False)
        else:
            monkeypatch.setenv(key, value)
        reset_config()  # Immediately reset so new config picks up change

    return setter
