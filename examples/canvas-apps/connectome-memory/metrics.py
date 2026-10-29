"""
Read memory indexes and saved eval files for the Canvas dashboard.

The overlap index stores means and cell lists that are only useful to
the condenser. The dashboard needs counts: how many notes, which role
said them, and whether centering has been fit. Eval JSON files are the
same. A gate file holds every turn; this module keeps the summary and
drops the rows.
"""

from __future__ import annotations

import json
from pathlib import Path

PREVIEW_NOTES = 3
PREVIEW_CHARS = 160


def scan_memory(root: Path) -> list[dict]:
    """One summary per ``index.json`` under ``root``, including ``root`` itself.

    Subdirectories are one conversation each. The root file is the
    single-directory layout the condenser uses when it is given the
    memory root directly.
    """
    root = root.expanduser()
    found: list[dict] = []
    if not root.is_dir():
        return found
    direct = root / "index.json"
    if direct.is_file():
        found.append(summarize_index(direct, conversation_id="default"))
    for child in sorted(root.iterdir()):
        index = child / "index.json"
        if child.is_dir() and index.is_file():
            found.append(summarize_index(index, conversation_id=child.name))
    return found


def summarize_index(path: Path, conversation_id: str) -> dict:
    """Counts and a short preview. Means and cell lists stay on disk."""
    payload = json.loads(path.read_text())
    notes = payload.get("notes") or []
    roles: dict[str, int] = {}
    characters = 0
    preview: list[str] = []
    for note in notes:
        text = str(note.get("text") or "")
        characters += len(text)
        role = text.split(":", 1)[0] if ":" in text else "Note"
        roles[role] = roles.get(role, 0) + 1
        if len(preview) < PREVIEW_NOTES and text:
            preview.append(text[:PREVIEW_CHARS])
    return {
        "id": conversation_id,
        "note_count": len(notes),
        "characters": characters,
        "roles": roles,
        "fitted": payload.get("mean") is not None,
        "preview": preview,
    }


def scan_results(directory: Path) -> list[dict]:
    """Summaries of eval JSON files, newest first. Row-level logs are omitted."""
    directory = directory.expanduser()
    if not directory.is_dir():
        return []
    files = sorted(directory.glob("*.json"), key=lambda path: path.stat().st_mtime, reverse=True)
    summaries = []
    for path in files[:20]:
        try:
            payload = json.loads(path.read_text())
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(payload, dict):
            summaries.append(summarize_result(path.name, payload))
    return summaries


def summarize_result(name: str, payload: dict) -> dict:
    """Pick the headline numbers from a gate, a correction session, or a bake-off."""
    summary = {"name": name, "kind": "file", "figures": []}
    memory = (payload.get("results") or {}).get("memory") if isinstance(payload.get("results"), dict) else None
    if isinstance(memory, dict) and "accuracy" in memory:
        summary["kind"] = "gate"
        summary["figures"] = [
            _figure("Recall", _pct(memory.get("accuracy"))),
            _figure("Tokens / turn", _num(memory.get("tokens_per_turn_mean"))),
            _figure("Tokens total", _int_text(memory.get("tokens_total"))),
            _figure("Questions", _int_text(memory.get("n_questions"))),
        ]
        return summary
    if "passed" in payload and "n" in payload and "rows" in payload:
        summary["kind"] = "corrections"
        summary["figures"] = [
            _figure("Passed", f"{payload.get('passed')}/{payload.get('n')}"),
            _figure("Links", f"{payload.get('link_ok')}/{payload.get('n')}"),
            _figure("New values", f"{payload.get('value_ok')}/{payload.get('n')}"),
        ]
        return summary
    retrievers = payload.get("retrievers")
    if isinstance(retrievers, dict):
        summary["kind"] = "bakeoff"
        for retriever_name, row in retrievers.items():
            if not isinstance(row, dict):
                continue
            summary["figures"].append(
                _figure(
                    str(retriever_name),
                    f"R@1 {_pct(row.get('recall_at_1'))} · ans {_pct(row.get('answer_accuracy'))}",
                )
            )
        return summary
    summary["figures"] = [_figure("File", name)]
    return summary


def _figure(label: str, value: str) -> dict:
    return {"label": label, "value": value}


def _pct(value: object) -> str:
    try:
        return f"{float(value) * 100:.1f}%"
    except (TypeError, ValueError):
        return "—"


def _num(value: object) -> str:
    try:
        return f"{float(value):.1f}"
    except (TypeError, ValueError):
        return "—"


def _int_text(value: object) -> str:
    try:
        return f"{int(value):,}"
    except (TypeError, ValueError):
        return "—"
