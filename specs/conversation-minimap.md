# Conversation Minimap Specs

The chat minimap is a turn index (one bar per user prompt). Chat rendering is a
lazy event log (initial tail of `INITIAL_HISTORY_PAGE_SIZE`, then
`useLoadOlderEvents` on scroll-up). Those two must not share a full-history
REST walk.

---

### MM-001: Do not walk full event history to build the Cloud minimap
- [ ] Cloud conversation open shall **not** call
      `fetchConversationEventsForMinimap()` / `fetchEventSearchPagesNewestFirst()`.
      That path pages `EventService.searchEvents` until exhaustion and downloads
      every action/observation, not just user turns.
- [ ] Until a cheap turn index exists (MM-003), Cloud segments shall be built
      from the **chat event store only** (the already-loaded tail plus live
      websocket events).
- [ ] `events/search` has no kind/role filter today. Any “complete strip”
      implemented as a full search walk will stay expensive on the Cloud App
      API (`/api/v1/conversation/{id}/events/search` via `callCloudProxy`).
- [ ] Older Cloud backends can 500 on `sort_order` / `page_id` / timestamp
      filters (needs OpenHands/OpenHands#14399). Completeness-sensitive
      callers must use `strictPagination: true` rather than the empty-page
      fallback, which looks like exhaustion and can retry or go silent.

### MM-002: Jump-to-turn loads chat pages on demand, and only then
- [x] Selecting a minimap segment whose turn is not in the DOM shall call
      `navigateToConversationTurn` → `loadOlder()` until that user event id is
      in the store and rendered, then scroll. Pay per jump, not per open.
- [ ] Do not start a second independent history walk for the click. Do not
      fetch a timestamp window that leaves a hole in the store (breaks
      scroll-up pagination).
- [ ] Cloud click-to-load shall use `strictPagination: true` so a backend
      without pagination filters fails loudly instead of returning empty pages.

### MM-003: Cheap turn index (SDK + typescript-client, then this frontend)
- [ ] Add a Cloud/App API summary of user turns, not another full event dump.
      Preferred: `GET /api/v1/conversation/{id}/turns` returning
      `{ id, timestamp, preview, agent_response_length }`.
      Acceptable alternative: `events/search?kind=MessageEvent&role=user`
      (still needs an SDK filter; do not invent a raw frontend query).
- [ ] New endpoint lives in **OpenHands/software-agent-sdk**, typed access in
      **OpenHands/typescript-client**, then this frontend consumes it. Do not
      add a direct `axios`/`fetch` App API call here.
- [ ] After MM-003 ships, the strip may show every turn again without
      downloading the transcript. Click still uses MM-002 to fill the chat
      store.

### Why this exists
- Opening a long Cloud conversation currently walks every event page for the
  minimap, then a click of an unloaded turn walks those pages again into the
  chat store. Chat only needs the latest page to render; the strip only needs
  one row per user turn.
- Local agent-server can hide this cost. Cloud App API pagination billed per
  full event page cannot.

### Do not
- Keep the independent full-history fetch and “just inject it” on click — that
  still bills Cloud on every open.
- Limit-only Cloud fallback that returns the newest page again — `hasMore`
  stays true and the client retries.
- Treat transcript export’s full walk (`loadCompleteTranscriptEvents`) as a
  template for the minimap. Export is explicit and user-triggered.
