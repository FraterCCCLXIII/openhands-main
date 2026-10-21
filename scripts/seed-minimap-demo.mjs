#!/usr/bin/env node
/**
 * Seed a 55-turn local conversation for minimap testing against a real agent-server.
 *
 * Usage (with `npm run dev` stack running):
 *   npm run seed:minimap-demo
 *   npm run seed:minimap-demo -- --force
 *
 * Env:
 *   AGENT_SERVER_URL  Agent-server origin (default http://127.0.0.1:18000)
 *   FRONTEND_URL      UI origin to print (default http://localhost:8000)
 *   SESSION_API_KEY   Overrides ~/.openhands/agent-canvas/api-key.txt
 *
 * Mock mode still uses the fixed slug `/conversations/minimap-demo` via MSW.
 * Real dev stacks assign a UUID; this script prints the URL after seeding.
 */

import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const MINIMAP_DEMO_TURN_COUNT = 55;
const MINIMAP_DEMO_TITLE = "Minimap demo (55 turns)";
const MINIMAP_DEMO_MARKER = join(
  homedir(),
  ".openhands",
  "agent-canvas",
  "minimap-demo-conversation-id.txt",
);
const MINIMAP_DEMO_BASE_TIME = Date.UTC(2026, 7, 20, 9, 0, 0);

const USER_PROMPTS = [
  "Summarize the latest deployment status.",
  "What changed in the auth module?",
  "Can you refactor this helper for clarity?",
  "Add tests for the pagination hook.",
  "Explain the websocket reconnect logic.",
  "Find regressions in the sidebar layout.",
  "Draft release notes for the minimap feature.",
  "Review error handling in the event store.",
  "Optimize bundle size for the chat route.",
  "Check i18n coverage for new strings.",
];

const defaults = JSON.parse(
  readFileSync(join(repoRoot, "config/defaults.json"), "utf8"),
);

const AGENT_SERVER_URL = (
  process.env.AGENT_SERVER_URL ||
  `http://127.0.0.1:${defaults.ports.agentServer}`
).replace(/\/$/, "");
const FRONTEND_URL = (
  process.env.FRONTEND_URL ||
  `http://localhost:${defaults.ports.proxy}`
).replace(/\/$/, "");
const API_KEY =
  process.env.SESSION_API_KEY ||
  readFileSync(
    join(homedir(), ".openhands", "agent-canvas", "api-key.txt"),
    "utf8",
  ).trim();

const force = process.argv.includes("--force");

function timestampForTurn(turnIndex, offsetSeconds) {
  return new Date(
    MINIMAP_DEMO_BASE_TIME + turnIndex * 120_000 + offsetSeconds * 1000,
  ).toISOString();
}

function userPromptForTurn(turn) {
  const template = USER_PROMPTS[(turn - 1) % USER_PROMPTS.length];
  return `Turn ${turn}: ${template}`;
}

function agentReplyForTurn(turn) {
  const length = 48 + (turn % 9) * 95 + ((turn * 7) % 5) * 220;
  const lead = `Agent reply for turn ${turn}. `;
  const body =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(
      Math.ceil(length / 57),
    );
  return (lead + body).slice(0, length);
}

function buildMessageEvent(id, role, text, turnIndex, offsetSeconds, parentId) {
  return {
    id,
    timestamp: timestampForTurn(turnIndex, offsetSeconds),
    source: role === "user" ? "user" : "agent",
    parent_id: parentId,
    kind: "MessageEvent",
    llm_message: {
      role,
      content: [{ cache_prompt: false, type: "text", text }],
      thinking_blocks: [],
    },
    activated_skills: [],
    extended_content: [],
  };
}

