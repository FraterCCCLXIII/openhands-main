# Agent Context Layer

A FastAPI MVP for a unified agent-facing context layer.

## Features
- Single context endpoint for registered APIs and MCP-style integrations
- Integration-level and function-level enable/disable controls
- Agent-class permissions with scope checks
- Dynamic access requests that can be approved for limited time and scope
- Notification fanout to email, in-app, and SMS channels
- Admin website with session login and optional Google OAuth support

## Quick start
```bash
python -m pip install -e .[dev]
uvicorn agent_context_layer.app:create_app --factory --reload
```

## Tests
```bash
pytest
```
