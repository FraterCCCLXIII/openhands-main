# Hangout

A Canvas App for talking to your agents like teammates.

- **Agents list** (left): Kamiji hand avatars, name, role and model, the PR or ticket
  each agent is on (GitHub, GitLab, Jira, Linear or a bare key) with its state and
  `+added −removed` diff. Search, and a View menu that mirrors the left-nav
  conversation list: organise by workspace or recent activity, sort by updated,
  created or name, nest/flatten/hide subagent trees, hide older conversations,
  filter automations and tags. Active filters show as chips you can clear.
- **Chat** (middle): header and composer stay pinned. The composer has the factory
  composer's pieces: a drag grip, auto-growing field, send-to target menu, attach
  files, model chip, dictation where the browser supports it, `/` commands
  (`/card`, `/status`, `/plan`, `/file`) and Enter to send.
- **Drawer** (right): Arco UI cards the agent generates (a fenced `json` block with
  `statCard`, `taskCard`, `calendarCard`, `weatherCard`, `musicPlayerCard`,
  `codeBlock`, `terminalBlock`, `textBlock` or `formBlock`, validated before
  drawing), plus Screen, Files, Terminal, Browser, Webview, VS Code, Planner and
  Tasks tabs built from the conversation's events.
- **Views** (toggle in the chat header): Chat, Preview (a browser pane beside the
  chat), Computer (the agent's desktop with a "has control / Take over" switch) and
  Studio, an editor for each agent's Kamiji face: 27 shapes in four groups, 16
  expressions, 12 colours, PNG export. "Powered by Kamiji and Kosmos" sits under it.

Sample agents show the layout; with a reachable Agent Server your 40 most recent
conversations appear as agents, and messages are posted to
`POST /api/conversations/{id}/events` with `run: true`. Screen, routines and the
Computer view are previews until agents publish them.

Install from Customize, then Apps, using this folder's path. Tests:
`npx vitest run --root examples/canvas-apps/hangout --environment jsdom`.
