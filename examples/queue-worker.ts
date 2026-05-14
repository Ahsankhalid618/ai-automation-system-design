import { isRetryableError, retryWithBackoff } from "./retry-strategy";

type ConversationJob = {
  jobId: string;
  idempotencyKey: string;
  conversationId: string;
  leadId: string;
  attempt: number;
};

type DeadLetterReason = "validation_failed" | "max_retries_exhausted";

type DeadLetterQueue = {
  send: (job: ConversationJob, reason: DeadLetterReason) => Promise<void>;
};

const processedTransitions = new Set<string>();

const deadLetterQueue: DeadLetterQueue = {
  async send(job, reason) {
    console.error("dead-lettered job", { jobId: job.jobId, reason });
  },
};

function isNonRetriableError(error: unknown): boolean {
  const candidate = error as { code?: string };
  return candidate?.code === "VALIDATION_ERROR";
}

async function loadContext(conversationId: string): Promise<string> {
  return `context for ${conversationId}`;
}

async function callAiProvider(_prompt: string): Promise<string> {
  return "AI generated response";
}

async function deliverResponse(_conversationId: string, _response: string): Promise<void> {
  return;
}

export async function processConversationJob(job: ConversationJob) {
  const transitionKey = `${job.idempotencyKey}:delivered`;

  if (processedTransitions.has(transitionKey)) {
    return {
      success: true,
      conversationId: job.conversationId,
      duplicate: true,
    };
  }

  try {
    const response = await retryWithBackoff(
      async () => {
        const context = await loadContext(job.conversationId);
        return callAiProvider(context);
      },
      {
        maxRetries: 3,
        shouldRetry: isRetryableError,
      }
    );

    await deliverResponse(job.conversationId, response);
    processedTransitions.add(transitionKey);

    return {
      success: true,
      conversationId: job.conversationId,
      duplicate: false,
    };
  } catch (error) {
    if (isNonRetriableError(error)) {
      await deadLetterQueue.send(job, "validation_failed");
      return {
        success: false,
        deadLettered: true,
        reason: "validation_failed",
      };
    }

    await deadLetterQueue.send(job, "max_retries_exhausted");
    return {
      success: false,
      deadLettered: true,
      reason: "max_retries_exhausted",
    };
  }
}