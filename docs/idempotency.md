# Idempotency Strategy

Reliable queue-based systems must treat duplicate delivery as a normal operating condition.

## Why It Matters

Duplicates can come from:

- webhook retries from upstream providers
- worker restarts before ack completion
- manual replay of failed events

Without idempotency, duplicates create repeated outbound messages and inconsistent workflow state.

## Key Design

Use deterministic idempotency keys at ingress and enforce transition guards in workers.

Example key format:

```txt
{platform}:{eventId}
```

Example state transition guard:

```txt
queued -> processing -> delivered
```

A transition is accepted only if it moves state forward. Replays that attempt an already-applied transition are treated as no-op.

## Scope Boundaries

Idempotency is enforced at:

1. webhook ingest (dedupe before enqueue)
2. worker execution (side-effect checkpoints)
3. outbound delivery write path (prevent duplicate sends)

## Example Flow

```mermaid
flowchart LR
A[Incoming Webhook] --> B[Derive Idempotency Key]
B --> C{Key Exists?}
C -->|Yes| D[Return Accepted No-op]
C -->|No| E[Enqueue Job + Record Key]
E --> F[Worker Executes with Transition Guard]
```

## Operational Notes

- idempotency keys should have a bounded retention window
- dedupe hit rate should be tracked as an operational signal
- false positives (bad key design) are as harmful as false negatives