async function api(path, options = {}) {
  const response = await fetch(`${AGENT_SERVER_URL}${path}`, {
    ...options,
    headers: {
      "X-Session-API-Key": API_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${path} failed (${response.status}): ${text}`,
    );
  }

  return body;
}

async function conversationExists(conversationId) {
  try {
    const result = await api(
      `/api/conversations?ids=${encodeURIComponent(conversationId)}`,
    );
    return Array.isArray(result) && result.length > 0;
  } catch {
    return false;
  }
}

function readMarkerConversationId() {
  if (!existsSync(MINIMAP_DEMO_MARKER)) return null;
  const id = readFileSync(MINIMAP_DEMO_MARKER, "utf8").trim();
  return id || null;
}

function writeMarkerConversationId(conversationId) {
  writeFileSync(MINIMAP_DEMO_MARKER, `${conversationId}\n`, "utf8");
}

function nextEventIndex(eventsDir) {
  const files = readdirSync(eventsDir).filter((name) => name.startsWith("event-"));
  let max = -1;
  for (const name of files) {
    const match = /^event-(\d+)-/.exec(name);
    if (match) max = Math.max(max, Number.parseInt(match[1], 10));
  }
  return max + 1;
}

async function waitForBootstrapEvents(eventsDir, minCount = 5) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const count = readdirSync(eventsDir).filter((name) =>
      name.startsWith("event-"),
    ).length;
    if (count >= minCount) {
      return nextEventIndex(eventsDir);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for the seeded conversation bootstrap events.");
}

function writeEventFile(eventsDir, index, event) {
  const filename = `event-${String(index).padStart(5, "0")}-${event.id}.json`;
  writeFileSync(join(eventsDir, filename), `${JSON.stringify(event)}\n`, "utf8");
}

function updateBaseState(persistenceDir, leafEventId, lastUserMessageId) {
  const baseStatePath = join(persistenceDir, "base_state.json");
  const baseState = JSON.parse(readFileSync(baseStatePath, "utf8"));
  baseState.execution_status = "finished";
  baseState.leaf_event_id = leafEventId;
  baseState.last_user_message_id = lastUserMessageId;
  writeFileSync(baseStatePath, `${JSON.stringify(baseState)}\n`, "utf8");
}

async function countUserMessages(conversationId) {
  let pageId = null;
  let users = 0;

  do {
    const query = new URLSearchParams({
      limit: "50",
      sort_order: "TIMESTAMP",
    });
    if (pageId) query.set("page_id", pageId);

    const page = await api(
      `/api/conversations/${conversationId}/events/search?${query.toString()}`,
    );
    for (const event of page.items ?? []) {
      if (
        event.kind === "MessageEvent" &&
        event.llm_message?.role === "user"
      ) {
        users += 1;
      }
    }
    pageId = page.next_page_id ?? null;
  } while (pageId);

  return users;
}

async function ensureEventsIndexed(conversationId) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const users = await countUserMessages(conversationId);
    if (users >= MINIMAP_DEMO_TURN_COUNT) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(
    "Seeded minimap demo events were written to disk but the agent-server " +
      "has not indexed them yet. Reload the conversation or restart the dev stack.",
  );
}

async function createDemoConversation() {
  const settings = await api("/api/settings", {
    headers: { "X-Expose-Secrets": "encrypted" },
  });

  const workspaceDir = join(
    homedir(),
    ".openhands",
    "agent-canvas",
    "workspaces",
    `minimap-demo-${Date.now()}`,
  );

  const conversation = await api("/api/conversations", {
    method: "POST",
    body: JSON.stringify({
      agent_settings: settings.agent_settings,
      workspace: { working_dir: workspaceDir, kind: "LocalWorkspace" },
      confirmation_policy: { kind: "NeverConfirm" },
      max_iterations: 500,
      stuck_detection: true,
      autotitle: false,
      worktree: true,
      secrets_encrypted: true,
      initial_message: {
        role: "user",
        content: [
          {
            type: "text",
            text: userPromptForTurn(1),
            cache_prompt: false,
          },
        ],
        run: false,
      },
    }),
  });

  const conversationId = conversation.id;
  const eventsDir = join(conversation.persistence_dir, "events");
  let eventIndex = await waitForBootstrapEvents(eventsDir);

  const initialUserEvent = (await api(
    `/api/conversations/${conversationId}/events/search?limit=20&sort_order=TIMESTAMP`,
  )).items.find(
    (event) => event.kind === "MessageEvent" && event.llm_message?.role === "user",
  );

  if (!initialUserEvent) {
    throw new Error("Created conversation is missing the initial user message.");
  }

  let parentId = initialUserEvent.id;
  let lastUserMessageId = parentId;

  for (let turn = 1; turn <= MINIMAP_DEMO_TURN_COUNT; turn += 1) {
    const agentId = randomUUID();
    const agentEvent = buildMessageEvent(
      agentId,
      "assistant",
      agentReplyForTurn(turn),
      turn,
      1,
      parentId,
    );
    writeEventFile(eventsDir, eventIndex, agentEvent);
    eventIndex += 1;
    parentId = agentId;

    if (turn < MINIMAP_DEMO_TURN_COUNT) {
      const userId = randomUUID();
      const userEvent = buildMessageEvent(
        userId,
        "user",
        userPromptForTurn(turn + 1),
        turn + 1,
        0,
        parentId,
      );
      writeEventFile(eventsDir, eventIndex, userEvent);
      eventIndex += 1;
      parentId = userId;
      lastUserMessageId = userId;
    }
  }

  updateBaseState(conversation.persistence_dir, parentId, lastUserMessageId);

  await ensureEventsIndexed(conversationId);

  await api(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    body: JSON.stringify({ title: MINIMAP_DEMO_TITLE }),
  });
  await api(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    body: JSON.stringify({ execution_status: "finished" }),
  });

  writeMarkerConversationId(conversationId);
  return conversationId;
}

async function main() {
  const existingId = readMarkerConversationId();
  if (existingId && !force && (await conversationExists(existingId))) {
    console.log(`Minimap demo already seeded (${existingId}).`);
    console.log(`${FRONTEND_URL}/conversations/${existingId}`);
    return;
  }

  if (existingId && force) {
    try {
      await api(`/api/conversations/${existingId}`, { method: "DELETE" });
    } catch {
      // Best-effort cleanup of a stale marker target.
    }
  }

  console.log(`Seeding ${MINIMAP_DEMO_TURN_COUNT}-turn minimap demo…`);
  const conversationId = await createDemoConversation();
  console.log(`Done. Open:`);
  console.log(`${FRONTEND_URL}/conversations/${conversationId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
