# How it works

> Authored for this app, from reading `extension.js`. Not imported from another repository.

## Overview

```
 browser (this app)                              holons-api (Ruby on Rails)
┌───────────────────────────┐   HTTP + JSON      ┌───────────────────────────┐
│ UI (DOM) + state          │ ─────────────────▶ │ /holons  /posts           │
│ createClient (HTTP)       │ ◀───────────────── │ /comments                 │
│ localStorage: token,      │   Bearer token     │ /holon_memberships        │
│   local courses, widths   │                    │ /users/tokens/sign_in     │
└───────────────────────────┘                    └───────────────────────────┘
        │  no server address, no token, or server unreachable
        ▼
 in-memory Demo backend (same methods, sample data)
```

The UI talks to a backend object. There are two with the same methods: the live client for `holons-api`, and the Demo backend. That is why every flow works in both modes.

## Choosing the mode

On open (and after sign-in or sign-out) the app picks a backend:

1. No server address saved: Demo.
2. An address but no token: Demo, with the notice "Sign in to connect to holons-api. Showing the demo."
3. Both: the app lists Holons from the server. If that works it is **Connected**; if it fails (server down, token rejected) it falls back to Demo and shows the error in a notice.

The "Connected" or "Demo" chip in the header, and the Sign in / Sign up buttons, open the account dialog. "Use demo" in that dialog forgets the saved address and token.

## Calls to the server

All requests are JSON with `Authorization: Bearer <token>` once you have one.

| Action | Request |
|---|---|
| Sign in | `POST /users/tokens/sign_in` with `{email, password}` |
| Health | `GET /up` |
| List Holons | `GET /holons`, or `?scope=created` or `?scope=joined` |
| Create, edit, delete a Holon | `POST /holons`, `PATCH /holons/:id`, `DELETE /holons/:id` |
| Posts | `GET /posts`, `POST /posts`, `PATCH` and `DELETE /posts/:id` |
| Replies | `GET /comments`, `POST /comments`, `PATCH` and `DELETE /comments/:id` |
| Team | `GET /holon_memberships?holon_id=`, `POST /holon_memberships`, `DELETE /holon_memberships/:id` |

Create and update bodies are wrapped the way Rails expects, for example `{"post": {"holon_id": 1, "title": "...", "content": "..."}}`.

Routes the README marks **unverified**: `POST /users/tokens/sign_up`, `POST /users/tokens/revoke` (sign out), and `GET /users/tokens/info` (to learn your user id when the sign-in answer does not carry it).

## Opening a Holon

When you open a Holon the app loads, at the same time, its memberships, its courses, and the posts, then the replies of each post. Posts are shown oldest first. The server returns every post and reply, so the app keeps only those for the Holon you opened.

## Ownership and permissions

The server decides who may do what. The app only decides which buttons to show:

- **Owner**: the Holon appears in your `?scope=created` list. You see Edit and Delete.
- **Member**: it appears in your `?scope=joined` list. You see Leave.
- **Neither**: you see Join (disabled with an explanation if the app does not know your user id).
- Edit and Delete on a post or reply appear when this browser created it (or the server names you as author), and on every post if you own the Holon.

If you try something the server refuses, the error text from the server is shown in a red banner.

## Writing

Creating a post, editing, deleting and replying are applied to the screen at once and then confirmed with the server; if the server refuses, the change is rolled back and the error is shown. A message waiting for the server is marked "Sending...". A post written in the composer gets the first line of its text as its title (the server requires one).

## Courses

```
Demo:       courses + modules  ──▶  in memory (lost on reload)
Connected:  courses + modules  ──▶  localStorage, per server address, never sent
```

A course store handles create, reorder (Move up, Move down) and "Mark complete". The same code serves both modes; only where it keeps the data differs.

## The columns

```
┌────┬──────────────┬──────────────────────────────┬──────────────┐
│rail│ list         │ main                         │ team         │
│    │ channels,    │ header, thread or welcome,   │ members and  │
│    │ courses,     │ composer                     │ roles        │
│    │ Docs link    │ (or the documentation reader)│              │
└────┴──────────────┴──────────────────────────────┴──────────────┘
```

The edges of the list and the team panel can be dragged (or focused and moved with the arrow keys); the widths are remembered. Below 900 pixels wide the team panel is hidden.

## The docs reader

The pages you are reading are Markdown files in the `docs/` folder, embedded into `extension.js` by `scripts/embed-docs.mjs` so the extension stays one file. A test checks that the embedded copy matches the files. Back returns to where you were; Copy Markdown and Download .md act on the page being shown.
