/* Kanban — a Canvas App with a three-column board (To do, In progress, Done).
 *
 * Cards are added in To do, moved with the arrow buttons or by dragging, and
 * deleted. They are saved in this browser's localStorage only; nothing is sent
 * anywhere. The first time it opens, it copies any cards from the board that
 * used to be built into Canvas (localStorage key "kanban-board"), without
 * changing or removing them.
 *
 * Browser-only, dependency-free ESM. All styles are scoped under `.kb`. Text is
 * always set with textContent.
 */

export const STORAGE_KEY = "canvas-extension:kanban:cards";
/** The key the former built-in board stored its cards under (zustand persist shape). */
export const LEGACY_STORAGE_KEY = "kanban-board";
export const COLUMNS = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
];
const COLUMN_IDS = COLUMNS.map((column) => column.id);

// ─── Cards (pure) ─────────────────────────────────────────────────────────

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Keeps only well-formed cards from untrusted JSON; an unknown column becomes To do. */
export function sanitizeCards(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c) => isObj(c) && typeof c.id === "string" && c.id && typeof c.title === "string" && c.title.trim())
    .map((c) => ({ id: c.id, title: c.title.trim().slice(0, 200), column: COLUMN_IDS.includes(c.column) ? c.column : "todo" }));
}

let counter = 0;
export function newId() {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function addCard(cards, title, id = newId()) {
  const trimmed = String(title ?? "").trim().slice(0, 200);
  if (!trimmed) return cards;
  return [...cards, { id, title: trimmed, column: "todo" }];
}

export function moveCard(cards, id, column) {
  if (!COLUMN_IDS.includes(column)) return cards;
  return cards.map((c) => (c.id === id ? { ...c, column } : c));
}

export function deleteCard(cards, id) {
  return cards.filter((c) => c.id !== id);
}

/** The column one step left (-1) or right (+1) of `column`, or null at the edge. */
export function neighbourColumn(column, step) {
  return COLUMN_IDS[COLUMN_IDS.indexOf(column) + step] ?? null;
}

// ─── Storage ──────────────────────────────────────────────────────────────

export function loadCards(storage) {
  try {
    const own = storage.getItem(STORAGE_KEY);
    if (own !== null) return sanitizeCards(JSON.parse(own));
    const legacy = storage.getItem(LEGACY_STORAGE_KEY);
    if (legacy !== null) return sanitizeCards(JSON.parse(legacy)?.state?.cards);
  } catch {
    // Unreadable or blocked storage: start empty.
  }
  return [];
}

export function saveCards(storage, cards) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(cards));
    return true;
  } catch {
    return false;
  }
}

// ─── View ─────────────────────────────────────────────────────────────────

