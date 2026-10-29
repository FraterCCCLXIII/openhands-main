# Marketing Production

A Canvas App that plans marketing against the OpenHands product release schedule. It adds a routed **Marketing** page at `/extensions/marketing-production/production`.

## Views

- **Timeline**: a Gantt of OpenHands releases, feature launches, quarterly campaigns and production projects. Past releases are real (the v1.x series); later ones are projected weekly. Dashed lines link each campaign to the feature launches it supports. Month, quarter and year zoom.
- **Board**: items by status, with move back and move on.
- **Calendar**: a month grid of what is happening each day, with release counts.
- **List**: sortable, filterable table of everything.
- **Campaigns**: the next six quarters, flagging any quarter with no campaign, with each campaign's linked launches and how many days apart they are.
- **Map**: a nodal map. Each campaign is a module built from an agent template, connected to the 2D, 3D and Seedance video generators and to every connector. Select a campaign to see all it can connect to; click a generator to add an asset brief or a connector to switch it on or off for that campaign.
- **Assets**: 2D image, 3D model and Seedance video assets moving from brief to published, per campaign.
- **Templates**: agent campaign templates as `.md` instructions and `.json` briefs. Copy them, create a campaign from one, or run one with an agent.
- **Costs**: estimated asset generation cost per campaign from editable placeholder rates.
- **Connectors**: the connectors this plan will have: HubSpot, X, LinkedIn, Google Search Console, Google Analytics, Reddit, ad networks and Spotify. Resend is listed as not using. Nothing is connected yet and no credentials are entered.

## AI

**Plan with AI**, **Ask an agent** (per item and per campaign) and **Run with an agent** (per template) each open a prompt for review. Only **Start conversation** creates a conversation on the active Agent Server, and then opens it. The prompt asks the agent to answer with a plan JSON block. Paste it into **Plan JSON** and apply it to add or replace items and assets.

## Data

The plan is a sample you edit; it is stored in this browser's localStorage. **Plan JSON** shows, edits, applies and resets it. **Refresh releases** loads the release list from the GitHub API (`OpenHands/OpenHands`, v1.x tags); the bundled snapshot is from 2026-10-29.

## Templates

`templates/` holds the three templates as files. They are generated from `extension.js`, the source of truth (the entrypoint must stay one self-contained file):

```sh
node export-templates.mjs
```

## Package

Dependency-free Canvas Extension, manifest schema 1, host API 1, entrypoint `extension.js`. Install it from **Customize → Apps → Add app** with this directory as the path, then enable it.

## Verify

```sh
npx vitest run examples/canvas-apps/marketing-production/extension.test.js --environment jsdom
```
