<p align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=260&color=0:020617,25:0F172A,50:1E1B4B,75:312E81,100:06B6D4&text=AI%20Automation%20System%20Design&fontSize=42&fontColor=ffffff&fontAlignY=38&animation=fadeIn&desc=Queue-Driven%20AI%20Infrastructure%20%7C%20Distributed%20Systems%20%7C%20Reliability%20Patterns&descAlignY=58&descSize=18"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-Showcase-06B6D4?style=for-the-badge&logo=icloud&logoColor=white"/>
  <img src="https://img.shields.io/badge/Distributed-Systems-8B5CF6?style=for-the-badge&logo=matrix&logoColor=white"/>
  <img src="https://img.shields.io/badge/Queue-Driven-EA580C?style=for-the-badge&logo=apachekafka&logoColor=white"/>
  <img src="https://img.shields.io/badge/AI-Orchestration-2563EB?style=for-the-badge&logo=openai&logoColor=white"/>
</p>

<p align="center">
  Production-inspired architecture showcase for scalable AI-native automation systems.
</p>

---

# 🧠 Overview

This repository demonstrates how to design reliable AI-enabled backend workflows with:

- webhook ingestion and normalization
- idempotent queue processing
- retry-safe worker orchestration
- provider-agnostic AI execution
- operational observability and failure handling

The focus is architecture and systems thinking, not a full application build. All patterns are generalized and NDA-safe.

## Production System Context

