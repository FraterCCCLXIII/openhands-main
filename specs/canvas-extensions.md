# Canvas Extensions

## Status

Implementation plan and v1 contract. The frontend vertical slice may ship behind
Agent Server capability detection while the backend endpoints are implemented.

## Product definition

Canvas Extensions are installable packages that change Agent Canvas itself.
They contribute UI and local product behavior such as routed pages, conversation
panels, renderers, slots, and themes. Skills and plugins change the agent;
Canvas Extensions change the app.

The Customize area remains the single inventory for Skills, Plugins, MCP, and
Canvas Extensions. The UI calls Canvas Extensions **Apps**: the inventory item is
**Customize > Apps** at `/apps`, installed with **Add app**; "addon" is an
informal alias only.

## Decisions

1. **The active Agent Server owns extensions.** An extension is installed on the
   computer or container running the Agent Server. Its source, resolved revision,
   files, manifest, and enabled state live there. Canvas only discovers and loads
   extensions from the currently active backend. Switching backends replaces the
   active extension set.
2. **Extension code is trusted, same-realm code.** There is no iframe, worker
   sandbox, or granular permission system. Once enabled, an extension has the
   same ambient browser authority as Canvas code. Shadow DOM may be offered later
   as optional style isolation, but never as a security boundary.
3. **Install and enable are separate.** Installation always produces a disabled
   extension. An agent may install or update an extension, but the user returns
   to Customize > Apps and explicitly enables it. In v1 this is a product
   consent invariant, not proof of human presence against an agent that can call
   the same authenticated APIs. A future backend policy may allow agent-driven
   enablement.
4. **Enablement is hot.** Enabling loads and activates the extension without an
   app or Agent Server restart. Disabling unmounts registered surfaces and calls
   lifecycle cleanup. Because code is trusted same-realm JavaScript, cleanup is
   best-effort; an extension can create global effects the host cannot revoke.
5. **Distribution follows plugins, not their runtime.** Install coordinates are
   `source`, optional `ref`, and optional `repo_path`, resolved and pinned by the
   Agent Server. A repository may contain multiple extensions and other artifact
   types under subpaths. Backend-local paths are interpreted on the backend
   machine, never in the frontend process.
6. **Updates preserve enablement.** Refresh resolves and installs a new revision
   atomically and keeps the prior enabled state. The UI shows the resulting
   resolved revision. Since v1 is a trusted-code model, there is no misleading
   permission-diff approval gate. The staged check/apply flow currently exists
   only at the Agent Server service layer; until it is exposed over HTTP, the
   app card's **Update** action re-installs from the recorded source, ref, and
   path with `force: true`, and the Agent Server keeps the enabled state.

## Trust disclosure

Before enabling, Canvas says plainly that the extension can access and modify the
Canvas page and can make authenticated requests available to the current browser
session. The review screen shows source, requested ref, resolved revision,
manifest metadata, and contributed surfaces. It does not show fictitious
fine-grained permissions.

Install and update are still meaningful trust actions because they select the
code revision stored by the backend. Enable is the explicit point at which Canvas
executes that code.

## Package contract

The manifest filename is `canvas-extension.json`.

```json
{
  "schema_version": 1,
  "name": "example-dashboard",
  "display_name": "Example dashboard",
  "version": "0.1.0",
  "description": "A backend-specific project dashboard.",
  "entrypoint": "dist/extension.js",
  "contributes": {
    "pages": [
      {
        "id": "dashboard",
        "title": "Dashboard",
        "path": "/dashboard",
        "nav_label": "Dashboard"
      }
    ]
  }
}
```

Rules for v1:

- `name` and contribution IDs use lowercase letters, digits, and hyphens.
- Page `path` values are absolute kebab-case routes (leading `/`); Canvas
  mounts them relative to `/extensions/{name}`.
- `entrypoint` is a path inside the installed package.
- The entrypoint is one self-contained browser ESM bundle. It must not contain
  unresolved bare imports or external chunks; dependencies, CSS, and small
  assets are bundled or embedded by the authoring template.
- The backend validates that the manifest, entrypoint, and any future asset path
  remain inside the installed extension root.
- Host compatibility fields will be added before marketplace distribution. The
  initial schema is intentionally small while the page ABI is proven by a
  separately built sample extension.

The v1 module exports `activate`:

