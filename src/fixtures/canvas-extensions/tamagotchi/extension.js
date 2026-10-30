// ASCII Tamagotchi: a dependency-free Canvas Extension (manifest schema 1, host API 1).
// The file is one self-contained browser ES module, so it can be installed as-is.

const STORAGE_KEY = "canvas-extension-tamagotchi:v1";
const TICK_MS = 1000;
const MINUTE_MS = 60 * 1000;
const MAX_CATCHUP_MS = 8 * 60 * MINUTE_MS;
const EGG_MS = 2 * MINUTE_MS;
const NAP_MS = 3 * MINUTE_MS;
const JOURNAL_LIMIT = 40;

const PAGES = [
  { id: "home", label: "Home", path: "/home" },
  { id: "journal", label: "Journal", path: "/journal" },
];

const STAGE_LABELS = {
  egg: "Egg stage",
  baby: "Baby stage",
  child: "Child stage",
  adult: "Adult stage",
  gone: "Passed away",
};

const MOODS = {
  gone: { label: "Passed", text: "Tater has passed. Start a new egg to begin again.", eyes: "x x", mouth: "_" },
  egg: { label: "Egg", text: "Still warming up inside its shell.", eyes: "", mouth: "" },
  sleepy: { label: "Sleepy", text: "Snoring softly in a dream of pixels.", eyes: "- -", mouth: "z" },
  sick: { label: "Sick", text: "Feeling under the weather. Medicine may help.", eyes: "x x", mouth: "~" },
  hungry: { label: "Hungry", text: "Tummy rumbling. Time for a snack.", eyes: "o o", mouth: "o" },
  dirty: { label: "Dirty", text: "Could use a tidy-up.", eyes: "> <", mouth: "~" },
  bored: { label: "Bored", text: "Wants a game to lift its spirits.", eyes: "- -", mouth: "..." },
  happy: { label: "Happy", text: "Bright-eyed and ready to play.", eyes: "^ ^", mouth: "\\_/" },
};

const BODIES = {
  egg: [
    "    _____    ",
    "   /     \\   ",
    "  |       |  ",
    "  |       |  ",
    "   \\_____/   ",
  ],
  baby: [
    '   .-"""-.   ',
    "  /       \\  ",
    " |  {EYES}  | ",
    " |   {MOUTH}  | ",
    "  \\       /  ",
    "   '-----'   ",
  ],
  child: [
    "   /\\___/\\   ",
    "  /  {EYES}  \\  ",
    " |    {MOUTH}   | ",
    "  \\_________/  ",
  ],
  adult: [
    "   .-------.   ",
    "  |  {EYES}  |  ",
    "  |   {MOUTH}   |  ",
    "  |_________|  ",
    "   /|       |\\ ",
    "  (_|       |_)",
  ],
};

const NEEDS = [
  ["hunger", "Hunger"],
  ["joy", "Joy"],
  ["energy", "Energy"],
  ["hygiene", "Hygiene"],
  ["health", "Health"],
];

const CARE_GUIDE = [
  ["Feed", "Boosts hunger and gives a tiny health bump."],
  ["Play", "Raises joy but burns energy and a little hunger."],
  ["Nap", "Sleeping restores energy and slows boredom."],
  ["Clean", "Removes mess and helps hygiene recover."],
  ["Medicine", "Best used when health dips or your pet looks sick."],
];

const clamp = (value) => Math.min(100, Math.max(0, value));
const done = (text) => ({ ok: true, text });
const refuse = (text) => ({ ok: false, text });

const ACTIONS = {
  feed(state) {
    if (state.hunger >= 95) return refuse("Too full for another bite.");
    state.hunger = clamp(state.hunger + 25);
    state.joy = clamp(state.joy + 2);
    return done("Fed Tater a tasty meal.");
  },
  play(state) {
    if (state.energy < 15) return refuse("Too tired to play. Try a nap.");
    state.joy = clamp(state.joy + 20);
    state.energy = clamp(state.energy - 12);
    state.hunger = clamp(state.hunger - 5);
    return done("Played a game together.");
  },
  nap(state, now) {
    if (state.energy >= 90) return refuse("Not sleepy yet.");
    state.sleepUntil = now + NAP_MS;
    return done("Tucked in for a nap.");
  },
  clean(state) {
    if (state.waste === 0 && state.hygiene >= 90) return refuse("Already spotless.");
    state.waste = 0;
    state.wasteTimer = 0;
    state.hygiene = clamp(state.hygiene + 35);
    state.joy = clamp(state.joy + 3);
    return done("Cleaned up the mess.");
  },
  medicine(state) {
    if (state.health >= 80) return refuse("Tater feels fine. Save the medicine.");
    state.health = clamp(state.health + 35);
    state.joy = clamp(state.joy - 5);
    return done("Gave medicine. Health is recovering.");
  },
};

