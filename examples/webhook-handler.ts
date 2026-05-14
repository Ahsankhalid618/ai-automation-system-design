type WebhookPayload = {
  platform: "instagram" | "whatsapp" | "custom";
  eventId: string;
  conversationId: string;
  message: string;
  receivedAt: string;
};

type ConversationJob = {
  jobId: string;
  idempotencyKey: string;
  conversationId: string;
  message: string;
  attempt: number;
  enqueuedAt: string;
};

type QueueClient = {
  enqueue: (job: ConversationJob) => Promise<void>;
};

type IdempotencyStore = {
  has: (key: string) => Promise<boolean>;
  set: (key: string, ttlSeconds: number) => Promise<void>;
};

const inMemoryIdempotency = new Set<string>();
const idempotencyStore: IdempotencyStore = {
  async has(key) {
    return inMemoryIdempotency.has(key);
  },
  async set(key) {
    inMemoryIdempotency.add(key);
  },
};

const queueClient: QueueClient = {
  async enqueue(job) {
    console.log("queued conversation job", job);
  },
};

function validatePayload(payload: WebhookPayload): void {
  if (!payload.eventId || !payload.conversationId || !payload.message) {
    throw new Error("Invalid webhook payload");
  }
}

function idempotencyKeyFor(payload: WebhookPayload): string {
  return `${payload.platform}:${payload.eventId}`;
}

export async function handleWebhook(payload: WebhookPayload) {
  validatePayload(payload);

  const idempotencyKey = idempotencyKeyFor(payload);
  const seen = await idempotencyStore.has(idempotencyKey);

  if (seen) {
    return {
      success: true,
      queued: false,
      duplicate: true,
      idempotencyKey,
    };
  }

  await idempotencyStore.set(idempotencyKey, 60 * 60 * 24);

  const job: ConversationJob = {
    jobId: `${payload.conversationId}:${payload.eventId}`,
    idempotencyKey,
    conversationId: payload.conversationId,
    message: payload.message,
    attempt: 0,
    enqueuedAt: new Date().toISOString(),
  };

  await queueClient.enqueue(job);

  return {
    success: true,
    queued: true,
    duplicate: false,
    idempotencyKey,
  };
}