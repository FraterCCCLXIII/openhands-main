// Stands in for the claude.ai artifact `db` API that page.html calls
// (`collection(name).onSnapshot(next, error)`, `collection(name).doc(id)
// .set / update / delete`), over every project in the hub.
//
// Files, all reached through `storage` and relative to the hub dir:
// - `hub.json`: the orgs and projects (README.md "Hub data").
// - `projects/<org>/<repo>/snapshot.json`: an adapter's snapshot (CONTRACT.md).
// - `projects/<org>/<repo>/local.json`: writes made on the page for that
//   project, as `{ collections: { [name]: { [id]: data } } }`, where `null`
//   deletes a document. hub-sync.mjs never touches it.
//
// Reads lay each project's local.json over its snapshot, then rollup.js turns
// the projects in scope into the page's collections. A write goes to the
// local.json of the project the document belongs to.
import { ALL, inScope, rollup, stripRefs } from "./rollup.js";
import { normalizeRefs, pickProject } from "./hub-router.js";

export const HUB_FILE = "hub.json";
const projectFile = (id, file) => `projects/${id}/${file}`;

function parse(text, file, fallback) {
  if (text == null) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${file} is not valid JSON.`);
  }
}

export function overlay(snapshot, local) {
  const out = {};
  for (const name of new Set([...Object.keys(snapshot ?? {}), ...Object.keys(local ?? {})])) {
    const docs = { ...snapshot?.[name] };
    for (const [id, data] of Object.entries(local?.[name] ?? {})) {
      if (data === null) delete docs[id];
      else docs[id] = data;
    }
    out[name] = docs;
  }
  return out;
}

function querySnapshot(docs) {
  const list = Object.entries(docs ?? {})
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, data]) => ({ id, exists: true, data: () => structuredClone(data) }));
  return { docs: list, size: list.length, empty: list.length === 0 };
}

/**
 * @param {{ read: (file: string) => Promise<string | null>,
 *           write: (file: string, text: string) => Promise<void> }} storage
 *   `read` resolves `null` when the file does not exist.
 * @param {{ pollMs?: number, scope?: string, missingHubMessage?: string }} [options]
 */
export function createHubDb(storage, options = {}) {
  const { pollMs = 30000, missingHubMessage = `No ${HUB_FILE} yet.` } = options;
  const listeners = new Map();
  const hubListeners = new Set();
  let scope = options.scope ?? ALL;
  let hub = null;
  let entries = [];
  let view = { collections: {}, projects: [], keys: new Map() };
  let loadError = null;
  let lastText = null;
  let loaded = null;
  let timer = null;
  let disposed = false;
  let ready = false;
  let writes = Promise.resolve();

  const deliver = (listener, name) => {
    if (loadError) listener.error?.(loadError);
    else listener.next(querySnapshot(view.collections[name]));
  };
  const emitAll = () => {
    for (const [name, set] of listeners) for (const l of set) deliver(l, name);
    for (const fn of hubListeners) fn(hubInfo());
  };
  const recompute = () => {
    // A scope can outlive its project (removed from hub.json): fall back to all.
    if (scope !== ALL && !entries.some((e) => inScope(e.project, scope))) scope = ALL;
    view = rollup(entries, scope);
  };

  async function load() {
    try {
      const hubText = await storage.read(HUB_FILE);
      hub = parse(hubText, HUB_FILE, null);
      if (!hub) throw new Error(missingHubMessage);
      const texts = await Promise.all(
        hub.projects.map(async (p) => [await storage.read(projectFile(p.id, "snapshot.json")), await storage.read(projectFile(p.id, "local.json"))]),
      );
      const text = [hubText, ...texts.flat()].join("\u0000");
      if (text === lastText && !loadError) return;
      lastText = text;
      entries = hub.projects.flatMap((p, i) => {
        const snap = parse(texts[i][0], projectFile(p.id, "snapshot.json"), null);
        if (!snap) return [];
        const local = parse(texts[i][1], projectFile(p.id, "local.json"), {}).collections ?? {};
        return [{ project: { ...snap.project, name: p.name ?? snap.project.name, lastSync: p.lastSync }, collections: overlay(snap.collections, local), snapshot: snap.collections }];
      });
      loadError = null;
      recompute();
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
      if (pollMs > 0) timer = setInterval(() => void load(), pollMs);
    }
    return loaded;
  }

  // Which project a page write belongs to, and the document's id there.
  function resolve(name, id, data) {
    const keys = [...view.keys].sort((a, b) => b[1].length - a[1].length);
    const byKey = (text) => {
      for (const [pid, key] of keys) for (const sep of [":", "_"]) if (String(text ?? "").startsWith(key + sep)) return [pid, String(text).slice(key.length + 1)];
      return null;
    };
    const multi = view.projects.length > 1;
    const hit = (multi && byKey(id)) || null;
    if (hit) return { project: hit[0], id: hit[1] };
    const named = data?.project && entries.some((e) => e.project.id === data.project) ? data.project : multi ? byKey(data?.card)?.[0] : null;
    if (named) return { project: named, id };
    // A document the rollup shows unprefixed (prices) belongs to the first project that has it.
    if (multi) {
      const owner = entries.find((e) => inScope(e.project, scope) && e.collections[name]?.[id] !== undefined);
      if (owner) return { project: owner.project.id, id };
      throw new Error("Pick one project in the scope menu, or name the project, before saving this.");
    }
    if (!view.projects[0]) throw new Error("No project in scope.");
    return { project: view.projects[0].id, id };
  }

  // Re-reads the project's local.json before each write so two open pages do
  // not drop each other's writes, and runs writes one at a time.
  function mutate(name, pageId, change, data) {
    const run = writes.then(async () => {
      await ensureLoaded();
      const { project, id } = resolve(name, pageId, data);
      const entry = entries.find((e) => e.project.id === project);
      const key = view.keys.get(project);
      const file = projectFile(project, "local.json");
      const fresh = parse(await storage.read(file), file, {}).collections ?? {};
      const current = overlay(entry.snapshot, fresh)[name]?.[id];
      const next = change(current, (d) => (view.projects.length > 1 ? stripRefs(d, key) : d));
      fresh[name] = { ...fresh[name], [id]: next && { ...next, project } };
      await storage.write(file, JSON.stringify({ collections: fresh }, null, 1));
      entry.collections = overlay(entry.snapshot, fresh);
      lastText = null;
      recompute();
      emitAll();
    });
    writes = run.catch(() => undefined);
    return run;
  }

  function docRef(name, id) {
    return {
      id,
      set: (data) => mutate(name, id, (_, strip) => strip(structuredClone(data)), data),
      update: (patch) =>
        mutate(name, id, (current, strip) => {
          if (current === undefined) throw new Error(`No document ${name}/${id} to update.`);
          return { ...current, ...strip(structuredClone(patch)) };
        }, patch),
      delete: () => mutate(name, id, () => null, null),
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
        if (ready) queueMicrotask(() => !disposed && listeners.get(name)?.has(listener) && deliver(listener, name));
        else void ensureLoaded();
        return () => listeners.get(name)?.delete(listener);
      },
    };
  }

  function hubInfo() {
    const keys = view.keys;
    return {
      scope,
      dir: options.dir ?? null,
      orgs: hub?.orgs ?? [],
      projects: entries.map((e) => ({ ...e.project, key: keys.get(e.project.id), inScope: inScope(e.project, scope) })),
      error: loadError?.message ?? null,
    };
  }

  return {
    db: { collection, doc: (path) => docRef(...String(path).split("/")) },
    hub: {
      info: hubInfo,
      setScope(next) {
        scope = next || ALL;
        if (ready && !loadError) recompute();
        emitAll();
      },
      // The composer's project step (hub-router.js); `similarity` scores a
      // project's cards against the prompt with the page's card router.
      pickProject(text, { selected = null, similarity } = {}) {
        const cardIds = new Map(entries.map((e) => [e.project.id, new Set(Object.keys(e.collections.cards ?? {}))]));
        return pickProject(text, hubInfo().projects, { scope, selected, cardIds, similarity });
      },
      normalizeRefs(text, projectId) {
        return normalizeRefs(text, new Set(Object.keys(entries.find((e) => e.project.id === projectId)?.collections.cards ?? {})));
      },
      onChange(fn) {
        hubListeners.add(fn);
        if (ready) queueMicrotask(() => hubListeners.has(fn) && fn(hubInfo()));
        else void ensureLoaded();
        return () => hubListeners.delete(fn);
      },
    },
    refresh: load,
    dispose() {
      disposed = true;
      if (timer) clearInterval(timer);
      listeners.clear();
      hubListeners.clear();
    },
  };
}