The patterns in this repository are inspired by real AI automation operations, including public product context from [AutoSetter](https://www.autosetter.ai), and generalized for public use.

Strictly excluded:

- internal prompts and private workflow logic
- customer data and business-sensitive automation rules
- internal APIs, credentials, or secret topology details

<p align="center">
  <img src="https://skillicons.dev/icons?i=ts,nodejs,postgres,redis,docker,nextjs" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/BullMQ-Queue%20Infrastructure-f97316?style=flat-square"/>
  <img src="https://img.shields.io/badge/OpenAI%20%7C%20Gemini-Provider%20Orchestration-111827?style=flat-square"/>
  <img src="https://img.shields.io/badge/Fly.io-Distributed%20Deployment-8B5CF6?style=flat-square"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Retry--Safe-Workflows-0EA5E9?style=flat-square"/>
  <img src="https://img.shields.io/badge/Idempotent-Processing-14B8A6?style=flat-square"/>
  <img src="https://img.shields.io/badge/Dead--Letter-Queues-7C3AED?style=flat-square"/>
  <img src="https://img.shields.io/badge/Operational-Observability-2563EB?style=flat-square"/>
  <img src="https://img.shields.io/badge/Provider-Agnostic%20AI-1D4ED8?style=flat-square"/>
</p>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2"/>

# ⚡ Quick Navigation

- [Product UI Snapshots](#product-ui-snapshots-nda-safe)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Real-World Execution Detail](#real-world-execution-detail-generalized)
- [Operational Constraints](#operational-constraints)
- [Design Trade-offs](#design-trade-offs)
- [Reliability and Failure Handling](#reliability-and-failure-handling)
- [Implementation Examples](#implementation-examples)
- [Repository Structure](#repository-structure)
- [Stack](#stack)

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2"/>

# 📸 Product UI Snapshots (NDA-Safe)

These screenshots provide product context for the architecture patterns demonstrated in this repository.

All examples are intentionally sanitized and blurred to avoid exposing:

- customer information
- operational metrics
- internal credentials
- proprietary business logic

## 🖥️ Operational Dashboard Preview

<p align="center">
  <img width="100%" src="./assets/images/Autosetter-Dashboard.png"/>
</p>

<p align="center">
  <i>
    Operational control center for AI workflow orchestration, runtime visibility, queue monitoring, infrastructure governance, and alerting systems.
  </i>
</p>

---

## 📦 Queue and Runtime Monitoring

<p align="center">
  <img width="100%" src="./assets/images/Jobs-queue-processing.png"/>
</p>

<p align="center">
  <i>
    Queue orchestration and runtime diagnostics interface for monitoring worker execution, retries, failures, queue health, and operational visibility.
  </i>
</p>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2"/>

# 🏗️ Architecture at a Glance

Core workflow:

1. Ingest webhook events and acknowledge quickly.
2. Validate and deduplicate with idempotency keys.
3. Persist durable ingest intent and enqueue normalized jobs.
4. Process workloads with bounded worker concurrency.
5. Route through AI orchestration and provider adapters.
6. Validate responses and enforce delivery guardrails.
7. Persist state transitions and emit structured telemetry.

```mermaid
flowchart TD
  A[External Webhooks] --> B[Ingress API]
  B --> C[Validation and Idempotency Check]
  C --> D[Durable Ingest Record]
  D --> E[Queue Router]
  E --> F[Worker Pool]
  F --> G[AI Runtime Coordinator]
  G --> H[Provider Call]
  H --> I[Response Validation]
  I --> J[Delivery and Persistence]
  F --> K[Metrics and Logs]
```

## 📊 Detailed Architecture Diagrams

- [System Architecture](./diagrams/system-architecture.md)
- [Queue Processing Flow](./diagrams/queue-processing.md)
- [AI Orchestration Flow](./diagrams/ai-orchestration.md)
- [Database Relationships](./diagrams/database-design.md)

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2"/>

# 🔍 Real-World Execution Detail (Generalized)

Representative operational signals for real automation backends:

- ingress acknowledgement latency and duplicate webhook hit rate
- queue depth and oldest-job age by lane (`reply`, `scheduler`, `recovery`)
- worker claim saturation and retry pressure by error class
- delivery outcomes split by `delivered`, `deferred`, `failed`, `dead_lettered`
- provider health split by throttling (`429`), timeout, and transient transport faults
- acceptance-unknown paths that trigger recovery checks instead of blind resend
- estimated runtime spend by lane with delayed billing reconciliation as separate truth

Operational patterns reflected throughout this repo:

- bounded retries with exponential backoff and jitter
- explicit non-retryable classification for poison jobs
- side-effect checkpoints at worker execution boundaries
- dead-letter isolation with triage-friendly reason taxonomy
- runtime state revalidation before outbound actions

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2"/>

# ⚙️ Operational Constraints

This architecture assumes realistic production constraints:

- at-least-once webhook delivery
- duplicate event retries
- provider/API rate limits
- variable AI latency
- transient infrastructure failures
- worker crashes and restarts
- bounded queue throughput

## 🎯 Design Priorities

- fast ingress acknowledgement
- retry-safe execution
- idempotent state transitions
- dead-letter queue isolation
- explicit failure categorization
- observability-first operations

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2"/>

# ⚖️ Design Trade-offs

See [architecture/design-tradeoffs.md](./architecture/design-tradeoffs.md).

### Key Trade-offs

| Trade-off | Benefit | Cost |
|---|---|---|
| Queue-driven processing | Reliability and isolation | Higher latency |
| Provider abstraction | Multi-provider flexibility | Integration complexity |
| Conservative retry caps | Controlled infrastructure spend | Reduced retry persistence |
| Strict validation | Fewer downstream failures | Increased processing overhead |

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2"/>

# 🛡️ Reliability and Failure Handling

## 🧷 Included Reliability Patterns

- [Idempotency Strategy](./docs/idempotency.md)
- [Rate Limiting Strategy](./docs/rate-limiting.md)
- [Failure Modes and Mitigations](./docs/failure-modes.md)

### Reliability Focus Areas

- retry-safe workflows
- dead-letter queue handling
- bounded retries
- queue isolation
- operational resilience
- provider fallback handling
- structured error categorization

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2"/>

# 🧩 Implementation Examples

Minimal production-inspired examples focused on architecture realism:

| Example | Purpose |
|---|---|
| [Webhook Handler](./examples/webhook-handler.ts) | Validation, dedupe, durable ingest intent, queue publishing |
| [Queue Worker](./examples/queue-worker.ts) | Worker execution lifecycle, retry classification, acceptance-unknown handling |
| [Retry Strategy](./examples/retry-strategy.ts) | Exponential backoff, retry budgets, jitter, retryability policy |

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2"/>

# 📂 Repository Structure

```txt
architecture/
+-- system-overview.md
+-- queue-processing.md
+-- ai-orchestration.md
+-- observability.md
+-- design-tradeoffs.md

docs/
+-- idempotency.md
+-- rate-limiting.md
+-- failure-modes.md

examples/
+-- webhook-handler.ts
+-- queue-worker.ts
+-- retry-strategy.ts

diagrams/
+-- system-architecture.md
+-- queue-processing.md
+-- ai-orchestration.md
+-- database-design.md
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2"/>

# 🚀 Stack

### Backend & Infrastructure

- TypeScript
- Node.js
- PostgreSQL
- Redis
- BullMQ

### AI & Orchestration

- OpenAI
- Gemini
- Provider-agnostic orchestration patterns

### Deployment & Observability

- Fly.io
- Structured logging
- Metrics pipelines
- Queue observability

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2"/>

# 👀 How to Review This Repo Quickly

For recruiters, founders, or interviewers:

1. Read the overview and operational constraints.
2. Review architecture diagrams and queue flows.
3. Review design trade-offs and reliability docs.
4. Explore implementation examples.
5. Evaluate systems thinking and operational maturity.

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2"/>

<p align="center">
  Built with a systems-first mindset focused on scalability, reliability, and operational resilience.
</p>

# 📜 License

MIT


