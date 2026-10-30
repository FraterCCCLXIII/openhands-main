# MESH spec v1.1: social and moderation layers

> Source: https://github.com/FraterCCCLXIII/mesh-protocol/blob/main/specs/MESH_PROTOCOL_v1.1.md (lines 489-789). Imported verbatim from the MESH protocol repository (CC0 1.0). Text is unedited; other sections of the source are omitted for length. The MESH repository itself is the authority; this is a copy.

## 7. Layer 4: Social Layer

*[Same as v1.0 - see original spec]*

---

## 8. Layer 5: Moderation Layer

### 8.1 Overview

The Moderation Layer provides attestation-based moderation with **explicit conflict resolution and spam prevention**.

### 8.2 Core Principle

**Attestations NEVER modify facts.** They are separate claims that compose on top of the truth layer.

### 8.3 Attestation (Same as v1.0)

```typescript
interface Attestation {
  id: string;
  issuer: string;
  subject: string;
  type: "trust" | "label" | "badge" | "block" | "verify" | "flag";
  claim: object;
  evidence?: object;
  ts: timestamp;
  expires_at?: timestamp;
  revoked: boolean;
  sig: bytes;
}
```

### 8.4 Conflicting Attestations ← **NEW SECTION**

When attestations conflict, clients MUST resolve them:

```typescript
interface AttestationConflict {
  subject: string;
  attestations: Attestation[];
  conflict_type: "contradictory" | "severity_mismatch" | "trust_conflict";
}
```

**Resolution Strategies:**

#### 1. Trust-Weighted Resolution

```python
def resolve_by_trust(conflicts: list[Attestation], trust_network: TrustNetwork) -> Attestation:
    """Resolve conflict by trust weight."""
    
    def trust_score(att: Attestation) -> float:
        if att.issuer in trust_network.direct_trust:
            return trust_network.direct_trust[att.issuer]  # 0.0 - 1.0
        
        # Transitive trust (discounted)
        for trusted in trust_network.trusted_issuers:
            if att.issuer in get_trusted_by(trusted):
                return trust_network.direct_trust[trusted] * 0.5
        
        return 0.0
    
    # Highest trust wins
    return max(conflicts, key=trust_score)
```

#### 2. Recency Resolution

```python
def resolve_by_recency(conflicts: list[Attestation]) -> Attestation:
    """Most recent attestation wins."""
    return max(conflicts, key=lambda a: a.ts)
```

#### 3. Severity Resolution

```python
def resolve_by_severity(conflicts: list[Attestation]) -> Attestation:
    """Most severe attestation wins (safety-first)."""
    severity_order = {"block": 3, "flag": 2, "label": 1, "trust": 0}
    return max(conflicts, key=lambda a: severity_order.get(a.type, 0))
```

#### 4. Configurable Resolution

Users configure their preferred resolution:

```typescript
interface ModerationConfig {
  conflict_resolution: "trust_weighted" | "recency" | "severity" | "manual";
  
  // Trust weights
  trust_weights: {
    [issuer: string]: number;  // 0.0 - 1.0
  };
  
  // Auto-apply rules
  auto_block_threshold: number;     // e.g., 3 trusted issuers = auto-block
  auto_hide_threshold: number;      // e.g., 2 trusted flags = auto-hide
  
  // Manual review queue
  require_manual_review: string[];  // Attestation types requiring manual review
}
```

### 8.5 Spam Attestation Prevention ← **NEW SECTION**

Attestations themselves can be spammed. Prevention mechanisms:

#### 1. Rate Limiting

```python
ATTESTATION_LIMITS = {
    "per_issuer_per_hour": 100,
    "per_subject_per_hour": 50,
    "per_issuer_per_day": 1000,
}

def check_attestation_rate_limit(att: Attestation) -> bool:
    recent_by_issuer = count_attestations(issuer=att.issuer, since=hours_ago(1))
    if recent_by_issuer > ATTESTATION_LIMITS["per_issuer_per_hour"]:
        return False
    
    recent_on_subject = count_attestations(subject=att.subject, since=hours_ago(1))
    if recent_on_subject > ATTESTATION_LIMITS["per_subject_per_hour"]:
        return False
    
    return True
```

#### 2. Stake/Reputation Requirements

