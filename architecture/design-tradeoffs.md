# Design Trade-offs

This repository favors reliability-oriented architecture decisions over low-latency synchronous flows.

## 1) Async Queue Processing vs Sync Request Handling

**Decision:** Webhook ingress acknowledges quickly and defers heavy work to queues.

**Why:** External webhook providers often enforce strict timeout windows. Queue decoupling improves reliability under bursts.

**Trade-off:** Added processing latency and eventual consistency.

**Mitigation:** Keep queue latency visible (depth + age metrics) and prioritize time-sensitive job classes.

## 2) Idempotent State Transitions vs Simpler Handlers

**Decision:** Every externally-triggered workflow uses a deterministic idempotency key.

**Why:** At-least-once delivery semantics mean duplicates are normal, not exceptional.

**Trade-off:** Additional persistence checks and key lifecycle handling.

**Mitigation:** Use bounded idempotency windows and compact key schemas (e.g., `platform:eventId`).

## 3) Retry Safety vs Throughput

**Decision:** Retries are bounded with backoff + jitter; non-retriable failures go directly to dead-letter.

**Why:** Unbounded retries can amplify outages and hide true failure modes.

**Trade-off:** Some jobs fail earlier instead of eventually succeeding after many attempts.

**Mitigation:** Separate transient vs permanent errors and alert on dead-letter growth.

## 4) Provider Abstraction vs Integration Simplicity

**Decision:** AI orchestration is provider-agnostic with validation boundaries.

**Why:** Allows fallback and controlled migration across providers.

**Trade-off:** More integration surface and normalization work.

**Mitigation:** Keep common contract small (prompt input, output schema, error model).

## 5) Concurrency Limits vs Maximum Throughput

**Decision:** Workers run with explicit concurrency caps and queue-level throttles.

**Why:** Protects downstream APIs, controls memory pressure, and reduces blast radius.

**Trade-off:** Throughput is intentionally bounded during peak load.

**Mitigation:** Scale worker replicas horizontally and tune concurrency by job type.
