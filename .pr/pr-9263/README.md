# PR #9263 port notes ("major updates")

Original: OpenHands/OpenHands#9263, branch `archive/openhands-pr-9263`, a single
draft commit from June 2025 (~102 files, +3387/-322) written against the old
monorepo layout (`frontend/src/...`, `config.toml.tmp`, `frontend/package*.json`).
That layout no longer exists (the frontend now lives at the repo root), so the
commit cannot be applied or squash-merged; its features were reviewed by hand.

## Features in the original PR and decisions

| Feature | Decision | Reason |
|---|---|---|
| Dark/light `ThemeProvider` + `ThemeToggle` (`context/theme-context.tsx`, `app-settings/theme-toggle.tsx`) | Skipped (superseded) | Current app has a full color-theme system (`src/themes/`, `ThemeInput` in `routes/app-settings.tsx`, sidebar appearance menu). |
| `/new-project` route, `new-project-chat-interface`, `new-project-controls`, `new-project-top-nav`, `interface-components` | Skipped (superseded) | Current Home launcher, chat interface and launch flow replace these; the draft duplicated chat UI as parallel components. |
| `/components` route and `library/chat-components.tsx` (component gallery) | Skipped (superseded) | `src/routes/mock-style-guide.tsx` and the mock app window already cover this. |
| `UserSettingsPopover` with org dropdown, `InviteTeamModal`, `NewOrganizationModal`, `EventCarousel` | Skipped | Placeholder UI only: hardcoded orgs ("Acme Inc."), `console.log` submit handlers, links to non-existent `/settings/team` and `/settings/account` routes, Unsplash hotlinked images and stale event links. Cloud organizations are now handled by real backends code (`cloud-organization-boundary.tsx`, backend selector). Porting would add dead, non-functional UI. |
| `LogoPopoverButton`, `WavingHand` icon, new branding SVGs | Skipped | Tied to the dropped popover/new-project pages; no ported feature uses the assets. |
| `ui/button.tsx`, `utils/cn.ts` | Skipped | `cn` exists in `#/utils/utils`; Button primitives exist in current components. |
| Wide restyle (settings inputs/switches, MCP settings, modals, home tasks, context menus, tailwind.config/tailwind.css/index.css token changes) | Skipped | Class-name churn against the 2025 Tailwind tokens; the design system has been redone since, and applying it would regress current styling. |
| `config.toml.tmp`, `package.json`/`package-lock.json` changes | Skipped | Out of scope per port rules; dependencies are exact-pinned and managed separately. |

## Ported

Nothing. No self-contained, still-meaningful behavior remained; this commit
contains only this design document.