const STYLE = `
.kb { --kb-bg: var(--oh-color-base, #0B0E14); --kb-panel: var(--oh-color-base-secondary, #21252F); --kb-raised: var(--oh-surface-raised, #2C313F);
  --kb-text: var(--oh-foreground, #EEF2F7); --kb-contrast: var(--oh-contrast, #FFFFFF); --kb-muted: var(--oh-muted, #A3B0C4);
  --kb-border: var(--oh-border-subtle, #383F50); --kb-primary: var(--oh-color-primary, #C9B974); --kb-danger: var(--oh-danger, #E76A5E);
  box-sizing: border-box; display: flex; flex-direction: column; gap: 16px; padding: 24px; overflow: auto;
  background: var(--kb-bg); color: var(--kb-text); font: 14px/1.4 system-ui, sans-serif; }
.kb *, .kb *::before, .kb *::after { box-sizing: border-box; }
.kb h1 { margin: 0; font-size: 22px; font-weight: 400; color: var(--kb-contrast); }
.kb .cols { display: flex; flex: 1; gap: 16px; align-items: stretch; overflow-x: auto; padding-bottom: 8px; }
.kb .col { display: flex; flex-direction: column; gap: 12px; flex: 0 0 288px; min-height: 256px; padding: 12px; border: 1px solid var(--kb-border); border-radius: 10px; background: var(--kb-panel); }
.kb .col.over { outline: 2px solid var(--kb-primary); }
.kb .col header { display: flex; justify-content: space-between; align-items: center; }
.kb .col h2 { margin: 0; font-size: 14px; font-weight: 600; color: var(--kb-contrast); }
.kb .count, .kb .empty { font-size: 12px; color: var(--kb-muted); }
.kb input[type="text"] { width: 100%; padding: 6px 8px; border: 1px solid var(--kb-border); border-radius: 6px; background: transparent; color: var(--kb-text); font: inherit; }
.kb ul { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
.kb .card { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--kb-border); border-radius: 8px; background: var(--kb-raised); cursor: grab; }
.kb .card.dragging { opacity: 0.5; }
.kb .title { overflow-wrap: anywhere; font-weight: 500; color: var(--kb-contrast); }
.kb .row { display: flex; justify-content: space-between; align-items: center; }
.kb .row > div { display: flex; gap: 4px; }
.kb button { padding: 2px 8px; border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--kb-muted); font: inherit; font-size: 12px; cursor: pointer; }
.kb button:hover:not(:disabled) { color: var(--kb-contrast); border-color: var(--kb-border); }
.kb button:disabled { opacity: 0.3; cursor: default; }
.kb button.del:hover:not(:disabled) { color: var(--kb-danger); }
.kb button:focus-visible, .kb input:focus-visible { outline: 2px solid var(--kb-primary); outline-offset: 2px; }
.kb .note { font-size: 12px; color: var(--kb-danger); }
`;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mountKanban(container, storage = window.localStorage) {
  const win = container.ownerDocument.defaultView ?? window;
  const style = el("style");
  style.textContent = STYLE;
  document.head.append(style);
  const root = el("div", "kb");
  container.append(root);

  let cards = loadCards(storage);
  let saveFailed = false;
  let draggedId = null;
  let disposed = false;

  /** Fill the visible page below wherever the host put us (hosts may not give a definite height). */
  function fit() {
    const top = Math.max(0, root.getBoundingClientRect().top);
    root.style.height = `${Math.max(480, (win.innerHeight || 800) - top)}px`;
  }

  function update(next) {
    cards = next;
    saveFailed = !saveCards(storage, cards);
    render();
  }

  function renderCard(card) {
    const li = el("li", "card");
    li.draggable = true;
    li.dataset.cardId = card.id;
    li.addEventListener("dragstart", () => { draggedId = card.id; li.classList.add("dragging"); });
    li.addEventListener("dragend", () => { draggedId = null; li.classList.remove("dragging"); });
    li.append(el("span", "title", card.title));
    const row = el("div", "row");
    const moves = el("div");
    for (const [step, glyph, verb] of [[-1, "←", "left"], [1, "→", "right"]]) {
      const target = neighbourColumn(card.column, step);
      const b = el("button", "move", glyph);
      b.type = "button";
      b.disabled = !target;
      b.setAttribute("aria-label", `Move ${card.title} ${verb}`);
      b.addEventListener("click", () => target && update(moveCard(cards, card.id, target)));
      moves.append(b);
    }
    const del = el("button", "del", "Delete");
    del.type = "button";
    del.setAttribute("aria-label", `Delete ${card.title}`);
    del.addEventListener("click", () => update(deleteCard(cards, card.id)));
    row.append(moves, del);
    li.append(row);
    return li;
  }

  function renderColumn(column) {
    const inColumn = cards.filter((c) => c.column === column.id);
    const section = el("section", "col");
    section.setAttribute("aria-label", column.label);
    section.dataset.column = column.id;
    section.addEventListener("dragover", (ev) => { ev.preventDefault(); section.classList.add("over"); });
    section.addEventListener("dragleave", () => section.classList.remove("over"));
    section.addEventListener("drop", (ev) => {
      ev.preventDefault();
      section.classList.remove("over");
      if (draggedId) update(moveCard(cards, draggedId, column.id));
      draggedId = null;
    });
    const header = el("header");
    header.append(el("h2", "", column.label), el("span", "count", String(inColumn.length)));
    section.append(header);
    if (column.id === "todo") {
      const form = el("form");
      const input = el("input");
      input.type = "text";
      input.placeholder = "Add a card";
      input.setAttribute("aria-label", "Add a card");
      form.append(input);
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        update(addCard(cards, input.value));
        root.querySelector('[data-column="todo"] input')?.focus();
      });
      section.append(form);
    }
    const list = el("ul");
    inColumn.forEach((c) => list.append(renderCard(c)));
    section.append(list);
    if (!inColumn.length) section.append(el("p", "empty", "No cards"));
    return section;
  }

  function render() {
    if (disposed) return;
    fit();
    const cols = el("div", "cols");
    COLUMNS.forEach((column) => cols.append(renderColumn(column)));
    const parts = [el("h1", "", "Kanban"), cols];
    if (saveFailed) parts.push(el("p", "note", "Cards could not be saved in this browser, so they will be lost on reload."));
    root.replaceChildren(...parts);
  }

  const onResize = () => fit();
  win.addEventListener("resize", onResize);
  render();

  return () => {
    disposed = true;
    win.removeEventListener("resize", onResize);
    style.remove();
    root.remove();
  };
}

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("Kanban requires Canvas host API 1.");
  return host.registerPage("board", ({ container }) => mountKanban(container));
}
