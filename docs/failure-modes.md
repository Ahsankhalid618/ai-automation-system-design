# Failure Modes and Mitigations

This document captures realistic failure modes in distributed AI automation systems and practical mitigations.

## 1) Duplicate Webhook Delivery

**Failure mode:** upstream source retries the same event.

**Risk:** duplicate jobs and duplicate outbound actions.

**Mitigation:**

- ingress idempotency key check
- dedupe-before-enqueue policy
- delivery checkpoint guard on outbound side effects

## 2) Worker Crash After Partial Side Effects

**Failure mode:** process exits after calling provider but before checkpoint/ack.

**Risk:** replay can send again or diverge state.

**Mitigation:**

- checkpoint before irreversible actions where possible
- claim and transition guards in worker execution
- explicit `acceptance_unknown` class for ambiguous sends

## 3) Provider Throttling and Timeouts

**Failure mode:** `429`, timeout, or intermittent 5xx from provider.

**Risk:** retry storms, queue growth, and stale responses.

**Mitigation:**

- bounded retry budgets with jitter
- provider-aware backoff policies
- lane-level throttling and fallback policy where safe

## 4) Poison Jobs / Permanent Validation Errors

**Failure mode:** malformed payload or invariant violation.

**Risk:** infinite retries and noisy operations.

**Mitigation:**

- classify non-retryable errors early
- route directly to dead-letter queue
- expose dead-letter reason codes and triage status

## 5) Queue Backlog Saturation

**Failure mode:** ingress volume exceeds sustained processing capacity.

**Risk:** high queue age and delayed user-visible actions.

**Mitigation:**

- prioritize critical queues
- apply ingress throttling/load shedding
- scale worker replicas and adjust concurrency per lane

## 6) Stale State Execution

**Failure mode:** worker runs with outdated conversation/lead assumptions.

**Risk:** invalid or unwanted automation behavior.

**Mitigation:**

- revalidate key runtime state at execution time
- use state versioning or freshness guards
- emit explicit `skipped_due_to_state_change` outcomes

## Minimum Operational Signals

- queue depth and oldest-job age by lane
- retries by error class and attempt index
- dead-letter inflow and unresolved age
- provider latency and error rate by class
- delivered/skipped/deferred/failed outcome distribution
- worker crash/restart frequency