```ts
export function activate(host: CanvasExtensionHost): void | (() => void) {
  return host.registerPage("dashboard", ({ container, path, navigate }) => {
    container.textContent = `Extension route: ${path}`;
    return () => container.replaceChildren();
  });
}
```

`CanvasExtensionHost` is versioned independently from the manifest. The first
host API contains:

- `apiVersion: "1"`
- immutable extension/backend metadata
- `registerPage(id, mount)` for page factories declared by the manifest
- `registerCreateAction(action)` and `onIntent(callback)` for entries in the
  New Chat menu (see below)
- `navigate(path)` using Canvas base-path-aware routing
- `agentServer.request(...)`, an authenticated request helper targeting the
  extension's owning backend

The runtime fetches the bundle as authenticated text and imports it through a
temporary Blob URL. A direct `<script src>` or `import(backendUrl)` cannot carry
`X-Session-API-Key`, so it is not the v1 loading path. Importing the bundle does
not activate it; Canvas calls `activate` only for an enabled installation.

### Create actions (New Chat menu)

An extension can add its own entries to the left nav's New Chat dropdown, after
the built-in ones and under a divider. They are registered at runtime, not in
the manifest, so the Agent Server schema and `minimumAgentServer` are
unchanged and extensions that never call the API keep working. Both
`registerCreateAction` and `onIntent` are additive to host API `"1"`; a
component built for an older host must feature-detect them.

```ts
interface CanvasExtensionCreateAction {
  id: string; // lowercase letters, digits, hyphens; unique within the extension
  label: string; // 1-40 characters, sentence case: "New document"
  description?: string; // row tooltip, up to 200 characters
  icon?: { svg: string }; // inline <svg> using currentColor, at most 4096 characters
  pageId: string; // a page this extension declared in `contributes.pages`
  intent?: string; // opaque, up to 200 characters; defaults to `id`
}
```

Rules:

- An invalid registration (bad `id`, empty or long `label`, `pageId` not
  declared in the manifest, malformed or oversized `icon.svg`, or a duplicate
  `id`) throws an `Error` from `registerCreateAction`, like `registerPage`.
  Nothing is stored for it, so the extension's other registrations are
  unaffected.
- Actions appear once activation resolves, ordered by extension name and then
  registration order. The returned disposer, disabling, uninstalling, updating,
  and switching backends remove them.
- Selecting a row navigates to the declared page (keeping the `?backend=`
  selection) and queues an intent `{ id, action, at }`: `id` is the action id,
  `action` is the action's `intent` string, `at` is epoch milliseconds.
- Icons are untrusted. Canvas never inserts the markup as HTML; it paints it as
  a CSS mask over the menu text colour, so only the shape matters and scripts
  never run. Without `icon`, the row shows the extension's own icon.
- The label comes from the extension and is not translated by Canvas.

Intent delivery is consumed once and never persisted:

- If the page is not mounted, the intent arrives as
  `mount({ intent })` and is cleared right after. A later plain visit sees
  `intent: null`. An intent whose navigation never landed is dropped after 10
  seconds.
- If the page is already mounted and the extension subscribed with
  `host.onIntent(callback)`, the callback receives the same object and the
  page is not remounted. Without a subscriber, the intent waits for the next
  mount (within the 10 second window).
- Conversation drawer tabs mount through the same page host and follow the same
  rules.

```ts
export function activate(host) {
  const disposers = [
    host.registerPage("editor", ({ container, intent }) => {
      startEditor(container, intent?.action === "create:document");
    }),
    host.onIntent((intent) => startNewDocument(intent.action)),
    host.registerCreateAction({
      id: "new-document",
      label: "New document",
      description: "Start a blank document",
      icon: {
        svg: '<svg viewBox="0 0 16 16"><path fill="currentColor" d="M3 1h7l3 3v11H3z"/></svg>',
      },
      pageId: "editor",
      intent: "create:document",
    }),
  ];
  return () => disposers.forEach((dispose) => dispose());
}
```

The built-in **New factory** row is not an extension action: it links to
`/factory?new=1`, which opens the Add Factory modal and removes the parameter.

### Optional app backend views

Schema 1 routed pages may embed an app-owned HTTP UI through the optional
`host.appBackendView` helper. The helper is present only when all parts of the
Agent Server bridge contract are available:

