"""Static file serving for SPA mode (K8s/Docker deployments).

When INTHUB_STATIC_DIR is set, FastAPI serves the pre-built Next.js SPA.
On Vercel, leave this unset since Vercel's CDN handles static files.

Usage:
    INTHUB_STATIC_DIR=/app/out uvicorn backend.app.main:app
"""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .config import get_default_config


logger = logging.getLogger(__name__)


def mount_static_files(app: FastAPI) -> bool:
    """Mount static file serving if INTHUB_STATIC_DIR is configured.

    Uses FastAPI's StaticFiles with html=True for SPA-style routing.
    The mount is registered at "/" which acts as a catch-all for unmatched
    routes, so API routes registered before this call take precedence.
    """
    config = get_default_config()
    static_dir = config.static_dir

    if not static_dir:
        return False

    static_path = Path(static_dir)
    if not static_path.exists() or not static_path.is_dir():
        logger.warning("INTHUB_STATIC_DIR=%s is not a valid directory", static_dir)
        return False

    logger.info("Mounting static files from %s", static_dir)

    # Mount the entire static directory with html=True for SPA routing
    # This automatically serves index.html for directories
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="spa")

    return True
