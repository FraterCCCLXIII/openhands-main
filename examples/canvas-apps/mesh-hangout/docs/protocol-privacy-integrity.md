# MESH spec v1.1: privacy, storage and integrity layers

> Source: https://github.com/FraterCCCLXIII/mesh-protocol/blob/main/specs/MESH_PROTOCOL_v1.1.md (lines 144-488). Imported verbatim from the MESH protocol repository (CC0 1.0). Text is unedited; other sections of the source are omitted for length. The MESH repository itself is the authority; this is a copy.

## 4. Layer 1: Privacy Layer

### 4.1 Overview

The Privacy Layer provides cryptographic primitives for identity, authentication, encryption, and recovery.

### 4.2 Identity Hierarchy ← **NEW SECTION**

MESH supports a hierarchical key structure for practical multi-device use:

```
                    ┌─────────────────┐
                    │   Root Key      │
                    │   (Ed25519)     │
                    │   KEEP OFFLINE  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Device 1 │  │ Device 2 │  │ Device 3 │
        │   Key    │  │   Key    │  │   Key    │
        └──────────┘  └──────────┘  └──────────┘
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Phone    │  │ Laptop   │  │ Desktop  │
        └──────────┘  └──────────┘  └──────────┘
```

**Key Types:**

| Key Type | Purpose | Storage | Compromise Impact |
|----------|---------|---------|-------------------|
| Root Key | Identity anchor | Offline/hardware | Total identity loss |
| Device Key | Day-to-day signing | On device | Revoke that device |
| Recovery Key | Account recovery | Trusted parties | Recovery possible |

### 4.3 Root Identity

The root identity is the canonical identity:

```typescript
interface RootIdentity {
  id: string;                    // ent:sha256(root_public_key)[:32]
  root_public_key: bytes;        // Ed25519 - KEEP PRIVATE KEY OFFLINE
  device_keys: DeviceKey[];      // Authorized device keys
  recovery_config?: RecoveryConfig;
  created_at: timestamp;
  sig: bytes;                    // Signed by root key
}

interface DeviceKey {
  device_id: string;
  public_key: bytes;             // Ed25519
  name: string;                  // "iPhone", "Laptop", etc.
  authorized_at: timestamp;
  expires_at?: timestamp;
  revoked: boolean;
  capabilities: string[];        // ["post", "follow", "dm", "admin"]
  sig: bytes;                    // Signed by root key
}
```

### 4.4 Device Key Authorization

To authorize a new device:

```python
def authorize_device(root_key: SigningKeyPair, device_public_key: bytes, name: str) -> DeviceKey:
    device = DeviceKey(
        device_id=generate_device_id(device_public_key),
        public_key=device_public_key,
        name=name,
        authorized_at=now(),
        revoked=False,
        capabilities=["post", "follow", "dm"],
    )
    device.sig = root_key.sign(canonical_json(device.to_dict()))
    return device
```

### 4.5 Signature Verification (Updated)

Signatures can come from root key OR authorized device key:

```python
def verify_event_signature(event: LogEvent, identity: RootIdentity) -> bool:
    # Try root key
    if verify_signature(identity.root_public_key, event_bytes, event.sig):
        return True
    
    # Try device keys
    for device in identity.device_keys:
        if device.revoked:
            continue
        if device.expires_at and device.expires_at < now():
            continue
        if verify_signature(device.public_key, event_bytes, event.sig):
            # Check capability
            if event_requires_capability(event) in device.capabilities:
                return True
    
    return False
```

### 4.6 Key Rotation

Device keys can be rotated without changing identity:

```python
def rotate_device_key(root_key: SigningKeyPair, old_device_id: str, new_device_public_key: bytes):
    # Revoke old
    revocation = DeviceKeyRevocation(
        device_id=old_device_id,
        revoked_at=now(),
        reason="rotation",
    )
    revocation.sig = root_key.sign(...)
    
    # Authorize new
    new_device = authorize_device(root_key, new_device_public_key, "Rotated Device")
    
    return revocation, new_device
```

---

## 5. Layer 2: Storage Layer

*[Same as v1.0 - see original spec]*

---

## 6. Layer 3: Integrity Layer

### 6.1 Overview

The Integrity Layer ensures append-only semantics while supporting **multi-device usage through a DAG structure with automatic merge**.

### 6.2 Multi-Head DAG (Key Change from v1.0) ← **MAJOR UPDATE**

**Problem with strict single-chain:**
- User posts from phone
- User posts from laptop before sync
- Result: FORK → terrible UX

**Solution: Allow multiple heads with automatic merge**

```
        Event 1 (laptop)
       /
Root ─┤
       \
        Event 2 (phone)
       
        ↓ Automatic merge
       
        Event 1 (laptop)
       /                \
Root ─┤                  ├─ Merge Event
       \                /
        Event 2 (phone)
```

### 6.3 LogEvent (Updated)