- `/server_info.capabilities` contains `canvas_app_backend_bridge_v1`;
- `/server_info.app_backend_ingress_url` is a valid HTTP(S) URL; and
- the installed `@openhands/typescript-client` exports
  `CanvasExtensionsClient.createAppBackendSession()` and
  `revokeAppBackendSession()`.

Extensions call `host.appBackendView.mount({ container })`; they never receive
an Agent Server session key, inspect local storage, construct an ingress origin,
or derive one from `window.location`. Canvas requests a short-lived session from
the discovered ingress, validates that the returned URL has the same origin,
and renders it in an iframe using only the server-provided allowlisted sandbox
tokens. `allow-same-origin` is required so authenticated fetch, WebSocket, and
Worker APIs retain the app ingress origin and partitioned session cookie; the
separate ingress origin is the authority boundary. Top-navigation, downloads,
and storage-access tokens remain rejected. The host owns loading, safe errors,
retry, a validated new-tab fallback, session revocation, and disposal on page
unmount or backend switch.

This remains additive to schema 1. Self-contained ESM loading, routed page
registration, and the native editor are unchanged. There is no generic runtime,
VS Code app, arbitrary URL proxy, mandatory sidecar, or frontend tarball loader.

The pinned `@openhands/typescript-client` `1.53.0` ships the bridge API
(first defined in draft `OpenHands/software-agent-sdk#5272`), so the client
export requirement above is satisfied by a released client. The helper is
feature-detected at runtime on the live Agent Server: `server_info.capabilities`
must advertise `canvas_app_backend_bridge_v1` and `app_backend_ingress_url`
must be a valid HTTP(S) URL. Canvas requires Agent Server `1.51.0` or newer,
which is above the first release exposing this bridge contract.

## Agent Server API

The API deliberately mirrors plugin distribution management while remaining a
separate runtime:

| Method   | Path                                             | Purpose                                                   |
| -------- | ------------------------------------------------ | --------------------------------------------------------- |
| `GET`    | `/api/canvas-extensions/installed`               | List installed extensions and parsed manifests            |
| `POST`   | `/api/canvas-extensions/install`                 | Install from git or a backend-local path; always disabled |
| `GET`    | `/api/canvas-extensions/installed/{name}`        | Read one installation                                     |
| `PATCH`  | `/api/canvas-extensions/installed/{name}`        | Set enabled state                                         |
| `DELETE` | `/api/canvas-extensions/installed/{name}`        | Uninstall                                                 |
| `GET`    | `/api/canvas-extensions/installed/{name}/bundle` | Return the entrypoint as JavaScript text                  |

A refresh endpoint (`POST /api/canvas-extensions/installed/{name}/refresh`) is
planned but not part of the current router; the service-layer staged check/apply
flow backs it and is tracked separately.

The list endpoint wraps its results in a `canvas_extensions` array.

Install request:

```json
{
  "source": "github:owner/repository",
  "ref": "main",
  "repo_path": "extensions/example-dashboard",
  "force": false
}
```

Installed response:

```json
{
  "name": "example-dashboard",
  "version": "0.1.0",
  "description": "A backend-specific project dashboard.",
  "enabled": false,
  "source": "github:owner/repository",
  "resolved_ref": "6f5f9a...",
  "repo_path": "extensions/example-dashboard",
  "installed_at": "2026-08-01T12:00:00Z",
  "install_path": "/home/user/.openhands/canvas-extensions/installed/example-dashboard",
  "manifest": {}
}
```

The `manifest` field (parsed `canvas-extension.json`, including
`contributes.pages`) is not returned by the current router yet; until it ships,
Canvas treats it as optional and renders installations without page
contributions or a display name.

The backend must prevent install requests from setting `enabled: true`. The
frontend's enable control calls the patch endpoint. Backend authorization and
multi-user installation scope follow the Agent Server deployment's existing
session trust model; v1 does not introduce a separate approval credential.

Until the API exists, Canvas treats HTTP 404 as "this backend does not support
Canvas Extensions". Customize shows an upgrade message, while the global runtime
stays silent. It must not collapse unsupported, unreachable, and an empty
inventory into the same state.

## Frontend runtime

The runtime is keyed by backend ID, organization scope, and connection revision.
This prevents an enabled bundle or cached inventory from one backend appearing
on another after a switch or reconnect.

For each enabled installation:

