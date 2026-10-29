# Connectome memory

An App for Agent Canvas. It shows the options for the overlap index and a dashboard of Canvas conversations, local memory indexes, and saved eval files.

The chat model stays the profile already selected in Agent Canvas. These options change how much history is dropped and which notes are recalled into that model's prompt. Embeddings stay on local Ollama.

This package targets Canvas extension schema 1 and host API 1. The page is local-only in one respect: index files and eval results are read through a loopback service, because the Agent Server does not store them.

## Run the local service

From the Connectome-Alpha repo, with the project virtualenv:

```sh
PYTHONPATH=. python -m openhands_app.sidecar
```

It listens on `http://127.0.0.1:8765` only. Starting it is separate from installing or enabling the app.

## Page

`/extensions/connectome-memory/memory`

Nested routes: `/options`, `/tests`, and `/conversations/<id>`.

## Install

In Agent Canvas, add the app from this directory on the machine that runs the Agent Server:

`/Users/paulbloch/Connectome-Alpha/openhands_app`

For a git checkout of this repo, the app path inside the repo is `openhands_app`. Leave the app disabled until you have read the source. Enabling runs `extension.js` inside Canvas.

## Check

```sh
node /Users/paulbloch/.openhands/cache/skills/public-skills/skills/canvas-extension-api/scripts/validate-extension.mjs /Users/paulbloch/Connectome-Alpha/openhands_app
node --test openhands_app/test/extension.test.mjs
PYTHONPATH=. python -m pytest tests/test_openhands_app.py
```