function freshState(now) {
  return {
    name: "Tater",
    born: now,
    lastTick: now,
    stage: "egg",
    hunger: 80,
    joy: 80,
    energy: 80,
    hygiene: 80,
    health: 100,
    growth: 0,
    waste: 0,
    wasteTimer: 0,
    sleepUntil: 0,
    dead: false,
    journal: [{ at: now, text: "A new egg appeared. Keep it warm and cared for." }],
  };
}

function loadState(now) {
  try {
    const saved = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && typeof saved.born === "number") return { ...freshState(now), ...saved };
  } catch {
    // Storage may be blocked or hold corrupt data; hatch a fresh egg instead.
  }
  return freshState(now);
}

function stageOf(state, now) {
  if (state.dead) return "gone";
  if (now - state.born < EGG_MS) return "egg";
  if (state.growth < 35) return "baby";
  if (state.growth < 70) return "child";
  return "adult";
}

function moodOf(state, stage, now) {
  if (stage === "gone") return "gone";
  if (stage === "egg") return "egg";
  if (now < state.sleepUntil) return "sleepy";
  if (state.health < 35) return "sick";
  if (state.hunger < 30) return "hungry";
  if (state.waste >= 3 || state.hygiene < 30) return "dirty";
  if (state.joy < 30) return "bored";
  return "happy";
}

function describe(state, now) {
  const stage = stageOf(state, now);
  return {
    stage,
    mood: moodOf(state, stage, now),
    asleep: !state.dead && now < state.sleepUntil,
    dead: state.dead,
    age: formatAge(now - state.born),
  };
}

function formatAge(ms) {
  const minutes = Math.floor(ms / MINUTE_MS);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

// Applies elapsed wall-clock time to the pet and returns journal lines for notable changes.
function advance(state, now) {
  const elapsed = Math.min(Math.max(now - state.lastTick, 0), MAX_CATCHUP_MS);
  state.lastTick = now;
  if (state.dead || elapsed === 0) return [];

  const events = [];
  const minutes = elapsed / MINUTE_MS;
  const wasSick = state.health < 35;
  const wasteBefore = state.waste;

  if (state.sleepUntil && now >= state.sleepUntil) {
    state.sleepUntil = 0;
    events.push("Woke up from a nap, feeling rested.");
  }

  if (now < state.sleepUntil) {
    state.energy = clamp(state.energy + 4 * minutes);
    state.hunger = clamp(state.hunger - 1 * minutes);
    state.hygiene = clamp(state.hygiene - 0.3 * minutes);
  } else {
    state.hunger = clamp(state.hunger - 2 * minutes);
    state.joy = clamp(state.joy - 1.5 * minutes);
    state.energy = clamp(state.energy - 1 * minutes);
    state.hygiene = clamp(state.hygiene - 0.8 * minutes);
    if (state.waste < 4) {
      state.wasteTimer += minutes;
      while (state.wasteTimer >= 4 && state.waste < 4) {
        state.waste += 1;
        state.wasteTimer -= 4;
      }
    } else {
      state.wasteTimer = 0;
    }
  }
  state.hygiene = clamp(state.hygiene - state.waste * 0.4 * minutes);
  if (state.waste > wasteBefore) events.push("Left a mess behind.");

  const lowest = Math.min(state.hunger, state.joy, state.energy, state.hygiene);
  if (lowest < 20) state.health = clamp(state.health - 3 * minutes);
  else if (lowest > 50) state.health = clamp(state.health + 1 * minutes);
  if (!wasSick && state.health < 35) events.push("Came down with a sickness.");

  if (state.health <= 0) {
    state.health = 0;
    state.dead = true;
    events.push("Tater has passed away. Start a new egg to begin again.");
    return events;
  }

  const stageBefore = state.stage;
  const stage = stageOf(state, now);
  if (stage !== "egg") {
    const care = (state.hunger + state.energy + state.hygiene + state.health) / 400;
    if (care >= 0.5) state.growth = clamp(state.growth + 1.2 * care * minutes);
  }
  const grownStage = stageOf(state, now);
  if (grownStage !== stageBefore) {
    state.stage = grownStage;
    if (stageBefore === "egg") events.push("Hatched! Tater is now a baby.");
    else events.push(`Grew into a ${grownStage}.`);
  }
  return events;
}

function artFor(stage, mood) {
  const bodyKey = stage === "gone" ? "baby" : stage;
  const face = MOODS[mood];
  return BODIES[bodyKey]
    .map((line) => line.split("{EYES}").join(face.eyes).split("{MOUTH}").join(face.mouth))
    .join("\n");
}

function barColor(key, value) {
  if (key === "growth") return "#9b8cff";
  if (value >= 50) return "#2ecc71";
  if (value >= 25) return "#f1c40f";
  return "#e74c3c";
}

function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "text") node.textContent = value;
    else if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
}

