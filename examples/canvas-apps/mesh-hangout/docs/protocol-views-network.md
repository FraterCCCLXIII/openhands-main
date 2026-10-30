# MESH spec v1.1: view, network and application layers

> Source: https://github.com/FraterCCCLXIII/mesh-protocol/blob/main/specs/MESH_PROTOCOL_v1.1.md (lines 790-968). Imported verbatim from the MESH protocol repository (CC0 1.0). Text is unedited; other sections of the source are omitted for length. The MESH repository itself is the authority; this is a copy.

## 9. Layer 6: View Layer

### 9.1 Overview

The View Layer provides deterministic feed computation with **explicit execution limits and cost controls**.

### 9.2 Execution Limits ← **NEW SECTION**

Views can be computationally expensive. Relays MUST enforce limits:

```typescript
interface ViewExecutionLimits {
  // Time limits
  max_execution_time_ms: number;     // e.g., 5000ms
  
  // Resource limits
  max_events_scanned: number;        // e.g., 100,000
  max_memory_mb: number;             // e.g., 100MB
  max_result_size: number;           // e.g., 1,000 events
  
  // Complexity limits
  max_sources: number;               // e.g., 100
  max_filters: number;               // e.g., 20
  max_attestation_lookups: number;   // e.g., 10,000
  
  // Rate limits
  executions_per_minute: number;     // e.g., 60
  executions_per_hour: number;       // e.g., 1,000
}

const DEFAULT_LIMITS: ViewExecutionLimits = {
  max_execution_time_ms: 5000,
  max_events_scanned: 100000,
  max_memory_mb: 100,
  max_result_size: 1000,
  max_sources: 100,
  max_filters: 20,
  max_attestation_lookups: 10000,
  executions_per_minute: 60,
  executions_per_hour: 1000,
};
```

### 9.3 View Cost Model ← **NEW SECTION**

Views have an estimated cost for planning:

```python
def estimate_view_cost(view_def: ViewDefinition) -> ViewCost:
    """Estimate computational cost of a view."""
    
    cost = ViewCost()
    
    # Source costs
    for source in view_def.sources:
        if source.kind == "actor":
            cost.events_to_scan += estimate_actor_events(source.actor_id)
        elif source.kind == "follows":
            following = len(get_following(source.actor_id))
            cost.events_to_scan += following * AVG_EVENTS_PER_USER
        elif source.kind == "all":
            cost.events_to_scan += TOTAL_EVENTS  # Very expensive!
    
    # Filter costs
    for filt in view_def.filters:
        if filt.require_attestations:
            cost.attestation_lookups += cost.events_to_scan
        if filt.exclude_attestations:
            cost.attestation_lookups += cost.events_to_scan
    
    # Reducer costs
    if view_def.reducer == "ranked":
        cost.complexity_multiplier = 2.0  # Scoring is expensive
    elif view_def.reducer == "custom":
        cost.complexity_multiplier = 5.0  # Unknown cost
    
    cost.total = (
        cost.events_to_scan * 0.001 +
        cost.attestation_lookups * 0.01
    ) * cost.complexity_multiplier
    
    return cost
```

### 9.4 View Execution Sandbox ← **NEW SECTION**

Custom reducers run in a sandbox:

```typescript
interface ViewSandbox {
  // Allowed operations
  allowed_operations: [
    "read_events",
    "read_attestations", 
    "sort",
    "filter",
    "aggregate",
  ];
  
  // Forbidden operations
  forbidden: [
    "network_access",
    "file_system",
    "exec",
    "eval",
  ];
  
  // Resource quotas
  max_cpu_ms: number;
  max_memory_bytes: number;
  max_iterations: number;
}
```

For WebAssembly-based custom reducers:

```python
def execute_custom_reducer(wasm_module: bytes, events: list, params: dict) -> list:
    """Execute custom reducer in WASM sandbox."""
    
    sandbox = WasmSandbox(
        memory_limit=100 * 1024 * 1024,  # 100MB
        fuel_limit=1_000_000,             # Instruction limit
        timeout_ms=5000,
    )
    
    try:
        result = sandbox.execute(wasm_module, {
            "events": events,
            "params": params,
        })
        return result
    except SandboxTimeout:
        raise ViewExecutionError("Custom reducer timed out")
    except SandboxMemoryExceeded:
        raise ViewExecutionError("Custom reducer exceeded memory limit")
```

### 9.5 View Abuse Prevention ← **NEW SECTION**

Preventing view-based DoS:

```python
def check_view_abuse(user_id: str, view_def: ViewDefinition) -> bool:
    """Check for view abuse patterns."""
    
    cost = estimate_view_cost(view_def)
    
    # Reject obviously expensive views
    if cost.total > MAX_VIEW_COST:
        raise ViewTooExpensive(f"View cost {cost.total} exceeds limit {MAX_VIEW_COST}")
    
    # Rate limit expensive views
    recent_expensive = count_expensive_views(user_id, since=minutes_ago(10))
    if recent_expensive > 10:
        raise RateLimited("Too many expensive views")
    
    # Track cumulative cost
    cumulative_cost = get_cumulative_cost(user_id, since=hours_ago(1))
    if cumulative_cost + cost.total > HOURLY_COST_LIMIT:
        raise CostLimitExceeded("Hourly view cost limit exceeded")
    
    return True
```

---

## 10. Layer 7: Network Layer

*[Same as v1.0 - see original spec]*

---

## 11. Layer 8: Application Layer

*[Same as v1.0 - see original spec]*

---