1. Fetch the authenticated entrypoint text from the owning backend.
2. Import the self-contained ESM bundle from a Blob URL.
3. Validate `activate` and its host API version.
4. Create an extension-scoped registry and call `activate`.
5. Admit registrations only when their IDs were declared in the manifest.
6. Render each surface inside an error boundary owned by Canvas.
7. On disable, uninstall, update, or backend switch, unmount every surface,
   invoke the extension disposer, and remove its registry entries.

The initial route shape is
`/extensions/{extension-name}/{declared-page-path}`. The Customize inventory is
`/apps`; there is no bare `/extensions` page. All routing goes through React
Router so `VITE_BASE_PATH` continues to work.

### Disabled and missing apps (additive, host API stays v1)

### CE-010: A route for an app that is off or missing explains itself

- [x] `/extensions/{name}/*` for an installed but disabled extension renders
      the shared "{name} is turned off" page with a link to Customize > Apps,
      instead of the generic unavailable card.
- [x] The same route for an extension that is not installed renders "not
      installed" with the same link. Once the inventory has loaded, an enabled
      extension still mounts normally.
- [x] No manifest or host API change: the guard reads the existing installed
      inventory, so `contributes.nav` is not needed yet.

### CE-011: Built-in apps share the switch model

- [x] Built-in apps (Tower, Factory, Automations, Commons) have per-user,
      per-backend switches under Customize > Apps > Built-in apps. All default
      on. Off hides the app's nav, rail and New Chat entries and shows the same
      "turned off" page at its routes; the app's data stores are never reset.
- [x] An app another app needs is locked on (Automations while Factory is on);
      a dependent is off whenever its requirement is off.

## Delivery plan

### Slice 1: contract and management

- Land this spec and shared TypeScript manifest/installation types.
- Add a backend-keyed service and query hooks for list, install, enable/disable,
  uninstall, and authenticated bundle fetch.
- Add Customize > Apps with an unsupported-backend state, source install
  form, source/revision/contribution review, and explicit enable control.
- Keep the global runtime silent when the active backend returns 404.

### Slice 2: routed page proof

- Add the versioned host API, module loader, lifecycle registry, and error
  boundary.
- Add dynamic page routes and left-rail navigation for enabled page
  contributions.
- Build a standalone fixture extension with the same scaffold authors will use.
- Verify enable, hot activation, navigation, disable cleanup, update, backend
  switching, session-key-authenticated bundle loading, and `VITE_BASE_PATH`.

### Slice 3: theme proof

- Define a code-free theme contribution with a strict Canvas token schema.
- Validate theme manifests on the backend and surface installed themes in
  Settings.
- Keep theme selection browser/user scoped while availability follows the active
  backend; fall back cleanly when switching away from the providing backend.

### Slice 4: conversation surfaces

- Replace the closed conversation tab union with namespaced runtime IDs and
  centralized persistence admission.
- Add extension tabs/panels, then host-owned header/footer/badge slots.
- Define mobile behavior, ordering, conflicts, missing-extension fallback, and
  per-conversation lifecycle context before opening each surface to authors.

### Slice 5: visualizers and authoring loop

- Add augment/replace visualizer registrations with explicit event matching,
  precedence, and built-in fallback.
- Publish the stable extension SDK types, bundler template, validation command,
  and sample repository.
- Only then ship `/build-canvas-extension`, including backend-local versus remote
  workspace guidance, temporary install, manual enable instructions, and git
  publication/update flow.

## Verification

Each slice adds service and runtime unit tests. The routed page slice also adds a
mock-LLM end-to-end spec (`tests/e2e/mock-llm/canvas-extensions/`) that drives
the production build through install → enable → page render → disable →
uninstall. Until the pinned agent-server ships the endpoints, the spec serves
the API contract from `src/fixtures/canvas-extensions/demo-page` through
Playwright route interception; once it does, the stub is removed and the same
steps run against the real backend.
Changing the mock-LLM feature layout or mapping requires updating
`.agents/skills/e2e-testing/references/guide.md` in the same change. Before merge,
run `npm run lint`, `npm test`, `npm run build`, and `npm run build:lib`.

## Explicit non-goals for v1

- iframe/worker isolation or enforceable fine-grained permissions
- arbitrary lifecycle scripts during installation
- automatic enablement by agents
- marketplace ranking or publisher signing
- conversation tabs, slots, or visualizer replacement in the first vertical
  slice
- treating `@openhands/extensions` as an installable runtime format
