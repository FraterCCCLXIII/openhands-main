# AGENTS.md

## Repository purpose
This repository contains an MVP "agent context layer" service built with FastAPI. It provides a single context endpoint across registered APIs and MCP-style integrations, agent-class permissions, temporary approval-based grants, notification fanout, and a small admin UI.

## Common commands
- Install dependencies: `python -m pip install -e .[dev]`
- Run app: `uvicorn agent_context_layer.app:create_app --factory --reload`
- Run tests: `pytest`

## Architecture notes
- `agent_context_layer.models` defines the domain objects.
- `agent_context_layer.services` contains the in-memory store, access-control logic, approval flow, and execution adapters.
- `agent_context_layer.auth` contains optional Google OAuth support plus a dev login for local testing.
- `agent_context_layer.app` wires the FastAPI routes and the admin UI.