const STYLE = `
.tama { min-height: 100%; box-sizing: border-box; padding: 1.25rem; color: var(--oh-foreground, #f5f5f5); background: var(--oh-color-base, #151515); font: inherit; }
.tama *, .tama *::before, .tama *::after { box-sizing: border-box; }
.tama-header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; border: 1px solid #333; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
.tama-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.tama-pill { border: 1px solid #444; border-radius: 999px; padding: 0.2rem 0.7rem; font-size: 0.8rem; background: #222; color: #f5f5f5; }
.tama h1 { font-size: 1.6rem; font-weight: 600; margin: 0.75rem 0 0.25rem; }
.tama h2 { font-size: 1.05rem; font-weight: 600; margin: 0; }
.tama-sub { margin: 0; opacity: 0.65; }
.tama-nav, .tama-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.tama-nav { align-self: flex-start; }
.tama-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
@media (max-width: 900px) { .tama-grid { grid-template-columns: 1fr; } }
.tama-panel { border: 1px solid #333; border-radius: 12px; padding: 1rem; background: #1b1b1b; color: #f5f5f5; display: flex; flex-direction: column; gap: 0.75rem; }
.tama-den { border: 1px solid #5a3d12; border-radius: 10px; padding: 1rem; display: flex; justify-content: center; background: radial-gradient(circle at 40% 30%, rgba(240, 160, 48, 0.18), transparent 60%), #171717; }
.tama-art { margin: 0; font-family: ui-monospace, Menlo, monospace; font-size: 0.95rem; line-height: 1.25; color: #f7c948; white-space: pre; }
.tama-name { text-align: center; font-size: 1.2rem; }
.tama-mood-text { text-align: center; margin: 0; opacity: 0.7; }
.tama-cells { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; }
.tama-cell { border: 1px solid #333; border-radius: 8px; padding: 0.5rem 0.75rem; }
.tama-cell span { display: block; font-size: 0.75rem; opacity: 0.6; }
.tama-cell strong { font-weight: 600; }
.tama-btn { font: inherit; font-size: 0.9rem; padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid #444; background: #222; color: #f5f5f5; cursor: pointer; }
.tama-btn:hover:not(:disabled) { border-color: #777; }
.tama-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.tama-btn:focus-visible { outline: 2px solid #f0a030; outline-offset: 2px; }
.tama-btn[data-active="true"] { border-color: #f0a030; color: #f7c948; }
.tama-btn[data-danger="true"] { border-color: #b64242; color: #ff8a8a; }
.tama-note { min-height: 1.25rem; margin: 0; color: #f0a030; font-size: 0.9rem; }
.tama-need { display: grid; gap: 0.3rem; }
.tama-need-head { display: flex; justify-content: space-between; font-size: 0.9rem; }
.tama-need-head span:last-child { opacity: 0.6; }
.tama-bar { height: 10px; border-radius: 999px; background: #2a2a2a; overflow: hidden; }
.tama-bar > span { display: block; height: 100%; transition: width 0.4s ease; }
.tama-guide { border: 1px solid #333; border-radius: 8px; padding: 0.6rem 0.8rem; }
.tama-guide span { display: block; font-size: 0.8rem; opacity: 0.6; }
.tama-guide p { margin: 0.15rem 0 0; font-weight: 600; }
.tama-log { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; max-height: 60vh; overflow: auto; }
.tama-log li { border: 1px solid #333; border-radius: 8px; padding: 0.5rem 0.75rem; }
.tama-log time { display: block; font-size: 0.75rem; opacity: 0.6; }
`;

