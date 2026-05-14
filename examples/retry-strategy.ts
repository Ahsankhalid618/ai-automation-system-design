type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onAttempt?: (attempt: number, delayMs: number, error: unknown) => void;
};

type RetryableError = Error & {
  code?: string;
  status?: number;
  retryable?: boolean;
};

const sleep = (delayMs: number) =>
  new Promise((resolve) => setTimeout(resolve, delayMs));

const withFullJitter = (capDelayMs: number) =>
  Math.floor(Math.random() * capDelayMs);

export function isRetryableError(error: unknown): boolean {
  const candidate = error as RetryableError | undefined;

  if (!candidate) {
    return false;
  }

  if (candidate.retryable === true) {
    return true;
  }

  if (candidate.status === 429 || candidate.status === 503) {
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
    onAttempt,
  } = options;

  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;

      const withinBudget = attempt <= maxRetries;
      const retryable = shouldRetry(error);

      if (!withinBudget || !retryable) {
        throw error;
      }

      const exponentialCap = Math.min(
        maxDelayMs,
        baseDelayMs * Math.pow(2, attempt)
      );
      const delayMs = withFullJitter(exponentialCap);

      onAttempt?.(attempt, delayMs, error);

      console.warn("retry_attempt", {
        attempt,
        maxRetries,
        delayMs,
      });

      await sleep(delayMs);
    }
  }
}
