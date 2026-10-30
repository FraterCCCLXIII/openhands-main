# MESH spec v1.1: sync protocol and security model

> Source: https://github.com/FraterCCCLXIII/mesh-protocol/blob/main/specs/MESH_PROTOCOL_v1.1.md (lines 1394-1488). Imported verbatim from the MESH protocol repository (CC0 1.0). Text is unedited; other sections of the source are omitted for length. The MESH repository itself is the authority; this is a copy.

## 15. Sync Protocol

### 15.1 Overview

MESH uses **DAG-based sync** that handles multi-device naturally.

### 15.2 Sync Algorithm (Updated for DAG)

```python
async def sync_actor(actor_id: str, relay: Relay):
    # 1. Get local heads (may be multiple)
    local_heads = storage.get_heads(actor_id)
    local_head_ids = {h.id for h in local_heads}
    
    # 2. Get remote heads
    remote_heads = await relay.get_heads(actor_id)
    remote_head_ids = {h.id for h in remote_heads}
    
    # 3. If same heads, in sync
    if local_head_ids == remote_head_ids:
        return
    
    # 4. Find missing events
    local_known = storage.get_all_event_ids(actor_id)
    remote_known = await relay.get_all_event_ids(actor_id)
    
    missing_local = remote_known - local_known
    missing_remote = local_known - remote_known
    
    # 5. Fetch missing events
    if missing_local:
        events = await relay.get_events(actor_id, event_ids=missing_local)
        for event in topological_sort(events):
            if verify_event(event):
                storage.store_event(event)
    
    # 6. Push events remote doesn't have
    if missing_remote:
        events = storage.get_events(actor_id, event_ids=missing_remote)
        await relay.submit_events(events)
    
    # 7. Merge if needed
    new_heads = storage.get_heads(actor_id)
    if len(new_heads) > 1:
        merge = auto_merge(new_heads)
        storage.store_event(merge)
        await relay.submit(merge)
```

---

## 16. Security Model

### 16.1 Updated Threat Model

**In Scope:**
- Impersonation (prevented by signatures)
- Tampering (prevented by signatures + DAG)
- Replay attacks (prevented by content-addressing)
- Eavesdropping on DMs (prevented by E2EE)
- **Key compromise on single device** (limited by device keys) ← **NEW**
- **Malicious fork attacks** (detected and rate-limited) ← **NEW**

**Out of Scope:**
- Root key compromise (total identity loss)
- Denial of service (relay responsibility)
- Spam (addressed by moderation layer)
- Sybil attacks (partially addressed by attestations)

### 16.2 Device Key Compromise Response

If a device is compromised:

```python
async def handle_device_compromise(root_key: SigningKeyPair, compromised_device_id: str):
    # 1. Revoke compromised device
    revocation = DeviceKeyRevocation(
        device_id=compromised_device_id,
        revoked_at=now(),
        reason="compromised",
    )
    revocation.sig = root_key.sign(...)
    await relay.publish_revocation(revocation)
    
    # 2. Events from compromised device after revocation are invalid
    # Clients MUST check revocation status when verifying
    
    # 3. Optionally: mark suspicious events
    suspicious = get_events_by_device(compromised_device_id, since=suspected_compromise_time)
    for event in suspicious:
        await mark_as_suspicious(event)
```

---


