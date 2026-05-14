type WebhookPayload = {
    eventId: string;
    conversationId: string;
    message: string;
  };
  
  export async function handleWebhook(
    payload: WebhookPayload
  ) {
    console.log(
      `Received webhook: ${payload.eventId}`
    );
  
    // 1. Validate payload
    // 2. Check idempotency
    // 3. Normalize event
    // 4. Push job to queue
    // 5. Return acknowledgement
  
    return {
      success: true,
      queued: true,
    };
  }