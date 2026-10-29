"""
Loopback service for the Connectome memory Canvas app.

Host API 1 can call the Agent Server, and that server does not know
about overlap indexes or the eval files in this repo. This process is
the narrow local bridge: options, index summaries, and one allowlisted
unit-test command. It binds to 127.0.0.1 only. Installing the Canvas
app does not start it.
"""

from __future__ import annotations

import json
import subprocess
import sys
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from openhands_app.metrics import scan_memory, scan_results
from openhands_memory.options import (
    MemoryOptions,
    load_options,
    save_options,
    validate_options,
)

HOST = "127.0.0.1"
PORT = 8765
SERVICE = "connectome-memory-sidecar"
VERSION = "0.1.0"
REPO_ROOT = Path(__file__).resolve().parents[1]

# The dashboard may run tests. The map is the whole allowlist: the
# request names a suite, and the suite names files in this repo.
TEST_SUITES = {
    "memory": [
        "tests/test_openhands_memory.py",
        "tests/test_subject.py",
    ],
}


def create_server(port: int = PORT) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((HOST, port), Handler)


class Handler(BaseHTTPRequestHandler):
    server_version = SERVICE

    def log_message(self, fmt: str, *args) -> None:
        # The default log writes to stderr with the client address. Keep
        # a single line so an operator can see probes without a stack trace.
        sys.stderr.write("%s %s\n" % (self.command, self.path))

    def do_OPTIONS(self) -> None:
        self._send(204, b"")

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/health":
            self._json({"status": "ready", "service": SERVICE, "version": VERSION})
            return
        if path == "/options":
            self._json(_public_options(load_options()))
            return
        if path == "/metrics":
            self._json(metrics_payload())
            return
        self._error(404, "Unknown path.")

    def do_PUT(self) -> None:
        if urlparse(self.path).path != "/options":
            self._error(404, "Unknown path.")
            return
        try:
            payload = self._body()
            current = _public_options(load_options())
            current.update(payload)
            saved = save_options(validate_options(current))
        except ValueError as exc:
            self._error(400, str(exc))
            return
        except (json.JSONDecodeError, UnicodeError):
            self._error(400, "Options must be a JSON object.")
            return
        self._json(_public_options(saved))

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/tests/run":
            self._error(404, "Unknown path.")
            return
        try:
            payload = self._body()
        except ValueError as exc:
            self._error(400, str(exc))
            return
        except (json.JSONDecodeError, UnicodeError):
            self._error(400, "Body must be JSON.")
            return
        suite = payload.get("suite") if isinstance(payload, dict) else None
        files = TEST_SUITES.get(suite)
        if files is None:
            self._error(400, "suite must be 'memory'.")
            return
        self._json(run_suite(files))

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length") or "0")
        if length > 65_536:
            raise ValueError("Body is too large.")
        raw = self.rfile.read(length) if length else b"{}"
        payload = json.loads(raw.decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("Body must be a JSON object.")
        return payload

    def _json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode()
        self._send(status, body, "application/json")

    def _error(self, status: int, message: str) -> None:
        self._json({"error": message}, status)

    def _send(self, status: int, body: bytes, content_type: str = "text/plain") -> None:
        origin = self.headers.get("Origin")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if origin and _loopback_origin(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        if body:
            self.wfile.write(body)


def metrics_payload() -> dict:
    """Indexes under the saved root, eval summaries, and a short Ollama probe."""
    options = load_options()
    results_dir = _results_dir(options)
    return {
        "conversations": scan_memory(options.memory_path()),
        "tests": scan_results(results_dir),
        "ollama": probe_ollama(options.ollama_base_url, options.embed_model),
        "results_dir": str(results_dir),
        "memory_root": str(options.memory_path()),
    }


def probe_ollama(base_url: str, embed_model: str) -> dict:
    """Whether the embedding model is installed. The chat model is not involved."""
    try:
        with urllib.request.urlopen(f"{base_url.rstrip('/')}/api/tags", timeout=2) as resp:
            payload = json.loads(resp.read().decode())
    except Exception as exc:
        return {"ok": False, "detail": type(exc).__name__}
    names = [item.get("name", "") for item in payload.get("models") or []]
    present = any(name.split(":")[0] == embed_model for name in names)
    return {"ok": present, "models": names}


def run_suite(files: list[str]) -> dict:
    """Run one allowlisted pytest command. The request cannot choose the arguments."""
    command = [sys.executable, "-m", "pytest", "-q", *files]
    completed = subprocess.run(
        command,
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        timeout=180,
        check=False,
    )
    tail = (completed.stdout + completed.stderr).strip().splitlines()
    return {
        "ok": completed.returncode == 0,
        "returncode": completed.returncode,
        "command": "pytest " + " ".join(files),
        "tail": tail[-12:],
    }


def _results_dir(options: MemoryOptions) -> Path:
    if options.results_dir:
        return Path(options.results_dir).expanduser()
    return REPO_ROOT / "results"


def _public_options(options: MemoryOptions) -> dict:
    from dataclasses import asdict

    payload = asdict(options)
    payload["results_dir"] = payload["results_dir"] or str(REPO_ROOT / "results")
    return payload


def _loopback_origin(origin: str) -> bool:
    return origin.startswith("http://127.0.0.1:") or origin.startswith("http://localhost:")


def main() -> None:
    server = create_server()
    sys.stderr.write(f"{SERVICE} {VERSION} at http://{HOST}:{PORT}\n")
    server.serve_forever()


if __name__ == "__main__":
    main()
