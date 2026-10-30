/* Marketing Production — a Canvas App that plans marketing against the OpenHands
 * product release schedule: a Gantt timeline of releases, feature launches,
 * quarterly campaigns and production projects, plus board, calendar, list,
 * campaign coverage, 2D/3D/video asset pipelines, agent campaign templates,
 * cost estimates and the services it will connect to.
 *
 * Browser-only, dependency-free ESM. All styles are scoped under `.mp`. Text is
 * always set with textContent. Plan data lives in this browser's localStorage.
 * Agent features start a conversation on the active Agent Server with
 * host.agentServer.request(), only when the person confirms.
 */

// ─── Constants ────────────────────────────────────────────────────────────

const STORAGE_KEY = "marketing-production:v1";
const DAY = 86_400_000;
const RELEASES_URL = "https://api.github.com/repos/OpenHands/OpenHands/releases?per_page=100";

export const LANES = [
  { id: "release", label: "OpenHands releases" },
  { id: "feature", label: "Feature launches" },
  { id: "campaign", label: "Quarterly campaigns" },
  { id: "project", label: "Production projects" },
];
export const STATUSES = [
  { id: "planned", label: "Planned" },
  { id: "in_progress", label: "In progress" },
  { id: "at_risk", label: "At risk" },
  { id: "shipped", label: "Shipped" },
];
export const CHANNELS = [
  { id: "hubspot", name: "HubSpot", feeds: "Contacts, email and lifecycle campaigns, lead attribution." },
  { id: "x", name: "X", feeds: "Scheduled posts and engagement analytics." },
  { id: "linkedin", name: "LinkedIn", feeds: "Company and creator posts, ad campaigns, engagement." },
  { id: "gsc", name: "Google Search Console", feeds: "Search impressions, clicks and ranking queries for launch content." },
  { id: "ga", name: "Google Analytics", feeds: "Traffic, conversions and campaign attribution on openhands.dev." },
  { id: "reddit", name: "Reddit", feeds: "Community posts and thread tracking in relevant subreddits." },
  { id: "ads", name: "Ad networks", feeds: "Paid spend, reach and cost per acquisition by network." },
  { id: "spotify", name: "Spotify", feeds: "Podcast episodes and audio ads, with listens per episode." },
];
// Listed with the connectors but not part of the plan: campaigns cannot pick it.
const EXCLUDED_CONNECTORS = [{ id: "resend", name: "Resend", feeds: "Transactional email. Not using it." }];
export const ASSET_KINDS = [
  { id: "image2d", label: "2D image", tool: "Image generation" },
  { id: "model3d", label: "3D model", tool: "3D generation" },
  { id: "video", label: "Video", tool: "Seedance" },
];
export const ASSET_STAGES = [
  { id: "brief", label: "Brief" },
  { id: "generating", label: "Generating" },
  { id: "review", label: "Review" },
  { id: "approved", label: "Approved" },
  { id: "published", label: "Published" },
];
const VIEWS = [
  ["timeline", "Timeline"],
  ["board", "Board"],
  ["calendar", "Calendar"],
  ["list", "List"],
  ["campaigns", "Campaigns"],
  ["map", "Map"],
  ["assets", "Assets"],
  ["templates", "Templates"],
  ["ads", "Ad spend"],
  ["costs", "Costs"],
  ["connections", "Connectors"],
];
const ZOOM_PPD = { month: 14, quarter: 4, year: 1.6 };
const ROW_H = 32;
const LABEL_W = 250;

// Releases of OpenHands/OpenHands (the v1.x series), published dates. A snapshot
// taken 2026-10-29; "Refresh releases" replaces it from the GitHub API.
const RELEASE_SNAPSHOT = [
  ["v1.6.1", "2026-07-28"], ["v1.7.0", "2026-07-29"], ["v1.7.1", "2026-07-30"], ["v1.7.2", "2026-07-30"],
  ["v1.8.0", "2026-07-30"], ["v1.9.0", "2026-08-03"], ["v1.10.0", "2026-08-05"], ["v1.11.0", "2026-08-07"],
  ["v1.12.0", "2026-08-07"], ["v1.13.0", "2026-08-13"], ["v1.14.0", "2026-08-17"], ["v1.15.0", "2026-08-21"],
  ["v1.16.0", "2026-08-27"], ["v1.17.0", "2026-09-09"], ["v1.18.0", "2026-09-11"], ["v1.19.0", "2026-09-16"],
  ["v1.20.0", "2026-09-17"], ["v1.21.0", "2026-09-22"], ["v1.22.0", "2026-09-22"], ["v1.23.0", "2026-09-23"],
  ["v1.24.0", "2026-09-25"], ["v1.25.0", "2026-10-06"], ["v1.26.0", "2026-10-08"], ["v1.27.0", "2026-10-12"],
  ["v1.27.1", "2026-10-12"], ["v1.28.0", "2026-10-19"], ["v1.28.1", "2026-10-19"], ["v1.29.0", "2026-10-20"],
  ["v1.30.0", "2026-10-22"], ["v1.30.1", "2026-10-22"], ["v1.31.0", "2026-10-22"], ["v1.32.0", "2026-10-23"],
  ["v1.33.0", "2026-10-23"], ["v1.34.0", "2026-10-27"],
].map(([tag, date]) => ({ tag, date }));

// ─── Agent campaign templates (.md instructions + .json brief) ────────────

const TEMPLATE_MD = {
  "quarterly-campaign": `# Quarterly campaign

You plan one quarterly marketing campaign for OpenHands and tie it to product releases.

## Inputs
- The campaign brief JSON (\`quarterly-campaign.json\`).
- The release schedule and feature launches from the Marketing Production plan.

## Do
1. Pick one theme for the quarter and state the audience and the one outcome that matters.
2. Link every campaign beat to a feature launch or release date. A beat that has no launch behind it is cut.
3. Schedule each channel so that posts land on launch day and the two days after, not before.
4. List every asset the campaign needs (2D, 3D, video) with its spec, and hand them to the asset brief.
5. Name the KPI per channel and where it is read (HubSpot, Google Analytics, Search Console, and so on).

## Output
Reply with one fenced \`json\` block in the plan format (\`items\` and \`assets\`) and a short rationale. Do not change files.
`,
  "feature-launch-kit": `# Feature launch kit

You prepare the launch kit for one OpenHands feature.

## Inputs
- The launch brief JSON (\`feature-launch-kit.json\`).
- The release that ships the feature.

## Do
1. Write the one-sentence claim, three supporting points and the proof for each (a demo, a number, a quote).
2. Draft the announcement for each channel in the brief, in that channel's native length and tone.
3. List the assets to generate: one hero image (2D), one short video (Seedance), and a 3D model if the feature has a physical metaphor.
4. Set the publish date to the release date or the next working day.

## Output
A fenced \`json\` block in the plan format, then the drafts as Markdown.
`,
  "asset-generation-brief": `# Asset generation brief

You turn a campaign into generation-ready briefs for 2D images, 3D models and Seedance video.

## Inputs
- The asset brief JSON (\`asset-generation-brief.json\`) with the asset list.
- The brand notes: product screenshots, palette and tone.

## Do
1. For each asset write a prompt, a negative prompt, the aspect ratio and the target size or duration.
2. For video (Seedance) write a shot list of 3 to 6 shots of 2 to 5 seconds each, with camera and motion notes.
3. For 3D give the poly budget, the material notes and the export format.
4. Put each asset in the \`brief\` stage. Mark any asset that needs a human decision.

## Output
A fenced \`json\` block with \`assets\` in the plan format.
`,
};

const TEMPLATE_JSON = {
  "quarterly-campaign": {
    template: "quarterly-campaign",
    version: 1,
    campaign: { name: "", quarter: "2027-Q1", theme: "", audience: "", outcome: "" },
    channels: ["hubspot", "linkedin", "x", "ga"],
    linkedFeatures: [],
    beats: [{ name: "Launch week", start: "", end: "", feature: "" }],
    assets: [
      { kind: "image2d", name: "Campaign hero", spec: "16:9, product UI on dark background" },
      { kind: "video", name: "Campaign teaser", spec: "15s, Seedance, 16:9" },
    ],
    kpis: [{ channel: "ga", metric: "Sessions from campaign links" }],
  },
  "feature-launch-kit": {
    template: "feature-launch-kit",
    version: 1,
    feature: { name: "", release: "", launchDate: "" },
    claim: "",
    proof: [],
    channels: ["linkedin", "x", "reddit", "hubspot"],
    assets: [
      { kind: "image2d", name: "Hero image", spec: "16:9" },
      { kind: "video", name: "Demo cut", spec: "20s, Seedance" },
    ],
  },
  "asset-generation-brief": {
    template: "asset-generation-brief",
    version: 1,
    campaign: "",
    brand: { palette: [], tone: "", references: [] },
    assets: [
      { kind: "image2d", name: "", prompt: "", negative: "", aspect: "16:9" },
      { kind: "model3d", name: "", prompt: "", polyBudget: 50000, format: "glb" },
      { kind: "video", name: "", tool: "Seedance", shots: [{ seconds: 3, camera: "", motion: "" }] },
    ],
  },
};

export const TEMPLATES = [
  { id: "quarterly-campaign", name: "Quarterly campaign", description: "One theme per quarter, tied to feature launches and channels." },
  { id: "feature-launch-kit", name: "Feature launch kit", description: "Claim, proof, channel drafts and assets for one feature." },
  { id: "asset-generation-brief", name: "Asset generation brief", description: "Prompts and shot lists for 2D, 3D and Seedance video." },
].map((t) => ({ ...t, md: TEMPLATE_MD[t.id], json: TEMPLATE_JSON[t.id] }));

// ─── Dates and ids ────────────────────────────────────────────────────────

export const toT = (iso) => {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const t = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
};
export const toIso = (t) => new Date(t).toISOString().slice(0, 10);
const fmt = (t) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
const fmtFull = (t) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const todayT = () => toT(toIso(Date.now()));
let idSeq = 0;
const newId = (p) => `${p}-${Date.now().toString(36)}${(idSeq += 1)}`;
export const quarterOf = (t) => {
  const d = new Date(t);
  return { year: d.getUTCFullYear(), q: Math.floor(d.getUTCMonth() / 3) + 1 };
};
const quarterStart = (year, q) => Date.UTC(year, (q - 1) * 3, 1);
const quarterEnd = (year, q) => Date.UTC(year, q * 3, 0);
const quarterLabel = ({ year, q }) => `Q${q} ${year}`;

// ─── Plan data ────────────────────────────────────────────────────────────

/** Weekly projected releases after the last shipped one. A projection, not a commitment. */
export function projectReleases(releases, count = 10) {
  const sorted = releases.map((r) => ({ ...r, t: toT(r.date) })).filter((r) => r.t !== null).sort((a, b) => a.t - b.t);
  const last = sorted.at(-1);
  if (!last) return [];
  const m = /^v(\d+)\.(\d+)\./.exec(last.tag);
  let minor = m ? Number(m[2]) : 0;
  const major = m ? Number(m[1]) : 1;
  const out = [];
  for (let i = 1; i <= count; i += 1) {
    minor += 1;
    out.push({ tag: `v${major}.${minor}.0`, date: toIso(last.t + i * 7 * DAY), projected: true });
  }
  return out;
}

export function releaseItems(releases) {
  return [
    ...releases.map((r) => ({ ...r, projected: false })),
    ...projectReleases(releases),
  ].map((r) => ({
    id: `rel-${r.tag}`, lane: "release", title: r.tag, start: r.date, end: r.date,
    status: r.projected ? "planned" : "shipped", channels: [], links: [], projected: r.projected,
  }));
}