function createShell(host, navigate, activeId) {
  const hostPill = h("span", { class: "tama-pill", text: `Host API ${host.apiVersion}` });
  const stagePill = h("span", { class: "tama-pill" });
  const moodPill = h("span", { class: "tama-pill" });
  const navButtons = PAGES.map(({ id, label, path }) =>
    h("button", {
      class: "tama-btn",
      type: "button",
      "data-active": String(id === activeId),
      text: label,
      onclick: () => navigate(path),
    }),
  );
  const el = h(
    "header",
    { class: "tama-header" },
    h(
      "div",
      {},
      h("div", { class: "tama-pills" }, hostPill, stagePill, moodPill),
      h("h1", { text: "ASCII Tamagotchi" }),
      h("p", {
        class: "tama-sub",
        text: "Raise a pocket monster with good food, games, naps, cleanup, and a little medicine.",
      }),
    ),
    h("nav", { class: "tama-nav" }, ...navButtons),
  );
  return {
    el,
    update(snapshot) {
      stagePill.textContent = STAGE_LABELS[snapshot.stage];
      moodPill.textContent = `Mood: ${MOODS[snapshot.mood].label}`;
    },
  };
}

function cell(label) {
  const value = h("strong");
  return { el: h("div", { class: "tama-cell" }, h("span", { text: label }), value), value };
}

function createHomeView(host, navigate, act) {
  const shell = createShell(host, navigate, "home");
  const art = h("pre", { class: "tama-art", role: "img", "aria-label": "Tamagotchi pet" });
  const name = h("h2", { class: "tama-name" });
  const moodText = h("p", { class: "tama-mood-text" });
  const age = cell("Age");
  const growth = cell("Growth");
  const waste = cell("Waste");
  const note = h("p", { class: "tama-note", role: "status" });
  const guideStatus = h("p", { class: "tama-sub" });

  const actionButtons = [
    ["feed", "Feed"],
    ["play", "Play"],
    ["nap", "Nap"],
    ["clean", "Clean"],
    ["medicine", "Medicine"],
  ].map(([key, label]) => ({
    key,
    el: h("button", { class: "tama-btn", type: "button", text: label, onclick: () => act(key) }),
  }));
  const newEgg = h("button", {
    class: "tama-btn",
    type: "button",
    "data-danger": "true",
    text: "New egg",
    onclick: () => act("new-egg"),
  });

  const needs = [...NEEDS, ["growth", "Growth"]].map(([key, label]) => {
    const valueText = h("span", {});
    const fill = h("span", {});
    return {
      key,
      valueText,
      fill,
      el: h(
        "div",
        { class: "tama-need" },
        h("div", { class: "tama-need-head" }, h("span", { text: label }), valueText),
        h("div", { class: "tama-bar" }, fill),
      ),
    };
  });

  const den = h(
    "section",
    { class: "tama-panel" },
    h("h2", { text: "Pet den" }),
    h("p", { class: "tama-sub", text: "Your pet grows faster when its core needs stay balanced." }),
    h("div", { class: "tama-den" }, art),
    name,
    moodText,
    h("div", { class: "tama-cells" }, age.el, growth.el, waste.el),
    h("div", { class: "tama-actions" }, ...actionButtons.map((button) => button.el), newEgg),
    note,
  );

  const needsPanel = h(
    "section",
    { class: "tama-panel" },
    h("h2", { text: "Needs and growth" }),
    h("p", { class: "tama-sub", text: "Keep the bars above the halfway mark to encourage steady evolution." }),
    ...needs.map((need) => need.el),
  );

  const carePanel = h(
    "section",
    { class: "tama-panel" },
    h("h2", { text: "Care guide" }),
    guideStatus,
    ...CARE_GUIDE.map(([label, description]) =>
      h("div", { class: "tama-guide" }, h("span", { text: label }), h("p", { text: description })),
    ),
    h("div", { class: "tama-actions" }, h("button", {
      class: "tama-btn",
      type: "button",
      text: "View journal",
      onclick: () => navigate("/journal"),
    })),
  );

  const el = h("div", { class: "tama" }, shell.el, h("div", { class: "tama-grid" }, den, needsPanel, carePanel));

  return {
    el,
    update(state, now) {
      const snapshot = describe(state, now);
      shell.update(snapshot);
      const mood = MOODS[snapshot.mood];
      art.textContent = artFor(snapshot.stage, snapshot.mood);
      name.textContent = state.name;
      moodText.textContent = mood.text;
      age.value.textContent = snapshot.age;
      growth.value.textContent = `${Math.round(state.growth)}%`;
      waste.value.textContent = `${state.waste}/4`;
      guideStatus.textContent =
        snapshot.mood === "sick"
          ? "Tater looks sick. Medicine is recommended."
          : "Everything looks stable. Keep rotating care actions to maintain balanced growth.";
      for (const button of actionButtons) {
        button.el.disabled = snapshot.dead || snapshot.asleep;
      }
      for (const need of needs) {
        const value = Math.round(state[need.key]);
        need.valueText.textContent = `${value}%`;
        need.fill.style.width = `${value}%`;
        need.fill.style.background = barColor(need.key, value);
      }
    },
    note,
  };
}

