// The composer's first step: which project a prompt is about. page.html then
// routes the prompt to a card inside that project with tools/pm/router.mjs.
// Order: a project named in the prompt (its id, repo, name or checkout path, or
// a `<key>:` card reference), a card id only one project has, the scope when
// it holds one project, the open card's project, then the project whose cards
// share the most words with the prompt.
import { ALL, inScope } from "./rollup.js";

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const word = (s) => new RegExp(`(^|[^A-Za-z0-9_-])${esc(s)}($|[^A-Za-z0-9_-])`, "i");
const ID = /\b([A-Z][A-Z0-9]{0,7}\.[A-Za-z0-9][A-Za-z0-9.]*[A-Za-z0-9]|[A-Z][A-Z0-9]{0,7}\.[A-Za-z0-9])\b/g;

/** `#12` -> `GH.12` (an issue) or `PR.12` (a pull request card) when the project has it. */
export function normalizeRefs(text, ids) {
  return String(text).replace(/(^|[^A-Za-z0-9&])#(\d+)\b/g, (m, pre, n) => (ids.has(`GH.${n}`) ? `${pre}GH.${n}` : ids.has(`PR.${n}`) ? `${pre}PR.${n}` : m));
}

/**
 * @param {string} text the prompt
 * @param {{ id, org, repo, name, path, key }[]} projects every project in the hub
 * @param {{ scope?: string, selected?: string | null, cardIds?: Map<string, Set<string>>,
 *           similarity?: (projectId: string, text: string) => number }} [ctx]
 * @returns {{ project: string | null, reasons: string[], confidence: number, alternatives: string[] }}
 */
export function pickProject(text, projects, ctx = {}) {
  const { scope = ALL, selected = null, cardIds = new Map(), similarity } = ctx;
  const inside = projects.filter((p) => inScope(p, scope));
  const pick = (p, why, confidence) => ({ project: p.id, reasons: [why], confidence, alternatives: inside.filter((x) => x.id !== p.id).map((x) => x.id) });

  // Named outright. Longest names first, so `openhands-main` beats `openhands`.
  const names = projects.flatMap((p) => [
    [p.id, p, 1], [p.path, p, 0.95], [p.repo, p, 0.9], [p.name, p, 0.9], [p.key, p, 0.9],
    ...(p.path ? [[p.path.split("/").pop(), p, 0.85]] : []),
  ]).filter(([n]) => n && n.length >= 3).sort((a, b) => b[0].length - a[0].length);
  for (const [n, p, c] of names) {
    if (String(text).includes(`${n}:`) && n === p.key) return pick(p, `Names a ${p.key} card.`, 0.95);
    if (word(n).test(text)) return pick(p, `Names ${n === p.path ? "the checkout" : "the project"} ${n}.`, c);
  }
  // The first word of a repo name, when only one project starts with it ("kosmos", "yakopop").
  const heads = {};
  for (const p of projects) {
    const h = p.repo.split(/[-_.]/)[0].toLowerCase();
    if (h.length >= 4) (heads[h] ??= []).push(p);
  }
  for (const [h, ps] of Object.entries(heads)) if (ps.length === 1 && word(h).test(text)) return pick(ps[0], `"${h}" means ${ps[0].id}.`, 0.75);

  // A card id that only one project has.
  const named = [...String(text).matchAll(ID)].map((m) => m[1]);
  const issues = [...String(text).matchAll(/#(\d+)\b/g)].flatMap((m) => [`GH.${m[1]}`, `PR.${m[1]}`]);
  for (const id of [...named, ...issues]) {
    const owners = inside.filter((p) => cardIds.get(p.id)?.has(id));
    if (owners.length === 1) return pick(owners[0], `Only ${owners[0].id} has ${id}.`, 0.85);
  }

  if (inside.length === 1) return pick(inside[0], `The scope is ${inside[0].id}.`, 0.8);
  const open = selected && inside.find((p) => p.key && selected.startsWith(`${p.key}:`));
  if (open && /\b(this|it|the card|this card)\b/i.test(text)) return pick(open, `"this" means the open card ${selected}.`, 0.8);

  if (similarity) {
    const scored = inside.map((p) => [p, similarity(p.id, text)]).sort((a, b) => b[1] - a[1]);
    const [best, second] = scored;
    if (best && best[1] >= 0.35 && (!second || best[1] - second[1] >= 0.1))
      return { ...pick(best[0], `${best[0].id} has the closest cards by words (${Math.round(best[1] * 100)}%).`, 0.55), alternatives: scored.slice(1).map(([p]) => p.id) };
  }
  if (open) return pick(open, `The open card ${selected} is in ${open.id}.`, 0.5);
  return { project: null, reasons: ["No project is named and the scope holds several: pick one."], confidence: 0, alternatives: inside.map((p) => p.id) };
}
