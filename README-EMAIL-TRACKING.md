# Email Tracking System Documentation

Complete email tracking system using Resend webhooks and Supabase.

## Overview

This system tracks email events (sent, delivered, opened, clicked, bounced) using Resend webhooks and stores them in Supabase for analytics.

## Components

### 1. Database Schema

The `email_events` table stores all email tracking events:

- `id` (uuid): Primary key
- `email_id` (uuid): Reference to emails table (can also store Resend email ID)
- `user_id` (text): User/recipient identifier from tags
- `campaign_id` (text): Campaign identifier from tags
- `event_type` (text): Event type (sent, delivered, opened, clicked, bounced, complained, unsubscribed)
- `recipient` (text): Recipient email address
- `timestamp` (timestamptz): Event timestamp (uses `created_at`)
- `raw` (jsonb): Full webhook payload for debugging

### 2. Email Sending with Tags

The `sendEmail()` and `sendBatchEmails()` functions now automatically attach tracking tags:

```typescript
await sendEmail({
  to: 'user@example.com',
  subject: 'Test Email',
  html: '<p>Hello</p>',
  userId: 'user-123',
  campaignId: 'campaign-456',
})
```

Tags are sent to Resend and included in webhook events, allowing us to track emails back to campaigns and users.

### 3. Webhook Endpoint

**Endpoint:** `POST /api/resend/webhook`

Receives webhook events from Resend and stores them in the database.

**Supported Events:**
- `email.sent` → `sent`
- `email.delivered` → `delivered`
- `email.opened` → `opened`
- `email.clicked` → `clicked`
- `email.bounced` → `bounced`
- `email.complained` → `complained`
- `email.unsubscribed` → `unsubscribed`

**Webhook Signature Verification:**
The endpoint verifies webhook signatures using `RESEND_WEBHOOK_SECRET` (optional but recommended).

### 4. Analytics API

**Endpoint:** `GET /api/stats/:campaignId`

Returns comprehensive campaign statistics:

```json
{
  "data": {
    "campaign_id": "uuid",
    "campaign_name": "Campaign Name",
    "total_sent": 100,
    "total_delivered": 95,
    "total_opened": 50,
    "total_clicked": 25,
    "total_bounced": 3,
    "total_failed": 2,
    "open_rate": 52.63,
    "click_rate": 26.32,
    "delivery_rate": 95.0,
    "bounce_rate": 3.0
  }
}
```

## Setup Instructions

### 1. Run Database Migration

Execute the migration script to add new columns to `email_events`:

```bash
# In Supabase SQL Editor, run:
supabase/migration_email_tracking.sql
```

Or manually add the columns:
- `user_id` (text)
- `campaign_id` (text)
- `recipient` (text)
- Rename `metadata` to `raw` (or add `raw` if `metadata` doesn't exist)

### 2. Enable Click Tracking in Resend

**IMPORTANT:** Click tracking is disabled by default in Resend and must be enabled for click events to work.

1. Go to Resend Dashboard → Domains
2. Select your domain
3. Navigate to Settings → Tracking
4. Enable **Click Tracking**
5. Save changes

See `CLICK-TRACKING-SETUP.md` for detailed instructions.

### 3. Configure Resend Webhook

1. Go to Resend Dashboard → Webhooks
2. Create a new webhook
3. Set the URL to: `https://yourdomain.com/api/resend/webhook`
4. Select events: `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`
5. Copy the webhook secret
6. Add to `.env`:

```env
RESEND_WEBHOOK_SECRET=your_webhook_secret_here
```

### 4. Environment Variables

Add to your `.env` file:

```env
# Resend API (already configured)
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL="AgentZero <noreply@yourdomain.com>"

# Resend Webhook (for signature verification)
RESEND_WEBHOOK_SECRET=your_webhook_secret_here
```

### 5. Test the System

1. **Send a test email:**
   ```typescript
   await sendEmail({
     to: 'test@example.com',
     subject: 'Test',
     html: '<p>Test</p>',
     userId: 'user-123',
     campaignId: 'campaign-456',
   })
   ```

2. **Check webhook logs:**
   - Resend Dashboard → Webhooks → View logs
   - Your server logs should show webhook events being processed

3. **Query statistics:**
   ```bash
   curl https://yourdomain.com/api/stats/campaign-456
   ```

## Integration with Existing System

The tracking system integrates seamlessly with the existing email system:

1. **Campaign Launch:** When launching a campaign, emails are automatically tagged with `userId` and `campaignId`
2. **Event Storage:** Webhook events are stored in `email_events` table
3. **Analytics:** The stats API uses both `emails` and `email_events` tables for accurate metrics
4. **Dashboard:** Existing dashboard views automatically show updated statistics from webhook events

## Event Flow

```
1. Email sent via Resend API (with tags)
   ↓
2. Resend processes email
   ↓
3. Resend sends webhook events to /api/resend/webhook
   ↓
4. Webhook handler stores events in email_events table
   ↓
5. Stats API queries email_events for analytics
   ↓
6. Dashboard displays real-time statistics
```

## Troubleshooting

### Webhook not receiving events

1. Check Resend webhook configuration
2. Verify webhook URL is accessible
3. Check server logs for errors
4. Test webhook endpoint: `GET /api/resend/webhook` should return status message

### Events not appearing in database

1. Check webhook signature verification (if enabled)
2. Verify database migration was run
3. Check Supabase logs for insert errors
4. Verify `email_id` matches between `emails` and `email_events` tables

### Stats API returning incorrect data

1. Verify events are being stored correctly
2. Check that `campaign_id` tags are being set when sending emails
3. Verify email records have correct `campaign_id` values
4. Check Supabase query logs

## API Reference

### POST /api/resend/webhook

Receives Resend webhook events.

**Headers:**
- `resend-signature`: Webhook signature (for verification)

**Body:** Resend webhook event JSON

**Response:**
```json
{
  "success": true,
  "eventId": "uuid",
  "message": "Event processed successfully"
}
```

### GET /api/stats/:campaignId

Get campaign statistics.

**Response:**
```json
{
  "data": {
    "campaign_id": "string",
    "campaign_name": "string",
    "total_sent": 0,
    "total_delivered": 0,
    "total_opened": 0,
    "total_clicked": 0,
    "total_bounced": 0,
    "total_failed": 0,
    "open_rate": 0.0,
    "click_rate": 0.0,
    "delivery_rate": 0.0,
    "bounce_rate": 0.0
  },
  "error": null
}
```

