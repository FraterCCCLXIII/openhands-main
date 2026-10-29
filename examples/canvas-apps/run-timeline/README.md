# Run Timeline

A Canvas App that shows where the time went in an OpenHands run. It adds a routed **Run Timeline** page at `/extensions/run-timeline/timeline`.

It pairs each action with its observation into a span and lays the spans out as a waterfall, next to messages and errors. Click a row for the arguments, result, exit code, risk and event id.

## Sources

- **A live conversation**: choose one from the list. The page reads its events through the Agent Server (`GET /api/conversations/search`, `GET /api/conversations/{id}/events/search`), up to 2,000 events, and refreshes every 10 seconds while the conversation is running.
- **An imported file**: **Import log** reads an OpenHands CLI headless JSONL stream, an SDK event JSON file (a single event, an array, or an object with `events`), or the same with a capture time beside each event. The file is read in the browser and never uploaded.

## Evidence rules

These follow the [Runward](https://github.com/K-kiron/runward) project (MIT), a local timeline viewer that reads the same OpenHands formats offline. No Runward code is included here; this is a separate implementation of the same rules.

- An action with no observation is **open**: no result was observed. It does not mean the tool is still running.
- A result with no matching action creates no interval, only a warning.
- An error flag, a nonzero exit code or a rejection marks a step failed. Message text never decides success or failure.
- A timestamp with an offset is the producer's own time. A timestamp without a timezone is used only with a capture time (`runwardObservedAt`); otherwise the event is skipped and counted in a warning. Live Agent Server events are read as UTC, as the chat does.
- Time **between steps** is model and orchestration time together and is not split further. Time inside overlapping steps is merged, not added.
- Up to 5,000 steps and 32 MiB of imported text are read. Detail text is clipped to 4,000 characters. Imported logs are not scrubbed: do not share raw ones.

## Package

Dependency-free Canvas Extension, manifest schema 1, host API 1, entrypoint `extension.js`. Install it from **Customize → Apps → Add app** with this directory as the path, then enable it.

## Verify

```sh
npx vitest run examples/canvas-apps/run-timeline/extension.test.js --environment jsdom
```
