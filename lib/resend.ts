import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY environment variable");
}

export const resend = new Resend(resendApiKey);

// Configure default from email (can be overridden via env variable)
const DEFAULT_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "AgentZero <onboarding@resend.dev>";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  userId?: string;
  campaignId?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface BatchEmailItem {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  userId?: string;
  campaignId?: string;
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Send a single email via Resend API with tracking tags
 * Tags are used by Resend webhooks to identify emails
 */
export async function sendEmail(params: SendEmailParams) {
  try {
    // Build tags array for Resend tracking
    // Resend tags format: [{ name: string, value: string }]
    const tags: Array<{ name: string; value: string }> = [];

    if (params.userId) {
      tags.push({ name: "userId", value: params.userId });
    }

    if (params.campaignId) {
      tags.push({ name: "campaignId", value: params.campaignId });
    }

    // Add any additional custom tags
    if (params.tags) {
      tags.push(...params.tags);
    }

    const result = await resend.emails.send({
      from: params.from || DEFAULT_FROM_EMAIL,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo, // Use camelCase for Resend SDK
      tags: tags.length > 0 ? tags : undefined,
    });

    return {
      success: true,
      data: result.data,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error.message || "Failed to send email",
    };
  }
}

/**
 * Send batch emails via Resend Batch API (up to 100 emails per batch)
 * Reference: https://resend.com/docs/api-reference/emails/send-batch-emails
 */
export async function sendBatchEmails(
  emails: BatchEmailItem[],
  options?: {
    validationMode?: "strict" | "permissive";
    idempotencyKey?: string;
  }
) {
  try {
    // Resend batch API supports up to 100 emails per request
    const BATCH_SIZE = 100;
    const allResults: Array<{ id?: string; error?: string; index: number }> =
      [];
    const allErrors: Array<{ index: number; message: string }> = [];

    // Process in batches of 100
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);

      // Prepare batch with default from email and tracking tags
      const batchPayload = batch.map((email) => {
        const tags: Array<{ name: string; value: string }> = [];

        if (email.userId) {
          tags.push({ name: "userId", value: email.userId });
        }

        if (email.campaignId) {
          tags.push({ name: "campaignId", value: email.campaignId });
        }

        if (email.tags) {
          tags.push(...email.tags);
        }

        return {
          from: email.from || DEFAULT_FROM_EMAIL,
          to: Array.isArray(email.to) ? email.to : [email.to],
          subject: email.subject,
          html: email.html,
          replyTo: email.replyTo, // Use camelCase for Resend SDK
          tags: tags.length > 0 ? tags : undefined,
        };
      });

      // Prepare options for batch send
      // Reference: https://resend.com/docs/api-reference/emails/send-batch-emails
      const batchOptions: {
        batchValidation?: "strict" | "permissive";
        idempotencyKey?: string;
      } = {};

      if (options?.validationMode) {
        batchOptions.batchValidation = options.validationMode;
      }
      if (options?.idempotencyKey) {
        batchOptions.idempotencyKey = options.idempotencyKey;
      }

      // Send batch using Resend Batch API
      console.log(
        `Sending batch of ${batchPayload.length} emails via Resend...`
      );
      const result = await resend.batch.send(batchPayload, batchOptions);

      // Log response for debugging
      if (result.error) {
        console.error("Resend batch API error:", {
          error: result.error,
          message: result.error.message,
          batchSize: batchPayload.length,
        });
      } else if (result.data) {
        const dataArray = (result.data as any)?.data || [];
        const errorsArray = (result.data as any)?.errors || [];
        console.log("Resend batch API success:", {
          dataCount: Array.isArray(dataArray) ? dataArray.length : 0,
          errorsCount: Array.isArray(errorsArray) ? errorsArray.length : 0,
        });
      }

      // Handle errors from Resend API
      if (result.error) {
        // If there's an error, all emails in this batch failed
        const errorMessage = result.error?.message || "Batch send failed";
        console.error("Resend batch API returned error:", {
          error: result.error,
          message: errorMessage,
          batchSize: batch.length,
        });

        batch.forEach((_, idx) => {
          allErrors.push({
            index: i + idx,
            message: errorMessage,
          });
        });
        continue;
      }

      // Process results - Resend batch API returns { data: { data: [...], errors: [...] } }
      // The actual array is nested at result.data.data
      if (result.data) {
        let dataArray: any[] = [];
        let errorsArray: any[] = [];

        // Handle nested structure: result.data.data contains the array
        if (result.data.data && Array.isArray(result.data.data)) {
          dataArray = result.data.data;
        } else if (Array.isArray(result.data)) {
          // Fallback: if result.data is directly an array
          dataArray = result.data;
        } else {
          // If data is not in expected format, log and treat as failed
          console.error("Resend batch response has unexpected structure:", {
            type: typeof result.data,
            data: result.data,
            result: result,
          });
          batch.forEach((_, idx) => {
            allErrors.push({
              index: i + idx,
              message: "Invalid response format from Resend API",
            });
          });
          continue;
        }

        // Process successful sends
        dataArray.forEach((item: any, idx: number) => {
          if (item && item.id) {
            allResults.push({
              id: item.id,
              index: i + idx,
            });
          } else {
            // If item doesn't have an id, it might be an error
            allErrors.push({
              index: i + idx,
              message: "Email sent but no ID returned",
            });
          }
        });

        // Process errors from nested structure: result.data.errors
        if (result.data.errors && Array.isArray(result.data.errors)) {
          errorsArray = result.data.errors;
        } else if (
          (result as any).errors &&
          Array.isArray((result as any).errors)
        ) {
          // Fallback: check top-level errors
          errorsArray = (result as any).errors;
        }

        // Process errors array
        errorsArray.forEach((error: any) => {
          allErrors.push({
            index: i + (error.index || 0),
            message: error.message || "Unknown batch send error",
          });
        });
      } else {
        // No data returned - all emails in batch failed
        batch.forEach((_, idx) => {
          allErrors.push({
            index: i + idx,
            message: "No response data from Resend API",
          });
        });
      }
    }

    return {
      success: allErrors.length === 0,
      data: allResults,
      errors: allErrors,
      totalSent: allResults.length,
      totalFailed: allErrors.length,
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      errors: [
        { index: 0, message: error.message || "Failed to send batch emails" },
      ],
      totalSent: 0,
      totalFailed: emails.length,
    };
  }
}
