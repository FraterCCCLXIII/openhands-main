# Kanban

A Canvas App with a three-column board: **To do**, **In progress** and **Done**. It adds a routed **Kanban** page at `/extensions/kanban/board`.

Add a card in To do, move it with the arrow buttons or by dragging it to another column, and delete it when finished.

## Where cards live

Cards are saved in this browser's `localStorage` (key `canvas-extension:kanban:cards`) and are never sent anywhere. If storage is blocked the board still works and says the cards will not survive a reload.

This app replaces the Kanban board that used to be a built-in Canvas route (`/kanban`). The first time it opens it copies any cards from the old board (`kanban-board`) and leaves the originals untouched. The old `/kanban` route now forwards here when the app is installed and enabled, and otherwise explains how to turn it on.

## Package

Dependency-free Canvas Extension, manifest schema 1, host API 1, entrypoint `extension.js`. Install it from **Customize → Apps → Add app** with this directory as the path, then enable it.

Styles are scoped under `.kb` and use the host's theme tokens (`--oh-color-base`, `--oh-foreground`, `--oh-contrast`, ...) with fallbacks, so it follows light and dark themes. The page fills the visible height below the host header.

## Verify

```sh
npx vitest run examples/canvas-apps/kanban/extension.test.js --environment jsdom
```
