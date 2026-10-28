# LLM experience specs

Baseline: the state of `openhands-proto` as of 2026-10-21. Items marked
`[ ]` are not yet implemented on that baseline. Items marked `[x]` are already
shipped and kept here as regression contracts.

Background: connections and grouped profiles shipped, but the setup flow still
has the footguns described in the LLM feedback: connections sit at the bottom,
Basic cannot take a custom model, nothing checks a key, and bulk add can create
unusable profiles.

Owning areas (see `AGENTS.md` repository ownership):

- Canvas UI and state: `src/components/features/settings/llm-profiles/`,
  `src/components/features/settings/sdk-settings/`,
  `src/components/shared/modals/settings/model-selector.tsx`,
  `src/components/features/chat/components/`.
- Backend contracts (new endpoints, fields, validation): Agent Server in
  `OpenHands/software-agent-sdk`. Canvas only consumes them through the
  TypeScript client. Raise `compatibility.minimumAgentServer` in
  `config/defaults.json` when a new endpoint or field is required.

---

### LLX-001: Provider connections are the first thing on the LLM settings page

- [x] Provider connections are rendered below the profiles list on
      `llm-profiles-manager.tsx`, and an empty state shows **Add connection**.
- [ ] The **Provider connections** section renders above **Available Profiles**
      so a user adds a connection before creating profiles.
- [ ] The section keeps its empty state, row menu, and load-error behavior
      (F11) after the move, and its test ids do not change.

### LLX-002: Profile editor opens on Basic

- [ ] Opening **Add profile** or an existing profile lands on the Basic tab.
      Advanced and All are never the first view, even after the user last used
      them.
- [ ] Unsaved edits made on Basic are visible on Advanced and All without a
      save step.

### LLX-003: Provider connection or API key, chosen first on Basic

- [ ] The first field on Basic is a segmented control: **Provider connection**
      or **API key**.
- [ ] If the user has at least one connection, the control defaults to
      **Provider connection** with that connection selected. The API key field
      is hidden.
- [ ] If the user has no connections, the control defaults to **API key** and
      shows the key field.
- [ ] Switching the control clears the other side's value only after
      confirmation when the other side has been typed into.

### LLX-004: Recognize the provider from a pasted key

- [ ] Pasting or typing an API key whose prefix matches a known provider
      (for example `sk-ant-` for Anthropic) switches the Provider field to that
      provider. The user can still change it.
- [ ] An unrecognized key leaves the Provider field unchanged and shows no
      error.
- [ ] Selecting a connection also sets the Provider field to the connection's
      provider.

### LLX-005: Background key check

- [ ] After a key or connection is set, the form runs a quick validation in the
      background. It does not wait for Save.
- [ ] A rejected key shows a polite inline note such as "This key doesn't appear
      to validate for <provider>. You can still save." Save is not blocked.
- [ ] While the check runs, the field shows a pending state, and a slow or
      failed check does not block the rest of the form.
- [ ] The check does not send the key to any host other than the selected
      provider's API. It is not logged.
- [ ] Backend contract: the check is an Agent Server endpoint. Add the endpoint
      in `software-agent-sdk` before Canvas depends on it.

### LLX-006: Carry Basic values into Advanced and All

- [ ] Switching from Basic to Advanced or All sets the Base URL from the
      provider's default when the Basic selection implies one.
- [ ] Values entered on Basic (provider, model, key or connection) are shown
      unchanged on Advanced and All.
- [ ] A Base URL the user already typed on Advanced is not overwritten by a
      later Basic change unless the provider changed.
- [ ] The current code comment that Basic "has no base_url field" is removed
      once this passes.

### LLX-007: Manual model name in Basic

- [ ] The Model dropdown on Basic accepts a typed model name that is not in the
      list, through an explicit control such as **Use custom model name**.
- [ ] A custom name is saved exactly as typed. The UI shows a note that the
      model is unverified.
- [ ] The same free-text entry works in the chat composer model selector.
- [ ] Advanced already accepts any model string. This spec only adds the Basic
      path and the composer path.

### LLX-008: Verified, unverified, and known-issue models

- [x] `config-service.api.ts` already returns both verified and unverified
      items for a provider.
- [ ] Verified models come from a fast endpoint that can be updated without a
      Canvas release. Use a cached list with a short TTL.
- [ ] The model dropdown shows three groups: **Verified**, **Unverified**, and
      **Known issues**. Known-issue models stay selectable with a visible
      warning.
- [ ] Backend contract: the endpoint and the known-issue field are defined in
      `software-agent-sdk`. Canvas consumes them through the TypeScript client.

### LLX-009: Favorites for the model selector

- [ ] A user can star a model. Starred models appear first in the chat
      composer model selector and in the profile Model dropdown.
- [ ] Favorites are stored in one named owner. They are not duplicated in
      profile data.
- [ ] Removing a favorite falls back to the default ordering. Deleting a
      profile does not remove a favorite.

### LLX-010: Profile browser for large lists

- [x] The chat composer dropdown groups models by provider and supports
      provider navigation and search (`52bb362f3c`).
- [ ] The profile list in settings supports search, filter by provider or
      connection, and the same favorites as LLX-009.
- [ ] Rows keep the connection grouping from `groupProfilesByConnection`.

### LLX-011: Bulk add creates only usable profiles

- [x] Bulk add from a connection preselects that connection, and the modal
      shows a note when a profile would be keyless (`add-models-keyless-note`).
- [ ] Bulk add from **Add from provider connections** does not create keyless
      profiles by default. The "No connection (keyless)" option is hidden
      unless the user opts in.
- [ ] Before submit, the modal shows the number of profiles it will create and
      how many have no working key.
- [ ] A keyless profile is not created silently. The user confirms it.

### LLX-012: Profile name placed last

- [ ] In the profile editor the **Profile name** field sits directly above
      Cancel and Save.
- [ ] The name is auto-filled from the chosen provider and model until the user
      edits it, and it updates when the model changes.
- [ ] A name that duplicates an existing profile is flagged before Save.

---

## Open questions

- LLX-005 and LLX-008 need Agent Server endpoints. Which repository owns the
  first change, and what is the minimum version to set in
  `compatibility.minimumAgentServer`?
- LLX-009: should favorites be per user, per backend, or per profile? The
  spec assumes per backend.
- LLX-011: should keyless profiles be blocked entirely, or only hidden behind
  an explicit opt-in?

## Test coverage

Each `[ ]` item needs a behavior test in the matching `__tests__/` file, and a
feature-map entry in `.agents/skills/verify-openhands/` only in a separate
verify-skill PR (see `AGENTS.md`, Verification Skill Independence).