function seedState() {
  const f = (id, title, start, end, status, note) => ({ id, lane: "feature", title, start, end, status, channels: [], links: [], note, sample: true });
  const c = (id, title, start, end, status, channels, links, note) => ({ id, lane: "campaign", title, start, end, status, channels, links, note, sample: true });
  const p = (id, title, start, end, status, channels) => ({ id, lane: "project", title, start, end, status, channels, links: [], sample: true });
  const items = [
    f("feat-learning", "Learning Center", "2026-09-28", "2026-10-30", "in_progress", "Courses and video map."),
    f("feat-feed", "Agent Canvas Feed", "2026-10-20", "2026-11-14", "in_progress", "Conversation feed with factories and teammates."),
    f("feat-factories", "Factories and pipelines", "2026-11-02", "2026-11-30", "planned"),
    f("feat-apps", "Canvas Apps gallery", "2026-11-16", "2026-12-18", "planned"),
    f("feat-automations", "Automations 2.0", "2027-01-11", "2027-02-12", "planned"),
    f("feat-teams", "Shared threads and teams", "2027-02-15", "2027-03-26", "planned"),
    f("feat-cloud", "Cloud organization controls", "2027-04-05", "2027-05-14", "planned"),
    c("camp-q4", "Q4 2026: Agent Canvas launch", "2026-10-01", "2026-12-31", "in_progress", ["hubspot", "linkedin", "x", "ga", "gsc", "reddit", "spotify"], ["feat-feed", "feat-factories", "feat-apps"], "Launch the Feed, Factories and Apps."),
    c("camp-feed", "Feed launch week", "2026-11-09", "2026-11-20", "planned", ["linkedin", "x", "reddit"], ["feat-feed"]),
    c("camp-q1", "Q1 2027: Automations and teams", "2027-01-01", "2027-03-31", "planned", ["hubspot", "linkedin", "x", "ads", "ga"], ["feat-automations", "feat-teams"]),
    c("camp-q2", "Q2 2027: Cloud for organizations", "2027-04-01", "2027-06-30", "planned", ["hubspot", "linkedin", "ads", "gsc", "ga"], ["feat-cloud"]),
    c("camp-q3", "Q3 2027: Agent ecosystem", "2027-07-01", "2027-09-30", "planned", ["hubspot", "x", "linkedin"], []),
    p("proj-video", "Launch video: Feed", "2026-10-26", "2026-11-10", "in_progress", ["linkedin", "x"]),
    p("proj-docs", "Docs and changelog refresh", "2026-11-02", "2026-11-20", "planned", []),
    p("proj-podcast", "Podcast series, season 1", "2026-11-16", "2026-12-18", "planned", ["spotify"]),
    p("proj-webinar", "Webinar: Factories", "2026-12-01", "2026-12-10", "planned", ["hubspot", "linkedin"]),
    p("proj-seo", "SEO content cluster", "2026-10-15", "2027-01-15", "in_progress", ["gsc", "ga"]),
  ];
  const a = (id, campaign, kind, name, stage, seconds) => ({ id, campaign, kind, name, stage, seconds: seconds ?? null });
  const assets = [
    a("as-1", "camp-q4", "image2d", "Campaign hero", "approved"),
    a("as-2", "camp-q4", "video", "Campaign teaser", "generating", 15),
    a("as-3", "camp-q4", "model3d", "Canvas device model", "brief"),
    a("as-4", "camp-feed", "image2d", "Feed screenshot set (4)", "review"),
    a("as-5", "camp-feed", "video", "Feed demo cut", "brief", 20),
    a("as-6", "camp-q1", "image2d", "Automations hero", "brief"),
  ];
  return {
    items, assets, releases: RELEASE_SNAPSHOT.map((r) => ({ ...r })), releasesFetchedAt: null,
    settings: { pricing: { ...DEFAULT_PRICING }, conv: { ...DEFAULT_CONV }, value: { ...DEFAULT_VALUE }, rates: { image2d: 0.05, model3d: 1, video: 0.4 }, tools: { image2d: "Image generation", model3d: "3D generation", video: "Seedance" } },
    log: [],
  };
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.items) && Array.isArray(s.releases)) {
        const seed = seedState();
        return { ...seed, ...s, settings: { ...seed.settings, ...s.settings, value: { ...DEFAULT_VALUE, ...s.settings?.value }, conv: { ...DEFAULT_CONV, ...s.settings?.conv }, pricing: { ...DEFAULT_PRICING, ...s.settings?.pricing } } };
      }
    }
  } catch { /* fall back to the sample plan */ }
  return seedState();
}

// ─── Plan logic (pure) ────────────────────────────────────────────────────

export function validateItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const lane = LANES.find((l) => l.id === raw.lane && l.id !== "release") ? raw.lane : null;
  const start = toT(raw.start);
  const end = toT(raw.end) ?? start;
  if (!lane || start === null || typeof raw.title !== "string" || !raw.title.trim()) return null;
  const known = new Set(CHANNELS.map((c) => c.id));
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newId("it"),
    lane, title: raw.title.trim().slice(0, 120),
    start: toIso(Math.min(start, end)), end: toIso(Math.max(start, end)),
    status: STATUSES.some((s) => s.id === raw.status) ? raw.status : "planned",
    channels: Array.isArray(raw.channels) ? raw.channels.filter((c) => known.has(c)) : [],
    links: Array.isArray(raw.links) ? raw.links.filter((l) => typeof l === "string") : [],
    note: typeof raw.note === "string" ? raw.note.slice(0, 400) : "",
    template: TEMPLATES.some((t) => t.id === raw.template) ? raw.template : lane === "campaign" ? "quarterly-campaign" : "",
  };
}

export function validateAsset(raw) {
  if (!raw || typeof raw !== "object" || typeof raw.name !== "string" || !raw.name.trim()) return null;
  if (!ASSET_KINDS.some((k) => k.id === raw.kind)) return null;
  const seconds = Number(raw.seconds);
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newId("as"),
    campaign: typeof raw.campaign === "string" ? raw.campaign : "",
    kind: raw.kind, name: raw.name.trim().slice(0, 120),
    stage: ASSET_STAGES.some((s) => s.id === raw.stage) ? raw.stage : "brief",
    seconds: raw.kind === "video" && seconds > 0 ? seconds : null,
  };
}

/** Merges a pasted or agent-written plan into the state. Returns counts. */
export function applyPlan(state, text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error("That is not valid JSON."); }
  const items = (Array.isArray(parsed.items) ? parsed.items : []).map(validateItem).filter(Boolean);
  const assets = (Array.isArray(parsed.assets) ? parsed.assets : []).map(validateAsset).filter(Boolean);
  if (items.length === 0 && assets.length === 0) throw new Error("No valid items or assets in the plan.");
  items.forEach((item) => {
    const at = state.items.findIndex((x) => x.id === item.id);
    if (at >= 0) state.items[at] = item; else state.items.push(item);
  });
  assets.forEach((asset) => {
    const at = state.assets.findIndex((x) => x.id === asset.id);
    if (at >= 0) state.assets[at] = asset; else state.assets.push(asset);
  });
  return { items: items.length, assets: assets.length };
}

/** The next quarters from `from`, each with the campaigns that overlap it. */
export function quarterCoverage(items, from, count = 6) {
  const out = [];
  let { year, q } = quarterOf(from);
  for (let i = 0; i < count; i += 1) {
    const start = quarterStart(year, q);
    const end = quarterEnd(year, q);
    const campaigns = items.filter((it) => it.lane === "campaign" && toT(it.start) <= end && toT(it.end) >= start);
    out.push({ label: quarterLabel({ year, q }), start, end, campaigns });
    q += 1;
    if (q > 4) { q = 1; year += 1; }
  }
  return out;
}

/** Days between a campaign's start and a linked feature's launch (negative: the feature ships first). */
export function launchLead(campaign, feature) {
  const c = toT(campaign.start);
  const f = toT(feature.end);
  return c === null || f === null ? null : Math.round((f - c) / DAY);
}

export function assetCost(assets, rates) {
  return assets.reduce((sum, a) => {
    if (a.kind === "video") return sum + (a.seconds ?? 0) * (rates.video ?? 0);
    return sum + (rates[a.kind] ?? 0);
  }, 0);
}

export function itemsOnDay(items, t) {
  return items.filter((it) => toT(it.start) <= t && toT(it.end) >= t);
}


// ─── Ad spend, growth and forecasts (sample data until connectors exist) ──

export const SITES = [
  { id: "web", name: "openhands.dev", goal: "Signup clicks" },
  { id: "docs", name: "docs.openhands.dev", goal: "Quickstart starts" },
  { id: "app", name: "app.all-hands.dev", goal: "Cloud signups" },
  { id: "github", name: "GitHub", goal: "Stars" },
];
export const AD_NETWORKS = [
  { id: "google", name: "Google Ads" },
  { id: "linkedin", name: "LinkedIn Ads" },
  { id: "reddit", name: "Reddit Ads" },
  { id: "x", name: "X Ads" },
  { id: "spotify", name: "Spotify Ads" },
];
export const GROWTH_METRICS = [
  { id: "visitors", label: "Visitors", organic: 26000, trend: 0.03, perDollar: 1 },
  { id: "signups", label: "Signups", organic: 620, trend: 0.025, perDollar: 0.032 },
  { id: "activated", label: "Activated users", organic: 260, trend: 0.022, perDollar: 0.012 },
  { id: "wau", label: "Weekly active users", organic: 5200, trend: 0.02, perDollar: 0.14 },
  { id: "paid", label: "Paid conversions", organic: 40, trend: 0.018, perDollar: 0.0014 },
];
export const AD_WEEKS = 12;
export const FORECAST_WEEKS = 12;
// [weekly spend, cost per conversion] for each site and network. Placeholder numbers.
const AD_BASE = {
  web: { google: [1800, 22], linkedin: [2400, 48], reddit: [600, 30], x: [500, 55], spotify: [700, 90] },
  docs: { google: [900, 12], reddit: [300, 15] },
  app: { google: [2200, 38], linkedin: [1800, 62], x: [400, 80] },
  github: { reddit: [500, 2.4], x: [350, 3.1], linkedin: [250, 4] },
};
/** Placeholder conversion rates (percent) for Teams and Enterprise accounts, editable on the page. */
export const DEFAULT_CONV = { teamCreate: 12, teamPaid: 18, entLead: 1.2, entQualified: 35, entWon: 22 };
export const FUNNELS = [
  { id: "teams", label: "Teams", stages: [["teamCreate", "Team workspaces created", "of activated users"], ["teamPaid", "Paid Teams accounts", "of new team workspaces"]] },
  { id: "enterprise", label: "Enterprise", stages: [["entLead", "Enterprise leads", "of activated users"], ["entQualified", "Qualified opportunities", "of leads"], ["entWon", "Closed-won accounts", "of qualified opportunities"]] },
];
/** What openhands.dev/pricing showed on 2026-10-29. Enterprise is "Custom pricing", so its value is an assumption. */
export const PRICING = {
  source: "https://openhands.dev/pricing",
  fetched: "2026-10-29",
  teams: { base: 500, includedSeats: 10, extraSeat: 50, trialDays: 30, sessionCap: 5000 },
};
export const DEFAULT_PRICING = { seats: 10, entAcv: 50000 };
const DEFAULT_VALUE = { web: 15, docs: 6, app: 40, github: 4 };

/** A small deterministic random source, so the sample data is stable. */
export function seeded(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mondayOf = (t) => t - ((new Date(t).getUTCDay() + 6) % 7) * DAY;

/** Twelve weeks of sample spend and conversions per site and ad network. */
export function sampleAds(now = todayT()) {
  const last = mondayOf(now);
  const weeks = Array.from({ length: AD_WEEKS }, (_, i) => toIso(last - (AD_WEEKS - 1 - i) * 7 * DAY));
  const cells = [];
  Object.entries(AD_BASE).forEach(([site, nets]) => {
    Object.entries(nets).forEach(([network, [base, cpa]]) => {
      const rnd = seeded(`${site}:${network}`);
      const spend = [];
      const conv = [];
      weeks.forEach((_, i) => {
        const s = base * (1 + 0.015 * i) * (0.85 + 0.3 * rnd());
        spend.push(Math.round(s));
        conv.push(Math.max(0, Math.round((s / cpa) * (0.85 + 0.3 * rnd()))));
      });
      cells.push({ site, network, spend, conv });
    });
  });
  return { weeks, cells };
}

const sum = (a) => a.reduce((x, y) => x + y, 0);
const mean = (a) => (a.length ? sum(a) / a.length : 0);

/** Spend, conversions, CPA and ROAS per network and site over the last `weeks` weeks. */
export function adMatrix(ads, value = DEFAULT_VALUE, weeks = 4) {
  const cell = (cells) => {
    const spend = sum(cells.map((c) => sum(c.spend.slice(-weeks))));
    const conv = sum(cells.map((c) => sum(c.conv.slice(-weeks))));
    const worth = sum(cells.map((c) => sum(c.conv.slice(-weeks)) * (value[c.site] ?? 0)));
    return { spend, conv, cpa: conv ? spend / conv : null, roas: spend ? worth / spend : null, worth };
  };
  const at = {};
  AD_NETWORKS.forEach((n) => SITES.forEach((s) => {
    const cells = ads.cells.filter((c) => c.network === n.id && c.site === s.id);
    at[`${n.id}|${s.id}`] = cells.length ? cell(cells) : null;
  }));
  return {
    at,
    rows: Object.fromEntries(AD_NETWORKS.map((n) => [n.id, cell(ads.cells.filter((c) => c.network === n.id))])),
    cols: Object.fromEntries(SITES.map((s) => [s.id, cell(ads.cells.filter((c) => c.site === s.id))])),
    total: cell(ads.cells),
  };
}

/** Weekly total ad spend across every site and network. */
export const weeklySpend = (ads) => ads.weeks.map((_, i) => sum(ads.cells.map((c) => c.spend[i])));

/** Weekly growth metrics: an organic trend plus an effect of that week's ad spend. */
export function sampleGrowth(ads) {
  const spend = weeklySpend(ads);
  const out = {};
  GROWTH_METRICS.forEach((m) => {
    const rnd = seeded(`growth:${m.id}`);
    out[m.id] = spend.map((s, i) => Math.round((m.organic * (1 + m.trend) ** i + m.perDollar * s) * (0.96 + 0.08 * rnd())));
  });
  return out;
}

/** Ordinary least squares: solves (XtX) b = Xty. Returns coefficients and the residual spread. */
export function olsFit(X, y) {
  const p = X[0].length;
  const A = Array.from({ length: p }, (_, i) => Array.from({ length: p + 1 }, (_, j) => (j < p ? sum(X.map((r) => r[i] * r[j])) : sum(X.map((r, k) => r[i] * y[k])))));
  for (let c = 0; c < p; c += 1) {
    let best = c;
    for (let r = c + 1; r < p; r += 1) if (Math.abs(A[r][c]) > Math.abs(A[best][c])) best = r;
    [A[c], A[best]] = [A[best], A[c]];
    if (Math.abs(A[c][c]) < 1e-12) throw new Error("The data cannot be fitted.");
    for (let r = 0; r < p; r += 1) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= p; k += 1) A[r][k] -= f * A[c][k];
    }
  }
  const beta = A.map((row, i) => row[p] / row[i]);
  const resid = X.map((r, k) => y[k] - sum(r.map((v, i) => v * beta[i])));
  const sigma = Math.sqrt(sum(resid.map((e) => e * e)) / Math.max(1, X.length - p));
  return { beta, sigma };
}

