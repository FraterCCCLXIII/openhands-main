# Kosmos Vox™

Voice for your agents, a Canvas App by Modern Telepathy. A voice workbench for the Kamiji voice stack: see which voice engines are installed and running, speak through a Kamiji avatar whose mouth follows the audio, listen, and talk to an agent conversation.

## The page

Two panes that fill the page height (a grip between them is draggable and remembered); one column under 720 px.

**Engines (left).** One row per engine with a status pill (Running, Installed, Missing, or Not checked), a description, version and voice info, the port, Start and Stop buttons where they are safe, and an Install disclosure with the exact commands. Nothing is installed or started for you: Start runs only the command shown, when you press it, through the Agent Server, and the output appears in the Command log.

| Engine | Port | Running means | Installed means | Start |
|---|---|---|---|---|
| Browser voice | n/a | n/a | `speechSynthesis` exists (voice count shown) | n/a |
| Kamiji voice server (Kokoro, Qwen3-TTS) | 4650, 4653 | `GET http://127.0.0.1:4650/` answers within 1.5 s | `~/.kamiji-voice/venv` python and the Kokoro model are present | `<kamiji>/tools/voice-server/run.sh start` (also Stop, Status) |
| Browser listening | n/a | n/a | `SpeechRecognition` exists (the desktop app often lacks it; some browsers send audio to their vendor) | n/a |
| Whisper server (yakopop) | 4640 | `GET http://127.0.0.1:4640/` answers | venv python and `tools/stt/server.py` are present | `cd <yakopop> && ~/Kosmos/voice-server/.venv/bin/python tools/stt/server.py --port 4640` (Stop only for a server started from here) |
| whisper.cpp | 8080 | not probed | `whisper-cli`, `whisper-server` and `~/.cache/whisper/ggml-base.en.bin` found | none: detected, not wired (its `/inference` route is not OpenAI-shaped) |
| Arco (Pipecat) | 4630 | `GET /status` answers (no-cors) | `~/Kosmos/voice-server/bot.py` and its venv | none, informational |
| System tools | n/a | n/a | `say`, `espeak-ng`, `ffmpeg` on the path (informational) | n/a |
| Wake word, Piper, voice cloning from a sample | n/a | n/a | Missing: not built (Piper is only listed if found, never wired) | n/a |

Running is found by HTTP probes (every 10 s while the tab is visible, and on Refresh). Installed is found by one read-only shell script run through the Agent Server (`POST /api/bash/start_bash_command`, then `GET /api/bash/bash_events/search?kind__eq=BashOutput&command_id__eq=<id>` until an output has an exit code). It runs at page open and on Refresh, never downloads or installs anything, and is skipped with "Detection needs the Agent Server" when the host has none (the HTTP probes still work). The Kamiji and yakopop folders for Start are found automatically or set under Settings.

**Speak.** Engine (Auto picks the Kamiji voice server when it answers, otherwise the Browser voice), voice (from `/v1/voices`, or the system voices), English or Japanese, speed, a "cute" slider for the browser voice (pitch and rate together), Qwen mood chips (only when Qwen answers), sample sentences and free text. A line at the top always says what is active ("Using: Browser voice · Listening: typed input").

**Listen.** Talk uses mic, then voice-activity detection, then the Whisper server when it is running; otherwise the browser's speech recognition; otherwise you type. Tick "Talk to the agent" and pick a conversation to send what you say to the Agent Server and speak the reply; without it the avatar repeats what you said. A strip shows speech-to-text, agent, and text-to-speech latency and which lip-sync source is active.

**Avatars.** Six Kamiji creatures (slime, cat, fox, bunny, bear, dragon), the Flux blob and a hand, all drawn in this file.

## Lip-sync ladder

Server `x-visemes` (Kokoro) → word-boundary events (browser voice) → level of the played audio (Qwen, using `x-speech` to keep silence closed) → a gentle wiggle. With `prefers-reduced-motion` the mouth is only open or closed and changes at most 8 times a second.

## Fallbacks

With no engine running the page still works: the Browser voice speaks, and typed input replaces the mic. Audio only goes to the localhost engines (the browser's own recognition is the exception, and is labelled).

## Not built

Wake word, Piper, voice cloning from an uploaded sample, whisper.cpp wiring, barge-in, streaming speech (one sentence per request). The mic may be blocked inside the Canvas frame (untested there). The voice servers allow only localhost origins (CORS).

Install from Customize → Apps with this folder's path. The engine block in `extension.js` (between the ENGINE markers) is copied to `kamiji/packages/kosmos-vox/engine.js`. See TRADEMARKS.md and NOTICE.md. Tests: `npm install && npm test`.
