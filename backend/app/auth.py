from __future__ import annotations

import os

DEFAULT_OWNER = "dev@localhost"


def admin_email_set() -> set[str]:
    return {email.strip().lower() for email in os.getenv("APP_ADMIN_EMAILS", "").split(",") if email.strip()}


def is_admin_owner(owner_id: str) -> bool:
    return owner_id.lower() in admin_email_set()
