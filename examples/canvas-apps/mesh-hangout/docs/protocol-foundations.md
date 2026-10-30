# MESH spec v1.1: overview, principles, architecture

> Source: https://github.com/FraterCCCLXIII/mesh-protocol/blob/main/specs/MESH_PROTOCOL_v1.1.md (lines 36-143). Imported verbatim from the MESH protocol repository (CC0 1.0). Text is unedited; other sections of the source are omitted for length. The MESH repository itself is the authority; this is a copy.

## 1. Overview

### 1.1 What is MESH?

MESH is a modular, layered protocol for decentralized social networking that provides:

- **Self-sovereign identity** via Ed25519 cryptographic keys
- **Append-only integrity** via prev-chain linked events
- **Multi-device support** via device keys and automatic merge ← **NEW**
- **End-to-end encryption** via X25519 + AES-256-GCM
- **Verifiable feeds** via deterministic view computation
- **Composable moderation** via third-party attestations
- **Optional identity recovery** via social recovery or custodial backup ← **NEW**
- **Horizontal scalability** via content-addressed data

### 1.2 Key Properties

| Property | Mechanism |
|----------|-----------|
| Decentralized | No required central servers |
| Self-sovereign | Users own their keys and data |
| Multi-device | Device keys with automatic merge |
| Censorship-resistant | Data replicates across relays |
| Privacy-preserving | E2EE for DMs and private groups |
| Verifiable | Deterministic feed computation |
| Recoverable | Optional social/custodial recovery |
| Scalable | Content-addressed, shardable |

### 1.3 Design Goals

1. **Simplicity** - Minimal primitive set (Entity, Content, Link)
2. **Integrity** - Provable append-only history
3. **Practicality** - Works with real-world usage patterns ← **EMPHASIZED**
4. **Privacy** - Encryption built-in, not bolted on
5. **Modularity** - Use only the layers you need
6. **Performance** - 6,000+ writes/sec, 5,000+ queries/sec

---

## 2. Design Principles

### 2.1 Core Principles

1. **Keys are identity** - Your Ed25519 keypair IS your identity
2. **Events are immutable** - Once written, events cannot be changed
3. **State is derived** - Current state is computed from event history
4. **Forks are normal** - Multi-device naturally creates forks; merge them ← **NEW**
5. **Attestations are separate** - Third-party claims never modify facts
6. **Views are deterministic** - Same inputs always produce same outputs
7. **Recovery is optional** - Users choose their security/convenience tradeoff ← **NEW**
8. **Layers are optional** - Clients choose which layers to implement

### 2.2 Tradeoffs Made

| Tradeoff | Choice | Rationale |
|----------|--------|-----------|
| Event logs vs state | Event logs | Auditability, sync simplicity |
| Push vs pull sync | Pull with subscriptions | Efficiency, offline support |
| Keys vs delegated identity | Keys with optional recovery | Self-sovereignty + practicality |
| Local-first vs relay-based | Hybrid | Flexibility, resilience |
| Single chain vs multi-head | **Multi-head with merge** | Multi-device support |
| Client-side vs protocol moderation | Client-side with attestations | Freedom, composability |
| E2EE default vs optional | Optional with easy E2EE | Performance, usability |

### 2.3 What MESH Does NOT Do

- **Consensus** - No blockchain, no global ordering
- **Payments** - No built-in cryptocurrency
- **Storage guarantees** - Relays may drop data
- **Forced recovery** - Recovery is opt-in, not mandatory
- **Content moderation** - Protocol provides tools, not policies

---

## 3. Architecture

### 3.1 Layer Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 8: APPLICATION                             │
│              (Mobile, Web, Desktop, Bots, VR)                       │
├─────────────────────────────────────────────────────────────────────┤
│                    LAYER 7: NETWORK                                 │
│           (HTTP API, WebSocket, Federation, P2P)                    │
├─────────────────────────────────────────────────────────────────────┤
│                    LAYER 6: VIEW                                    │
│        (ViewDefinitions, Reducers, Execution Limits)                │
├─────────────────────────────────────────────────────────────────────┤
│                    LAYER 5: MODERATION                              │
│           (Attestations, Trust Networks, Conflict Resolution)       │
├─────────────────────────────────────────────────────────────────────┤
│                    LAYER 4: SOCIAL                                  │
│              (Entity, Content, Link primitives)                     │
├─────────────────────────────────────────────────────────────────────┤
│                    LAYER 3: INTEGRITY                               │
│         (LogEvent, Multi-Head DAG, Automatic Merge)                 │
├─────────────────────────────────────────────────────────────────────┤
│                    LAYER 2: STORAGE                                 │
│            (SQLite/PostgreSQL, Indexes, Caching)                    │
├─────────────────────────────────────────────────────────────────────┤
│                    LAYER 1: PRIVACY                                 │
│     (Ed25519, X25519, AES-256-GCM, Device Keys, Recovery Keys)      │
└─────────────────────────────────────────────────────────────────────┘
```

---


