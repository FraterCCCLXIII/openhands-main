from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from .models import ManagedConnector
from .repository import repository


CATALOG_SNAPSHOT_PATH = Path(__file__).with_name("integration_catalog_snapshot.json")


@lru_cache(maxsize=1)
def integration_catalog_snapshot() -> dict:
    return json.loads(CATALOG_SNAPSHOT_PATH.read_text())


@lru_cache(maxsize=1)
def default_managed_connectors() -> tuple[ManagedConnector, ...]:
    return tuple(
        ManagedConnector(**connector)
        for connector in integration_catalog_snapshot()["defaultManagedConnectors"]
    )


def default_managed_connector(slug: str) -> ManagedConnector | None:
    return next(
        (
            connector
            for connector in default_managed_connectors()
            if connector.slug == slug
        ),
        None,
    )


def get_managed_connector(slug: str) -> ManagedConnector | None:
    return repository.get_managed_connector(slug) or default_managed_connector(slug)


def list_managed_connectors(include_defaults: bool = True) -> list[ManagedConnector]:
    connectors = repository.list_managed_connectors()
    if include_defaults:
        registered = {connector.slug for connector in connectors}
        connectors = [
            *connectors,
            *[
                connector
                for connector in default_managed_connectors()
                if connector.slug not in registered
            ],
        ]
    return sorted(connectors, key=lambda connector: connector.name.lower())
