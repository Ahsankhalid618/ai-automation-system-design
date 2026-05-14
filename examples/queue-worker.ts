import { isRetryableError, retryWithBackoff } from "./retry-strategy";

type ConversationJob = {
  jobId: string;
  idempotencyKey: string;
  conversationId: string;
  leadId: string;
  attempt: number;
};

type JobOutcome = "delivered" | "duplicate" | "deferred_acceptance_unknown" | "dead_lettered";
type DeadLetterReason = "validation_failed" | "max_retries_exhausted";

type DeadLetterQueue = {
  send: (job: ConversationJob, reason: DeadLetterReason) => Promise<void>;
};

type DeliveryStateStore = {
  hasTransition: (transitionKey: string) => Promise<boolean>;
  markTransition: (transitionKey: string) => Promise<void>;
};

const transitionStore = new Set<string>();

const deliveryStateStore: DeliveryStateStore = {
  async hasTransition(transitionKey) {
    return transitionStore.has(transitionKey);
  },
  async markTransition(transitionKey) {
    transitionStore.add(transitionKey);
  },
};

const deadLetterQueue: DeadLetterQueue = {
  async send(job, reason) {
    console.error("dead_letter", { jobId: job.jobId, reason });
  },
};

function isNonRetriableError(error: unknown): boolean {
  const candidate = error as { code?: string };
  return candidate?.code === "VALIDATION_ERROR";
}

function isAcceptanceUnknown(error: unknown): boolean {
  const candidate = error as { code?: string; status?: number };
  return candidate?.code === "ETIMEDOUT" || candidate?.status === 504;
}

async function loadConversationContext(conversationId: string): Promise<string> {
  return `context for ${conversationId}`;
}

async function callAiProvider(_prompt: string): Promise<string> {
  return "AI generated response";
}

async function deliverResponse(_conversationId: string, _response: string): Promise<void> {
  return;
}

export async function processConversationJob(
  job: ConversationJob
): Promise<{ success: boolean; outcome: JobOutcome }> {
  const transitionKey = `${job.idempotencyKey}:delivered`;

  if (await deliveryStateStore.hasTransition(transitionKey)) {
    return {
      success: true,
      outcome: "duplicate",
    };
  }

  try {
    const response = await retryWithBackoff(
      async () => {
        const context = await loadConversationContext(job.conversationId);
        return callAiProvider(context);
      },
      {
        maxRetries: 3,
        shouldRetry: isRetryableError,
      }
    );

    await deliverResponse(job.conversationId, response);
    await deliveryStateStore.markTransition(transitionKey);

    return {
      success: true,
      outcome: "delivered",
    };
  } catch (error) {
    if (isAcceptanceUnknown(error)) {
      console.warn("delivery_outcome_unknown", {
        jobId: job.jobId,
        idempotencyKey: job.idempotencyKey,
      });
      return {
        success: false,
        outcome: "deferred_acceptance_unknown",
      };
    }

    if (isNonRetriableError(error)) {
      await deadLetterQueue.send(job, "validation_failed");
      return {
        success: false,
        outcome: "dead_lettered",
      };
    }

    await deadLetterQueue.send(job, "max_retries_exhausted");
    return {
      success: false,
      outcome: "dead_lettered",
    };
  }
}
