from __future__ import annotations

from .config import get_default_config


DEFAULT_OWNER = "dev@localhost"


def admin_email_set() -> frozenset[str]:
    """Return the set of admin email addresses from config."""
    return get_default_config().app_admin_emails


def is_admin_owner(owner_id: str) -> bool:
    """Check if the given owner ID is an admin."""
    return get_default_config().is_admin_email(owner_id)
