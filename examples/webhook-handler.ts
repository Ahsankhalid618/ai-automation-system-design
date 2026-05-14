type WebhookPayload = {
  source: "instagram" | "whatsapp" | "custom";
  eventId: string;
  conversationId: string;
  leadId: string;
  message: string;
  receivedAt: string;
};

type IngestRecord = {
  idempotencyKey: string;
  source: WebhookPayload["source"];
  eventId: string;
  conversationId: string;
  leadId: string;
  status: "accepted" | "duplicate";
  receivedAt: string;
};

type ConversationJob = {
  jobId: string;
  idempotencyKey: string;
  conversationId: string;
  leadId: string;
  attempt: number;
  enqueuedAt: string;
};

type IngestStore = {
  hasProcessedKey: (key: string) => Promise<boolean>;
  saveIngestRecord: (record: IngestRecord) => Promise<void>;
};

type QueueClient = {
  enqueueConversationJob: (job: ConversationJob) => Promise<void>;
};

const processed = new Set<string>();
const ingestStore: IngestStore = {
  async hasProcessedKey(key) {
    return processed.has(key);
  },
  async saveIngestRecord(record) {
    if (record.status === "accepted") {
      processed.add(record.idempotencyKey);
    }
    console.info("ingest_record", record);
  },
};

const queueClient: QueueClient = {
  async enqueueConversationJob(job) {
    console.info("queue_publish", {
      queue: "conversation",
      jobId: job.jobId,
      idempotencyKey: job.idempotencyKey,
    });
  },
};

function validatePayload(payload: WebhookPayload): void {
  if (!payload.eventId || !payload.conversationId || !payload.leadId || !payload.message) {
    throw new Error("invalid_webhook_payload");
  }
}

function deriveIdempotencyKey(payload: WebhookPayload): string {
  return `${payload.source}:${payload.eventId}`;
}

export async function handleWebhook(payload: WebhookPayload) {
  validatePayload(payload);

  const idempotencyKey = deriveIdempotencyKey(payload);
  const duplicate = await ingestStore.hasProcessedKey(idempotencyKey);

  const ingestRecord: IngestRecord = {
    idempotencyKey,
    source: payload.source,
    eventId: payload.eventId,
    conversationId: payload.conversationId,
    leadId: payload.leadId,
    status: duplicate ? "duplicate" : "accepted",
    receivedAt: payload.receivedAt,
  };

  await ingestStore.saveIngestRecord(ingestRecord);

  if (duplicate) {
    return {
      success: true,
      ack: true,
      duplicate: true,
      idempotencyKey,
    };
  }

  const job: ConversationJob = {
    jobId: `${payload.conversationId}:${payload.eventId}`,
    idempotencyKey,
    conversationId: payload.conversationId,
    leadId: payload.leadId,
    attempt: 0,
    enqueuedAt: new Date().toISOString(),
  };

  await queueClient.enqueueConversationJob(job);

  return {
    success: true,
    ack: true,
    duplicate: false,
    queued: true,
    idempotencyKey,
  };
}
