# MESH protocol: overview

> Source: https://github.com/FraterCCCLXIII/mesh-protocol/blob/main/README.md (lines 17-60 and 127-137). Imported verbatim from the MESH protocol repository (CC0 1.0). Text is unedited; other sections of the source are omitted for length. The MESH repository itself is the authority; this is a copy.

## What is MESH?

MESH is a layered protocol for decentralized social networking:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    APPLICATION (mobile, web, bots)                  │
├─────────────────────────────────────────────────────────────────────┤
│                    NETWORK (HTTP, WebSocket, federation)            │
├─────────────────────────────────────────────────────────────────────┤
│                    VIEW (feeds, algorithms, caching)                │
├─────────────────────────────────────────────────────────────────────┤
│                    MODERATION (attestations, trust networks)        │
├─────────────────────────────────────────────────────────────────────┤
│                    SOCIAL (Entity, Content, Link)                   │
├─────────────────────────────────────────────────────────────────────┤
│                    INTEGRITY (DAG, merge, verification)             │
├─────────────────────────────────────────────────────────────────────┤
│                    STORAGE (SQLite, PostgreSQL)                     │
├─────────────────────────────────────────────────────────────────────┤
│                    PRIVACY (Ed25519, X25519, AES-GCM)               │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Features

| Feature | Description |
|---------|-------------|
| **Self-sovereign identity** | Ed25519 keys are your identity |
| **Multi-device support** | Device keys with automatic merge |
| **End-to-end encryption** | X25519 + AES-256-GCM for DMs/groups |
| **Verifiable feeds** | Deterministic computation |
| **Composable moderation** | Third-party attestations |
| **Optional recovery** | Social, custodial, or hardware backup |
| **High performance** | 6,000+ writes/sec, 37M+ DAU per node |

## Performance

| Operation | Time | Throughput |
|-----------|:----:|:----------:|
| Ed25519 sign+verify | 0.15ms | 6,700/sec |
| Storage write | 0.17ms | 6,000/sec |
| Simple query | 0.19ms | 5,300/sec |
| View execution | 2.76ms | 360/sec |

## Comparison with Other Protocols

| Feature | MESH | Nostr | ActivityPub | SSB | AT Protocol |
|---------|:----:|:-----:|:-----------:|:---:|:-----------:|
| Self-sovereign ID | ✓ | ✓ | ✗ | ✓ | ✗ |
| Multi-device | ✓ | ✗ | ✓ | ✗ | ✓ |
| E2EE | ✓ | ✗ | ✗ | ✓ | ✗ |
| Fork handling | ✓ Auto | N/A | N/A | ✗ Manual | ✓ |
| Identity recovery | ✓ Optional | ✗ | ✓ | ✗ | ✓ |
| Custom algorithms | ✓ | ✗ | ✗ | ✗ | ✓ |


