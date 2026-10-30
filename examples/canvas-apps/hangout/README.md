# Hangout

A Canvas App for talking to your agents like teammates. Three panes: a list of
agents with their latest update, a chat with the one you pick, and that agent's
screen and routines.

- **Sample agents** (Chief of Staff, EA, Inbox Manager, and so on) show the
  layout. Their threads, screen and routines are illustrative; messages you send
  to them are kept in this browser's localStorage.
- **Live conversations.** With a reachable Agent Server, your 20 most recent
  conversations appear at the top as agents, marked with a green dot. Their last messages
  come from `GET /api/conversations/{id}/events/search`. Sending a message posts
  a user message to `POST /api/conversations/{id}/events` with `run: true`.
- Screen and routines are a preview until agents publish them; routines will
  come from automations.

Install it from Customize, then Apps, using this folder's path. The page opens at
`/extensions/hangout/hangout`. Run the tests with
`npx vitest run --root examples/canvas-apps/hangout --environment jsdom`.
