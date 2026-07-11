from __future__ import annotations

import psycopg
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.repository import Repository, repository


class ConfigEnvFixtureProtocol:
    def __call__(self, key: str, value: str | None) -> None: ...


def test_live_endpoint_does_not_depend_on_database(monkeypatch) -> None:
    monkeypatch.setattr(
        repository,
        "database_ready",
        lambda: (_ for _ in ()).throw(AssertionError("live must not check the DB")),
    )

    response = TestClient(app).get("/api/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "backend": "fastapi"}


def test_ready_endpoint_requires_database(monkeypatch) -> None:
    monkeypatch.setattr(repository, "database_ready", lambda: False)

    response = TestClient(app).get("/api/ready")

    assert response.status_code == 503
    assert response.json()["detail"] == "Database is not ready."


def test_ready_endpoint_returns_success_when_database_is_available(monkeypatch) -> None:
    monkeypatch.setattr(repository, "database_ready", lambda: True)

    response = TestClient(app).get("/api/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready", "backend": "fastapi"}


def test_database_ready_checks_the_configured_database(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    repo = Repository()
    queries: list[str] = []

    def fake_db_rows(query: str, _params: tuple[object, ...] = ()):
        queries.append(query)
        return [{"ready": 1}]

    monkeypatch.setattr(repo, "db_rows", fake_db_rows)

    assert repo.database_ready()
    assert queries == ["SELECT 1 AS ready"]


def test_database_ready_returns_false_without_database(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", None)
    repo = Repository()
    monkeypatch.setattr(
        repo,
        "db_rows",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            AssertionError("missing database must not be queried")
        ),
    )

    assert not repo.database_ready()


def test_database_ready_returns_false_when_database_query_fails(
    config_env: ConfigEnvFixtureProtocol, monkeypatch
) -> None:
    config_env("INTHUB_POSTGRES_URL", "postgres://test")
    repo = Repository()
    monkeypatch.setattr(
        repo,
        "db_rows",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(
            psycopg.OperationalError("database is unavailable")
        ),
    )

    assert not repo.database_ready()