```typescript
interface LogEvent {
  id: string;                    // sha256(actor:device:local_seq)[:48]
  actor: string;                 // entity_id of author
  device_id: string;             // Which device created this ← NEW
  
  // DAG structure (changed from single prev)
  parents: string[];             // Previous event IDs (1 or more) ← CHANGED
  local_seq: number;             // Per-device sequence number ← CHANGED
  
  // Lamport timestamp for ordering
  lamport: number;               // max(parent.lamport) + 1 ← NEW
  
  op: "create" | "update" | "delete";
  object_type: "entity" | "content" | "link" | "state" | "attestation" | "view";
  object_id: string;
  payload: object;
  
  ts: timestamp;                 // Wall clock (informational only)
  sig: bytes;                    // Signed by device key
}
```

### 6.4 Fork Handling Strategies ← **NEW SECTION**

MESH defines three fork handling strategies. Implementations MUST support at least one:

#### Strategy 1: Automatic Merge (Recommended)

For most content, forks merge automatically:

```python
def auto_merge(heads: list[LogEvent]) -> LogEvent:
    """Create a merge event that combines multiple heads."""
    
    # Sort by lamport timestamp for deterministic ordering
    sorted_heads = sorted(heads, key=lambda e: (e.lamport, e.id))
    
    merge_event = LogEvent(
        id=generate_merge_id(sorted_heads),
        actor=heads[0].actor,
        device_id="merge",  # Special device ID for merges
        parents=[h.id for h in sorted_heads],
        local_seq=0,
        lamport=max(h.lamport for h in sorted_heads) + 1,
        op="merge",
        object_type="merge",
        object_id="",
        payload={
            "merged_heads": [h.id for h in sorted_heads],
            "strategy": "auto",
        },
        ts=now(),
        sig=b"",  # Merges are unsigned - deterministic from parents
    )
    
    return merge_event
```

**Merge Rules by Object Type:**

| Object Type | Merge Rule |
|-------------|------------|
| Content (post) | Both posts preserved, ordered by lamport |
| Content (edit) | Last-write-wins by lamport |
| Link (follow) | Union - if either says follow, follow |
| Link (unfollow) | Last-write-wins by lamport |
| Profile update | Last-write-wins by lamport |
| Attestation | Both preserved |

#### Strategy 2: Last-Write-Wins

For state that can't merge (e.g., profile bio):

```python
def last_write_wins(heads: list[LogEvent]) -> LogEvent:
    """Select the head with highest lamport timestamp."""
    winner = max(heads, key=lambda e: (e.lamport, e.id))
    
    # Other heads are "abandoned" - still valid, but not current
    return winner
```

#### Strategy 3: User Resolution

For rare conflicts that can't auto-resolve:

```python
def request_user_resolution(heads: list[LogEvent]) -> UserResolutionRequest:
    """Present conflict to user for manual resolution."""
    return UserResolutionRequest(
        conflict_type="unresolvable_fork",
        heads=heads,
        message="Your account has conflicting changes. Please choose which to keep.",
        options=[
            {"id": h.id, "summary": summarize_event(h)} 
            for h in heads
        ],
    )
```

**When to use each:**

| Scenario | Strategy | Example |
|----------|----------|---------|
| Both devices posted | Auto merge | Both posts appear in timeline |
| Both devices edited bio | LWW | Most recent bio wins |
| Conflicting block/unblock | User resolution | "Did you mean to block Alice?" |

### 6.5 Convergence Guarantee

With automatic merge, all devices eventually converge:

```python
def sync_and_merge(local_events: list, remote_events: list) -> list:
    # Combine all events
    all_events = set(local_events + remote_events)
    
    # Find all heads (events with no children)
    children = {e.id for e in all_events for p in e.parents}
    heads = [e for e in all_events if e.id not in children]
    
    # If multiple heads, merge them
    if len(heads) > 1:
        merge = auto_merge(heads)
        all_events.add(merge)
    
    return sorted(all_events, key=lambda e: e.lamport)
```

### 6.6 Offline Support

Devices can work offline and merge later:

```
Timeline:
─────────────────────────────────────────────────────►
   │
   │  Phone goes offline
   │  ├── Post A (phone, lamport=5)
   │  ├── Post B (phone, lamport=6)
   │
   │  Laptop continues online
   │  ├── Post C (laptop, lamport=5)
   │  ├── Post D (laptop, lamport=6)
   │
   │  Phone comes online
   │  ├── Sync discovers fork
   │  ├── Auto-merge creates merge event (lamport=7)
   │  └── All 4 posts preserved, ordered by lamport
   │
```

### 6.7 Preventing Malicious Forks

While forks from honest multi-device use are normal, malicious forks are detected:

```python
def detect_malicious_fork(events: list[LogEvent]) -> bool:
    """Detect if someone is intentionally creating many forks."""
    
    # Count forks per time window
    fork_events = [e for e in events if len(e.parents) > 1]
    
    # More than 10 forks per hour is suspicious
    recent_forks = [e for e in fork_events if e.ts > now() - hours(1)]
    if len(recent_forks) > 10:
        return True
    
    # Same device creating forks is impossible (local_seq is sequential)
    # Different devices creating occasional forks is normal
    
    return False
```

---


