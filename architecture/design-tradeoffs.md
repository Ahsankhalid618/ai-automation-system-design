# Design Trade-offs

This architecture favors operational safety and recoverability over minimum-latency synchronous execution.

## 1) Fast ACK + Async Execution vs In-Request Processing

**Decision:** acknowledge webhook traffic quickly and defer heavy work.

**Why:** upstream systems use strict timeout windows and retry at-least-once.

**Cost:** adds eventual consistency and queue latency.

**Mitigation:** track queue age SLOs, prioritize user-facing lanes, and expose backlog state in ops dashboards.

## 2) Idempotent Checkpoints vs Simpler Stateless Handlers

**Decision:** persist idempotency keys and transition checkpoints at side-effect boundaries.

**Why:** worker crashes and replayed jobs are normal in distributed systems.

**Cost:** more persistence operations and key lifecycle management.

**Mitigation:** use bounded retention windows and compact key schemas tied to semantic events.

## 3) Bounded Retry Budgets vs Aggressive Persistence

**Decision:** classify failures and enforce finite retries with jitter.

**Why:** unbounded retries amplify outages and hide poison jobs.

**Cost:** some jobs fail earlier and require operator intervention.

**Mitigation:** separate retryable/non-retryable/ambiguous outcomes, and maintain dead-letter triage tooling.

## 4) Queue Lane Isolation vs Operational Simplicity

**Decision:** split workload classes into separate queues and worker pools.

**Why:** isolates failure domains and protects high-priority lanes.

**Cost:** higher configuration and operational complexity.

**Mitigation:** keep lane taxonomy small and map each lane to clear SLOs and ownership.

## 5) Provider Abstraction vs Direct Provider Feature Access

**Decision:** enforce a normalized provider contract.

**Why:** supports fallback, portability, and consistent safety validation.

**Cost:** abstraction overhead and slower adoption of provider-specific features.

**Mitigation:** preserve extension hooks while keeping core execution contract stable.

## 6) Strict Concurrency Caps vs Peak Throughput

**Decision:** cap concurrency per worker group and provider boundary.

**Why:** limits blast radius, protects downstream systems, and controls spend.

**Cost:** intentional throttling during surges.

**Mitigation:** horizontal worker scaling, queue prioritization, and dynamic throttle tuning.

## 7) Estimated Runtime Cost Guardrails vs Invoice-Lagged Truth

**Decision:** use estimated per-lane spend for realtime controls; use delayed billing imports for reconciliation.

**Why:** invoice truth arrives too late for runtime protection.

**Cost:** estimated and billed values diverge in short windows.

**Mitigation:** surface both values and track deltas as normal operational signals.
