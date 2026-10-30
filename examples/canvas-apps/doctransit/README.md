# DocTransit

A Canvas App for [DocTransit](https://doctransit.com), an e-signature product. It uses the official DocTransit mark and wordmark (from the DocTransit website's `favicon.svg` / `doctransit_logo.svg`; the header wordmark follows the theme text colour, shapes unchanged) and the website's `hero-signing.jpeg` (resized to 1200px, about 51 KB, embedded) behind the not-connected screen and the Connect dialog, under a dark scrim.

## Connect

The **Connect** button is always in the header. It opens a guided dialog with three steps and a progress bar (Esc closes it, focus stays inside it and returns to the button):

1. **Sign in or create your DocTransit account**: opens `https://app.doctransit.com/login` or `/create-account` in a new tab (`noopener noreferrer`), or "Use the embedded page instead" switches to the embedded Sign in tab.
2. **Create an API key**: in DocTransit open Developer, then API Keys, then create a key. The button opens the real API Keys page, `https://app.doctransit.com/generatetoken`, in a new tab.
3. **Paste your API key**: a password field with show/hide. **Connect** verifies the key with `GET https://api.doctransit.com/v1/me` and shows the exact result ("That API key was not accepted." or "Could not reach api.doctransit.com."). Only an accepted key is saved.

Once connected the header shows "Connected" with a menu: **Manage connection** (account name or email when `/me` returns one, the key as `dt_••••1234`, Replace key, Disconnect) and **Disconnect** (removes the key). A key saved by an earlier version still works and is loaded on the Documents tab.

Privacy: the key is saved in this browser's `localStorage` (`canvas-extension-doctransit:v1`) only after verification, is sent only to `api.doctransit.com` as `Authorization: Bearer`, is never placed in a URL, never logged, and never shown except its last four characters. DocTransit passwords are never collected here; sign-in happens on DocTransit's own pages.

## What is in it

1. **Documents** (native): when connected, summary cards (Total, Awaiting signature, Completed, Declined or expired, computed from the documents loaded so far), a sticky filter bar (status, search, refresh), a table with status chips, signer avatars and relative dates (full date on hover), skeleton loading, empty and error states with Try again, Load more, and a slide-over drawer with a signer timeline, copy/open signing links, DocTransit's suggested next actions and Download signed PDF. It can also create a draft from a template id; nothing is sent unless you tick "Send to signers now" and confirm. Not connected, it shows a welcome screen with Connect and Open DocTransit.
2. **Embedded web pages** (Dashboard `/dashboard/35KBoSgoAK`, Sign in `/login`, Create account `/create-account` on `https://app.doctransit.com`): the real pages in an iframe that fills the whole page area, with a slim toolbar (title, page path, reload, Open in browser). The Dashboard toolbar shows "Not signed in? Connect". If a page has not loaded after 10 seconds a "Not loading? Open in browser" note appears over the frame.

The web app address can be changed in Settings (http/https only).

## New Chat menu

The New Chat (+) dropdown has two entries: **New document** and **New contract**. Each opens the Documents tab with the matching "from a template" form expanded and focused. Both use the same create-from-template request (the template id decides what is made); the contract entry only changes the labels.

## Prerequisites

A DocTransit account and an API key (Connect walks you through it).

## Known limits

- Whether a page refuses to be embedded (X-Frame-Options / CSP) cannot be detected from here. After 10 seconds the loading text says so, and an "Open in browser" link is always shown under the frame.
- The API key lives in this browser's storage once verified; Disconnect removes it.
- The `/me` response shape is not specified in the OpenAPI ("key context"); the account name or email is shown only if it contains `name` or `email` (also looked up under `account`, `user`, `owner`, `principal`).
- The Sign in tab is for the web app only. Signing in there does not give the Documents tab access; /v1 accepts API keys only and has no account endpoints.
- The Dashboard tab points at the fixed dashboard id the web app's own header uses.
- The download endpoint's response shape is only described as "Download URL" in the OpenAPI; `download_url`, `url` or `signed_url` are accepted.

## Not built

Cancel, archive and delete are intentionally absent. Sending an existing draft, field placement and template browsing are not built (the template id is typed in).

Tests: `npm install && npm test`.