/**
 * Fits metric ~ intercept + trend + weekly ad spend, then projects it forward at
 * the given future weekly spend. A rough statistical projection, not a promise.
 */
export function forecastMetric(series, spend, futureSpend) {
  const n = series.length;
  const { beta, sigma } = olsFit(series.map((_, t) => [1, t, spend[t]]), series);
  const future = futureSpend.map((s, k) => {
    const value = beta[0] + beta[1] * (n + k) + beta[2] * s;
    const band = 1.64 * sigma * Math.sqrt(1 + (k + 1) / n);
    return { value: Math.max(0, value), lo: Math.max(0, value - band), hi: value + band };
  });
  return { beta, sigma, future };
}

export const SPEND_SCENARIOS = [
  { id: "hold", label: "Hold ad spend", factor: 1 },
  { id: "up25", label: "Raise ad spend 25%", factor: 1.25 },
  { id: "up50", label: "Raise ad spend 50%", factor: 1.5 },
  { id: "down25", label: "Cut ad spend 25%", factor: 0.75 },
];

/** Growth matrix rows: recent level, change, ad impact and the projection under a spend scenario. */
export function growthMatrix(ads, growth, factor = 1) {
  const spend = weeklySpend(ads);
  const base = mean(spend.slice(-4));
  const hold = Array.from({ length: FORECAST_WEEKS }, () => base);
  const plan = hold.map((s) => s * factor);
  return GROWTH_METRICS.map((m) => {
    const y = growth[m.id];
    const f = forecastMetric(y, spend, plan);
    const h = forecastMetric(y, spend, hold);
    const last4 = mean(y.slice(-4));
    const prev4 = mean(y.slice(-8, -4));
    const perDollar = Math.max(0, f.beta[2]);
    return {
      id: m.id, label: m.label, series: y, last4,
      change: prev4 ? last4 / prev4 - 1 : null,
      adShare: last4 ? Math.min(1, (perDollar * base) / last4) : null,
      per1k: perDollar * 1000,
      future: f.future, hold: h.future,
      at4: f.future[3].value, at12: f.future[FORECAST_WEEKS - 1].value,
      lift12: f.future[FORECAST_WEEKS - 1].value - h.future[FORECAST_WEEKS - 1].value,
    };
  });
}


/**
 * Applies conversion rates (percent) down each funnel from the activated-users row:
 * what each stage is producing a week now, and what it would in 4 and 12 weeks.
 */
export function funnelMatrix(rows, conv = DEFAULT_CONV) {
  const base = rows.find((r) => r.id === "activated");
  if (!base) return [];
  return FUNNELS.map((f) => {
    let factor = 1;
    return {
      id: f.id,
      label: f.label,
      stages: f.stages.map(([key, label, of]) => {
        const rate = Math.max(0, Math.min(100, Number(conv[key]) || 0));
        factor *= rate / 100;
        const sum = (a = []) => a.reduce((x, y) => x + y.value, 0);
        return { key, label, of, rate, fromActivated: factor * 100, now: base.last4 * factor, at4: base.at4 * factor, at12: base.at12 * factor, lift12: base.lift12 * factor, added12: sum(base.future) * factor, added12Hold: sum(base.hold) * factor };
      }),
    };
  });
}

/** Monthly price of one Teams account on the pricing page: the base fee plus each seat past the included ones. */
export const teamsMonthly = (seats) => PRICING.teams.base + Math.max(0, Math.round(seats) - PRICING.teams.includedSeats) * PRICING.teams.extraSeat;

/**
 * Revenue from the funnel at the pricing-page prices. Teams is paid accounts times the
 * monthly price (per week of new MRR, and ARR at 12 times that). Enterprise is closed-won
 * accounts times an assumed annual contract value, since the page only says "Custom pricing".
 */
export function revenueMatrix(funnels, pricing = DEFAULT_PRICING) {
  const paid = funnels.find((f) => f.id === "teams")?.stages.find((x) => x.key === "teamPaid");
  const won = funnels.find((f) => f.id === "enterprise")?.stages.find((x) => x.key === "entWon");
  if (!paid || !won) return null;
  const perAccount = teamsMonthly(pricing.seats);
  const acv = Math.max(0, Number(pricing.entAcv) || 0);
  const teams = { perAccount, nowMrr: paid.now * perAccount, at4Mrr: paid.at4 * perAccount, at12Mrr: paid.at12 * perAccount, addedMrr: paid.added12 * perAccount, addedMrrHold: paid.added12Hold * perAccount };
  const enterprise = { acv, nowAcv: won.now * acv, at4Acv: won.at4 * acv, at12Acv: won.at12 * acv, addedAcv: won.added12 * acv, addedAcvHold: won.added12Hold * acv };
  const added = teams.addedMrr * 12 + enterprise.addedAcv;
  const hold = teams.addedMrrHold * 12 + enterprise.addedAcvHold;
  return { teams, enterprise, addedAnnual: added, liftAnnual: added - hold };
}

/** Where a shift of weekly spend from the weakest to the strongest cell would help, at observed rates. */
export function reallocationHint(matrix, shareMoved = 0.2) {
  const cells = Object.entries(matrix.at).filter(([, c]) => c && c.roas !== null && c.spend > 0).map(([key, c]) => ({ key, ...c }));
  if (cells.length < 2) return null;
  const sorted = [...cells].sort((a, b) => a.roas - b.roas);
  const low = sorted[0];
  const high = sorted.at(-1);
  const moved = (low.spend / 4) * shareMoved;
  const lowRate = low.spend ? low.conv / low.spend : 0;
  const highRate = high.spend ? high.conv / high.spend : 0;
  return { from: low.key, to: high.key, moved, extraConversions: moved * (highRate - lowRate) };
}

// ─── Agent prompts ────────────────────────────────────────────────────────

const PLAN_FORMAT = `Reply with one fenced \`json\` block shaped like this, plus a short rationale:
{"items":[{"id":"optional","lane":"feature|campaign|project","title":"","start":"YYYY-MM-DD","end":"YYYY-MM-DD","status":"planned|in_progress|at_risk|shipped","channels":["hubspot","x","linkedin","gsc","ga","reddit","ads","spotify"],"links":["feature ids a campaign ties to"],"note":""}],
"assets":[{"campaign":"item id","kind":"image2d|model3d|video","name":"","stage":"brief","seconds":15}]}`;

export function planSnapshot(state) {
  return JSON.stringify({
    today: toIso(Date.now()),
    releases: { shipped: state.releases.slice(-8), projectedWeekly: projectReleases(state.releases, 6) },
    items: state.items.map(({ sample, ...rest }) => rest),
    assets: state.assets,
  });
}

export function planPrompt(state, goal) {
  return `You are the marketing production planner for OpenHands.\n\nGoal: ${goal}\n\nCurrent plan (JSON):\n${planSnapshot(state)}\n\nRules: every quarter needs at least one campaign, and each campaign links to the feature launches it supports. Assets are 2D images, 3D models and Seedance videos. Channels are limited to HubSpot, X, LinkedIn, Google Search Console, Google Analytics, Reddit, ad networks and Spotify.\n\n${PLAN_FORMAT}`;
}

export function itemPrompt(state, item) {
  const links = state.items.filter((x) => item.links.includes(x.id));
  return `Draft a brief for "${item.title}" (${item.lane}, ${item.start} to ${item.end}, status ${item.status}).\n\nChannels: ${item.channels.join(", ") || "none yet"}.\nLinked launches: ${links.map((l) => `${l.title} (${l.end})`).join("; ") || "none"}.\nNext releases: ${projectReleases(state.releases, 3).map((r) => `${r.tag} ${r.date}`).join(", ")}.\n\n${PLAN_FORMAT}`;
}

export function adPrompt(ads, value) {
  const m = adMatrix(ads, value);
  const cells = Object.entries(m.at).filter(([, c]) => c).map(([k, c]) => ({ cell: k, spend4w: Math.round(c.spend), conversions4w: c.conv, cpa: c.cpa && +c.cpa.toFixed(2), roas: c.roas && +c.roas.toFixed(2) }));
  return `Review ad spend efficiency across our sites and ad networks. Sites: ${SITES.map((s) => `${s.name} (${s.goal})`).join(", ")}. Value per conversion (USD): ${JSON.stringify(value)}.\n\nLast four weeks by network|site:\n${JSON.stringify(cells)}\n\nSay where spend is least and most efficient, what to shift, and what to test next. Note any cell too small to trust. This data is sample data until the ad connectors are live.`;
}

