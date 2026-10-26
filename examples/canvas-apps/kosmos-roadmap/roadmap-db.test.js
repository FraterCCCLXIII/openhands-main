import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createRoadmapDb } from "./roadmap-db.js";
import { packRefreshOutput } from "./sync.mjs";

function memoryStorage(files = {}) {
  return {
    files,
    read: async (file) => files[file] ?? null,
    write: async (file, text) => {
      files[file] = text;
    },
  };
}

const snapshotOf = (collections) => JSON.stringify({ collections });
const parsedLocal = (storage) =>
  JSON.parse(storage.files["local.json"]).collections;

function nextSnapshot(db, name) {
  return new Promise((resolve, reject) => {
    const stop = db.collection(name).onSnapshot((snap) => {
      stop();
      resolve(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, reject);
  });
}

describe("Kosmos Roadmap db adapter", () => {
  let store;
  afterEach(() => store?.dispose());

  it("serves snapshot documents with local writes layered over them", async () => {
    // Arrange
    const storage = memoryStorage({
      "snapshot.json": snapshotOf({
        rows: { b: { t: "B" }, a: { t: "A" }, c: { t: "C" } },
      }),
      "local.json": snapshotOf({ rows: { b: { t: "B edited" }, c: null } }),
    });
    store = createRoadmapDb(storage, { pollMs: 0 });

    // Act
    const rows = await nextSnapshot(store.db, "rows");

    // Assert
    expect(rows).toEqual([
      { id: "a", t: "A" },
      { id: "b", t: "B edited" },
    ]);
  });

  it("persists set, update and delete to local.json and notifies listeners", async () => {
    // Arrange
    const storage = memoryStorage({
      "snapshot.json": snapshotOf({
        actions: { a1: { title: "Ship", done: false } },
        cardstate: {},
      }),
    });
    store = createRoadmapDb(storage, { pollMs: 0 });
    const seen = [];
    store.db
      .collection("cardstate")
      .onSnapshot((snap) => seen.push(snap.docs.map((d) => d.id)));
    const cards = store.db.collection("cardstate");

    // Act
    await cards.doc("ORC.1").set({ card: "ORC.1", col: "doing" });
    await store.db.collection("actions").doc("a1").update({ done: true });
    await cards.doc("ORC.1").delete();
    // A second page wrote to local.json in the meantime; the next write keeps it.
    storage.files["local.json"] = JSON.stringify({
      collections: {
        ...parsedLocal(storage),
        decisions: { d1: { answer: "yes" } },
      },
    });
    await cards.doc("ORC.2").set({ card: "ORC.2", col: "review" });

    // Assert
    expect(parsedLocal(storage)).toEqual({
      cardstate: { "ORC.1": null, "ORC.2": { card: "ORC.2", col: "review" } },
      actions: { a1: { title: "Ship", done: true } },
      decisions: { d1: { answer: "yes" } },
    });
    expect(seen).toEqual([[], ["ORC.1"], [], ["ORC.2"]]);
    await expect(
      store.db.collection("actions").doc("missing").update({ done: true }),
    ).rejects.toThrow("No document actions/missing");
  });

  it("reports a missing snapshot through the error callback", async () => {
    // Arrange
    store = createRoadmapDb(memoryStorage(), {
      pollMs: 0,
      missingSnapshotMessage: "Run sync.mjs.",
    });

    // Act
    const result = nextSnapshot(store.db, "rows");

    // Assert
    await expect(result).rejects.toThrow("Run sync.mjs.");
  });

  it("re-emits only when a re-read finds new content", async () => {
    // Arrange
    const storage = memoryStorage({
      "snapshot.json": snapshotOf({ rows: { a: { t: "A" } } }),
    });
    store = createRoadmapDb(storage, { pollMs: 0 });
    const seen = [];
    store.db
      .collection("rows")
      .onSnapshot((snap) => seen.push(snap.docs.map((d) => d.data().t)));
    await store.refresh();

    // Act
    await store.refresh();
    storage.files["snapshot.json"] = snapshotOf({ rows: { a: { t: "A2" } } });
    await store.refresh();

    // Assert
    expect(seen).toEqual([["A"], ["A2"]]);
  });
});

describe("Kosmos Roadmap sync", () => {
  let dir;
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("packs refresh.mjs batch files into snapshot collections in batch order", () => {
    // Arrange
    dir = mkdtempSync(join(tmpdir(), "kosmos-sync-"));
    const doc = (name, data) => {
      const path = join(dir, `${name}.json`);
      writeFileSync(path, JSON.stringify(data));
      return path;
    };
    const set = (collection, id, data) => ({
      op: "set",
      collection,
      doc_id: id,
      file_path: doc(`${collection}-${id}-${data.v}`, data),
    });
    writeFileSync(
      join(dir, "batch-2.json"),
      JSON.stringify([
        set("rows", "p0", { v: 2 }),
        set("meta", "board", { v: 1 }),
      ]),
    );
    writeFileSync(
      join(dir, "batch-1.json"),
      JSON.stringify([
        set("rows", "p0", { v: 1 }),
        set("rows", "p1", { v: 1 }),
      ]),
    );

    // Act
    const snapshot = packRefreshOutput(dir);

    // Assert
    expect(snapshot.documents).toBe(4);
    expect(snapshot.collections).toEqual({
      rows: { p0: { v: 2 }, p1: { v: 1 } },
      meta: { board: { v: 1 } },
    });
  });
});
