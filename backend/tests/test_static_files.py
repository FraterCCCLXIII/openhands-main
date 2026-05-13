"""Tests for static file serving module."""
from __future__ import annotations

import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.static_files import mount_static_files


def test_mount_static_files_returns_false_when_static_dir_unset() -> None:
    """Verify mount_static_files returns False when INTHUB_STATIC_DIR is unset."""
    app = FastAPI()

    with patch("app.static_files.get_default_config") as mock_config:
        mock_config.return_value.static_dir = None
        result = mount_static_files(app)

    assert result is False


def test_mount_static_files_returns_false_for_nonexistent_path(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Verify mount_static_files returns False and logs warning for non-existent path."""
    app = FastAPI()

    with patch("app.static_files.get_default_config") as mock_config:
        mock_config.return_value.static_dir = "/nonexistent/path/that/does/not/exist"
        result = mount_static_files(app)

    assert result is False
    assert "is not a valid directory" in caplog.text


def test_mount_static_files_succeeds_with_valid_directory() -> None:
    """Verify mount_static_files returns True and mounts when given valid directory."""
    app = FastAPI()

    with tempfile.TemporaryDirectory() as tmpdir:
        # Create an index.html for the SPA
        Path(tmpdir, "index.html").write_text("<html><body>SPA</body></html>")

        with patch("app.static_files.get_default_config") as mock_config:
            mock_config.return_value.static_dir = tmpdir
            result = mount_static_files(app)

        assert result is True

        # Verify the mount was added
        client = TestClient(app)
        response = client.get("/")
        assert response.status_code == 200
        assert "SPA" in response.text


def test_api_routes_take_precedence_over_static_mount() -> None:
    """Verify API routes registered before mount take precedence."""
    app = FastAPI()

    # Register an API route BEFORE mounting static files
    @app.get("/api/test")
    def api_test() -> dict[str, str]:
        return {"status": "ok"}

    with tempfile.TemporaryDirectory() as tmpdir:
        # Create an index.html for the SPA
        Path(tmpdir, "index.html").write_text("<html><body>SPA</body></html>")

        with patch("app.static_files.get_default_config") as mock_config:
            mock_config.return_value.static_dir = tmpdir
            result = mount_static_files(app)

        assert result is True

        client = TestClient(app)

        # API route should still work (takes precedence)
        api_response = client.get("/api/test")
        assert api_response.status_code == 200
        assert api_response.json() == {"status": "ok"}

        # Static files should also work
        static_response = client.get("/")
        assert static_response.status_code == 200
        assert "SPA" in static_response.text
