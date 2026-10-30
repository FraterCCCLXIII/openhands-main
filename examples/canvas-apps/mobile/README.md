# Mobile

A Canvas App that is a landing page for the OpenHands mobile app. It adds a routed **Mobile app** page at `/extensions/mobile/mobile`.

The page shows a hero (app icon, pitch, honest status), four feature sections, **How pairing works**, and two buttons:

- **Pair your phone** opens Settings → Mobile (`/settings/mobile`), where Canvas shows the pairing QR code.
- **Mobile app setup** opens Settings → App (`/settings/app`), which has the clone and install commands.

## Where the content comes from

Every statement comes from the `openhands-mobile` repository (README, `app.json`, `src/`): QR pairing from Agent Canvas, typed host and session key as a fallback, conversations with live events, Customize (MCP servers, skills, plugins), Automations (dashboard, templates, run now, create-from-chat) and dictation in the composer. The repository has no screenshots, so the phone pictures are CSS drawings labelled as illustrations. There are no store links, ratings or download counts because none exist; the app is an Expo project you build and run from source. The embedded icon is the app's `assets/icon.png` scaled to 96px.

## Package

Dependency-free Canvas Extension, manifest schema 1, host API 1, entrypoint `extension.js`. Install it from **Customize → Apps → Add app** with this directory as the path, then enable it. Styles are scoped under `.mb` and use host theme tokens with fallbacks. The page fills the visible height below the host header.

## Verify

```sh
npx vitest run examples/canvas-apps/mobile/extension.test.js --environment jsdom
```