```python
def can_issue_attestation(issuer: str, att_type: str) -> bool:
    issuer_reputation = get_reputation(issuer)
    
    # Higher-impact attestations require more reputation
    required_reputation = {
        "label": 10,
        "flag": 50,
        "block": 100,
        "verify": 200,
    }
    
    return issuer_reputation >= required_reputation.get(att_type, 0)
```

#### 3. Attestation Challenges

```python
def challenge_attestation(att: Attestation, challenger: str, reason: str):
    """Allow challenging questionable attestations."""
    challenge = AttestationChallenge(
        attestation_id=att.id,
        challenger=challenger,
        reason=reason,
        ts=now(),
    )
    
    # If enough challenges, attestation is flagged for review
    challenges = get_challenges(att.id)
    if len(challenges) >= 3:
        flag_for_review(att)
```

### 8.6 Trust Bootstrapping ← **NEW SECTION**

New users need a way to bootstrap trust:

#### 1. Well-Known Trust Anchors

```python
WELL_KNOWN_ANCHORS = [
    "ent:mesh_foundation",      # Protocol foundation
    "ent:community_council",    # Elected moderators
    "ent:verified_orgs",        # Verified organizations
]

def default_trust_network() -> TrustNetwork:
    """Starting trust network for new users."""
    return TrustNetwork(
        trusted_issuers=WELL_KNOWN_ANCHORS,
        trust_depth=1,
        attestation_types=["label", "block", "flag"],
    )
```

#### 2. Social Trust Import

```python
def import_trust_from_follows(user_id: str) -> TrustNetwork:
    """Build trust network from who user follows."""
    following = get_following(user_id)
    
    # People you follow have base trust
    trust_weights = {f: 0.3 for f in following}
    
    # Mutual follows have higher trust
    followers = get_followers(user_id)
    for f in following:
        if f in followers:
            trust_weights[f] = 0.6
    
    return TrustNetwork(
        trusted_issuers=list(trust_weights.keys()),
        trust_weights=trust_weights,
    )
```

#### 3. Trust Discovery

```python
def discover_trusted_labelers(user_id: str) -> list[str]:
    """Find well-regarded labelers in user's network."""
    
    # Get who user's trusted contacts trust
    my_trusted = get_trust_network(user_id).trusted_issuers
    
    candidates = {}
    for trusted in my_trusted:
        their_trusted = get_trust_network(trusted).trusted_issuers
        for candidate in their_trusted:
            if candidate not in my_trusted:
                candidates[candidate] = candidates.get(candidate, 0) + 1
    
    # Sort by how many trusted contacts trust them
    return sorted(candidates.keys(), key=lambda c: candidates[c], reverse=True)[:10]
```

### 8.7 Moderation Policy Framework ← **NEW SECTION**

MESH doesn't define policies, but provides a framework for them:

```typescript
interface ModerationPolicy {
  id: string;
  name: string;                    // "Family Friendly", "Free Speech", etc.
  description: string;
  
  // What this policy considers violations
  violation_definitions: {
    [violation_type: string]: {
      description: string;
      severity: "low" | "medium" | "high" | "critical";
      auto_action?: "hide" | "warn" | "block";
    };
  };
  
  // Who enforces this policy
  enforcers: string[];             // entity_ids of authorized labelers
  
  // Appeals process
  appeals_contact?: string;
  appeals_process?: string;
}
```

**Example Policies:**

```json
{
  "id": "policy:mesh-default",
  "name": "MESH Default Policy",
  "violation_definitions": {
    "spam": {"severity": "medium", "auto_action": "hide"},
    "harassment": {"severity": "high", "auto_action": "warn"},
    "illegal_content": {"severity": "critical", "auto_action": "block"},
    "impersonation": {"severity": "high", "auto_action": "warn"}
  },
  "enforcers": ["ent:mesh_foundation", "ent:community_council"]
}
```

Users choose which policies to adopt:

```python
def apply_policies(content: Content, policies: list[str]) -> ModerationResult:
    """Apply selected moderation policies to content."""
    
    results = []
    for policy_id in policies:
        policy = get_policy(policy_id)
        attestations = get_attestations_from(policy.enforcers, subject=content.id)
        
        for att in attestations:
            if att.claim.get("violation_type") in policy.violation_definitions:
                violation = policy.violation_definitions[att.claim["violation_type"]]
                results.append(ModerationAction(
                    policy=policy_id,
                    violation=att.claim["violation_type"],
                    severity=violation["severity"],
                    action=violation.get("auto_action"),
                ))
    
    return aggregate_results(results)
```

---


