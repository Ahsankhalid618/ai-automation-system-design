# 🏗️ System Architecture Diagram

```mermaid
flowchart TD

subgraph External Systems
A[Instagram / External APIs]
B[Webhook Events]
end

subgraph Ingestion Layer
C[Ingress API]
D[Validation Layer]
E[Deduplication]
end

subgraph Queue Infrastructure
F[BullMQ Queue]
G[Redis]
R[Dead Letter Queue]
end

subgraph Worker System
H[Conversation Workers]
I[Retry Workers]
J[Scheduler Workers]
S[Concurrency Controls]
end

subgraph AI Layer
K[AI Orchestrator]
L[Prompt Builder]
M[Provider Routing]
N[OpenAI / Gemini]
T[Provider Rate Limit Guard]
end

subgraph Persistence
O[(PostgreSQL)]
end

subgraph Observability
P[Structured Logs]
Q[Metrics & Monitoring]
end

A --> B
B --> C
C --> D
D --> E
E --> F

F --> H
F --> I
F --> J
F --> S

H --> K
K --> L
L --> M
M --> T
T --> N

H --> O
K --> O

H --> P
P --> Q

I --> R
```
