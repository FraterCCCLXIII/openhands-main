// Stands in for the claude.ai artifact `db` API that kosmos-gantt.html calls:
// `collection(name).onSnapshot(next, error)` and
// `collection(name).doc(id).set / update / delete`.
//
// Two JSON files back it, both reached through `storage`:
// - `snapshot.json`: every document `tools/pm/refresh.mjs` generated, packed
//   by `sync.mjs` as `{ collections: { [name]: { [id]: data } } }`.
// - `local.json`: writes made on this page (board moves, decisions, ticked
//   actions, row edits) in the same shape, where `null` deletes a document.
//   A refresh never touches it, so local writes survive.

export const SNAPSHOT_FILE = "snapshot.json";
export const LOCAL_FILE = "local.json";

function parseCollections(text, file) {
  if (text == null) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed.collections === "object"
      ? parsed.collections
      : {};
  } catch {
    throw new Error(`${file} is not valid JSON.`);
  }
}

export function mergeCollection(snapshot, local, name) {
  const docs = { ...snapshot?.[name] };
  for (const [id, data] of Object.entries(local?.[name] ?? {})) {
    if (data === null) delete docs[id];
    else docs[id] = data;
  }
  return docs;
}

function querySnapshot(docs) {
  const list = Object.entries(docs)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, data]) => ({
      id,
      exists: true,
      data: () => structuredClone(data),
    }));
  return { docs: list, size: list.length, empty: list.length === 0 };
}

/**
 * @param {{ read: (file: string) => Promise<string | null>,
 *           write: (file: string, text: string) => Promise<void> }} storage
 *   `read` resolves `null` when the file does not exist.
 * @param {{ pollMs?: number, missingSnapshotMessage?: string }} [options]
 */
export function createRoadmapDb(storage, options = {}) {
  const {
    pollMs = 30000,
    missingSnapshotMessage = `No ${SNAPSHOT_FILE} yet.`,
  } = options;
  const listeners = new Map();
  let snapshot = null;
  let local = {};
  let loadError = null;
  let lastText = null;
  let loaded = null;
  let timer = null;
  let disposed = false;
  let writes = Promise.resolve();

  let ready = false;

  const deliver = (listener, name) => {
    if (loadError) listener.error?.(loadError);
    else listener.next(querySnapshot(mergeCollection(snapshot, local, name)));
  };
  const emit = (name) => {
    for (const listener of listeners.get(name) ?? []) deliver(listener, name);
  };
  const emitAll = () => {
    for (const name of listeners.keys()) emit(name);
  };

  async function load() {
    try {
      const [snapshotText, localText] = await Promise.all([
        storage.read(SNAPSHOT_FILE),
        storage.read(LOCAL_FILE),
      ]);
      const text = `${snapshotText}\u0000${localText}`;
      if (text === lastText && !loadError) return;
      lastText = text;
      snapshot = parseCollections(snapshotText, SNAPSHOT_FILE);
      local = parseCollections(localText, LOCAL_FILE) ?? {};
      loadError = snapshot ? null : new Error(missingSnapshotMessage);
    } catch (error) {
      loadError = error instanceof Error ? error : new Error(String(error));
      lastText = null;
    }
    ready = true;
    if (!disposed) emitAll();
  }

  function ensureLoaded() {
    if (!loaded) {
      loaded = load();
      if (pollMs > 0) {
        timer = setInterval(() => {
          void load();
        }, pollMs);
      }
    }
    return loaded;
  }

  // Re-reads local.json before each write so two open pages do not drop each
  // other's writes, and runs writes one at a time.
  function mutate(name, id, change) {
    const run = writes.then(async () => {
      await ensureLoaded();
      const fresh =
        parseCollections(await storage.read(LOCAL_FILE), LOCAL_FILE) ?? {};
      const current = mergeCollection(snapshot, fresh, name)[id];
      const next = change(current);
      fresh[name] = { ...fresh[name], [id]: next };
      const text = JSON.stringify({ collections: fresh }, null, 1);
      await storage.write(LOCAL_FILE, text);
      local = fresh;
      lastText = null;
      emit(name);
    });
    writes = run.catch(() => undefined);
    return run;
  }

  function docRef(name, id) {
    return {
      id,
      set: (data) => mutate(name, id, () => structuredClone(data)),
      update: (patch) =>
        mutate(name, id, (current) => {
          if (current === undefined) {
            throw new Error(`No document ${name}/${id} to update.`);
          }
          return { ...current, ...structuredClone(patch) };
        }),
      delete: () => mutate(name, id, () => null),
    };
  }

  function collection(name) {
    return {
      doc: (id) => docRef(name, id),
      onSnapshot(next, error) {
        const listener = { next, error };
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name).add(listener);
        // Before the first load finishes, that load's emit reaches this
        // listener; after it, deliver the current documents now.
        if (ready) {
          queueMicrotask(() => {
            if (!disposed && listeners.get(name)?.has(listener)) {
              deliver(listener, name);
            }
          });
        } else {
          void ensureLoaded();
        }
        return () => listeners.get(name)?.delete(listener);
      },
    };
  }

  return {
    db: {
      collection,
      doc: (path) => {
        const [name, id] = String(path).split("/");
        return docRef(name, id);
      },
    },
    refresh: load,
    dispose() {
      disposed = true;
      if (timer) clearInterval(timer);
      listeners.clear();
    },
  };
}