function createJournalView(host, navigate) {
  const shell = createShell(host, navigate, "journal");
  const summary = h("p", { class: "tama-sub" });
  const list = h("ol", { class: "tama-log" });
  const el = h(
    "div",
    { class: "tama" },
    shell.el,
    h(
      "section",
      { class: "tama-panel" },
      h("h2", { text: "Journal" }),
      summary,
      list,
      h("div", { class: "tama-actions" }, h("button", {
        class: "tama-btn",
        type: "button",
        text: "Back to den",
        onclick: () => navigate("/home"),
      })),
    ),
  );

  return {
    el,
    update(state, now) {
      const snapshot = describe(state, now);
      shell.update(snapshot);
      summary.textContent = `${state.name} is a ${STAGE_LABELS[snapshot.stage].toLowerCase()} and ${snapshot.age} old.`;
      const entries = [...state.journal].reverse();
      list.replaceChildren(
        ...(entries.length
          ? entries.map(({ at, text }) =>
              h(
                "li",
                {},
                h("time", { text: new Date(at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) }),
                text,
              ),
            )
          : [h("li", { text: "Nothing written yet." })]),
      );
    },
  };
}

export function activate(host) {
  let state = loadState(Date.now());
  let note = "";
  const listeners = new Set();

  const notify = () => {
    const now = Date.now();
    for (const listener of listeners) listener(state, now);
  };

  const save = () => {
    try {
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Persistence is a convenience; the pet keeps running without it.
    }
  };

  const record = (texts, at) => {
    for (const text of texts) state.journal.push({ at, text });
    state.journal = state.journal.slice(-JOURNAL_LIMIT);
  };

  const commit = (text) => {
    note = text;
    save();
    notify();
    return text;
  };

  const act = (name) => {
    const now = Date.now();
    if (name === "new-egg") {
      state = freshState(now);
      return commit("A fresh egg appeared.");
    }
    if (state.dead) return commit("Tater has passed. Start a new egg to begin again.");
    record(advance(state, now), now);
    if (now < state.sleepUntil) return commit("Shh, Tater is napping.");
    const result = ACTIONS[name](state, now);
    if (result.ok) record([result.text], now);
    return commit(result.text);
  };

  const mountPage = (createView) => ({ container, navigate }) => {
    const view = createView(navigate);
    const refresh = (current, now) => {
      view.update(current, now);
      if (view.note) view.note.textContent = note;
    };
    listeners.add(refresh);
    refresh(state, Date.now());
    container.replaceChildren(h("style", { text: STYLE }), view.el);
    return () => {
      listeners.delete(refresh);
      container.replaceChildren();
    };
  };

  const unregisterHome = host.registerPage(
    "home",
    mountPage((navigate) => createHomeView(host, navigate, act)),
  );
  const unregisterJournal = host.registerPage(
    "journal",
    mountPage((navigate) => createJournalView(host, navigate)),
  );

  const timer = setInterval(() => {
    record(advance(state, Date.now()), Date.now());
    save();
    notify();
  }, TICK_MS);

  return () => {
    clearInterval(timer);
    listeners.clear();
    for (const unregister of [unregisterHome, unregisterJournal]) {
      if (typeof unregister === "function") unregister();
    }
  };
}
