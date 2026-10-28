# Kosmic App Cards — Specification & Integration Plan

> **Status**: DRAFT v0.1 — Living document for planning Kosmic App Cards as an OpenHands extension ecosystem.
> **Last Updated**: 2026-10-23

---

## Table of Contents

1. [Vision & Goals](#1-vision--goals)
2. [Source Libraries Inventory](#2-source-libraries-inventory)
3. [Architecture Overview](#3-architecture-overview)
4. [Package Design: @kosmos/app-cards](#4-package-design-kosmosapp-cards)
5. [OpenHands Extension Integration](#5-openhands-extension-integration)
6. [App Library Catalog](#6-app-library-catalog)
7. [Longformer Embedded Extension](#7-longformer-embedded-extension)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Technical Decisions](#9-technical-decisions)
10. [Open Questions](#10-open-questions)

---

## 1. Vision & Goals

### What are Kosmic App Cards?

**Kosmic App Cards** are dynamic, interactive mini-apps that render directly inside AI agent conversations. They transform plain text responses into rich, themeable UI experiences — weather widgets, music players, task lists, calendars, charts, and full-fledged applications.

### Core Principles

1. **Schema-Driven Generation** — AI agents emit JSON schema, not HTML/CSS. The schema maps to pre-styled, validated components.

2. **Bounded Vocabulary** — Agents assemble from a typed registry of blocks. No arbitrary markup = reliable, safe, themeable output.

3. **Portable & Embeddable** — Works in OpenHands Agent Canvas, standalone apps, and any host that implements the renderer.

4. **One Source of Truth** — Each block has exactly one definition that drives schema, validation, prompt docs, and render.

### Use Cases

- Agent responds with an interactive weather card instead of "The weather is 75°F sunny"
- Task manager cards that agents can create, update, and track in-conversation
- Music/media players that control playback from chat
- Calendar scheduling cards for meeting coordination
- Code execution cards with live preview
- Document editors embedded in conversation flow
- Full generated apps docked inside the agent workspace

---

## 2. Source Libraries Inventory

### Primary Sources

| Repository | Description | Key Components |
|------------|-------------|----------------|
| **UI Experiments/longformer-ui-tailwind** | Complete generative-UI system | 59+ block types, GeneratedSurfaceSchema, themed primitives |
| **UI Experiments/longformer-ui** | CSS Modules variant | Same blocks, different styling approach |
| **~/Desktop/UI/MAIN BEST** | HTML/CSS prototypes | Widget designs, card layouts, style references |
| **kosmos-engine/apps/dev-ui** | SolidJS HUD components | Icons, buttons, kit.tsx primitives |
| **kosmos-engine/crates/kosmos-ui** | Rust retained-mode UI tree | UiTree ops, NodeKind, Props system |

### DocTransit Apps (Extension Candidates)

| App | Purpose | Integration Priority |
|-----|---------|---------------------|
| `doctransit-app` | Document management platform | High — core document workflows |
| `doctransit-app-canvas-app-view` | Canvas embedding system | High — already built for embedding |
| `doctransit-app-document-agent` | AI document agent | High — agent-in-agent pattern |
| `doctransit-app-fileupload` | File upload handling | Medium |
| `doctransit-app-legal-services` | Legal document workflows | Medium |
| `doctransit-app-entity-formation` | Business formation docs | Medium |
| `doctransit-app-room-signing` | Document signing rooms | Low |
| `doctransit-mcp` | MCP server for documents | High — MCP integration |

### Kosmos Office Apps (from kosmos.computer)

| App | Kind | Description |
|-----|------|-------------|
| Task board | Skill | Kanban-style task management |
| Notes | App | Rich text notes workspace |
| Calendar | App | Event scheduling with sync |
| Budget sheet | Generated | Personal/team finance tracking |
| Brand board | Generated | Logo, palette, type pairings |
| Invoice form | Generated | Freelancer invoicing |
| Campaign landing | Generated | Single-page offer builder |

### Additional Integrations

| Source | Description |
|--------|-------------|
| **hermes-webui** | Full chat/agent UI — potential embedding |
| **yakopop** | Game flashcard system — card UI patterns |
| **Golf-Cards** | Card game UI — interaction patterns |

---

## 3. Architecture Overview

### Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenHands Agent Canvas                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Conversation Message Stream                 ││
│  │  ┌────────────────────────────────────────────────────┐ ││
│  │  │          Kosmic App Cards Extension                │ ││
│  │  │  ┌──────────────────────────────────────────────┐  │ ││
│  │  │  │        KosmicSurface Renderer                │  │ ││
│  │  │  │  ┌────────────────────────────────────────┐  │  │ ││
│  │  │  │  │     Block Registry (59+ types)         │  │  │ ││
│  │  │  │  │  ┌──────────────────────────────────┐  │  │  │ ││
│  │  │  │  │  │   @kosmos/app-cards Package      │  │  │  │ ││
│  │  │  │  │  │  • Primitives (tokens, atoms)    │  │  │  │ ││
│  │  │  │  │  │  • Blocks (composites)           │  │  │  │ ││
│  │  │  │  │  │  • Containers (frames)           │  │  │  │ ││
│  │  │  │  │  │  • Types & Schemas               │  │  │  │ ││
│  │  │  │  │  └──────────────────────────────────┘  │  │  │ ││
│  │  │  │  └────────────────────────────────────────┘  │  │ ││
│  │  │  └──────────────────────────────────────────────┘  │ ││
│  │  └────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Agent LLM Response
       │
       ▼
┌──────────────────┐
│ JSON Schema      │  ← GeneratedSurfaceSchema / A2UI / OpenUI Lang
│ { blocks: [...] }│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Schema Validator │  ← Zod runtime validation
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Block Registry   │  ← registry[type].render()
│ Lookup           │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Themed React     │  ← CSS tokens, dark/light mode
│ Components       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Interactive UI   │  ← Actions, state updates, callbacks
│ in Conversation  │
└──────────────────┘
```

---

## 4. Package Design: @kosmos/app-cards

### Package Structure

```
@kosmos/app-cards/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Main exports
│   │
│   ├── tokens/                     # Design tokens (Tier 0)
│   │   ├── tokens.ts               # --kosmic-* CSS variables
│   │   ├── tokens.css              # CSS custom properties
│   │   ├── ThemeProvider.tsx       # Theme context
│   │   └── index.ts
│   │
│   ├── primitives/                 # Atomic components (Tier 1)
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Avatar/
│   │   ├── Badge/
│   │   ├── Input/
│   │   ├── Icon/
│   │   ├── Progress/
│   │   └── index.ts
│   │
│   ├── blocks/                     # Data-driven blocks (Tier 2)
│   │   ├── StatCardsBlock/
│   │   ├── ActivityCardsBlock/
│   │   ├── MetricChartCardsBlock/
│   │   ├── WeatherCardsBlock/
│   │   ├── MusicPlayerCardsBlock/
│   │   ├── CalendarScheduleCardsBlock/
│   │   ├── TaskChecklistCardsBlock/
│   │   ├── CodeBlock/
│   │   ├── TerminalBlock/
│   │   ├── FormBlock/
│   │   └── index.ts
│   │
│   ├── containers/                 # Frame containers (Tier 3)
│   │   ├── AppCardFrame/           # Single card container
│   │   ├── CardGrid/               # Multi-card layout
│   │   ├── DockableWindow/         # Desktop-style window
│   │   └── index.ts
│   │
│   ├── registry/                   # Block registry system
│   │   ├── defineBlock.ts          # Block definition helper
│   │   ├── registry.ts             # Central block map
│   │   ├── schemas.ts              # Zod schemas per block
│   │   └── index.ts
│   │
│   ├── renderer/                   # Surface renderers
│   │   ├── KosmicSurface.tsx       # Main schema→UI renderer
│   │   ├── StreamRenderer.tsx      # Streaming/partial render
│   │   └── index.ts
│   │
│   └── types/                      # TypeScript types
│       ├── blocks.ts               # Block type definitions
│       ├── schema.ts               # GeneratedSurfaceSchema
│       ├── actions.ts              # Interaction callbacks
│       └── index.ts
│
├── styles/
│   ├── kosmic.css                  # Full CSS bundle
│   └── kosmic.module.css           # CSS Modules version
│
└── dist/                           # Build output
    ├── index.js
    ├── index.d.ts
    └── kosmic.css
```

### Core Types

```typescript
// types/schema.ts

export interface KosmicAppCard {
  id: string;
  type: KosmicCardType;
  title?: string;
  blocks: KosmicBlock[];
  actions?: KosmicAction[];
  meta?: {
    refreshInterval?: number;
    expandable?: boolean;
    pinnable?: boolean;
    resizable?: boolean;
  };
}

export type KosmicBlock =
  | { id: string; type: "text"; text: string; tone?: "default" | "muted" | "heading" }
  | { id: string; type: "statCards"; title?: string; cards: StatCard[] }
  | { id: string; type: "activityCards"; title?: string; cards: ActivityCard[] }
  | { id: string; type: "weatherCards"; title?: string; cards: WeatherCard[] }
  | { id: string; type: "musicPlayerCards"; title?: string; cards: MusicPlayerCard[] }
  | { id: string; type: "calendarScheduleCards"; title?: string; cards: CalendarCard[] }
  | { id: string; type: "taskChecklistCards"; title?: string; cards: TaskCard[] }
  | { id: string; type: "metricChartCards"; title?: string; cards: MetricChartCard[] }
  | { id: string; type: "code"; language?: string; code: string }
  | { id: string; type: "terminal"; lines: string[] }
  | { id: string; type: "form"; title?: string; fields: FormField[] }
  // ... 50+ more block types

export interface KosmicAction {
  id: string;
  label: string;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost";
  callback?: () => void | Promise<void>;
}

export interface KosmicSurfaceSchema {
  id: string;
  cards: KosmicAppCard[];
}
```

### Block Registration

```typescript
// registry/defineBlock.ts

import { z } from "zod";

export interface BlockDefinition<T> {
  type: string;
  schema: z.ZodType<T>;
  render: React.ComponentType<{ block: T }>;
  promptDescription: string;
  examples: T[];
  formFactorSupport: ("desktop" | "tablet" | "phone" | "watch" | "widget")[];
}

export function defineBlock<T>(def: BlockDefinition<T>): BlockDefinition<T> {
  return def;
}

// Example usage:
export const weatherCardsBlock = defineBlock({
  type: "weatherCards",
  schema: z.object({
    id: z.string(),
    type: z.literal("weatherCards"),
    title: z.string().optional(),
    cards: z.array(weatherCardSchema),
  }),
  render: WeatherCardsBlock,
  promptDescription: "Display weather conditions with temperature, forecast, and conditions icon.",
  examples: [
    {
      id: "weather-1",
      type: "weatherCards",
      cards: [{ temp: "75°", condition: "Sunny", high: "80°", low: "56°" }],
    },
  ],
  formFactorSupport: ["desktop", "tablet", "phone", "watch", "widget"],
});
```

---

## 5. OpenHands Extension Integration

### Extension Architecture

The Kosmic App Cards extension integrates with OpenHands Agent Canvas through:

1. **Message Content Type Extension** — Register a new content type for `kosmic-card` in conversation messages
2. **Tool Definition** — `render_kosmic_card` tool that agents can call to emit cards
3. **UI Component Registration** — React components that render in the message stream

### Extension Package

```typescript
// @kosmos/openhands-extension/src/index.ts

import { KosmicSurface } from "@kosmos/app-cards";
import type { ConversationTool, MessageContentRenderer } from "@openhands/sdk";

// Tool that agents can invoke
export const kosmicCardTool: ConversationTool = {
  name: "render_kosmic_card",
  description: "Render an interactive Kosmic App Card in the conversation",
  parameters: {
    type: "object",
    properties: {
      cardType: {
        type: "string",
        enum: ["weather", "music", "calendar", "tasks", "stats", "form", ...],
        description: "Type of card to render",
      },
      data: {
        type: "object",
        description: "Card-specific data payload",
      },
    },
    required: ["cardType", "data"],
  },
  execute: async ({ cardType, data }) => {
    // Return schema for client-side rendering
    return {
      contentType: "kosmic-card",
      schema: buildSchema(cardType, data),
    };
  },
};

// Content renderer for Agent Canvas
export const kosmicCardRenderer: MessageContentRenderer = {
  contentType: "kosmic-card",
  component: KosmicCardMessage,
};

function KosmicCardMessage({ content }) {
  return (
    <div className="kosmic-card-container">
      <KosmicSurface schema={content.schema} />
    </div>
  );
}
```

### Integration with Agent Canvas

```typescript
// In OpenHands Agent Canvas configuration

import { kosmicCardTool, kosmicCardRenderer } from "@kosmos/openhands-extension";

// Register the tool for agents
agentConfig.tools.push(kosmicCardTool);

// Register the renderer for conversation UI
messageRenderers.register(kosmicCardRenderer);
```

---

## 6. App Library Catalog

### Phase 1: Core Cards (MVP)

| Card Type | Description | Blocks Used | Priority |
|-----------|-------------|-------------|----------|
| Weather | Current conditions + forecast | glassWidget, text | High |
| Calendar | Day/week view with events | calendarScheduleCards | High |
| Tasks | Checklist with progress | taskChecklistCards | High |
| Stats | Metric tiles with delta | statCards, metricChartCards | High |
| Music | Player with controls | musicPlayerCards | High |
| Timer/Clock | Countdown, timezone | timezoneCards, meetingCountdown | Medium |

### Phase 2: Productivity Apps

| Card Type | Description | Blocks Used |
|-----------|-------------|-------------|
| Notes | Rich text mini-editor | formBlock, text |
| Email Preview | Message preview cards | mediaCards, listingCards |
| Contacts | Contact cards with actions | profileSummaryCards |
| Files | File browser cards | listingCards with icons |
| Code Snippet | Syntax-highlighted code | codeBlock |
| Terminal | Command output display | terminalBlock |

### Phase 3: Domain Apps

| App | Source | Integration |
|-----|--------|-------------|
| DocTransit Document Viewer | doctransit-app | Embedded iframe or native blocks |
| DocTransit Form Builder | doctransit-app-document-agent | Form generation |
| Legal Services | doctransit-app-legal-services | Document workflow cards |
| Invoice Generator | kosmos office apps | Form + PDF preview |
| Budget Tracker | kosmos office apps | Stats + charts |

### Phase 4: Full Embedded Apps

| App | Description | Integration Pattern |
|-----|-------------|---------------------|
| Longformer | Transcription studio | Embedded workspace |
| Hermes WebUI | Full chat interface | Nested conversation |
| Techno Studio | Code editor + preview | Embedded IDE |

---

## 7. Longformer Embedded Extension

### Goal

Embed the Longformer transcription app as a first-class extension within OpenHands conversations, enabling:

- Upload audio → transcription in conversation
- Chapterization and clip creation
- Edit transcript inline
- Export to notes/docs

### Architecture

```
┌─────────────────────────────────────────┐
│        OpenHands Conversation           │
│  ┌───────────────────────────────────┐  │
│  │  User: "Transcribe this audio"   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Agent: [Longformer Card]        │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │   Audio Player        │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │   Transcript View     │  │  │  │
│  │  │  │   with timestamps     │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │   Chapter List        │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  │  [Edit] [Export] [Share]    │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Implementation Path

1. **Longformer as MCP Server** — Expose transcription as MCP tools
2. **Kosmic Blocks for Transcript UI** — Build specialized blocks for audio/transcript
3. **Embedded Workspace** — Full editor experience docked in conversation

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- [ ] Create `@kosmos/app-cards` package skeleton
- [ ] Port token system from longformer-ui-tailwind
- [ ] Port 10 core primitives (Button, Card, Avatar, Badge, Input, etc.)
- [ ] Port 10 essential blocks (statCards, taskChecklistCards, etc.)
- [ ] Build KosmicSurface renderer
- [ ] Set up build/publish pipeline

### Phase 2: Extension Layer (Weeks 3-4)

- [ ] Create `@kosmos/openhands-extension` package
- [ ] Implement `render_kosmic_card` tool
- [ ] Register content renderer in Agent Canvas
- [ ] Build demo conversation flow
- [ ] Test with real agent interactions

### Phase 3: Core App Cards (Weeks 5-6)

- [ ] Weather card (API integration)
- [ ] Calendar card (event data)
- [ ] Task card (CRUD operations)
- [ ] Stats card (data binding)
- [ ] Music card (playback controls)

### Phase 4: DocTransit Integration (Weeks 7-8)

- [ ] Review doctransit-app-canvas-app-view
- [ ] Build document viewer card
- [ ] Build form builder card
- [ ] Test document workflow integration

### Phase 5: Longformer Embedding (Weeks 9-10)

- [ ] Build audio player blocks
- [ ] Build transcript viewer blocks
- [ ] Implement MCP server
- [ ] Full workspace embedding

### Phase 6: App Library Expansion (Ongoing)

- [ ] Port remaining 49+ blocks from longformer-ui
- [ ] Build domain-specific cards
- [ ] Community contributions system

---

## 9. Technical Decisions

### D1: Styling Approach

**Decision**: CSS Modules + CSS custom properties (tokens)

**Rationale**:
- Zero runtime cost
- Full theming via `--kosmic-*` tokens
- Portable to any React host
- AI emits schema, not styles

### D2: Schema Validation

**Decision**: Zod at runtime, JSON Schema for constrained decoding

**Rationale**:
- Type safety end-to-end
- Runtime validation prevents invalid UI
- JSON Schema enables LLM structured outputs

### D3: Registry Pattern

**Decision**: Single `defineBlock()` definition drives everything

**Rationale**:
- No drift between schema, render, docs
- Auto-generated prompt descriptions
- One place to add a new block type

### D4: Integration Surface

**Decision**: OpenHands tool + content type extension

**Rationale**:
- Clean separation from core Agent Canvas
- Agents explicitly request cards via tool
- Renderer handles all block types

### D5: Embedded Apps

**Decision**: Progressive enhancement from cards → full apps

**Rationale**:
- Start with simple cards
- Expand to embedded iframes for complex apps
- Eventually native integration for performance

---

## 10. Open Questions

1. **State Management** — How do cards maintain state across conversation turns?

2. **Action Callbacks** — How do card interactions trigger agent responses?

3. **Data Binding** — How do cards connect to live data sources (APIs, databases)?

4. **Persistence** — Should generated cards be saveable/shareable?

5. **Versioning** — How do we handle schema evolution without breaking existing cards?

6. **MCP Integration** — Should cards be exposed as MCP tools directly?

7. **Mobile/Responsive** — How do cards adapt to mobile Agent Canvas?

8. **Accessibility** — Full a11y compliance for all card types?

---

## Appendix A: Block Type Reference

Full list of 59+ block types from longformer-ui:

| Block Type | Description |
|------------|-------------|
| text | Plain text with tone |
| cardGrid | Generic card grid |
| mediaCards | Media/image cards |
| listingCards | List items with metadata |
| statCards | Metric tiles |
| activityCards | Activity feed items |
| metricChartCards | Charts with metrics |
| selectionTiles | Selectable options |
| timelineSteps | Timeline with steps |
| routeCards | Navigation routes |
| profileSummaryCards | Profile previews |
| filterSections | Filter controls |
| sessionCards | Session info |
| scheduleSlots | Time slot picker |
| insightCards | Insight/tip cards |
| timezoneCards | Timezone display |
| meetingCountdownCards | Meeting countdown |
| eventCards | Calendar events |
| deviceCards | Device status |
| expenseCards | Expense items |
| courseCards | Course/lesson cards |
| cryptoMarketCards | Crypto prices |
| vpnConnectionCards | VPN status |
| calendarScheduleCards | Full calendar |
| batteryStatusCards | Battery display |
| musicPlayerCards | Music player |
| videoPlayerCards | Video player |
| newsFeedCards | News items |
| taskChecklistCards | Task lists |
| translationCards | Translation panels |
| colorPaletteCards | Color swatches |
| assetShowcaseCards | Asset galleries |
| designCards | Design previews |
| glassWidgets | Glassmorphism widgets |
| creatorWidgets | Creator content |
| flowReportCards | Flow diagrams |
| savedMoneyCards | Savings display |
| fearGreedCards | Market sentiment |
| targetChartCards | Target progress |
| quizScoreCards | Quiz results |
| timeSpentCards | Time tracking |
| weeklyStreakCards | Streak display |
| globalRankingCards | Leaderboards |
| enrollmentChartCards | Enrollment stats |
| activeProjectsCards | Project status |
| miniStatChartCards | Mini charts |
| statisticsProgressCards | Progress bars |
| salesOverviewCards | Sales dashboard |
| webinarCtaCards | Webinar CTAs |
| expenseGaugeCards | Expense gauges |
| earningReportsCards | Earnings display |
| subscribersChartCards | Subscriber charts |
| spentThisMonthCards | Monthly spending |
| profileGridCards | Profile grids |
| phoneHomeScreen | Phone home simulation |
| form | Form inputs |
| code | Code blocks |
| terminal | Terminal output |

---

## Appendix B: Related Repositories

| Repository | Path | Purpose |
|------------|------|---------|
| UI Experiments | `~/Documents/github/UI Experiments` | Main UI library |
| kosmos-engine | `~/Documents/github/kosmos-engine` | Game engine UI |
| kosmos-www | `~/Documents/github/kosmos-www` | Marketing site + app catalog |
| doctransit-app | `~/Documents/github/doctransit-app` | Document platform |
| doctransit-mcp | `~/Documents/github/doctransit-mcp` | MCP server |
| hermes-webui | `~/Documents/github/hermes-webui` | Chat UI |
| Desktop UI | `~/Desktop/UI` | Prototypes |

---

*This specification is a living document. Update as implementation progresses.*
