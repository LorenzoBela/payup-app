/**
 * Rate-limited email queue to avoid hitting Resend API limits
 * Resend allows 2 requests per second on free tier
 */

// Delay helper function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Rate limit configuration
const RATE_LIMIT = {
    requestsPerSecond: 2,
    delayBetweenEmails: 600, // 600ms = ~1.6 emails/sec (safe margin under 2/sec)
    maxRetries: 3,
    retryDelay: 2000, // Wait 2 seconds before retry
};

interface QueuedEmail<T> {
    sendFn: () => Promise<{ success: boolean; error?: unknown }>;
    data: T;
    recipientEmail: string;
}

interface QueueResult {
    successful: number;
    failed: number;
    total: number;
    errors: Array<{ email: string; error: string }>;
}

/**
 * Send emails with rate limiting - processes emails sequentially with delays
 * to avoid hitting Resend's 2 req/sec rate limit
 */
export async function sendEmailsWithRateLimit<T>(
    emails: QueuedEmail<T>[]
): Promise<QueueResult> {
    const result: QueueResult = {
        successful: 0,
        failed: 0,
        total: emails.length,
        errors: [],
    };

    for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        let success = false;
        let lastError: unknown = null;

        // Retry logic for transient failures
        for (let attempt = 1; attempt <= RATE_LIMIT.maxRetries; attempt++) {
            try {
                const response = await email.sendFn();

                if (response.success) {
                    success = true;
                    result.successful++;
                    console.log(`[Email Queue] Sent to ${email.recipientEmail} (${i + 1}/${emails.length})`);
                    break;
                } else {
                    lastError = response.error;

                    // Check if it's a rate limit error (429)
                    const errorStr = String(response.error);
                    if (errorStr.includes('429') || errorStr.includes('rate')) {
                        console.log(`[Email Queue] Rate limited, waiting ${RATE_LIMIT.retryDelay}ms before retry...`);
                        await delay(RATE_LIMIT.retryDelay);
                    } else if (attempt < RATE_LIMIT.maxRetries) {
                        // Other error, still retry
                        await delay(RATE_LIMIT.retryDelay);
                    }
                }
            } catch (error) {
                lastError = error;
                if (attempt < RATE_LIMIT.maxRetries) {
                    await delay(RATE_LIMIT.retryDelay);
                }
            }
        }

        if (!success) {
            result.failed++;
            result.errors.push({
                email: email.recipientEmail,
                error: lastError instanceof Error ? lastError.message : String(lastError),
            });
            console.error(`[Email Queue] Failed to send to ${email.recipientEmail}:`, lastError);
        }

        // Wait between emails to respect rate limit (except for last email)
        if (i < emails.length - 1) {
            await delay(RATE_LIMIT.delayBetweenEmails);
        }
    }

    console.log(`[Email Queue] Complete: ${result.successful}/${result.total} sent, ${result.failed} failed`);
    return result;
}

/**
 * Helper to batch emails for rate-limited sending
 * Use this in place of Promise.allSettled for email sending
 */
export async function sendBatchedEmails<T>(
    recipients: Array<{
        email: string;
        sendFn: () => Promise<{ success: boolean; error?: unknown }>;
        data: T;
    }>
): Promise<QueueResult> {
    const queuedEmails: QueuedEmail<T>[] = recipients.map(r => ({
        sendFn: r.sendFn,
        data: r.data,
        recipientEmail: r.email,
    }));

    return sendEmailsWithRateLimit(queuedEmails);
}
