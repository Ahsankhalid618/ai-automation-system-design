type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
};

type RetryableError = Error & {
  code?: string;
  status?: number;
  retryable?: boolean;
};

const sleep = (delayMs: number) =>
  new Promise((resolve) => setTimeout(resolve, delayMs));

const withFullJitter = (maxDelayMs: number) =>
  Math.floor(Math.random() * maxDelayMs);

export function isRetryableError(error: unknown): boolean {
  const candidate = error as RetryableError | undefined;

  if (!candidate) {
    return false;
  }

  if (candidate.retryable === true) {
    return true;
  }

  if (candidate.status === 429) {
    return true;
  }

  return ["ETIMEDOUT", "ECONNRESET", "EAI_AGAIN"].includes(
    candidate.code ?? ""
  );
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 250,
    maxDelayMs = 5_000,
    shouldRetry = isRetryableError,
  } = options;

  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;
      const canRetry = attempt <= maxRetries && shouldRetry(error);

      if (!canRetry) {
        throw error;
      }

      // Exponential backoff with full jitter prevents retry stampedes.
      const exponentialCap = Math.min(
        maxDelayMs,
        baseDelayMs * Math.pow(2, attempt)
      );
      const delayMs = withFullJitter(exponentialCap);

      console.warn(
        `retrying operation attempt=${attempt} delayMs=${delayMs}`
      );
      await sleep(delayMs);
    }
  }
}