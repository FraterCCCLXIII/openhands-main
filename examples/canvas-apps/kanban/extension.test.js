import { afterEach, describe, expect, it, vi } from "vitest";
import { LEGACY_STORAGE_KEY, STORAGE_KEY, activate, addCard, deleteCard, loadCards, moveCard, mountKanban, neighbourColumn, saveCards } from "./extension.js";

const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
};

describe("card operations", () => {
  it("adds trimmed cards to To do and ignores blank titles", () => {
    expect(addCard([], "  Ship it ", "a")).toEqual([{ id: "a", title: "Ship it", column: "todo" }]);
    expect(addCard([], "   ")).toEqual([]);
  });

  it("moves a card between columns and rejects an unknown column", () => {
    const cards = [{ id: "a", title: "A", column: "todo" }];
    expect(moveCard(cards, "a", "done")[0].column).toBe("done");
    expect(moveCard(cards, "a", "nope")).toBe(cards);
  });

  it("deletes a card and finds neighbouring columns", () => {
    expect(deleteCard([{ id: "a", title: "A", column: "todo" }], "a")).toEqual([]);
    expect(neighbourColumn("todo", -1)).toBeNull();
    expect(neighbourColumn("todo", 1)).toBe("in_progress");
    expect(neighbourColumn("done", 1)).toBeNull();
  });
});

describe("storage", () => {
  it("round-trips cards and drops malformed entries", () => {
    const storage = memoryStorage();
    saveCards(storage, [{ id: "a", title: "A", column: "done" }]);
    expect(loadCards(storage)).toEqual([{ id: "a", title: "A", column: "done" }]);
    storage.data[STORAGE_KEY] = JSON.stringify([{ id: "x" }, { id: "b", title: "B", column: "weird" }]);
    expect(loadCards(storage)).toEqual([{ id: "b", title: "B", column: "todo" }]);
  });

  it("copies cards from the former built-in board without removing them", () => {
    const legacy = JSON.stringify({ state: { cards: [{ id: "old", title: "Old", column: "in_progress" }] }, version: 0 });
    const storage = memoryStorage({ [LEGACY_STORAGE_KEY]: legacy });
    expect(loadCards(storage)).toEqual([{ id: "old", title: "Old", column: "in_progress" }]);
    expect(storage.data[LEGACY_STORAGE_KEY]).toBe(legacy);
  });

  it("starts empty when storage throws or holds bad JSON", () => {
    expect(loadCards({ getItem: () => { throw new Error("blocked"); } })).toEqual([]);
    expect(loadCards(memoryStorage({ [STORAGE_KEY]: "{" }))).toEqual([]);
  });
});

describe("page", () => {
  afterEach(() => { document.body.replaceChildren(); document.head.replaceChildren(); });

  const mount = (storage = memoryStorage()) => {
    const container = document.createElement("div");
    document.body.append(container);
    const dispose = mountKanban(container, storage);
    return { container, dispose, storage };
  };

  it("adds a card from the form, moves it right and persists it", () => {
    const { container, storage } = mount();
    const input = container.querySelector('input[aria-label="Add a card"]');
    input.value = "Write docs";
    input.closest("form").dispatchEvent(new Event("submit", { cancelable: true }));
    expect(container.querySelector('[data-column="todo"] .title').textContent).toBe("Write docs");
    container.querySelector('button[aria-label="Move Write docs right"]').click();
    expect(container.querySelector('[data-column="in_progress"] .title').textContent).toBe("Write docs");
    expect(JSON.parse(storage.data[STORAGE_KEY])).toMatchObject([{ title: "Write docs", column: "in_progress" }]);
  });

  it("disables the edge arrows and deletes a card", () => {
    const { container } = mount(memoryStorage({ [STORAGE_KEY]: JSON.stringify([{ id: "a", title: "A", column: "todo" }]) }));
    expect(container.querySelector('button[aria-label="Move A left"]').disabled).toBe(true);
    container.querySelector('button[aria-label="Delete A"]').click();
    expect(container.querySelectorAll(".card")).toHaveLength(0);
  });

  it("moves a dragged card into the dropped column", () => {
    const { container } = mount(memoryStorage({ [STORAGE_KEY]: JSON.stringify([{ id: "a", title: "A", column: "todo" }]) }));
    container.querySelector(".card").dispatchEvent(new Event("dragstart"));
    container.querySelector('[data-column="done"]').dispatchEvent(new Event("drop", { cancelable: true }));
    expect(container.querySelector('[data-column="done"] .title').textContent).toBe("A");
  });

  it("warns when cards cannot be saved and cleans up on dispose", () => {
    const storage = { getItem: () => null, setItem: () => { throw new Error("full"); } };
    const { container, dispose } = mount(storage);
    const input = container.querySelector("input");
    input.value = "A";
    input.closest("form").dispatchEvent(new Event("submit", { cancelable: true }));
    expect(container.querySelector(".note").textContent).toMatch(/could not be saved/);
    dispose();
    expect(container.querySelector(".kb")).toBeNull();
    expect(document.head.querySelector("style")).toBeNull();
  });

  it("uses the host's contrast token with a fallback and fills the viewport height", () => {
    const { container } = mount();
    expect(document.head.querySelector("style").textContent).toContain("var(--oh-contrast, #FFFFFF)");
    expect(container.querySelector(".kb").style.height).toMatch(/px$/);
  });

  it("registers one page and rejects an unsupported host API", () => {
    const registerPage = vi.fn(() => () => {});
    activate({ apiVersion: "1", registerPage });
    expect(registerPage).toHaveBeenCalledWith("board", expect.any(Function));
    expect(() => activate({ apiVersion: "2", registerPage })).toThrow(/host API 1/);
  });
});
