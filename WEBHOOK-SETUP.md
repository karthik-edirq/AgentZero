# Resend Webhook Setup Guide

## Quick Setup

1. **Get your webhook URL:**
   - **Local Development:** You need a public URL! Use one of these options:
     - **Option A - ngrok (Recommended):** 
       ```bash
       # Install ngrok: https://ngrok.com/download
       ngrok http 3000
       # Use the HTTPS URL: https://xxxx.ngrok.io/api/resend/webhook
       ```
     - **Option B - Cloudflare Tunnel:**
       ```bash
       cloudflared tunnel --url http://localhost:3000
       ```
     - **Option C - LocalTunnel:**
       ```bash
       npx localtunnel --port 3000
       ```
   - **Production:** `https://yourdomain.com/api/resend/webhook`

2. **Configure in Resend Dashboard:**
   - Go to: https://resend.com/webhooks
   - Click "Create Webhook"
   - Enter your webhook URL
   - Select all events:
     - ✅ email.sent
     - ✅ email.delivered
     - ✅ email.opened
     - ✅ email.clicked
     - ✅ email.bounced
     - ✅ email.complained
   - Copy the webhook secret

3. **Add to environment variables:**
   ```env
   RESEND_WEBHOOK_SECRET=your_webhook_secret_here
   ```

4. **Test the webhook:**
   - Visit: `GET /api/resend/webhook` to see if endpoint is active
   - Send a test email
   - Check server logs for webhook events

## Webhook Event Flow

```
Email Sent via Resend API
    ↓
Resend processes email
    ↓
Resend sends webhook to /api/resend/webhook
    ↓
Webhook handler:
  1. Verifies signature (if RESEND_WEBHOOK_SECRET set)
  2. Extracts email_id from event.data.email_id
  3. Looks up email in database by resend_email_id
  4. Saves event to email_events table
  5. Updates email status in emails table
```

## Webhook Event Structure

Resend sends events in this format:

```json
{
  "type": "email.sent",
  "data": {
    "email_id": "abc123...",
    "to": "user@example.com",
    "tags": [
      { "name": "userId", "value": "user-123" },
      { "name": "campaignId", "value": "campaign-456" }
    ]
  },
  "created_at": "2025-12-06T19:00:00Z"
}
```

## Troubleshooting

### Webhook not receiving events

1. **Check webhook URL is accessible:**
   ```bash
   curl https://yourdomain.com/api/resend/webhook
   ```
   Should return: `{ "message": "Resend webhook endpoint is active", ... }`

2. **Check Resend Dashboard:**
   - Go to Webhooks → Your Webhook → Logs
   - Check for delivery errors
   - Verify webhook URL is correct

3. **Check server logs:**
   - Look for "Resend webhook received" messages
   - Check for any error messages

### Events not matching emails

1. **Verify resend_email_id is saved:**
   - Check `emails` table in Supabase
   - Ensure `resend_email_id` column has the Resend email ID
   - This ID should match `event.data.email_id` from webhook

2. **Check webhook logs:**
   - Server logs show: "Looking up email record with resend_email_id: ..."
   - If not found, check if the ID matches

3. **Test webhook manually:**
   ```bash
   curl -X POST https://yourdomain.com/api/resend/webhook \
     -H "Content-Type: application/json" \
     -H "resend-signature: sha256=..." \
     -d '{
       "type": "email.sent",
       "data": {
         "email_id": "test-email-id",
         "to": "test@example.com"
       }
     }'
   ```

### Signature verification failing

1. **Check RESEND_WEBHOOK_SECRET is set:**
   ```env
   RESEND_WEBHOOK_SECRET=your_secret_here
   ```

2. **Verify signature format:**
   - Resend sends: `resend-signature: sha256=<hash>`
   - Our code expects this format

3. **Temporarily disable verification for testing:**
   - Remove or comment out signature check in webhook handler

## Monitoring

Check webhook activity:
- **Server logs:** Look for "Resend webhook received" messages
- **Database:** Query `email_events` table for recent events
- **Resend Dashboard:** Webhooks → Your Webhook → Logs

## Event Types

| Resend Event | Our Event Type | Updates Email Status |
|-------------|----------------|---------------------|
| email.sent | sent | status: 'sent', sent_at |
| email.delivered | delivered | status: 'delivered', delivered_at |
| email.opened | opened | opened_at |
| email.clicked | clicked | clicked_at |
| email.bounced | bounced | status: 'bounced' |
| email.complained | complained | status: 'bounced' |
| email.unsubscribed | unsubscribed | status: 'bounced' |

