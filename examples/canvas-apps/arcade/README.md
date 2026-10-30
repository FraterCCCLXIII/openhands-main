# Arcade

A Canvas App with a game picker and a stage that runs the selected game in a sandboxed iframe. The page is also available as a drawer tab and in the left nav.

| Game | Status | Where it runs |
|---|---|---|
| Kamiji pet game | ready | Static build shipped in this app at `/kamiji-experiments/kamiji-game/index.html` (no network calls found in the bundle). |
| Yakopop | external | Live at https://yakopop.com, which sends `X-Frame-Options: SAMEORIGIN`, so it cannot be framed. The card shows an "Open in new tab" button instead. It is a learning platform; the Yakopop World game has no web build here. |
| Kamikin | coming soon | Godot slice and Kosmos engine port only; the Kamiji repo notes "Kamikin has no web build". `play.kamikin.com` is planned, not live. |
| Kosmica | coming soon | Prototype on the Kosmos engine; `kosmicagame.com` (waitlist site) did not respond. |

Add a game by editing `GAMES` in `extension.js`: `{ id, title, description, url, kind: "local" | "remote", status: "ready" | "coming-soon" | "external", note }`. Local games use same-origin paths the app serves (for example from `public/`).

The last game played is remembered in `localStorage` under `canvas-extension-arcade:v1`. The iframe is only focused after you press Play. Tests: `npm install && npm test`.
