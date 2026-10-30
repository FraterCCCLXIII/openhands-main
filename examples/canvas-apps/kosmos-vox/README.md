# Kosmos Vox™

Voice for your agents, a Canvas App by Modern Telepathy. Talk, and it listens, sends your words to an agent conversation, then speaks the reply while an orb's mouth follows the audio.

Flow: mic → energy voice-activity detection (stops when you stop) → speech recognition → Agent Server conversation → sentence-by-sentence speech → animated orb.

| Stage | Default | Notes |
|---|---|---|
| Recognition | `http://127.0.0.1:4640/v1` (OpenAI-compatible `/audio/transcriptions`) | yakopop `tools/stt/server.py` (Whisper). A Qwen recognition server would drop in here. |
| Speech | `http://127.0.0.1:4650` Kamiji voice server, `qwen:girl-teen/happy@2` (Qwen3-TTS) | Falls back to the browser voice. The first call loads the model (about 10 to 20 s). |
| Agent | any conversation on the Agent Server | Pick it under Settings. |

Install from Customize → Apps with this folder's path, open Vox, pick a conversation, and press Start talking.

Limits: the mic may be blocked inside the Canvas frame (untested), speech is not streamed (whole sentence per request), no barge-in, and the voice and recognition servers must allow this origin (CORS).

The engine block in `extension.js` (between the ENGINE markers) is copied to `kamiji/packages/kosmos-vox/engine.js`. See TRADEMARKS.md and NOTICE.md. Tests: `npm install && npm test`.