export function templatePrompt(state, template, context) {
  return `${template.md}\n\n## Brief (${template.id}.json)\n\`\`\`json\n${JSON.stringify({ ...template.json, ...context }, null, 2)}\n\`\`\`\n\n## Current plan\n${planSnapshot(state)}\n\n${PLAN_FORMAT}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────

const STYLE = `
.mp { --mp-bg: var(--oh-color-base, #0B0E14); --mp-panel: var(--oh-color-base-secondary, #21252F); --mp-raised: var(--oh-surface-raised, #2C313F);
  --mp-text: var(--oh-foreground, #EEF2F7); --mp-contrast: var(--oh-contrast, #FFFFFF); --mp-muted: var(--oh-muted, #A3B0C4);
  --mp-border: var(--oh-border-subtle, #383F50); --mp-primary: var(--oh-color-primary, #C9B974); --mp-on-primary: var(--oh-accent-foreground, #0B0E14);
  --mp-danger: var(--oh-danger, #E76A5E); --mp-success: var(--oh-success, #A5E75E); --mp-info: #6AA8F0; --mp-today: #E76A5E;
  color: var(--mp-text); font: 14px/1.45 system-ui, sans-serif; height: 100%; overflow: auto; padding: 24px; box-sizing: border-box; }
.mp *, .mp *::before, .mp *::after { box-sizing: border-box; }
.mp h1 { font-size: 22px; margin: 0; font-weight: 600; color: var(--mp-contrast); }
.mp h2 { font-size: 15px; margin: 0 0 8px; font-weight: 600; color: var(--mp-contrast); }
.mp p { margin: 0; }
.mp .muted { color: var(--mp-muted); }
.mp .small { font-size: 12px; }
.mp .top { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.mp .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.mp button, .mp select, .mp input, .mp textarea { font: inherit; color: inherit; }
.mp button { background: var(--mp-raised); border: 1px solid var(--mp-border); border-radius: 8px; padding: 5px 12px; cursor: pointer; }
.mp button:hover:not(:disabled) { border-color: var(--mp-muted); }
.mp button:disabled { opacity: .5; cursor: default; }
.mp button.primary { background: var(--mp-primary); color: var(--mp-on-primary); border-color: transparent; font-weight: 600; }
.mp button.ghost { background: transparent; }
.mp button:focus-visible, .mp select:focus-visible, .mp input:focus-visible, .mp textarea:focus-visible, .mp summary:focus-visible { outline: 2px solid var(--mp-contrast); outline-offset: 1px; }
.mp input, .mp select, .mp textarea { background: var(--mp-bg); border: 1px solid var(--mp-border); border-radius: 8px; padding: 5px 8px; max-width: 100%; }
.mp textarea { width: 100%; resize: vertical; font-family: ui-monospace, monospace; font-size: 12px; }
.mp .tabs { display: flex; gap: 2px; overflow-x: auto; border-bottom: 1px solid var(--mp-border); margin-bottom: 16px; }
.mp .tab { border: 0; border-radius: 8px 8px 0 0; background: transparent; color: var(--mp-muted); padding: 8px 14px; }
.mp .tab[aria-selected="true"] { color: var(--mp-contrast); box-shadow: inset 0 -2px 0 var(--mp-primary); }
.mp .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin-bottom: 16px; }
.mp .tile, .mp .card { background: var(--mp-panel); border: 1px solid var(--mp-border); border-radius: 12px; padding: 12px 14px; }
.mp .tile b { display: block; font-size: 20px; color: var(--mp-contrast); }
.mp .banner { background: var(--mp-panel); border: 1px dashed var(--mp-border); border-radius: 10px; padding: 8px 12px; margin-bottom: 12px; }
.mp .toast { position: fixed; right: 20px; bottom: 20px; background: var(--mp-raised); border: 1px solid var(--mp-border); border-radius: 10px; padding: 8px 14px; z-index: 40; }
.mp .toast.err { border-color: var(--mp-danger); }
.mp .chip { display: inline-block; border-radius: 999px; padding: 1px 8px; font-size: 11px; background: var(--mp-raised); color: var(--mp-muted); border: 1px solid var(--mp-border); }
.mp .chip.s-planned { color: color-mix(in srgb, var(--mp-info) 50%, var(--mp-contrast)); } .mp .chip.s-in_progress { color: color-mix(in srgb, var(--mp-primary) 70%, var(--mp-contrast)); }
.mp .chip.s-at_risk { color: var(--mp-danger); } .mp .chip.s-shipped { color: var(--mp-success); }
/* timeline */
.mp, .mp .sheet { overscroll-behavior-x: contain; }
.mp .sheet { scrollbar-color: var(--mp-border) var(--mp-panel); }
.mp .sheet { background: var(--mp-panel); border: 1px solid var(--mp-border); border-radius: 12px; overflow-x: auto; position: relative; }
.mp .grid { display: grid; grid-template-columns: ${LABEL_W}px auto; min-width: max-content; }
.mp .labels { position: sticky; left: 0; z-index: 4; background: var(--mp-panel); border-right: 1px solid var(--mp-border); }
.mp .cell { height: ${ROW_H}px; display: flex; align-items: center; gap: 8px; padding: 0 10px; border-bottom: 1px solid var(--mp-border); white-space: nowrap; overflow: hidden; }
.mp .cell.head { height: 44px; color: var(--mp-muted); font-size: 12px; }
.mp .cell.grp, .mp .lane.grp { background: var(--mp-bg); text-transform: uppercase; font-size: 11px; letter-spacing: .08em; color: var(--mp-muted); }
.mp .cell.item { cursor: pointer; background: none; border: 0; border-bottom: 1px solid var(--mp-border); border-radius: 0; width: 100%; text-align: left; }
.mp .cell.item:hover, .mp .cell.item.sel { background: var(--mp-raised); }
.mp .cell .t { overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 1; }
.mp .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--mp-muted); }
.mp .tl { position: relative; }
.mp .axis { height: 44px; border-bottom: 1px solid var(--mp-border); position: relative; }
.mp .axis .q { position: absolute; top: 0; height: 20px; padding: 2px 6px; font-size: 11px; color: var(--mp-contrast); border-left: 1px solid var(--mp-border); white-space: nowrap; overflow: hidden; }
.mp .axis .m { position: absolute; top: 22px; padding: 2px 6px; font-size: 11px; color: var(--mp-muted); border-left: 1px solid var(--mp-border); white-space: nowrap; overflow: hidden; }
.mp .vg { position: absolute; top: 44px; bottom: 0; border-left: 1px solid var(--mp-border); opacity: .5; pointer-events: none; }
.mp .today { position: absolute; top: 0; bottom: 0; border-left: 2px solid var(--mp-today); z-index: 2; pointer-events: none; }
.mp .today span { position: absolute; bottom: 6px; left: 4px; font-size: 10px; color: var(--mp-today); text-transform: uppercase; }
.mp .lane { height: ${ROW_H}px; border-bottom: 1px solid var(--mp-border); position: relative; }
.mp .bar { position: absolute; top: 6px; height: ${ROW_H - 12}px; border-radius: 4px; border: 1px solid var(--c); background: color-mix(in srgb, var(--c) 30%, transparent); font-size: 11px; padding: 0 6px; line-height: ${ROW_H - 14}px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: pointer; color: var(--mp-text); min-width: 6px; }
.mp .bar.sel { background: color-mix(in srgb, var(--c) 60%, transparent); box-shadow: 0 0 0 2px var(--mp-contrast); }
.mp .dia { position: absolute; top: 9px; width: 13px; height: 13px; transform: translateX(-6px) rotate(45deg); background: var(--c); border-radius: 2px; border: 0; padding: 0; cursor: pointer; }
.mp .dia.projected { background: transparent; border: 1.5px dashed var(--c); }
.mp .links { position: absolute; left: 0; top: 44px; pointer-events: none; z-index: 1; overflow: visible; }
.mp .links line { stroke: var(--mp-muted); stroke-dasharray: 3 3; opacity: .35; }
.mp .links line.hot { stroke: var(--mp-contrast); opacity: .9; }
.mp .links circle { fill: var(--mp-muted); opacity: .5; }
.mp .s-planned { --c: var(--mp-info); } .mp .s-in_progress { --c: var(--mp-primary); } .mp .s-at_risk { --c: var(--mp-danger); } .mp .s-shipped { --c: var(--mp-success); }
/* board, calendar, lists */
.mp .board { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; align-items: start; }
.mp .col { background: var(--mp-panel); border: 1px solid var(--mp-border); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 8px; min-height: 120px; }
.mp .kcard { background: var(--mp-raised); border: 1px solid var(--mp-border); border-radius: 10px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; text-align: left; }
.mp .cal { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 1px; background: var(--mp-border); border: 1px solid var(--mp-border); border-radius: 10px; overflow: hidden; }
.mp .cal .dow { background: var(--mp-panel); padding: 4px 8px; font-size: 11px; color: var(--mp-muted); }
.mp .cal .day { background: var(--mp-bg); min-height: 92px; padding: 4px; display: flex; flex-direction: column; gap: 2px; }
.mp .cal .day.off { opacity: .45; } .mp .cal .day.now { box-shadow: inset 0 0 0 2px var(--mp-today); }
.mp .cal .ev { font-size: 11px; border-radius: 4px; padding: 1px 5px; border: 0; background: color-mix(in srgb, var(--c) 30%, transparent); text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp table { width: 100%; border-collapse: collapse; }
.mp th, .mp td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--mp-border); vertical-align: top; }
.mp th { color: var(--mp-muted); font-weight: 500; font-size: 12px; }
.mp tr.clk { cursor: pointer; } .mp tr.clk:hover { background: var(--mp-raised); }
.mp .stack { display: flex; flex-direction: column; gap: 12px; }
.mp .cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
.mp .warn { color: var(--mp-danger); }
.mp pre { background: var(--mp-bg); border: 1px solid var(--mp-border); border-radius: 8px; padding: 10px; overflow: auto; max-height: 280px; font-size: 12px; margin: 6px 0 0; white-space: pre-wrap; }
.mp details > summary { cursor: pointer; color: var(--mp-muted); }
.mp .drawer { margin-top: 16px; }
.mp .form { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
.mp label.f { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--mp-muted); }
.mp .checks { display: flex; flex-wrap: wrap; gap: 4px 12px; }
.mp .checks label { display: flex; gap: 4px; align-items: center; color: var(--mp-text); font-size: 13px; }
.mp .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 30; display: flex; align-items: center; justify-content: center; padding: 16px; }
.mp .dlg { background: var(--mp-panel); border: 1px solid var(--mp-border); border-radius: 14px; padding: 18px; width: min(720px, 100%); max-height: 88vh; overflow: auto; display: flex; flex-direction: column; gap: 12px; }
.mp .map { position: relative; }
.mp .map .edges { position: absolute; inset: 0; pointer-events: none; overflow: visible; }
.mp .map .e { fill: none; stroke: var(--mp-muted); stroke-width: 1.5; opacity: .45; }
.mp .map .e.off { stroke-dasharray: 4 4; opacity: .25; }
.mp .map .e.hot { stroke: var(--mp-primary); opacity: .95; }
.mp .map .e.off.hot { opacity: .5; }
.mp .node { position: absolute; display: flex; flex-direction: column; justify-content: center; gap: 1px; text-align: left; padding: 6px 10px; border-radius: 10px; overflow: hidden; background: var(--mp-raised); }
.mp .node b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }
.mp .node .small { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp .node.on { border-color: var(--mp-primary); }
.mp .node.mod { background: var(--mp-panel); }
.mp .node.mod.on { box-shadow: 0 0 0 2px var(--mp-primary); }
.mp .map .colhead { position: absolute; top: -22px; text-transform: uppercase; letter-spacing: .08em; font-size: 10px; }
.mp .matrix th, .mp .matrix td { text-align: center; }
.mp .matrix th:first-child { text-align: left; }
.mp .cellv { font-variant-numeric: tabular-nums; }
.mp .cellv.total { font-weight: 600; background: var(--mp-bg); }
.mp .cellv.good2 { background: color-mix(in srgb, var(--mp-success) 38%, transparent); }
.mp .cellv.good1 { background: color-mix(in srgb, var(--mp-success) 16%, transparent); }
.mp .cellv.bad1 { background: color-mix(in srgb, var(--mp-danger) 16%, transparent); }
.mp .cellv.bad2 { background: color-mix(in srgb, var(--mp-danger) 38%, transparent); }
.mp .spark .past { fill: none; stroke: var(--mp-contrast); stroke-width: 1.5; }
.mp .spark .proj { fill: none; stroke: var(--mp-primary); stroke-width: 1.5; stroke-dasharray: 3 3; }
.mp .spark .band { fill: var(--mp-primary); opacity: .15; }
@media (prefers-reduced-motion: no-preference) { .mp .bar, .mp .kcard { transition: background .15s ease; } }
`;

// ─── DOM helpers ──────────────────────────────────────────────────────────

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function button(label, onClick, cls = "") {
  const b = el("button", cls, label);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}
function field(label, input) {
  const wrap = el("label", "f");
  wrap.append(el("span", "", label), input);
  return wrap;
}
function select(options, value, onChange) {
  const s = el("select");
  options.forEach(([v, l]) => {
    const o = el("option", "", l);
    o.value = v;
    s.append(o);
  });
  s.value = value;
  if (onChange) s.addEventListener("change", () => onChange(s.value));
  return s;
}
function checks(options, selected, name) {
  const wrap = el("div", "checks");
  options.forEach(([v, l]) => {
    const lab = el("label");
    const cb = el("input");
    cb.type = "checkbox";
    cb.value = v;
    cb.name = name;
    cb.checked = selected.includes(v);
    lab.append(cb, el("span", "", l));
    wrap.append(lab);
  });
  return wrap;
}
const picked = (wrap) => [...wrap.querySelectorAll("input:checked")].map((i) => i.value);
const chipEls = (ids) => ids.map((id) => el("span", "chip", CHANNELS.find((c) => c.id === id)?.name ?? id));
const laneLabel = (id) => LANES.find((l) => l.id === id)?.label ?? id;
const statusLabel = (id) => STATUSES.find((s) => s.id === id)?.label ?? id;
const money = (n) => `$${n.toFixed(2)}`;
const svg = (tag, attrs) => {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v)));
  return n;
};

// ─── Mount ────────────────────────────────────────────────────────────────

function mountProduction(host, { container }) {
  const style = el("style");
  style.textContent = STYLE;
  document.head.append(style);
  const root = el("div", "mp");
  container.append(root);

  const st = loadState();
  const ads = sampleAds();
  const growth = sampleGrowth(ads);
  const ui = { view: "timeline", zoom: "quarter", editing: null, dialog: null, toast: null, calMonth: toIso(todayT()).slice(0, 7), mapSel: null, scenario: "hold", adMode: "roas", lane: "all", status: "all", search: "", assetCampaign: "all", scrolled: false, busy: false };
  let toastTimer = null;
  let disposed = false;

  const save = () => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); } catch { /* storage unavailable */ }
  };
  const allItems = () => [...releaseItems(st.releases), ...st.items];
  const byId = (id) => allItems().find((i) => i.id === id);
  const campaigns = () => st.items.filter((i) => i.lane === "campaign");
  const features = () => st.items.filter((i) => i.lane === "feature");
  const notify = (text, err = false) => {
    ui.toast = { text, err };
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { ui.toast = null; if (!disposed) render(); }, 4000);
    render();
  };
  const change = () => { save(); render(); };

  async function startAgent(prompt, kind) {
    const profiles = await host.agentServer.request({ path: "/api/agent-profiles" }).catch(() => null);
    const list = profiles?.profiles ?? [];
    const agent = list.find((a) => a.id && a.id === profiles?.active_agent_profile_id) ?? list.find((a) => a.name === "default") ?? list[0];
    if (!agent) throw new Error("This Agent Server has no agent profile.");
    const info = await host.agentServer.request({
      method: "POST",
      path: "/api/conversations",
      body: { agent_profile_id: agent.id ?? agent.name, initial_message: { role: "user", content: [{ type: "text", text: prompt }] }, tags: { source: "marketing-production", kind } },
    });
    const id = info?.id ?? info?.conversation_id ?? null;
    if (id) host.navigate(`/conversations/${id}`);
    return id;
  }

  const openEditor = (item, isNew = false) => { ui.editing = { item: { ...item, channels: [...(item.channels || [])], links: [...(item.links || [])] }, isNew }; render(); };
  const newItem = (lane = "project", start = toIso(todayT()), end = toIso(todayT() + 14 * DAY)) => ({ id: newId("it"), lane, title: "", start, end, status: "planned", channels: [], links: [], note: "" });

  // ── Views ──
  function tiles() {
    const today = todayT();
    const wrap = el("div", "tiles");
    const next = projectReleases(st.releases, 1)[0];
    const last = st.releases.at(-1);
    const recent = st.releases.filter((r) => toT(r.date) >= today - 30 * DAY).length;
    const thisQ = quarterCoverage(st.items, today, 1)[0];
    const inReview = st.assets.filter((a) => a.stage === "review").length;
    [["Latest release", last ? `${last.tag}` : "none", last ? fmtFull(toT(last.date)) : ""],
      ["Next release (projected)", next?.tag ?? "none", next ? fmtFull(toT(next.date)) : ""],
      ["Releases, last 30 days", String(recent), ""],
      [`Campaigns, ${thisQ.label}`, String(thisQ.campaigns.length), thisQ.campaigns.length ? "" : "None planned"],
      ["Assets in review", String(inReview), `${st.assets.length} assets in total`]].forEach(([label, value, detail]) => {
      const t = el("div", "tile");
      t.append(el("span", "muted small", label), el("b", "", value), el("span", "muted small", detail));
      wrap.append(t);
    });
    return wrap;
  }

  const num = (n, d = 0) => (n === null || n === undefined || Number.isNaN(n) ? "n/a" : n.toLocaleString(undefined, { maximumFractionDigits: d }));
  const pct = (n) => (n === null || n === undefined ? "n/a" : `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`);

  function sparkline(row) {
    const W = 180;
    const H = 38;
    const all = [...row.series, ...row.future.map((f) => f.hi)];
    const lo = Math.min(...row.series, ...row.future.map((f) => f.lo));
    const hi = Math.max(...all);
    const n = row.series.length + row.future.length;
    const x = (i) => (i / (n - 1)) * (W - 4) + 2;
    const y = (v) => H - 3 - ((v - lo) / (hi - lo || 1)) * (H - 6);
    const box = svg("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: "spark", role: "img" });
    box.setAttribute("aria-label", `${row.label}: last ${row.series.length} weeks and a ${row.future.length}-week projection`);
    const off = row.series.length;
    const band = [...row.future.map((f, k) => `${x(off + k)},${y(f.hi)}`), ...row.future.map((f, k) => `${x(off + row.future.length - 1 - k)},${y(row.future[row.future.length - 1 - k].lo)}`)].join(" ");
    box.append(svg("polygon", { points: band, class: "band" }));
    box.append(svg("polyline", { points: row.series.map((v, i) => `${x(i)},${y(v)}`).join(" "), class: "past" }));
    box.append(svg("polyline", { points: [[off - 1, row.series.at(-1)], ...row.future.map((f, k) => [off + k, f.value])].map(([i, v]) => `${x(i)},${y(v)}`).join(" "), class: "proj" }));
    return box;
  }

  function growthSection() {
    const sc = SPEND_SCENARIOS.find((x) => x.id === ui.scenario) ?? SPEND_SCENARIOS[0];
    const rows = growthMatrix(ads, growth, sc.factor);
    const card = el("div", "card stack");
    card.setAttribute("data-testid", "mp-growth");
    const head = el("div", "row");
    head.append(el("h2", "", "User growth and ad impact"), select(SPEND_SCENARIOS.map((x) => [x.id, x.label]), sc.id, (v) => { ui.scenario = v; render(); }),
      button("Ask an agent", () => { ui.dialog = { type: "agent", prompt: adPrompt(ads, st.settings.value), kind: "growth" }; render(); }, "ghost"));
    const table = el("table");
    const hr = el("tr");
    ["Metric", "Last 12 weeks and projection", "Last 4 weeks (per week)", "4-week change", "From ad spend", "Per $1,000 of spend", "In 4 weeks", "In 12 weeks", "12 weeks vs holding spend"].forEach((h) => hr.append(el("th", "", h)));
    table.append(hr);
    rows.forEach((r) => {
      const tr = el("tr");
      const c2 = el("td"); c2.append(sparkline(r));
      tr.append(el("td", "", r.label), c2, el("td", "", num(r.last4)), el("td", r.change >= 0 ? "" : "warn", pct(r.change)), el("td", "", r.adShare === null ? "n/a" : `${Math.round(r.adShare * 100)}%`), el("td", "", num(r.per1k, 1)),
        el("td", "", num(r.at4)), el("td", "", num(r.at12)), el("td", r.lift12 >= 0 ? "" : "warn", `${r.lift12 >= 0 ? "+" : ""}${num(r.lift12)}`));
      table.append(tr);
    });
    const sheet = el("div", "sheet"); sheet.append(table);
    card.append(head, sheet, el("p", "muted small", "Each metric is fitted to a weekly trend plus that week's total ad spend, then projected 12 weeks at the chosen spend. The shaded band is a rough 90% range. This is sample data and a simple model: it does not know about launches, seasonality or diminishing returns, so treat it as a direction."));
    card.append(funnelSection(rows));
    return card;
  }

  function funnelSection(rows) {
    const card = el("div", "card stack");
    card.setAttribute("data-testid", "mp-funnel");
    const head = el("div", "row");
    head.append(el("h2", "", "Teams and Enterprise conversion"), el("span", "muted small", "Each % is a variable: change it and the projections follow."));
    const table = el("table");
    const hr = el("tr");
    ["Account type and stage", "Conversion", "From activated", "Now (per week)", "In 4 weeks", "In 12 weeks", "12 weeks vs holding spend"].forEach((h) => hr.append(el("th", "", h)));
    table.append(hr);
    const f1 = (n) => (n >= 100 ? Math.round(n).toLocaleString() : n.toFixed(n < 10 ? 1 : 0));
    funnelMatrix(rows, st.settings.conv).forEach((track) => {
      const g = el("tr");
      const gh = el("td", "", track.label); gh.colSpan = 7; gh.style.cssText = "font-weight:600;color:var(--mp-contrast);background:var(--mp-bg);";
      g.append(gh);
      table.append(g);
      track.stages.forEach((stage) => {
        const tr = el("tr");
        const first = el("td"); first.append(el("span", "", stage.label), el("br"), el("span", "muted small", stage.of));
        const rateTd = el("td");
        const input = el("input"); input.type = "number"; input.min = "0"; input.max = "100"; input.step = "0.1"; input.value = String(stage.rate); input.style.width = "78px";
        input.setAttribute("aria-label", `${stage.label} conversion percent`);
        input.addEventListener("change", () => { st.settings.conv[stage.key] = Math.max(0, Math.min(100, Number(input.value) || 0)); change(); });
        rateTd.append(input, el("span", "muted small", " %"));
        tr.append(first, rateTd, el("td", "", `${stage.fromActivated.toFixed(stage.fromActivated < 1 ? 2 : 1)}%`), el("td", "", f1(stage.now)), el("td", "", f1(stage.at4)), el("td", "", f1(stage.at12)), el("td", stage.lift12 >= 0 ? "" : "warn", `${stage.lift12 >= 0 ? "+" : ""}${f1(stage.lift12)}`));
        table.append(tr);
      });
    });
    const sheet = el("div", "sheet"); sheet.append(table);
    card.append(head, sheet, el("p", "muted small", "Starts from activated users, so it moves with the ad spend scenario above. The percentages are placeholders: set them from HubSpot and product data once those connectors are live. Counts are accounts per week, not users."));
    const revenue = revenueMatrix(funnelMatrix(rows, st.settings.conv), st.settings.pricing);
    const usd = (n) => `$${Math.round(n).toLocaleString()}`;
    const rv = el("div", "stack");
    rv.append(el("h2", "", "Revenue at the openhands.dev pricing"));
    const form = el("div", "form");
    const seats = el("input"); seats.type = "number"; seats.min = "1"; seats.step = "1"; seats.value = String(st.settings.pricing.seats);
    seats.addEventListener("change", () => { st.settings.pricing.seats = Math.max(1, Math.round(Number(seats.value) || 1)); change(); });
    const acv = el("input"); acv.type = "number"; acv.min = "0"; acv.step = "1000"; acv.value = String(st.settings.pricing.entAcv);
    acv.addEventListener("change", () => { st.settings.pricing.entAcv = Math.max(0, Number(acv.value) || 0); change(); });
    form.append(field("Seats per Teams account (the page: $500 a month for up to 10, $50 a month per seat beyond)", seats), field("Enterprise annual contract value, USD (the page says Custom pricing: an assumption)", acv));
    const rt = el("table");
    const rh = el("tr");
    ["", "Now (per week)", "In 4 weeks", "In 12 weeks", "Added over 12 weeks"].forEach((h) => rh.append(el("th", "", h)));
    rt.append(rh);
    const line = (label, a, b, c, d) => { const tr = el("tr"); tr.append(el("td", "", label), el("td", "", a), el("td", "", b), el("td", "", c), el("td", "", d)); rt.append(tr); };
    line(`New Teams MRR (${usd(revenue.teams.perAccount)} per account a month)`, usd(revenue.teams.nowMrr), usd(revenue.teams.at4Mrr), usd(revenue.teams.at12Mrr), usd(revenue.teams.addedMrr));
    line("Same as annual (ARR)", usd(revenue.teams.nowMrr * 12), usd(revenue.teams.at4Mrr * 12), usd(revenue.teams.at12Mrr * 12), usd(revenue.teams.addedMrr * 12));
    line(`New Enterprise contract value (${usd(revenue.enterprise.acv)} each, assumed)`, usd(revenue.enterprise.nowAcv), usd(revenue.enterprise.at4Acv), usd(revenue.enterprise.at12Acv), usd(revenue.enterprise.addedAcv));
    const tot = el("tr");
    tot.append(el("td", "", "New annual revenue, Teams and Enterprise"), el("td"), el("td"), el("td"), el("td", revenue.liftAnnual >= 0 ? "" : "warn", `${usd(revenue.addedAnnual)} (${revenue.liftAnnual >= 0 ? "+" : "−"}${usd(Math.abs(revenue.liftAnnual))} against holding spend)`));
    rt.append(tot);
    const rsheet = el("div", "sheet"); rsheet.append(rt);
    rv.append(form, rsheet, el("p", "muted small", `Prices read from ${PRICING.source} on ${PRICING.fetched}: Teams $500 a month (30-day trial) for up to 10 users, with $50 a month per seat beyond; capped at 5,000 sessions a month. The page did not say how seats above 10 are billed, so that is read as stated. Agent Canvas is free, and Enterprise is custom, so its value is your assumption. Trials are not modeled: set the paid-Teams % net of trials. New revenue only: no churn and no existing customers.`));
    card.append(rv);
    return card;
  }

  function viewAds() {
    const wrap = el("div", "stack");
    const m = adMatrix(ads, st.settings.value);
    const modes = [["roas", "Return on ad spend"], ["cpa", "Cost per conversion"], ["spend", "Spend"], ["conv", "Conversions"]];
    const bar = el("div", "row");
    bar.append(select(modes, ui.adMode, (v) => { ui.adMode = v; render(); }), el("span", "muted small", "Last four weeks. Sample data until the ad connectors are live. Green is more efficient than the portfolio average."),
      button("Ask an agent to review", () => { ui.dialog = { type: "agent", prompt: adPrompt(ads, st.settings.value), kind: "ads" }; render(); }, "ghost"));
    const show = (c) => {
      if (!c) return null;
      return { spend: `$${num(c.spend)}`, conv: num(c.conv), cpa: c.cpa === null ? "n/a" : `$${num(c.cpa, 2)}`, roas: c.roas === null ? "n/a" : `${num(c.roas, 2)}x` }[ui.adMode];
    };
    const tone = (c) => {
      if (!c) return "";
      const r = ui.adMode === "roas" ? (c.roas ?? 0) / (m.total.roas || 1) : ui.adMode === "cpa" ? (c.cpa ? (m.total.cpa || 1) / c.cpa : 0) : 1;
      if (ui.adMode === "spend" || ui.adMode === "conv") return "";
      return r >= 1.25 ? "good2" : r >= 1 ? "good1" : r >= 0.75 ? "bad1" : "bad2";
    };
    const table = el("table", "matrix");
    table.setAttribute("data-testid", "mp-ad-matrix");
    const hr = el("tr");
    hr.append(el("th", "", "Ad network"));
    SITES.forEach((s) => { const th = el("th", "", s.name); th.title = s.goal; hr.append(th); });
    hr.append(el("th", "", "All sites"));
    table.append(hr);
    AD_NETWORKS.forEach((n) => {
      const tr = el("tr");
      tr.append(el("th", "", n.name));
      SITES.forEach((s) => {
        const c = m.at[`${n.id}|${s.id}`];
        const td = el("td", `cellv ${tone(c)}`, show(c) ?? "-");
        if (c) td.title = `${n.name} on ${s.name}: $${num(c.spend)} spend, ${num(c.conv)} ${s.goal.toLowerCase()}`;
        tr.append(td);
      });
      tr.append(el("td", `cellv total ${tone(m.rows[n.id])}`, show(m.rows[n.id])));
      table.append(tr);
    });
    const tot = el("tr");
    tot.append(el("th", "", "All networks"));
    SITES.forEach((s) => tot.append(el("td", `cellv total ${tone(m.cols[s.id])}`, show(m.cols[s.id]))));
    tot.append(el("td", "cellv total", show(m.total)));
    table.append(tot);
    const sheet = el("div", "sheet"); sheet.append(table);

    const notes = el("div", "cols");
    const ranked = Object.entries(m.at).filter(([, c]) => c && c.roas !== null && c.spend >= 400).sort((a, b) => b[1].roas - a[1].roas);
    const label = (key) => { const [n, s] = key.split("|"); return `${AD_NETWORKS.find((x) => x.id === n).name} on ${SITES.find((x) => x.id === s).name}`; };
    const best = el("div", "card stack");
    best.append(el("h2", "", "Most and least efficient"));
    if (ranked.length >= 2) {
      best.append(el("span", "small", `Best: ${label(ranked[0][0])}, ${num(ranked[0][1].roas, 2)}x return`), el("span", "small warn", `Weakest: ${label(ranked.at(-1)[0])}, ${num(ranked.at(-1)[1].roas, 2)}x return`));
    }
    const hint = reallocationHint(m);
    const shift = el("div", "card stack");
    shift.append(el("h2", "", "Reallocation hint"));
    shift.append(el("span", "small", hint ? `Moving 20% of the weakest cell's weekly spend ($${num(hint.moved)}) to the strongest (${label(hint.to)}) would add about ${num(hint.extraConversions)} conversions a week at observed rates.` : "Not enough data."), el("span", "muted small", "Assumes returns stay linear. Real returns fall as spend rises, so test in steps."));
    notes.append(best, shift);

    const values = el("div", "card stack");
    values.append(el("h2", "", "Value per conversion"), el("span", "muted small", "Used for return on ad spend. Placeholder values: set what a conversion on each site is worth."));
    const form = el("div", "form");
    SITES.forEach((s) => {
      const input = el("input"); input.type = "number"; input.min = "0"; input.step = "0.5"; input.value = String(st.settings.value[s.id]);
      input.addEventListener("change", () => { st.settings.value[s.id] = Math.max(0, Number(input.value) || 0); change(); });
      form.append(field(`${s.name}: ${s.goal} (USD)`, input));
    });
    values.append(form);
    wrap.append(bar, sheet, notes, values);
    return wrap;
  }

  function viewTimeline() {
    const items = allItems();
    const today = todayT();
    const dated = items.flatMap((i) => [toT(i.start), toT(i.end)]).filter((t) => t !== null);
    let min = Math.min(today - 60 * DAY, ...dated);
    let max = Math.max(today + 120 * DAY, ...dated);
    if (ui.zoom === "month") { min = today - 30 * DAY; max = today + 150 * DAY; }
    const mStart = (t) => { const d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); };
    min = mStart(min);
    max = mStart(max) + 32 * DAY;
    const ppd = ZOOM_PPD[ui.zoom];
    const x = (t) => Math.round(((t - min) / DAY) * ppd);
    const width = x(max);

    const rows = [];
    LANES.forEach((lane) => {
      rows.push({ group: lane });
      const laneItems = items.filter((i) => i.lane === lane.id).sort((a, b) => toT(a.start) - toT(b.start));
      if (lane.id === "release") rows.push({ items: laneItems, label: "Release train" });
      else laneItems.forEach((it) => rows.push({ items: [it], label: it.title, item: it }));
    });

    const labels = el("div", "labels");
    const head = el("div", "cell head", "Item");
    labels.append(head);
    const tl = el("div", "tl");
    tl.style.width = `${width}px`;
    const axis = el("div", "axis");
    let qCursor = min;
    while (qCursor < max) {
      const q = quarterOf(qCursor);
      const qs = quarterStart(q.year, q.q);
      const qe = quarterEnd(q.year, q.q) + DAY;
      const lab = el("div", "q", quarterLabel(q));
      lab.style.left = `${x(Math.max(qs, min))}px`;
      lab.style.width = `${Math.max(0, x(Math.min(qe, max)) - x(Math.max(qs, min)))}px`;
      axis.append(lab);
      qCursor = qe;
    }
    for (let m = min; m < max; ) {
      const d = new Date(m);
      const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
      const lab = el("div", "m", d.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }));
      lab.style.left = `${x(m)}px`;
      lab.style.width = `${x(next) - x(m)}px`;
      axis.append(lab);
      const vg = el("div", "vg");
      vg.style.left = `${x(m)}px`;
      tl.append(vg);
      m = next;
    }
    tl.prepend(axis);
    const todayLine = el("div", "today");
    todayLine.style.left = `${x(today)}px`;
    todayLine.append(el("span", "", "Today"));
    tl.append(todayLine);

    const rowIndex = new Map();
    rows.forEach((row, i) => {
      if (row.group) {
        labels.append(el("div", "cell grp", row.group.label));
        tl.append(el("div", "lane grp"));
        return;
      }
      (row.items || []).forEach((it) => rowIndex.set(it.id, i));
      const sel = ui.editing?.item.id === row.item?.id && row.item;
      const lab = row.item ? button("", () => openEditor(row.item), `cell item${sel ? " sel" : ""}`) : el("div", "cell");
      const dot = el("span", `dot s-${row.item?.status ?? "shipped"}`);
      dot.style.background = "var(--c, var(--mp-muted))";
      lab.append(dot, el("span", "t", row.label));
      labels.append(lab);
      const lane = el("div", "lane");
      (row.items || []).forEach((it) => {
        const s = toT(it.start);
        const e = toT(it.end);
        if (s === null) return;
        const isPoint = it.lane === "release" || s === e;
        const status = `s-${it.status}`;
        if (isPoint) {
          const d = el("button", `dia ${status}${it.projected ? " projected" : ""}`);
          d.type = "button";
          d.style.left = `${x(s)}px`;
          d.title = `${it.title} · ${fmtFull(s)}${it.projected ? " (projected)" : ""}`;
          d.setAttribute("aria-label", d.title);
          d.addEventListener("click", () => { ui.editing = { item: it, isNew: false, readOnly: true }; render(); });
          lane.append(d);
        } else {
          const bar = el("div", `bar ${status}${sel ? " sel" : ""}`);
          bar.style.left = `${x(s)}px`;
          bar.style.width = `${Math.max(6, x(e + DAY) - x(s))}px`;
          bar.textContent = it.title;
          bar.title = `${it.title}\n${fmt(s)} to ${fmt(e)} · ${statusLabel(it.status)}`;
          bar.tabIndex = 0;
          bar.addEventListener("click", () => openEditor(it));
          bar.addEventListener("keydown", (ev) => { if (ev.key === "Enter") openEditor(it); });
          lane.append(bar);
        }
      });
      tl.append(lane);
    });

    // Dashed links from each campaign to the feature launches it supports.
    const overlay = svg("svg", { class: "links", width, height: rows.length * ROW_H });
    const hot = ui.editing?.item.id;
    st.items.filter((i) => i.lane === "campaign").forEach((c) => {
      (c.links || []).forEach((fid) => {
        const f = st.items.find((i) => i.id === fid);
        if (!f || !rowIndex.has(c.id) || !rowIndex.has(f.id)) return;
        const lx = x(toT(f.end) + DAY);
        const y1 = rowIndex.get(f.id) * ROW_H + ROW_H / 2;
        const y2 = rowIndex.get(c.id) * ROW_H + ROW_H / 2;
        overlay.append(svg("line", { x1: lx, y1, x2: lx, y2, class: hot === c.id || hot === f.id ? "hot" : "" }));
        overlay.append(svg("circle", { cx: lx, cy: y1, r: 3 }), svg("circle", { cx: lx, cy: y2, r: 3 }));
      });
    });
    tl.append(overlay);

    const grid = el("div", "grid");
    grid.append(labels, tl);
    const sheet = el("div", "sheet");
    sheet.append(grid);
    sheet.setAttribute("data-testid", "mp-sheet");
    const target = ui.scrolled ? ui.scrollLeft ?? 0 : Math.max(0, x(today) - 320);
    window.requestAnimationFrame(() => { sheet.scrollLeft = target; ui.scrolled = true; });
    sheet.addEventListener("scroll", () => { ui.scrollLeft = sheet.scrollLeft; });

    const bar = el("div", "row");
    bar.append(el("span", "muted small", "Zoom"), select([["month", "Month"], ["quarter", "Quarter"], ["year", "Year"]], ui.zoom, (v) => { ui.zoom = v; ui.scrolled = false; render(); }));
    bar.append(el("span", "muted small", "Dashed lines link a campaign to the feature launches it supports. Hollow diamonds are projected weekly releases."));
    const wrap = el("div", "stack");
    wrap.append(bar, sheet, growthSection());
    return wrap;
  }

  function viewBoard() {
    const wrap = el("div", "board");
    STATUSES.forEach((s) => {
      const col = el("div", "col");
      col.append(el("h2", "", s.label));
      st.items.filter((i) => i.status === s.id).sort((a, b) => toT(a.start) - toT(b.start)).forEach((it) => {
        const card = el("div", "kcard");
        const open = button(it.title, () => openEditor(it), "ghost");
        open.style.cssText = "border:0;padding:0;text-align:left;font-weight:600;";
        card.append(open, el("span", "muted small", `${laneLabel(it.lane)} · ${fmt(toT(it.start))} to ${fmt(toT(it.end))}`));
        if (it.channels.length) { const r = el("div", "row"); r.append(...chipEls(it.channels)); card.append(r); }
        const move = el("div", "row");
        const i = STATUSES.findIndex((x) => x.id === s.id);
        const to = (d) => () => { it.status = STATUSES[i + d].id; change(); };
        const prev = button("Move back", to(-1), "ghost small");
        prev.disabled = i === 0;
        const nxt = button("Move on", to(1), "ghost small");
        nxt.disabled = i === STATUSES.length - 1;
        move.append(prev, nxt);
        card.append(move);
        col.append(card);
      });
      wrap.append(col);
    });
    return wrap;
  }

  function viewCalendar() {
    const [y, m] = ui.calMonth.split("-").map(Number);
    const first = Date.UTC(y, m - 1, 1);
    const offset = (new Date(first).getUTCDay() + 6) % 7;
    const start = first - offset * DAY;
    const items = allItems();
    const wrap = el("div", "stack");
    const nav = el("div", "row");
    const move = (d) => () => { const n = new Date(Date.UTC(y, m - 1 + d, 1)); ui.calMonth = toIso(n.getTime()).slice(0, 7); render(); };
    nav.append(button("Previous", move(-1)), el("b", "", new Date(first).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })), button("Next", move(1)), button("This month", () => { ui.calMonth = toIso(todayT()).slice(0, 7); render(); }, "ghost"));
    const grid = el("div", "cal");
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d) => grid.append(el("div", "dow", d)));
    for (let i = 0; i < 42; i += 1) {
      const t = start + i * DAY;
      const day = el("div", `day${new Date(t).getUTCMonth() !== m - 1 ? " off" : ""}${t === todayT() ? " now" : ""}`);
      day.append(el("span", "muted small", String(new Date(t).getUTCDate())));
      const here = itemsOnDay(items, t);
      const rel = here.filter((it) => it.lane === "release");
      if (rel.length) day.append(el("span", "chip s-shipped", `${rel.length} release${rel.length > 1 ? "s" : ""}`));
      here.filter((it) => it.lane !== "release").slice(0, 3).forEach((it) => {
        const ev = el("button", `ev s-${it.status}`, it.title);
        ev.type = "button";
        ev.addEventListener("click", () => openEditor(it));
        day.append(ev);
      });
      const more = here.filter((it) => it.lane !== "release").length - 3;
      if (more > 0) day.append(el("span", "muted small", `+${more} more`));
      grid.append(day);
    }
    wrap.append(nav, grid);
    return wrap;
  }

  function viewList() {
    const wrap = el("div", "stack");
    const bar = el("div", "row");
    const search = el("input");
    search.type = "search";
    search.placeholder = "Search";
    search.value = ui.search;
    search.setAttribute("aria-label", "Search items");
    search.addEventListener("input", () => { ui.search = search.value; ui.fillList?.(); });
    bar.append(search, select([["all", "All lanes"], ...LANES.map((l) => [l.id, l.label])], ui.lane, (v) => { ui.lane = v; render(); }), select([["all", "All statuses"], ...STATUSES.map((s) => [s.id, s.label])], ui.status, (v) => { ui.status = v; render(); }));
    const holder = el("div");
    holder.dataset.list = "";
    wrap.append(bar, holder);
    const fill = () => {
      const q = ui.search.trim().toLowerCase();
      const rows = allItems().filter((i) => (ui.lane === "all" || i.lane === ui.lane) && (ui.status === "all" || i.status === ui.status) && (!q || i.title.toLowerCase().includes(q))).sort((a, b) => toT(a.start) - toT(b.start));
      const table = el("table");
      const hr = el("tr");
      ["Lane", "Title", "Dates", "Status", "Channels"].forEach((h) => hr.append(el("th", "", h)));
      table.append(hr);
      rows.forEach((it) => {
        const tr = el("tr", "clk");
        tr.tabIndex = 0;
        const open = () => { ui.editing = { item: it, isNew: false, readOnly: it.lane === "release" }; render(); };
        tr.addEventListener("click", open);
        tr.addEventListener("keydown", (ev) => { if (ev.key === "Enter") open(); });
        const dates = it.start === it.end ? fmtFull(toT(it.start)) : `${fmt(toT(it.start))} to ${fmt(toT(it.end))}`;
        const c1 = el("td", "", laneLabel(it.lane));
        const c2 = el("td", "", it.title);
        const c3 = el("td", "", `${dates}${it.projected ? " (projected)" : ""}`);
        const c4 = el("td"); c4.append(el("span", `chip s-${it.status}`, statusLabel(it.status)));
        const c5 = el("td"); c5.append(...chipEls(it.channels));
        tr.append(c1, c2, c3, c4, c5);
        table.append(tr);
      });
      holder.replaceChildren(rows.length ? table : el("p", "muted", "Nothing matches."));
    };
    ui.fillList = fill;
    fill();
    return wrap;
  }

  function viewCampaigns() {
    const wrap = el("div", "stack");
    const today = todayT();
    const all = allItems();
    quarterCoverage(st.items, today, 6).forEach((q) => {
      const sec = el("div", "card stack");
      const rels = all.filter((i) => i.lane === "release" && toT(i.start) >= q.start && toT(i.start) <= q.end);
      const head = el("div", "row");
      head.append(el("h2", "", q.label), el("span", "muted small", `${rels.length} release${rels.length === 1 ? "" : "s"}${rels.some((r) => r.projected) ? " (some projected)" : ""}`));
      sec.append(head);
      if (q.campaigns.length === 0) {
        const r = el("div", "row");
        r.append(el("span", "warn", "No campaign planned for this quarter."), button("Add campaign", () => openEditor(newItem("campaign", toIso(q.start), toIso(q.end)), true)));
        sec.append(r);
      }
      q.campaigns.forEach((c) => {
        const card = el("div", "kcard");
        const top = el("div", "row");
        top.append(button(c.title, () => openEditor(c), "ghost"), el("span", `chip s-${c.status}`, statusLabel(c.status)), el("span", "muted small", `${fmt(toT(c.start))} to ${fmt(toT(c.end))}`));
        card.append(top);
        const linked = c.links.map((id) => st.items.find((i) => i.id === id)).filter(Boolean);
        if (linked.length === 0) card.append(el("span", "warn small", "Not linked to a feature launch yet."));
        linked.forEach((f) => {
          const lead = launchLead(c, f);
          const text = lead === null ? "" : lead >= 0 ? `ships ${lead} days after the campaign starts` : `ships ${-lead} days before the campaign starts`;
          card.append(el("span", "small", `${f.title}: launches ${fmtFull(toT(f.end))}, ${text}`));
        });
        const ch = el("div", "row");
        ch.append(...chipEls(c.channels));
        card.append(ch);
        const assets = st.assets.filter((a) => a.campaign === c.id);
        card.append(el("span", "muted small", `${assets.length} assets · estimated ${money(assetCost(assets, st.settings.rates))}`));
        const acts = el("div", "row");
        acts.append(button("Ask an agent", () => { ui.dialog = { type: "agent", prompt: itemPrompt(st, c), kind: "campaign" }; render(); }, "ghost"));
        card.append(acts);
        sec.append(card);
      });
      wrap.append(sec);
    });
    return wrap;
  }

  function viewMap() {
    const camps = campaigns().sort((a, b) => toT(a.start) - toT(b.start));
    const sel = camps.find((c) => c.id === ui.mapSel) ?? null;
    const GAP = 78;
    const NODE_W = 210;
    const NODE_H = 58;
    const cols = { tpl: 0, mod: 290, gen: 600, con: 880 };
    const rows = Math.max(TEMPLATES.length, camps.length, ASSET_KINDS.length, CHANNELS.length);
    const height = rows * GAP + 20;
    const place = (n, count) => 10 + (rows - count) * GAP / 2 + n * GAP;
    const pos = { tpl: {}, mod: {}, gen: {}, con: {} };
    TEMPLATES.forEach((t, i) => { pos.tpl[t.id] = place(i, TEMPLATES.length); });
    camps.forEach((c, i) => { pos.mod[c.id] = place(i, camps.length); });
    ASSET_KINDS.forEach((k, i) => { pos.gen[k.id] = place(i, ASSET_KINDS.length); });
    CHANNELS.forEach((c, i) => { pos.con[c.id] = place(i, CHANNELS.length); });

    const wrap = el("div", "stack");
    const bar = el("div", "row");
    bar.append(el("span", "muted small", sel ? `Selected: ${sel.title}. Click a generator to add an asset brief, or a connector to turn it on or off for this campaign.` : "Each campaign is a module built from an agent template. Select one to see everything it can connect to; solid lines are what it uses."));
    if (sel) bar.append(button("Clear selection", () => { ui.mapSel = null; render(); }, "ghost"));
    const canvas = el("div", "map");
    canvas.style.height = `${height}px`;
    canvas.style.width = `${cols.con + NODE_W + 10}px`;
    canvas.setAttribute("data-testid", "mp-map");
    const edges = svg("svg", { class: "edges", width: cols.con + NODE_W + 10, height });
    const edge = (x1, y1, x2, y2, cls) => edges.append(svg("path", { d: `M${x1} ${y1} C${x1 + 70} ${y1} ${x2 - 70} ${y2} ${x2} ${y2}`, class: cls }));
    const mid = NODE_H / 2;
    camps.forEach((c) => {
      const mine = st.assets.filter((a) => a.campaign === c.id);
      const hot = sel?.id === c.id;
      const tpl = c.template || "quarterly-campaign";
      if (pos.tpl[tpl] !== undefined) edge(cols.tpl + NODE_W, pos.tpl[tpl] + mid, cols.mod, pos.mod[c.id] + mid, hot ? "e hot" : "e");
      ASSET_KINDS.forEach((k) => {
        const used = mine.some((a) => a.kind === k.id);
        if (used || hot) edge(cols.mod + NODE_W, pos.mod[c.id] + mid, cols.gen, pos.gen[k.id] + mid, `${used ? "e" : "e off"}${hot ? " hot" : ""}`);
      });
      CHANNELS.forEach((ch) => {
        const used = c.channels.includes(ch.id);
        if (used || hot) edge(cols.mod + NODE_W, pos.mod[c.id] + mid, cols.con, pos.con[ch.id] + mid, `${used ? "e" : "e off"}${hot ? " hot" : ""}`);
      });
    });
    canvas.append(edges);
    const node = (kind, x, y, title, lines, on, onClick, cls = "") => {
      const n = el("button", `node ${kind} ${cls}${on ? " on" : ""}`);
      n.type = "button";
      n.style.left = `${x}px`;
      n.style.top = `${y}px`;
      n.style.width = `${NODE_W}px`;
      n.style.height = `${NODE_H}px`;
      n.append(el("b", "", title), ...lines.map((l) => el("span", "muted small", l)));
      if (onClick) n.addEventListener("click", onClick); else n.disabled = true;
      canvas.append(n);
      return n;
    };
    TEMPLATES.forEach((t) => node("tpl", cols.tpl, pos.tpl[t.id], t.name, [`${t.id}.md + .json`], camps.some((c) => (c.template || "quarterly-campaign") === t.id), null));
    camps.forEach((c) => {
      const n = st.assets.filter((a) => a.campaign === c.id).length;
      const tname = TEMPLATES.find((t) => t.id === (c.template || "quarterly-campaign"))?.name ?? "No template";
      node("mod", cols.mod, pos.mod[c.id], c.title, [`${tname} · ${n} assets · ${c.channels.length} connectors`], sel?.id === c.id, () => { ui.mapSel = sel?.id === c.id ? null : c.id; render(); }, `s-${c.status}`);
    });
    ASSET_KINDS.forEach((k) => {
      const count = st.assets.filter((a) => a.kind === k.id && (!sel || a.campaign === sel.id)).length;
      node("gen", cols.gen, pos.gen[k.id], `${k.label} generator`, [`${st.settings.tools[k.id]} · ${count} asset${count === 1 ? "" : "s"}`], count > 0, sel ? () => {
        st.assets.push(validateAsset({ campaign: sel.id, kind: k.id, name: `${sel.title}: new ${k.label.toLowerCase()}`, seconds: k.id === "video" ? 15 : undefined }));
        change();
      } : null);
    });
    CHANNELS.forEach((ch) => {
      const used = campaigns().filter((c) => c.channels.includes(ch.id)).length;
      const on = sel ? sel.channels.includes(ch.id) : used > 0;
      node("con", cols.con, pos.con[ch.id], ch.name, [sel ? (on ? "On for this campaign" : "Off for this campaign") : `${used} campaign${used === 1 ? "" : "s"} · not connected`], on, sel ? () => {
        sel.channels = on ? sel.channels.filter((x) => x !== ch.id) : [...sel.channels, ch.id];
        change();
      } : null);
    });
    ["Agent templates", "Campaign modules", "Generators", "Connectors"].forEach((label, i) => {
      const h = el("span", "colhead small muted", label);
      h.style.left = `${Object.values(cols)[i]}px`;
      canvas.append(h);
    });
    const sheet = el("div", "sheet");
    sheet.style.padding = "28px 14px 14px";
    sheet.append(canvas);
    wrap.append(bar, sheet);
    return wrap;
  }

  function viewAssets() {
    const wrap = el("div", "stack");
    const camps = campaigns();
    const bar = el("div", "row");
    bar.append(select([["all", "All campaigns"], ...camps.map((c) => [c.id, c.title])], ui.assetCampaign, (v) => { ui.assetCampaign = v; render(); }));
    const name = el("input"); name.placeholder = "New asset name"; name.setAttribute("aria-label", "New asset name");
    const kind = select(ASSET_KINDS.map((k) => [k.id, `${k.label} (${st.settings.tools[k.id]})`]), "image2d");
    const seconds = el("input"); seconds.type = "number"; seconds.min = "1"; seconds.placeholder = "Seconds"; seconds.style.width = "90px"; seconds.setAttribute("aria-label", "Video length in seconds");
    const camp = select(camps.map((c) => [c.id, c.title]), camps[0]?.id ?? "");
    bar.append(name, kind, seconds, camp, button("Add asset", () => {
      const a = validateAsset({ campaign: camp.value, kind: kind.value, name: name.value, seconds: seconds.value });
      if (!a) return notify("Give the asset a name.", true);
      st.assets.push(a);
      change();
    }, "primary"));
    const board = el("div", "board");
    ASSET_STAGES.forEach((stage, si) => {
      const col = el("div", "col");
      col.append(el("h2", "", stage.label));
      st.assets.filter((a) => a.stage === stage.id && (ui.assetCampaign === "all" || a.campaign === ui.assetCampaign)).forEach((a) => {
        const k = ASSET_KINDS.find((x) => x.id === a.kind);
        const card = el("div", "kcard");
        card.append(el("b", "", a.name), el("span", "muted small", `${k.label} · ${st.settings.tools[a.kind]}${a.seconds ? ` · ${a.seconds}s` : ""}`), el("span", "muted small", st.items.find((i) => i.id === a.campaign)?.title ?? "No campaign"));
        const acts = el("div", "row");
        const back = button("Back", () => { a.stage = ASSET_STAGES[si - 1].id; change(); }, "ghost small");
        back.disabled = si === 0;
        const nxt = button("Next stage", () => { a.stage = ASSET_STAGES[si + 1].id; change(); }, "ghost small");
        nxt.disabled = si === ASSET_STAGES.length - 1;
        acts.append(back, nxt, button("Remove", () => { st.assets = st.assets.filter((x) => x.id !== a.id); change(); }, "ghost small"));
        card.append(acts);
        col.append(card);
      });
      board.append(col);
    });
    wrap.append(el("p", "muted small", "2D, 3D and Seedance video assets move from brief to published. Generation runs through the agents; stages are updated here."), bar, board);
    return wrap;
  }

  function viewTemplates() {
    const wrap = el("div", "stack");
    wrap.append(el("p", "muted small", "Campaign templates for agents: a Markdown instruction file and a JSON brief. Copy them, create a campaign from one, or run one with an agent."));
    TEMPLATES.forEach((t) => {
      const card = el("div", "card stack");
      card.append(el("h2", "", t.name), el("span", "muted", t.description));
      const files = el("div", "row");
      const copy = (text, what) => () => {
        const done = () => notify(`Copied ${what}.`);
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => notify("Copy failed.", true)); else notify("Copy is not available here.", true);
      };
      files.append(button(`Copy ${t.id}.md`, copy(t.md, `${t.id}.md`)), button(`Copy ${t.id}.json`, copy(JSON.stringify(t.json, null, 2), `${t.id}.json`)),
        button("Create campaign from template", () => { ui.dialog = { type: "template", template: t }; render(); }, "primary"),
        button("Run with an agent", () => { ui.dialog = { type: "agent", prompt: templatePrompt(st, t, {}), kind: `template:${t.id}` }; render(); }));
      card.append(files);
      const md = el("details"); md.append(el("summary", "", `${t.id}.md`), el("pre", "", t.md));
      const js = el("details"); js.append(el("summary", "", `${t.id}.json`), el("pre", "", JSON.stringify(t.json, null, 2)));
      card.append(md, js);
      wrap.append(card);
    });
    return wrap;
  }

  function viewCosts() {
    const wrap = el("div", "stack");
    const rates = st.settings.rates;
    const rateCard = el("div", "card stack");
    rateCard.append(el("h2", "", "Generation rates"), el("span", "muted small", "Placeholder rates for estimates only. Replace them with your providers' prices."));
    const form = el("div", "form");
    [["image2d", "2D image, per asset"], ["model3d", "3D model, per asset"], ["video", "Video, per second"]].forEach(([k, label]) => {
      const input = el("input"); input.type = "number"; input.min = "0"; input.step = "0.01"; input.value = String(rates[k]);
      input.addEventListener("change", () => { st.settings.rates[k] = Math.max(0, Number(input.value) || 0); change(); });
      form.append(field(`${label} (USD)`, input));
    });
    ASSET_KINDS.forEach((k) => {
      const input = el("input"); input.value = st.settings.tools[k.id];
      input.addEventListener("change", () => { st.settings.tools[k.id] = input.value.trim() || k.tool; change(); });
      form.append(field(`${k.label} tool`, input));
    });
    rateCard.append(form);
    const table = el("table");
    const hr = el("tr");
    ["Campaign", "2D", "3D", "Video", "Estimate"].forEach((h) => hr.append(el("th", "", h)));
    table.append(hr);
    let total = 0;
    campaigns().forEach((c) => {
      const a = st.assets.filter((x) => x.campaign === c.id);
      const cost = assetCost(a, rates);
      total += cost;
      const tr = el("tr");
      const secs = a.filter((x) => x.kind === "video").reduce((s, x) => s + (x.seconds ?? 0), 0);
      tr.append(el("td", "", c.title), el("td", "", String(a.filter((x) => x.kind === "image2d").length)), el("td", "", String(a.filter((x) => x.kind === "model3d").length)), el("td", "", `${a.filter((x) => x.kind === "video").length} (${secs}s)`), el("td", "", money(cost)));
      table.append(tr);
    });
    const foot = el("tr");
    foot.append(el("td", "", "Total"), el("td"), el("td"), el("td"), el("td", "", money(total)));
    table.append(foot);
    const est = el("div", "card stack");
    est.append(el("h2", "", "Estimated asset cost by campaign"), table);
    wrap.append(rateCard, est);
    return wrap;
  }

  function viewConnections() {
    const wrap = el("div", "stack");
    wrap.append(el("p", "muted small", "The connectors this plan will have. None is connected yet, and no credentials are entered on this page."));
    const grid = el("div", "cols");
    const card = (c, excluded) => {
      const box = el("div", "card stack");
      const used = campaigns().filter((x) => x.channels.includes(c.id)).length;
      box.append(el("h2", "", c.name), el("span", "chip", excluded ? "Not using" : "Not connected"), el("span", "muted small", c.feeds));
      if (!excluded) box.append(el("span", "small", `Used by ${used} campaign${used === 1 ? "" : "s"}`));
      const connect = button("Connect", () => {}, "ghost");
      connect.disabled = true;
      connect.title = excluded ? "This connector is not used" : "Connectors are not wired yet";
      box.append(connect);
      return box;
    };
    CHANNELS.forEach((c) => grid.append(card(c, false)));
    EXCLUDED_CONNECTORS.forEach((c) => grid.append(card(c, true)));
    wrap.append(grid);
    return wrap;
  }

  // ── Editor and dialogs ──
  function editor() {
    const { item, isNew, readOnly } = ui.editing;
    const box = el("div", "card stack drawer");
    box.setAttribute("data-testid", "mp-editor");
    if (readOnly) {
      box.append(el("h2", "", item.title), el("span", "muted", `${laneLabel(item.lane)} · ${fmtFull(toT(item.start))}${item.projected ? " · projected from the recent weekly cadence" : ""}`), button("Close", () => { ui.editing = null; render(); }));
      return box;
    }
    box.append(el("h2", "", isNew ? "New item" : "Edit item"));
    const title = el("input"); title.value = item.title;
    const lane = select(LANES.filter((l) => l.id !== "release").map((l) => [l.id, l.label]), item.lane);
    const start = el("input"); start.type = "date"; start.value = item.start;
    const end = el("input"); end.type = "date"; end.value = item.end;
    const status = select(STATUSES.map((s) => [s.id, s.label]), item.status);
    const template = select([["", "No template"], ...TEMPLATES.map((t) => [t.id, t.name])], item.template ?? "");
    const note = el("textarea"); note.rows = 2; note.value = item.note ?? "";
    const ch = checks(CHANNELS.map((c) => [c.id, c.name]), item.channels, "channel");
    const lk = checks(features().filter((f) => f.id !== item.id).map((f) => [f.id, f.title]), item.links, "link");
    const form = el("div", "form");
    form.append(field("Title", title), field("Lane", lane), field("Start", start), field("End", end), field("Status", status), field("Agent template (campaigns)", template));
    const read = () => validateItem({ ...item, title: title.value, lane: lane.value, start: start.value, end: end.value, status: status.value, template: template.value, channels: picked(ch), links: picked(lk), note: note.value });
    const acts = el("div", "row");
    acts.append(button("Save", () => {
      const v = read();
      if (!v) return notify("A title and a start date are needed.", true);
      const at = st.items.findIndex((x) => x.id === v.id);
      if (at >= 0) st.items[at] = v; else st.items.push(v);
      ui.editing = null;
      change();
    }, "primary"), button("Cancel", () => { ui.editing = null; render(); }));
    if (!isNew) {
      acts.append(button("Ask an agent", () => { ui.dialog = { type: "agent", prompt: itemPrompt(st, item), kind: item.lane }; render(); }, "ghost"), button("Delete", () => {
        st.items = st.items.filter((x) => x.id !== item.id);
        st.assets = st.assets.filter((a) => a.campaign !== item.id);
        st.items.forEach((x) => { x.links = x.links.filter((l) => l !== item.id); });
        ui.editing = null;
        change();
      }, "ghost"));
    }
    box.append(form, field("Channels", ch), field("Linked feature launches", lk), field("Notes", note), acts);
    return box;
  }

  function dialog() {
    const d = ui.dialog;
    const over = el("div", "overlay");
    over.addEventListener("click", (ev) => { if (ev.target === over) { ui.dialog = null; render(); } });
    const box = el("div", "dlg");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    const close = () => { ui.dialog = null; ui.busy = false; render(); };
    if (d.type === "agent") {
      box.setAttribute("aria-label", "Start an agent conversation");
      const ta = el("textarea"); ta.rows = 14; ta.value = d.prompt;
      const status = el("p", "warn small");
      const go = button("Start conversation", async () => {
        go.disabled = true;
        status.textContent = "";
        try {
          await startAgent(ta.value, d.kind);
          ui.dialog = null;
          render();
        } catch (e) {
          status.textContent = e instanceof Error ? e.message : String(e);
          go.disabled = false;
        }
      }, "primary");
      box.append(el("h2", "", "Plan with an agent"), el("p", "muted small", "This starts a new conversation on the active Agent Server with the prompt below, and opens it. Ask for the plan JSON, then paste the agent's JSON block into Plan JSON to apply it."), ta, status, el("div", "row"));
      box.lastChild.append(go, button("Cancel", close));
    } else if (d.type === "json") {
      box.setAttribute("aria-label", "Plan JSON");
      const ta = el("textarea"); ta.rows = 16; ta.value = JSON.stringify({ items: st.items.map(({ sample, ...r }) => r), assets: st.assets }, null, 2);
      const status = el("p", "warn small");
      const acts = el("div", "row");
      acts.append(button("Apply plan", () => {
        try {
          const n = applyPlan(st, ta.value);
          ui.dialog = null;
          save();
          notify(`Applied ${n.items} items and ${n.assets} assets.`);
        } catch (e) { status.textContent = e instanceof Error ? e.message : String(e); }
      }, "primary"), button("Reset to sample plan", () => { const fresh = seedState(); Object.assign(st, fresh, { releases: st.releases, releasesFetchedAt: st.releasesFetchedAt }); ui.dialog = null; ui.editing = null; change(); }, "ghost"), button("Close", close));
      box.append(el("h2", "", "Plan JSON"), el("p", "muted small", "The whole plan. Edit it, or paste a plan an agent wrote, and apply. Items with an existing id are replaced."), ta, status, acts);
    } else if (d.type === "template") {
      box.setAttribute("aria-label", "Create a campaign from a template");
      const t = d.template;
      const name = el("input"); name.value = "";
      const qs = quarterCoverage(st.items, todayT(), 6);
      const q = select(qs.map((x, i) => [String(i), x.label]), "0");
      const acts = el("div", "row");
      acts.append(button("Create campaign", () => {
        if (!name.value.trim()) return;
        const qq = qs[Number(q.value)];
        const camp = validateItem({ lane: "campaign", title: name.value, start: toIso(qq.start), end: toIso(qq.end), channels: t.json.channels ?? [], links: [], template: t.id, note: `From the ${t.name} template.` });
        st.items.push(camp);
        (t.json.assets ?? []).forEach((a) => {
          const v = validateAsset({ campaign: camp.id, kind: a.kind, name: a.name || `${t.name} asset`, seconds: a.kind === "video" ? 15 : undefined });
          if (v) st.assets.push(v);
        });
        ui.dialog = null;
        change();
      }, "primary"), button("Cancel", close));
      box.append(el("h2", "", `New campaign from ${t.name}`), el("div", "form"), acts);
      box.querySelector(".form").append(field("Campaign name", name), field("Quarter", q));
      box.append(el("p", "muted small", "Creates the campaign with the template's channels and its starting assets in the brief stage."));
    }
    over.append(box);
    return over;
  }

  // ── Render ──
  const bodies = { timeline: viewTimeline, board: viewBoard, calendar: viewCalendar, list: viewList, campaigns: viewCampaigns, map: viewMap, ads: viewAds, assets: viewAssets, templates: viewTemplates, costs: viewCosts, connections: viewConnections };
  let bodyHost = null;

  function renderBody() {
    bodyHost.replaceChildren(bodies[ui.view]());
  }

  async function refreshReleases() {
    try {
      const res = await window.fetch(RELEASES_URL, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) throw new Error(`GitHub answered ${res.status}.`);
      const data = await res.json();
      const rels = data.filter((r) => /^v\d+\.\d+\.\d+$/.test(r.tag_name) && r.published_at && !r.prerelease).map((r) => ({ tag: r.tag_name, date: r.published_at.slice(0, 10) })).sort((a, b) => a.date.localeCompare(b.date) || a.tag.localeCompare(b.tag, undefined, { numeric: true }));
      if (!rels.length) throw new Error("No releases were returned.");
      st.releases = rels;
      st.releasesFetchedAt = toIso(Date.now());
      save();
      notify(`Loaded ${rels.length} releases from GitHub.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not load releases.", true);
    }
  }

  function render() {
    if (disposed) return;
    root.replaceChildren();
    const head = el("div", "top");
    const left = el("div");
    left.append(el("h1", "", "Marketing Production"), el("span", "muted", `Campaigns planned against the OpenHands release schedule · today ${fmtFull(todayT())}`));
    const acts = el("div", "row");
    acts.append(button("Plan with AI", () => { ui.dialog = { type: "agent", prompt: planPrompt(st, "Fill the gaps in the next four quarters: every quarter has a campaign linked to feature launches, with the assets each needs."), kind: "plan" }; render(); }, "primary"),
      button("Add item", () => openEditor(newItem(), true)), button("Plan JSON", () => { ui.dialog = { type: "json" }; render(); }), button("Refresh releases", refreshReleases, "ghost"));
    head.append(left, acts);
    const banner = el("div", "banner small muted", `Feature launches, campaigns, projects and assets are a sample plan: edit or replace them. Releases are the OpenHands v1.x series${st.releasesFetchedAt ? ` loaded from GitHub on ${st.releasesFetchedAt}` : " (snapshot of 2026-10-29)"}; later ones are projected weekly.`);
    const tabs = el("div", "tabs");
    tabs.setAttribute("role", "tablist");
    VIEWS.forEach(([id, label]) => {
      const t = el("button", "tab", label);
      t.type = "button";
      t.setAttribute("role", "tab");
      t.setAttribute("aria-selected", String(ui.view === id));
      t.addEventListener("click", () => { ui.view = id; render(); });
      tabs.append(t);
    });
    bodyHost = el("div");
    bodyHost.setAttribute("role", "tabpanel");
    root.append(head, tiles(), banner, tabs, bodyHost);
    renderBody();
    if (ui.editing) root.append(editor());
    if (ui.dialog) root.append(dialog());
    if (ui.toast) { const t = el("div", `toast${ui.toast.err ? " err" : ""}`, ui.toast.text); t.setAttribute("role", "status"); root.append(t); }
  }

  render();
  return () => {
    disposed = true;
    window.clearTimeout(toastTimer);
    style.remove();
    root.remove();
  };
}

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("Marketing Production requires Canvas host API 1.");
  return host.registerPage("production", (context) => mountProduction(host, context));
}
