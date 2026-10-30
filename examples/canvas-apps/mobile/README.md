# Mobile

A Canvas App that is a landing page for the OpenHands mobile app. It adds a routed **Mobile app** page at `/extensions/mobile/mobile`.

The page is a dark, full-bleed product page: a hero with the OpenHands logo, a very large headline, **Download** and **Pair your phone** buttons and a floating phone illustration; four scroll sections (pairing, conversations with dictation, Customize, Automations) with large phone drawings; a facts strip; **How pairing works**; a **Download** section (`#download`); and a closing call to action.

- **Download** (hero) scrolls to the Download section. That section says no prebuilt app is published yet and offers **Download from GitHub**, which opens the `OpenHands/openhands-mobile` repository, plus copyable commands (clone and install, `npm run ios:device`, `npm run android:device`, `npx eas build -p android --profile development`).
- **Pair your phone** opens Settings → Mobile (`/settings/mobile`), where Canvas shows the pairing QR code.
- **Mobile app setup** opens Settings → App (`/settings/app`), which has the clone and install commands.

## Where the content comes from

Every statement comes from the `openhands-mobile` repository (README, `app.json`, `src/`): QR pairing from Agent Canvas, typed host and session key as a fallback, conversations with live events, Customize (MCP servers, skills, plugins), Automations (dashboard, templates, run now, create-from-chat) and dictation in the composer. The repository has no screenshots, so the phone pictures are CSS drawings labelled as illustrations. There are no store links, ratings or download counts because none exist: the repository has no tag, release or built `.ipa`/`.apk`, so Download points at the source repository. The facts strip comes from `package.json`, `app.json`, `eas.json` and `ios/`. The hero shows the OpenHands logo (`public/favicon.svg`, inlined as an SVG data URL).

## Package

Dependency-free Canvas Extension, manifest schema 1, host API 1, entrypoint `extension.js`. Install it from **Customize → Apps → Add app** with this directory as the path, then enable it. Styles are scoped under `.mb`. The hero, feature sections and closing call to action are a fixed dark stage so contrast holds in light and dark host themes; the facts, pairing and Download sections use host theme tokens with fallbacks. Reveal, float and parallax motion are skipped under `prefers-reduced-motion` and without `IntersectionObserver`. The page fills the visible height below the host header.

## Verify

```sh
npx vitest run examples/canvas-apps/mobile/extension.test.js --environment jsdom
```
