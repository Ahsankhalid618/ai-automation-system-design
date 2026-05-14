export async function retryWithBackoff(
    operation: () => Promise<void>,
    retries = 3
  ) {
    let attempt = 0;
  
    while (attempt < retries) {
      try {
        await operation();
  
        return;
      } catch (error) {
        attempt++;
  
        console.error(
          `Retry attempt ${attempt} failed`
        );
  
        const delay =
          Math.pow(2, attempt) * 1000;
  
        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );
      }
    }
  
    throw new Error(
      "Operation failed after retries"
    );
  }